import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import {
  ArrowLeft,
  Sparkles,
  Text as TextIcon,
  Shield,
  Zap,
  Star,
  Clipboard as ClipboardIcon,
  ChevronDown,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Archive,
  QrCode,
  Layers,
  Scissors,
  Unlock,
  Wrench,
  Type as TypeIcon,
} from 'lucide-react';
import AdSpace from '../../components/AdSpace';
import { getToolSeoByPath } from '../../components/seo/toolSeoData';

/** ---------- Catalog for header Tools menu ---------- */
type ToolLink = { name: string; href: string; icon?: React.ElementType };
type ToolSection = { title: string; items: ToolLink[] };

const TOOLS_CATALOG: ToolSection[] = [
  {
    title: 'Convert to PDF',
    items: [
      { name: 'Word to PDF', href: '/tools/docx-to-pdf', icon: FileText },
      { name: 'PowerPoint to PDF', href: '/tools/pptx-to-pdf', icon: FileText },
      { name: 'JPG to PDF', href: '/tools/jpg-to-pdf', icon: ImageIcon },
      { name: 'PNG to PDF', href: '/tools/png-to-pdf', icon: ImageIcon },
      { name: 'Images to PDF', href: '/tools/images-to-pdf', icon: ImageIcon },
      { name: 'Markdown to PDF', href: '/tools/markdown-to-pdf', icon: FileText },
      { name: 'Text to PDF', href: '/tools/text-to-pdf', icon: FileText },
      { name: 'HTML to PDF', href: '/tools/html-to-pdf', icon: FileText },
      { name: 'EPUB to PDF', href: '/tools/epub-to-pdf', icon: FileText },
    ],
  },
  {
    title: 'Convert from / between',
    items: [
      { name: 'PDF to JPG', href: '/tools/pdf-to-jpg', icon: ImageIcon },
      { name: 'SVG to PNG', href: '/tools/svg-to-png', icon: ImageIcon },
      { name: 'WEBP Converter', href: '/tools/webp-converter', icon: ImageIcon },
      { name: 'GIF to MP4', href: '/tools/gif-to-mp4', icon: ImageIcon },
      { name: 'XLSX to CSV', href: '/tools/xlsx-to-csv', icon: FileText },
      { name: 'RTF to DOCX', href: '/tools/rtf-to-docx', icon: FileText },
      { name: 'Image to PDF', href: '/tools/image-to-pdf', icon: ImageIcon },
    ],
  },
  {
    title: 'Merge & Split',
    items: [
      { name: 'Merge PDF', href: '/tools/merge-pdf', icon: Layers },
      { name: 'Split PDF', href: '/tools/split-pdf', icon: Scissors },
      { name: 'Create ZIP', href: '/tools/create-zip', icon: Archive },
      { name: 'Combine ZIPs', href: '/tools/combine-zips', icon: Archive },
      { name: 'Extract ZIP', href: '/tools/extract-zip', icon: Archive },
    ],
  },
  {
    title: 'PDF Tools',
    items: [
      { name: 'Extract Images', href: '/tools/extract-images', icon: ImageIcon },
      { name: 'Extract Text (OCR)', href: '/tools/extract-text', icon: FileText },
      { name: 'Unlock PDF', href: '/tools/unlock-pdf', icon: unlock },
    ],
  },
  {
    title: 'Images & QR',
    items: [
      { name: 'Compress Images', href: '/tools/compress-image', icon: ImageIcon },
      { name: 'Image Resizer', href: '/tools/image-resizer', icon: ImageIcon },
      { name: 'Background Remover', href: '/tools/background-remover', icon: Wrench },
      { name: 'QR Generator', href: '/tools/qr-generator', icon: QrCode },
      { name: 'QR Scanner', href: '/tools/qr-scanner', icon: QrCode },
    ],
  },
  {
    title: 'Text Utilities',
    items: [
      { name: 'Case Converter', href: '/tools/case-converter', icon: TypeIcon },
      { name: 'Word Counter', href: '/tools/word-counter', icon: FileText },
    ],
  },
];

/** Dropdown menu pinned to right edge (no clipping), with icons */
function ToolsMenu() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      if (btnRef.current && btnRef.current.contains(target)) return;
      // close if click outside panel (panel is fixed, so just close on any click not on button)
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="ml-auto inline-flex items-center px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
      >
        Tools <ChevronDown className="w-4 h-4 ml-2" />
      </button>

      {open && (
        <div
          role="menu"
          className="fixed right-4 top-20 w-[1000px] max-w-[96vw] max-h-[75vh] overflow-auto z-[100] bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS_CATALOG.map((sec) => (
              <div key={sec.title}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {sec.title}
                </h4>
                <ul className="space-y-2">
                  {sec.items.map((item) => {
                    const Icon = item.icon ?? FileText;
                    return (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          className="group flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <span className="flex items-center gap-2 text-sm text-gray-800 group-hover:text-gray-900">
                            <Icon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                            {item.name}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/** -------- Page -------- */
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

  const toTitleCase = (str: string) => {
    if (!str) return str;
    return str
      .split(/(\s+)/)
      .map((token, idx, arr) => {
        if (/\s+/.test(token)) return token;
        const prev = arr[idx - 1] ?? '';
        const isFirst = !arr.slice(0, idx).some(t => !/\s+/.test(t));
        const isLast = !arr.slice(idx + 1).some(t => !/\s+/.test(t));
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
      })
      .join('');
  };

  const toSentenceCase = (str: string) => {
    if (!str) return str;
    const lower = str.toLowerCase();
    const firstCap = lower.replace(/^[\s"'\(\[\{]*[a-z]/, (m) => m.toUpperCase());
    return firstCap.replace(/([\.!?]\s*["'\)\]\}]*\s*)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
  };

  const convert = (mode: 'upper' | 'lower' | 'title' | 'sentence') => {
    try {
      setError(null);
      let out = '';
      switch (mode) {
        case 'upper': out = input.toUpperCase(); break;
        case 'lower': out = input.toLowerCase(); break;
        case 'title': out = toTitleCase(input); break;
        case 'sentence': out = toSentenceCase(input); break;
      }
      setOutput(out);
      setCopied(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to convert text.');
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError(null);
    setCopied(false);
  };

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
        {/* bg blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-4">
              <a href="/" className="p-3 rounded-xl hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </a>

              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Sparkles className="w-7 h-7 text-white animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
              </div>

              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Files Nova
                </h1>
                <p className="text-xs text-gray-500 font-medium">Case Converter</p>
              </div>

              {/* ➜ Rightmost Tools dropdown */}
              <ToolsMenu />
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">1. Enter Text</h3>
              <textarea
                className="w-full h-56 p-4 border border-gray-300 rounded-xl focus:border-blue-500 outline-none resize-y"
                placeholder="Paste or type your text here…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                  onClick={() => convert('upper')}
                  disabled={!input}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  UPPERCASE
                </button>
                <button
                  onClick={() => convert('lower')}
                  disabled={!input}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  lowercase
                </button>
                <button
                  onClick={() => convert('title')}
                  disabled={!input}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Title Case
                </button>
                <button
                  onClick={() => convert('sentence')}
                  disabled={!input}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sentence case
                </button>
                {/* 🔥 New: Clear */}
                <button
                  onClick={clearAll}
                  className="px-4 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-300 hover:bg-gray-50 transition-all"
                >
                  Clear
                </button>
              </div>
              {error && <p className="text-red-600 mt-4">{error}</p>}
            </div>

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

          <div className="mt-8">
            <AdSpace />
          </div>
        </div>
      </div>
    </>
  );
};

export default CaseConverterPage;
