// src/pages/tools/WordCounterPage.tsx

import React, { useMemo, useState } from 'react';
import UploadZone from '../../components/UploadZone';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import ToolsMenu from '../../components/ToolsMenu';
import {
  Sparkles,
  AlignLeft,
  Shield,
  Zap,
  Star,
} from 'lucide-react';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

type Counts = {
  words: number;
  uniqueWords: number;
  charsWithSpaces: number;
  charsNoSpaces: number;
  lines: number;
  sentences: number;
  paragraphs: number;
  avgWordLength: number;
  readingTimeMin: number;   // ~200 wpm
  speakingTimeMin: number;  // ~130 wpm
};

type TokenizeOptions = {
  caseSensitive: boolean;
  countNumbers: boolean;
  treatHyphenAsOne: boolean;
  stripPunctuation: boolean;
  excludeStopwords: boolean;
};

const defaultOpts: TokenizeOptions = {
  caseSensitive: false,
  countNumbers: true,
  treatHyphenAsOne: true,
  stripPunctuation: false,
  excludeStopwords: false,
};

// lightweight English stopword list
const EN_STOPWORDS = new Set([
  'a','about','above','after','again','against','all','am','an','and','any','are','aren\'t','as','at',
  'be','because','been','before','being','below','between','both','but','by',
  'can\'t','cannot','could','couldn\'t',
  'did','didn\'t','do','does','doesn\'t','doing','don\'t','down','during',
  'each','few','for','from','further',
  'had','hadn\'t','has','hasn\'t','have','haven\'t','having','he','he\'d','he\'ll','he\'s','her','here','here\'s','hers','herself','him','himself','his','how','how\'s',
  'i','i\'d','i\'ll','i\'m','i\'ve','if','in','into','is','isn\'t','it','it\'s','its','itself',
  'let\'s','me','more','most','mustn\'t','my','myself',
  'no','nor','not','of','off','on','once','only','or','other','ought','our','ours','ourselves','out','over','own',
  'same','shan\'t','she','she\'d','she\'ll','she\'s','should','shouldn\'t','so','some','such',
  'than','that','that\'s','the','their','theirs','them','themselves','then','there','there\'s','these','they','they\'d','they\'ll','they\'re','they\'ve','this','those','through','to','too',
  'under','until','up',
  'very',
  'was','wasn\'t','we','we\'d','we\'ll','we\'re','we\'ve','were','weren\'t','what','what\'s','when','when\'s','where','where\'s','which','while','who','who\'s','whom','why','why\'s','with','won\'t','would','wouldn\'t',
  'you','you\'d','you\'ll','you\'re','you\'ve','your','yours','yourself','yourselves'
]);

type FreqRow = { token: string; count: number; pct: number };

