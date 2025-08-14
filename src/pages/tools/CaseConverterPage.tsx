import React, { useState } from 'react';
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
} from 'lucide-react';
import AdSpace from '../../components/AdSpace';

// ✅ Safe SEO resolver (replaces ToolSeo + TOOL_SEO_DATA direct access)
import { getToolSeoByPath } from '../../components/seo/toolSeoData';

/**
 * CaseConverterPage allows users to convert text between different cases: upper,
 * lower, title and sentence. Results can be copied to the clipboard.
 */
const CaseConverterPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ✅ Centralized SEO (no undefined crashes)
  const seo = getToolSeoByPath('/tools/case-converter');

  // --- Utilities ---
  const SMALL_WORDS = new Set([
    'a','an','and','as','at','but','by','en','for','if','in','of','on','or','the','to','v','v.','via','vs','vs.',
  ]);

  const isAllCapsWord = (w: string) => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w);
  const capitalize = (w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w);

  // Title Case with small-words rule, hyphen/colon aware, acronym preserve
  const toTitleCase = (str: string) => {
    if (!str) return str;
    return str
      .split(/(\s+)/) // keep spaces
      .map((token, idx, arr) => {
        if (/\s+/.test(token)) return token;

        // handle colon-boundary (capitalize next word)
        const prev = arr[idx - 1] ?? '';
        const isFirst = !arr.slice(0, idx).some(t => !/\s+/.test(t));
        const isLast = !arr.slice(idx + 1).some(t => !/\s+/.test(t));

        // split hyphenated words
        const parts = token.split(/(-)/); // keep hyphens
        const mapped = parts.map((p, i) => {
          if (p === '-') return p;

          // preserve ALL-CAPS acronyms
          if (isAllCapsWord(p)) return p;

          const lower = p.toLowerCase();
          const shouldLower =
            !isFirst &&
            !isLast &&
            SMALL_WORDS.has(lower) &&
            !(prev && prev.trim().endsWith(':')); // after colon, capitalize

          if (shouldLower) return lower;
          return capitalize(lower);
        });

        // ensure first and last words are capitalized even if small-word
        if (isFirst && mapped[0] && mapped[0] !== '-') {
          const lower = mapped[0].toString().toLowerCase();
          if (SMALL_WORDS.has(lower) && !isAllCapsWord(mapped[0].toString())) {
            mapped[0] = capitalize(lower);
          }
        }
        if (isLast && mapped[mapped.length - 1] && mapped[mapped.length - 1] !== '-') {
          const lw = mapped[mapped.length - 1].toString();
          if (SMALL_WORDS.has(lw.toLowerCase()) && !isAllCapsWord(lw)) {
            mapped[mapped.length - 1] = capitalize(lw.toLowerCase());
          }
        }

        return mapped.join('');
      })
      .join('');
  };

  // Sentence case: lowercase first, then capitalize after start or .!? plus closing quotes/brackets
  const toSentenceCase = (str: string) => {
    if (!str) return str;
    const lower = str.toLowerCase();

    // Capitalize first alpha
    const firstCap = lower.replace(/^[\s"'\(\[\{]*[a-z]/, (m) => m.toUpperCase());

    // Capitalize after sentence-ending punctuation
    return firstCap.replace(/([\.!?]\s*["'\)\]\}]*\s*)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
  };

  const convert = (mode: 'upper' | 'lower' | 'title' | 'sentence') => {
    try {
      setError(null);
      let out = '';
      switch (mode) {
        case 'upper':
          out = input.toUpperCase();
          break;
        case 'lower':
          out = input.toLowerCase();
          break;
        case 'title':
          out = toTitleCase(input);
          break;
        case 'sentence':
          out = toSentenceCase(input);
          break;
      }
      setOutput(out);
      setCopied(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to convert text.');
    }
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
      {/* ✅ Helmet via centralized SEO */}
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />
        {/* OG/Twitter */}
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={seo.canonical} />
        <meta property="og:image" content="https://filesnova.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Structured Data */}
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

        {/* header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 space-x-4">
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
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
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

          {/* Ad space below */}
          <div className="mt-8">
            <AdSpace />
          </div>
        </div>
      </div>
    </>
  );
};

export default CaseConverterPage;
