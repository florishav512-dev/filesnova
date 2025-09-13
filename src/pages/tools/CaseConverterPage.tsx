// src/pages/tools/CaseConverterPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import JsonLd from '../../components/JsonLd';
import {
  Sparkles,
  Text as TextIcon,
  Shield,
  Zap,
  Star,
  Clipboard as ClipboardIcon,
  Upload,
  Download as DownloadIcon,
  Eraser,
  Undo2,
  Redo2,
  Search,
  Info,
} from 'lucide-react';
import AdSpace from '../../components/AdSpace';
import { getToolSeoByPath } from '../../components/seo/toolSeoData';
import ToolsMenu from '../../components/ToolsMenu';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';
import FileNovaIconWebp from '../../assets/FILESNOVANEWICON.webp';

type Mode =
  | 'upper' | 'lower' | 'title' | 'sentence'
  | 'camel' | 'pascal' | 'snake' | 'kebab'
  | 'alternating' | 'invert';

const STORAGE_KEY = 'filesnova_case_converter_v2';

const SMALL_WORDS = new Set([
  'a','an','and','as','at','but','by','en','for','if','in','of','on','or','the','to','v','v.','via','vs','vs.',
]);

const isAllCapsWord = (w: string) => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w);
const capitalize = (w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w);

// Title Case
const toTitleCase = (str: string) =>
  !str ? str :
  str.split(/(\s+)/).map((token, idx, arr) => {
    if (/\s+/.test(token)) return token;
    const prev = arr[idx - 1] ?? '';
    const isFirst = !arr.slice(0, idx).some(t => !/\s+/.test(t));
    const isLast  = !arr.slice(idx + 1).some(t => !/\s+/.test(t));
    const parts = token.split(/(-)/);
    const mapped = parts.map((p) => {
      if (p === '-') return p;
      if (isAllCapsWord(p)) return p;
      const lower = p.toLowerCase();
      const shouldLower = !isFirst && !isLast && SMALL_WORDS.has(lower) && !(prev && prev.trim().endsWith(':'));
      return shouldLower ? lower : capitalize(lower);
    });
    if (isFirst && mapped[0] && mapped[0] !== '-') {
      const l = mapped[0].toString().toLowerCase();
      if (SMALL_WORDS.has(l)) mapped[0] = capitalize(l);
    }
    if (isLast && mapped[mapped.length - 1] && mapped[mapped.length - 1] !== '-') {
      const l = mapped[mapped.length - 1].toString().toLowerCase();
      if (SMALL_WORDS.has(l)) mapped[mapped.length - 1] = capitalize(l);
    }
    return mapped.join('');
  }).join('');