const WordCounterPage: React.FC = () => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Advanced options
  const [opts, setOpts] = useState<TokenizeOptions>(defaultOpts);

  // Frequency state
  const [freqs, setFreqs] = useState<FreqRow[] | null>(null);
  const [topN, setTopN] = useState(50);

  // SEO data (Home → Tools → Word Counter)
  const { title, description, canonical, breadcrumb } =
    TOOL_SEO_DATA['/tools/word-counter'];

  // --- Helpers ---
  const cleanForCounting = (raw: string) => raw.replace(/\u200B|\u200C|\u200D|\uFEFF/g, ''); // zero-width cleanup

  const tokenizeWords = (raw: string, o: TokenizeOptions): string[] => {
    let s = cleanForCounting(raw);

    if (o.treatHyphenAsOne) {
      // collapse spaces around hyphens: "well - being" -> "well-being"
      s = s.replace(/\s*-\s*/g, '-');
    }

    const wordRegex = o.treatHyphenAsOne
      ? /[\p{L}\p{N}_]+(?:[-'][\p{L}\p{N}_]+)*/gu
      : /[\p{L}\p{N}_]+(?:'[ \p{L}\p{N}_]+)*/gu;

    let tokens = s.match(wordRegex) || [];

    if (!o.countNumbers) {
      tokens = tokens.filter((t) => /[A-Za-z\u00C0-\u024F]/.test(t));
    }

    if (!o.caseSensitive) {
      tokens = tokens.map((t) => t.toLowerCase());
    }

    if (o.stripPunctuation) {
      tokens = tokens.map((t) => t.replace(/[^\p{L}\p{N}_-]+/gu, '')).filter(Boolean);
    }

    if (o.excludeStopwords && !o.caseSensitive) {
      tokens = tokens.filter((t) => !EN_STOPWORDS.has(t));
    }

    return tokens;
  };

  const splitSentences = (raw: string): string[] => {
    const s = cleanForCounting(raw).replace(/\s+/g, ' ').trim();
    if (!s) return [];
    const parts = s.split(/(?<=[.!?])\s+(?=[A-Z(“"'])/g);
    return parts.filter(Boolean);
  };

  const splitParagraphs = (raw: string): string[] => {
    const parts = cleanForCounting(raw).split(/\r?\n\s*\r?\n/);
    return parts.filter((p) => p.trim().length > 0);
  };

  const computeCounts = () => {
    try {
      setError(null);
      const src = text || '';
      const tokens = tokenizeWords(src, opts);

      const charsWithSpaces = src.length;
      const charsNoSpaces = src.replace(/\s+/g, '').length;
      const lines = src ? src.split(/\r?\n/).length : 0;
      const sentences = splitSentences(src).length;
      const paragraphs = splitParagraphs(src).length;

      const totalWordChars = tokens.reduce((sum, t) => sum + t.length, 0);
      const avgWordLength = tokens.length ? totalWordChars / tokens.length : 0;
      const uniqueWords = new Set(tokens).size;

      const words = tokens.length;
      const readingTimeMin = words ? Math.max(0.01, words / 200) : 0;
      const speakingTimeMin = words ? Math.max(0.01, words / 130) : 0;

      setCounts({
        words,
        uniqueWords,
        charsWithSpaces,
        charsNoSpaces,
        lines,
        sentences,
        paragraphs,
        avgWordLength,
        readingTimeMin,
        speakingTimeMin,
      });

      // build frequencies
      const map = new Map<string, number>();
      for (const t of tokens) map.set(t, (map.get(t) || 0) + 1);
      const arr: FreqRow[] = Array.from(map.entries())
        .map(([token, count]) => ({
          token,
          count,
          pct: words ? (count / words) * 100 : 0,
        }))
        .sort((a, b) => (b.count - a.count) || a.token.localeCompare(b.token));

      setFreqs(arr);
    } catch (err: any) {
      console.error(err);
      setError('Failed to compute counts');
      setCounts(null);
      setFreqs(null);
    }
  };

  const exportCsv = () => {
    if (!counts) return;
    const rows = [
      ['Metric', 'Value'],
      ['Words', counts.words],
      ['Unique Words', counts.uniqueWords],
      ['Characters (with spaces)', counts.charsWithSpaces],
      ['Characters (no spaces)', counts.charsNoSpaces],
      ['Lines', counts.lines],
      ['Sentences', counts.sentences],
      ['Paragraphs', counts.paragraphs],
      ['Average Word Length', counts.avgWordLength.toFixed(2)],
      ['Reading Time (min @200wpm)', counts.readingTimeMin.toFixed(2)],
      ['Speaking Time (min @130wpm)', counts.speakingTimeMin.toFixed(2)],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'word-counter.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportFreqCsv = () => {
    if (!freqs) return;
    const lim = Math.max(1, Math.min(1000, topN)); // safety
    const rows = [
      ['Rank', 'Token', 'Count', 'Percent'],
      ...freqs.slice(0, lim).map((r, i) => [String(i + 1), r.token, String(r.count), r.pct.toFixed(2) + '%']),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'word-frequency.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const cleanedText = useMemo(() => cleanForCounting(text), [text]);

  const copyCleaned = async () => {
    try {
      await navigator.clipboard.writeText(cleanedText);
    } catch {}
  };

  return (
    <>
      <ToolSeo
        title={title}
        description={description}
        canonical={canonical}
        breadcrumb={breadcrumb}
        showBreadcrumb
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* BG pulses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no arrow; Tools button on right) */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-">
              <div className="relative shrink-0">
                <img
                  src={FileNovaIcon}
                  alt="Files Nova"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  draggable={false}
                  loading="lazy"
                  width="96"
                  height="96"
                />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Files Nova
                </h1>
                <p className="text-xs text-gray-500 font-medium">Word Counter</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <AlignLeft className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Word Counter</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Count words, characters, lines, sentences & more — paste text or upload a file.
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

          {/* Editor + Upload */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Enter or Upload Text</h3>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setCounts(null);
                setFreqs(null);
                setError(null);
              }}
              placeholder="Type or paste text here..."
              className="w-full h-40 p-4 mb-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
              <button
                type="button"
                onClick={() => {
                  setText('');
                  setCounts(null);
                  setFreqs(null);
                  setFile(null);
                  setError(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={copyCleaned}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                title="Copy text without zero-width characters"
              >
                Copy cleaned text
              </button>
            </div>

            <UploadZone
              accept="text/plain,text/markdown,text/csv,.txt,.md,.csv"
              multiple={false}
              title="Drop your TXT/MD/CSV file here"
              buttonLabel="Choose File"
              supportedFormats="TXT, MD, CSV"
              onFilesSelected={(fs) => {
                const f = fs[0] || null;
                setFile(f);
                setCounts(null);
                setFreqs(null);
                setError(null);
                if (f) {
                  const reader = new FileReader();
                  reader.onload = () => setText((reader.result as string) ?? '');
                  reader.onerror = () => setError('Failed to read file');
                  reader.readAsText(f);
                } else {
                  setText('');
                }
              }}
            />

            {/* Options */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-xl border border-gray-200 bg-white/70">
                <h4 className="font-semibold text-gray-900 mb-3">Counting Options</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={opts.caseSensitive}
                      onChange={(e) => setOpts((o) => ({ ...o, caseSensitive: e.target.checked }))}
                    />
                    <span className="text-sm text-gray-700">Case-sensitive unique words</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={opts.countNumbers}
                      onChange={(e) => setOpts((o) => ({ ...o, countNumbers: e.target.checked }))}
                    />
                    <span className="text-sm text-gray-700">Count numbers as words</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={opts.treatHyphenAsOne}
                      onChange={(e) => setOpts((o) => ({ ...o, treatHyphenAsOne: e.target.checked }))}
                    />
                    <span className="text-sm text-gray-700">Hyphenated as one word</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={opts.stripPunctuation}
                      onChange={(e) => setOpts((o) => ({ ...o, stripPunctuation: e.target.checked }))}
                    />
                    <span className="text-sm text-gray-700">Strip punctuation in tokens</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={opts.excludeStopwords}
                      onChange={(e) => setOpts((o) => ({ ...o, excludeStopwords: e.target.checked }))}
                    />
                    <span className="text-sm text-gray-700">Exclude common stopwords</span>
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-white/70">
                <h4 className="font-semibold text-gray-900 mb-3">Quick Tips</h4>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  <li>Paste or upload text and click <strong>Count Words</strong>.</li>
                  <li>Reading time is estimated at ~200 wpm; speaking at ~130 wpm.</li>
                  <li>“Copy cleaned text” removes zero-width characters.</li>
                  <li>Use “Exclude stopwords” to focus frequencies on content words.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={computeCounts}
              disabled={!text && !file}
              className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Count Words
            </button>

            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

          {/* Results */}
          {counts && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Results</h3>

              {/* Stat chips */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-600">Words</span>
                  <span className="font-semibold text-gray-900">{counts.words}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-600">Unique Words</span>
                  <span className="font-semibold text-gray-900">{counts.uniqueWords}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-600">Characters (w/ spaces)</span>
                  <span className="font-semibold text-gray-900">{counts.charsWithSpaces}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-600">Characters (no spaces)</span>
                  <span className="font-semibold text-gray-900">{counts.charsNoSpaces}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-600">Sentences</span>
                  <span className="font-semibold text-gray-900">{counts.sentences}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-600">Paragraphs</span>
                  <span className="font-semibold text-gray-900">{counts.paragraphs}</span>
                </div>
              </div>

              {/* More details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-white/70">
                  <h4 className="font-semibold text-gray-900 mb-2">Averages</h4>
                  <p className="text-sm text-gray-700">
                    <strong>Average word length:</strong> {counts.avgWordLength.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 bg-white/70">
                  <h4 className="font-semibold text-gray-900 mb-2">Time Estimates</h4>
                  <p className="text-sm text-gray-700">
                    <strong>Reading:</strong> {counts.readingTimeMin.toFixed(2)} min
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Speaking:</strong> {counts.speakingTimeMin.toFixed(2)} min
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={exportCsv}
                  className="w-full sm:w-auto px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Download results (CSV)
                </button>
              </div>
            </div>
          )}

          {/* Word Frequency */}
          {freqs && freqs.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">3. Word Frequency</h3>
                  <p className="text-gray-600 text-sm">
                    Top tokens based on your options {opts.excludeStopwords ? '(stopwords excluded)' : ''}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Show top</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={topN}
                    onChange={(e) => setTopN(Math.max(1, Math.min(1000, Number(e.target.value) || 50)))}
                    className="w-24 p-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={exportFreqCsv}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Download frequency (CSV)
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600 text-sm">
                      <th className="py-2 pr-4 font-semibold">#</th>
                      <th className="py-2 pr-4 font-semibold">Token</th>
                      <th className="py-2 pr-4 font-semibold">Count</th>
                      <th className="py-2 pr-4 font-semibold">Percent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freqs.slice(0, topN).map((r, i) => (
                      <tr key={r.token} className="border-b border-gray-100">
                        <td className="py-2 pr-4 text-gray-700">{i + 1}</td>
                        <td className="py-2 pr-4 text-gray-900 font-medium break-all">{r.token}</td>
                        <td className="py-2 pr-4 text-gray-700">{r.count}</td>
                        <td className="py-2 pr-4 text-gray-700">{r.pct.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WordCounterPage;
