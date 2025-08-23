// src/pages/tools/CaseConverterPage.tsx
import React, { useState } from 'react';
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
} from 'lucide-react';
import AdSpace from '../../components/AdSpace';
import { getToolSeoByPath } from '../../components/seo/toolSeoData';

// ✅ shared Tools menu
import ToolsMenu from '../../components/ToolsMenu';

const CaseConverterPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const seo = getToolSeoByPath('/tools/case-converter');

  const SMALL_WORDS = new Set([
    'a','an','and','as','at','but','by','en','for','if','in','of','on','or','the','to','v','v.','via','vs','vs.',
  ]);
  const isAllCapsWord = (w: string) => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w);
  const capitalize = (w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w);

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

  const toSentenceCase = (str: string) =>
    !str ? str :
    str.toLowerCase()
       .replace(/^[\s"'(\[\{]*[a-z]/, m => m.toUpperCase())
       .replace(/([\.!?]\s*["')\]\}]*\s*)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());

  const convert = (mode: 'upper' | 'lower' | 'title' | 'sentence') => {
    try {
      setError(null);
      const out =
        mode === 'upper'    ? input.toUpperCase() :
        mode === 'lower'    ? input.toLowerCase() :
        mode === 'title'    ? toTitleCase(input) :
                              toSentenceCase(input);
      setOutput(out);
      setCopied(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to convert text.');
    }
  };

  const clearAll = () => { setInput(''); setOutput(''); setError(null); setCopied(false); };

  const copyOutput = async () => {
    try {
      if (!navigator?.clipboard) throw new Error('Clipboard API not available');
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e: any) {
      setError(e?.message || 'Unable to copy to clipboard.');
    }
  };

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

        {/* 🔥 Local-only CSS for animated gradient trigger (no global edits needed) */}
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
        {/* background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* header (no back arrow) */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Sparkles className="w-7 h-7 text-white animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
              </div>

              <div>
                <Link to="/" className="block leading-tight">
                  <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Files Nova
                  </h1>
                </Link>
                <p className="text-xs text-gray-500 font-medium">Case Converter</p>
              </div>

              {/* push Tools to extreme right */}
              <div className="ml-auto">
                <ToolsMenu
                  triggerLabel="Tools"
                  // ✨ animated glossy gradient trigger (pink→purple→blue)
                  triggerClassName="
                    inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-white
                    bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600
                    fn-animate-gradient-x shadow-md hover:shadow-lg transition-all
                    hover:-translate-y-0.5 active:translate-y-0
                  "
                />
              </div>
            </div>
          </div>
        </header>

        {/* main */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <TextIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Case Converter</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert text to UPPERCASE, lowercase, Title Case, or Sentence case.
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

          {/* INPUT / ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">1. Enter Text</h3>
              <textarea
                className="w-full h-56 p-4 border border-gray-300 rounded-xl focus:border-blue-500 outline-none resize-y"
                placeholder="Paste or type your text here…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              {/* aligned buttons (uniform height; single-line on large screens) */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'UPPERCASE', action: () => convert('upper') },
                  { label: 'lowercase', action: () => convert('lower') },
                  { label: 'Title Case', action: () => convert('title') },
                  { label: 'Sentence case', action: () => convert('sentence') },
                ].map((b) => (
                  <button
                    key={b.label}
                    onClick={b.action}
                    disabled={!input}
                    className="
                      h-12 w-full rounded-xl
                      bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600
                      text-white text-sm font-bold
                      flex items-center justify-center whitespace-nowrap
                      hover:shadow-lg transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {b.label}
                  </button>
                ))}
                <button
                  onClick={clearAll}
                  className="
                    h-12 w-full rounded-xl border border-gray-300
                    bg-white text-gray-700 text-sm font-bold
                    flex items-center justify-center
                    hover:bg-gray-50 transition-all
                  "
                >
                  Clear
                </button>
              </div>
              {error && <p className="text-red-600 mt-4">{error}</p>}
            </div>

            {/* OUTPUT */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Result</h3>
              <textarea
                className="w-full h-56 p-4 border border-gray-300 rounded-xl focus:border-blue-500 outline-none resize-y"
                placeholder="Your converted text will appear here…"
                value={output}
                onChange={(e) => setOutput(e.target.value)}
              />
              <button
                onClick={copyOutput}
                disabled={!output}
                className="mt-4 inline-flex items-center px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ClipboardIcon className="w-5 h-5 mr-2" /> {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>

          {/* Ad space */}
          <div className="mt-8">
            <AdSpace />
          </div>
        </div>
      </div>
    </>
  );
};

export default CaseConverterPage;