// Sentence case
const toSentenceCase = (str: string) =>
  !str ? str :
  str.toLowerCase()
     .replace(/^[\s"'(\[\{]*[a-z]/, m => m.toUpperCase())
     .replace(/([\.!?]\s*["')\]\}]*\s*)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());

// Word splitting / slug helpers
const wordsFrom = (s: string) =>
  s
    .trim()
    .replace(/[_\-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean);

const toCamel = (s: string) => {
  const ws = wordsFrom(s.toLowerCase());
  if (!ws.length) return '';
  return ws[0] + ws.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
};
const toPascal = (s: string) =>
  wordsFrom(s.toLowerCase()).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
const toSnake  = (s: string) => wordsFrom(s).map(w => w.toLowerCase()).join('_');
const toKebab  = (s: string) => wordsFrom(s).map(w => w.toLowerCase()).join('-');

const alternatingCase = (s: string) =>
  s.split('').map((ch, i) => (/[a-z]/i.test(ch) ? (i % 2 ? ch.toLowerCase() : ch.toUpperCase()) : ch)).join('');
const invertCase = (s: string) =>
  s.split('').map((ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase())).join('');

// Cleanup tools
const trimEdges = (s: string) => s.replace(/^\s+|\s+$/g, '');
const collapseSpaces = (s: string) => s.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n');
const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Stats
const utf8Bytes = (s: string) => new TextEncoder().encode(s).length;
const readingTime = (s: string) => {
  const words = (s.match(/\b\w+\b/g) || []).length;
  const minutes = words / 200;
  return minutes < 1 ? '<1 min' : `${Math.ceil(minutes)} min`;
};
const humanBytes = (n: number) => {
  if (!n) return '0 B';
  const u = ['B','KB','MB','GB'];
  let i=0, x=n;
  while (x>=1024 && i<u.length-1) { x/=1024; i++; }
  return `${x.toFixed(1)} ${u[i]}`;
};

const CaseConverterPage: React.FC = () => {
  const seo = getToolSeoByPath('/tools/case-converter');

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [keepAcronyms, setKeepAcronyms] = useState(true);
  const [smartCleanup, setSmartCleanup] = useState(true);
  const [stripMarks, setStripMarks] = useState(false);

  // Find & Replace
  const [findQ, setFindQ] = useState('');
  const [replaceQ, setReplaceQ] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  // Undo/Redo
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

  // Persist session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { input, output, options } = JSON.parse(raw);
        if (typeof input === 'string') setInput(input);
        if (typeof output === 'string') setOutput(output);
        if (options) {
          setKeepAcronyms(!!options.keepAcronyms);
          setSmartCleanup(!!options.smartCleanup);
          setStripMarks(!!options.stripMarks);
        }
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        input, output,
        options: { keepAcronyms, smartCleanup, stripMarks }
      }));
    } catch {}
  }, [input, output, keepAcronyms, smartCleanup, stripMarks]);

  // Derived stats
  const stats = useMemo(() => {
    const text = output || input;
    const words = (text.match(/\b\w+\b/g) || []).length;
    const lines = text ? text.split('\n').length : 0;
    return {
      words,
      chars: text.length,
      lines,
      bytes: utf8Bytes(text),
      read: readingTime(text),
    };
  }, [input, output]);

  // Convert core
  const runConvert = (mode: Mode) => {
    try {
      setError(null);
      pushUndo(output ? output : input);

      let src = input;
      if (smartCleanup) src = collapseSpaces(trimEdges(src));
      if (stripMarks) src = stripDiacritics(src);

      const preserve = (txt: string) =>
        keepAcronyms ? txt.replace(/\b([A-Z]{2,})\b/g, '__ACR__$1__') : txt;
      const restore = (txt: string) =>
        keepAcronyms ? txt.replace(/__ACR__([A-Z]{2,})__/g, '$1') : txt;

      let out =
        mode === 'upper'     ? src.toUpperCase() :
        mode === 'lower'     ? src.toLowerCase() :
        mode === 'title'     ? restore(toTitleCase(preserve(src))) :
        mode === 'sentence'  ? restore(toSentenceCase(preserve(src))) :
        mode === 'camel'     ? toCamel(src) :
        mode === 'pascal'    ? toPascal(src) :
        mode === 'snake'     ? toSnake(src) :
        mode === 'kebab'     ? toKebab(src) :
        mode === 'alternating' ? alternatingCase(src) :
        invertCase(src);

      setOutput(out);
      setCopied(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to convert text.');
    }
  };

  // Undo/Redo mechanics
  const pushUndo = (val: string) => {
    undoStack.current.push(val);
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
  };
  const undo = () => {
    const prev = undoStack.current.pop();
    if (prev !== undefined) {
      redoStack.current.push(output);
      setOutput(prev);
    }
  };
  const redo = () => {
    const nxt = redoStack.current.pop();
    if (nxt !== undefined) {
      undoStack.current.push(output);
      setOutput(nxt);
    }
  };

  // Clipboard
  const copyOutput = async () => {
    try {
      if (!navigator?.clipboard) throw new Error('Clipboard API not available');
      await navigator.clipboard.writeText(output || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e: any) {
      setError(e?.message || 'Unable to copy to clipboard.');
    }
  };

  // File import/export
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadTextFile = async (file: File) => {
    const txt = await file.text();
    setInput(txt);
  };
  const downloadTxt = () => {
    const blob = new Blob([output || input], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'text.txt';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // Find & Replace
  const applyFindReplace = () => {
    try {
      const src = output || input;
      if (!findQ) return setOutput(src);
      let pattern = findQ;
      if (wholeWord) pattern = `\\b${pattern}\\b`;
      const flags = caseSensitive ? 'g' : 'gi';
      const re = useRegex ? new RegExp(pattern, flags) : new RegExp(escapeRegExp(pattern), flags);
      const replaced = src.replace(re, replaceQ);
      setOutput(replaced);
    } catch (e: any) {
      setError('Invalid regular expression.');
    }
  };
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const clearAll = () => { setInput(''); setOutput(''); setError(null); setCopied(false); undoStack.current=[]; redoStack.current=[]; };

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) return;
        e.preventDefault(); copyOutput();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [output]);

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={seo.canonical} />
        <meta property="og:image" content="https://filesnova.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <style>{`
          @keyframes filesnova-gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50%      { background-position: 100% 50%; }
          }
          .fn-animate-gradient-x {
            background-size: 200% 200%;
            animation: filesnova-gradient-x 3s ease infinite;
          }
        `}</style>
      </Helmet>

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Case Converter – Files Nova",
        "url": "https://filesnova.com/tools/case-converter",
        "applicationCategory": "FileConverter",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://filesnova.com/" },
          { "@type": "ListItem", "position": 2, "name": "Case Converter", "item": "https://filesnova.com/tools/case-converter" }
        ]
      }} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-">
              <div className="relative shrink-0">
                <picture>
                  <source srcSet={FileNovaIconWebp} type="image/webp" />
                  <source srcSet={FileNovaIcon} type="image/png" />
                  <img
                    src={FileNovaIcon}
                    alt="Files Nova"
                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                    draggable={false}
                    loading="lazy"
                    width="96"
                    height="96"
                  />
                </picture>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Files Nova
                </h1>
                <p className="text-xs text-gray-500 font-medium">Case converter</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>
        {/* main */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* hero */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <TextIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Case Converter</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert text to UPPERCASE, lowercase, Title Case, Sentence case—plus camelCase, PascalCase, snake_case, kebab-case, alternating, and invert case.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                  <Shield className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium">100% Secure</span>
                </div>
                <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                  <Zap className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-sm font-medium">Lightning Fast</span>
                </div>
                <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                  <Star className="w-4 h-4 mr-2 text-purple-600" />
                  <span className="text-sm font-medium">Premium Quality</span>
                </div>
              </div>
            </div>
          </div>

          {/* grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* LEFT: input + actions */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">1. Enter Text</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm"
                      title="Load .txt file"
                    >
                      <Upload className="w-4 h-4" /> Import
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) loadTextFile(f);
                        e.currentTarget.value = '';
                      }}
                    />
                    <button
                      onClick={downloadTxt}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm"
                      title="Download result as .txt"
                    >
                      <DownloadIcon className="w-4 h-4" /> Export
                    </button>
                  </div>
                </div>

                <textarea
                  className="w-full h-56 p-4 border border-gray-300 rounded-xl focus:border-blue-500 outline-none resize-y"
                  placeholder="Paste or type your text here…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />

                {/* conversion buttons */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'UPPER', mode: 'upper' as Mode },
                    { label: 'lower', mode: 'lower' as Mode },
                    { label: 'Title', mode: 'title' as Mode },
                    { label: 'Sentence', mode: 'sentence' as Mode },
                    { label: 'camelCase', mode: 'camel' as Mode },
                    { label: 'PascalCase', mode: 'pascal' as Mode },
                    { label: 'snake_case', mode: 'snake' as Mode },
                    { label: 'kebab-case', mode: 'kebab' as Mode },
                    { label: 'aLtErNaTiNg', mode: 'alternating' as Mode },
                    { label: 'Invert a/A', mode: 'invert' as Mode },
                  ].map(({ label, mode }) => (
                    <button
                      key={label}
                      onClick={() => runConvert(mode)}
                      disabled={!input}
                      className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-sm font-bold flex items-center justify-center whitespace-nowrap hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {label}
                    </button>
                  ))}

                  <button
                    onClick={clearAll}
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-bold flex items-center justify-center hover:bg-gray-50 transition-all"
                  >
                    Clear
                  </button>
                </div>

                {/* smart options */}
                <div className="mt-4 grid sm:grid-cols-3 gap-3">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="accent-blue-600" checked={keepAcronyms} onChange={(e)=>setKeepAcronyms(e.target.checked)} />
                    Preserve ACRONYMS (NASA, PDF)
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="accent-blue-600" checked={smartCleanup} onChange={(e)=>setSmartCleanup(e.target.checked)} />
                    Smart cleanup (trim & collapse spaces)
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="accent-blue-600" checked={stripMarks} onChange={(e)=>setStripMarks(e.target.checked)} />
                    Strip diacritics (café → cafe)
                  </label>
                </div>

                {/* find & replace */}
                <div className="mt-6 p-4 rounded-2xl border border-gray-200 bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold">Find &amp; Replace</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Find…"
                      value={findQ}
                      onChange={(e)=>setFindQ(e.target.value)}
                    />
                    <input
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Replace with…"
                      value={replaceQ}
                      onChange={(e)=>setReplaceQ(e.target.value)}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="accent-blue-600" checked={useRegex} onChange={(e)=>setUseRegex(e.target.checked)} />
                      Use regex
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="accent-blue-600" checked={caseSensitive} onChange={(e)=>setCaseSensitive(e.target.checked)} />
                      Case sensitive
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="accent-blue-600" checked={wholeWord} onChange={(e)=>setWholeWord(e.target.checked)} />
                      Whole word
                    </label>
                    <button
                      onClick={applyFindReplace}
                      className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* RESULT */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
                {/* ✅ Mobile-safe header: wraps buttons so nothing hides */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-xl font-bold text-gray-900">2. Result</h3>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={undo}
                      className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs sm:text-sm disabled:opacity-50"
                      disabled={!undoStack.current.length}
                      title="Undo (Ctrl/Cmd+Z)"
                    >
                      <Undo2 className="w-4 h-4" /> Undo
                    </button>
                    <button
                      onClick={redo}
                      className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs sm:text-sm disabled:opacity-50"
                      disabled={!redoStack.current.length}
                      title="Redo (Ctrl/Cmd+Shift+Z)"
                    >
                      <Redo2 className="w-4 h-4" /> Redo
                    </button>
                    <button
                      onClick={() => { setOutput(collapseSpaces(trimEdges(output))); }}
                      className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs sm:text-sm"
                      title="Quick cleanup"
                    >
                      <Eraser className="w-4 h-4" /> Clean
                    </button>
                  </div>
                </div>

                <textarea
                  className="w-full h-56 p-4 border border-gray-300 rounded-xl focus:border-blue-500 outline-none resize-y"
                  placeholder="Your converted text will appear here…"
                  value={output}
                  onChange={(e) => setOutput(e.target.value)}
                />

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={copyOutput}
                    disabled={!output}
                    className="inline-flex items-center px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ClipboardIcon className="w-5 h-5 mr-2" /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                  {error && <p className="text-red-600">{error}</p>}
                </div>
              </div>
            </div>

            {/* RIGHT: stats & tips */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Live Stats</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><span className="font-medium">Words:</span> {stats.words.toLocaleString()}</li>
                  <li><span className="font-medium">Characters:</span> {stats.chars.toLocaleString()}</li>
                  <li><span className="font-medium">Lines:</span> {stats.lines.toLocaleString()}</li>
                  <li><span className="font-medium">Bytes (UTF-8):</span> {humanBytes(stats.bytes)}</li>
                  <li><span className="font-medium">Reading time:</span> {stats.read}</li>
                </ul>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-amber-600" />
                  <h3 className="text-lg font-bold text-gray-900">Tips & Shortcuts</h3>
                </div>
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                  <li>All processing is client-side; nothing is uploaded.</li>
                  <li>Copy result quickly with <span className="font-medium">Ctrl/Cmd+C</span> (when not focused in a field).</li>
                  <li>Undo/Redo with <span className="font-medium">Ctrl/Cmd+Z</span> and <span className="font-medium">Ctrl/Cmd+Shift+Z</span>.</li>
                  <li>“Preserve ACRONYMS” keeps things like PDF/HTML uppercase in Title/Sentence case.</li>
                </ul>
              </div>

              <AdSpace />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};



export default CaseConverterPage;
