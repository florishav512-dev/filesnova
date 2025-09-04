import React, { useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  Sparkles,
  Shield,
  Zap,
  Star,
  Scissors,
  FileUp,
  Download as DownloadIcon,
  X,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { getToolSeoByPath } from '../../components/seo/toolSeoData';
import ToolsMenu from '../../components/ToolsMenu';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

type OutputFile = { name: string; url: string; size: number };

const SplitPdfPage: React.FC = () => {
  const seo = getToolSeoByPath('/tools/split-pdf');

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);

  const [mode, setMode] = useState<'split-all' | 'extract-range' | 'multi-ranges'>('split-all');
  // Every-N + naming
  const [everyN, setEveryN] = useState<number>(1);
  const [namePattern, setNamePattern] = useState<string>('{base}-p{start}-{end}.pdf');

  const [rangeText, setRangeText] = useState<string>('');
  const [outputs, setOutputs] = useState<OutputFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ---------- Helpers ----------
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // fresh buffer loader to avoid detached ArrayBuffer issues
  const loadPdfFresh = async (f: File) => {
    const buf = await f.arrayBuffer(); // ALWAYS read fresh
    return PDFDocument.load(buf);
  };

  // Parse "1-3,5,7-9" -> [1,2,3,5,7,8,9]
  const parseSingleRange = (text: string, maxPage: number): number[] => {
    const cleaned = text.replace(/\s+/g, '');
    if (!cleaned) return [];
    const parts = cleaned.split(',');
    const pages: number[] = [];
    for (const part of parts) {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map((n) => parseInt(n, 10));
        if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('Invalid range format.');
        const start = Math.min(a, b);
        const end = Math.max(a, b);
        if (start < 1 || end > maxPage) throw new Error(`Range out of bounds (1–${maxPage}).`);
        for (let p = start; p <= end; p++) pages.push(p);
      } else {
        const p = parseInt(part, 10);
        if (!Number.isFinite(p)) throw new Error('Invalid page number.');
        if (p < 1 || p > maxPage) throw new Error(`Page out of bounds (1–${maxPage}).`);
        pages.push(p);
      }
    }
    return Array.from(new Set(pages)).sort((a, b) => a - b);
  };

  // Parse "1-3; 4,6-7" -> [[1,2,3], [4,6,7]]
  const parseRangeGroups = (text: string, maxPage: number): number[][] => {
    const groups = text
      .split(';')
      .map((g) => g.trim())
      .filter(Boolean);
    if (groups.length === 0) return [];
    return groups.map((g) => parseSingleRange(g, maxPage));
  };

  const resetOutputs = () => {
    outputs.forEach((o) => URL.revokeObjectURL(o.url));
    setOutputs([]);
  };

  // ---------- Handlers ----------
  const postSelectCommon = async (f: File) => {
    setFile(f);
    resetOutputs();
    setError(null);
    try {
      const pdf = await loadPdfFresh(f); // read fresh here too
      setPageCount(pdf.getPageCount());
    } catch {
      setPageCount(null);
      setError('Unable to read PDF. The file might be corrupted.');
    }
  };

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') return setError('Please select a PDF file.');
    await postSelectCommon(f);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') return setError('Please drop a PDF file.');
    await postSelectCommon(f);
  };

  const resolvedName = (base: string, start: number, end: number) =>
    namePattern
      .replace(/\{base\}/g, base)
      .replace(/\{start\}/g, String(start))
      .replace(/\{end\}/g, String(end));

  const doSplitAllOrEveryN = async () => {
    if (!file || !pageCount) return;
    setBusy(true);
    setProgress(0);
    resetOutputs();

    try {
      const src = await loadPdfFresh(file); // <-- FRESH BUFFER (fixes detached)
      const base = file.name.replace(/\.pdf$/i, '');
      const out: OutputFile[] = [];

      const step = Math.max(1, Math.floor(everyN || 1)); // everyN=1 -> one page per file
      for (let start = 1; start <= pageCount; start += step) {
        const end = Math.min(pageCount, start + step - 1);
        const newPdf = await PDFDocument.create();
        const indices = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
        const copied = await newPdf.copyPages(src, indices);
        copied.forEach((pg) => newPdf.addPage(pg));
        const bytes = await newPdf.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        out.push({
          name: resolvedName(base, start, end),
          url: URL.createObjectURL(blob),
          size: blob.size,
        });
        setProgress(Math.round((end / pageCount) * 100));
        // let UI breathe on large docs
        if ((end % 10) === 0) await new Promise((r) => setTimeout(r, 0));
      }
      setOutputs(out);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Unexpected error while splitting.');
    } finally {
      setBusy(false);
    }
  };

  const doExtractRange = async () => {
    if (!file || !pageCount) return;
    setBusy(true);
    setProgress(0);
    resetOutputs();

    try {
      const pages = parseSingleRange(rangeText, pageCount);
      if (pages.length === 0) throw new Error('Please enter a valid range.');
      const src = await loadPdfFresh(file); // FRESH
      const newPdf = await PDFDocument.create();
      const indices = pages.map((p) => p - 1);
      const copied = await newPdf.copyPages(src, indices);
      copied.forEach((pg) => newPdf.addPage(pg));
      const bytes = await newPdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setOutputs([
        {
          name: `${file.name.replace(/\.pdf$/i, '')}-extracted.pdf`,
          url: URL.createObjectURL(blob),
          size: blob.size,
        },
      ]);
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Invalid range format.');
    } finally {
      setBusy(false);
    }
  };

  const doMultiRanges = async () => {
    if (!file || !pageCount) return;
    setBusy(true);
    setProgress(0);
    resetOutputs();

    try {
      const groups = parseRangeGroups(rangeText, pageCount);
      if (groups.length === 0) throw new Error('Please enter at least one range group.');
      const src = await loadPdfFresh(file); // FRESH

      const out: OutputFile[] = [];
      const base = file.name.replace(/\.pdf$/i, '');
      for (let gi = 0; gi < groups.length; gi++) {
        const newPdf = await PDFDocument.create();
        const indices = groups[gi].map((p) => p - 1);
        const copied = await newPdf.copyPages(src, indices);
        copied.forEach((pg) => newPdf.addPage(pg));

        const bytes = await newPdf.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        out.push({
          name: `${base}-group-${gi + 1}.pdf`,
          url: URL.createObjectURL(blob),
          size: blob.size,
        });
        setProgress(Math.round(((gi + 1) / groups.length) * 100));
        if ((gi % 3) === 2) await new Promise((r) => setTimeout(r, 0));
      }
      setOutputs(out);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Invalid ranges. Example: "1-3; 5; 7-9"');
    } finally {
      setBusy(false);
    }
  };

  const handleStart = () => {
    setError(null);
    if (!file) return setError('Please upload a PDF first.');
    if (mode === 'split-all') return void doSplitAllOrEveryN();
    if (mode === 'extract-range') return void doExtractRange();
    if (mode === 'multi-ranges') return void doMultiRanges();
  };

  // ---------- UI ----------
  return (
    <>
      {/* SEO */}
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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no back arrow, with Tools button) */}
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
                <p className="text-xs text-gray-500 font-medium">Split PDF</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Tool Header */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <Scissors className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Split PDF</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Split your PDF into single pages or extract custom page ranges—fast, private, in your browser.
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

          {/* Upload + Options */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8">
            <div className="p-8">
              <div
                className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="mb-6">
                  <FileUp className="w-16 h-16 mx-auto text-gray-400 group-hover:text-blue-500 group-hover:animate-bounce transition-all" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {file ? 'Change PDF' : 'Drop your PDF here'}
                </h3>
                <p className="text-gray-600 mb-4">{file ? file.name : 'or click to browse from your device'}</p>
                <button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:-translate-y-1">
                  {file ? 'Choose Another PDF' : 'Choose PDF'}
                </button>
                <p className="text-xs text-gray-500 mt-4">Supported format: PDF</p>
              </div>
              <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleSelect} />
            </div>

            {file && pageCount !== null && (
              <div className="border-t border-gray-200 p-8">
                {/* Modes */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    className={`px-4 py-2 rounded-xl font-medium ${mode === 'split-all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    onClick={() => setMode('split-all')}
                  >
                    Split All / Every N
                  </button>
                  <button
                    className={`px-4 py-2 rounded-xl font-medium ${mode === 'extract-range' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    onClick={() => setMode('extract-range')}
                  >
                    Extract Range
                  </button>
                  <button
                    className={`px-4 py-2 rounded-xl font-medium ${mode === 'multi-ranges' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    onClick={() => setMode('multi-ranges')}
                  >
                    Multi-Ranges
                  </button>
                </div>

                {/* Split-all / Every-N controls — mobile-safe grid */}
                {mode === 'split-all' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="min-w-0">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Every N pages
                        <span className="ml-2 text-xs font-normal text-gray-500">(1 = one page per file)</span>
                      </label>
                      <input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={everyN}
                        onChange={(e) => setEveryN(Math.max(1, parseInt(e.target.value || '1', 10)))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Name pattern</label>
                      <input
                        value={namePattern}
                        onChange={(e) => setNamePattern(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="{base}-p{start}-{end}.pdf"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use <code>{'{base}'}</code>, <code>{'{start}'}</code>, <code>{'{end}'}</code>
                      </p>
                    </div>
                  </div>
                )}

                {/* Range input */}
                {(mode === 'extract-range' || mode === 'multi-ranges') && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {mode === 'extract-range'
                        ? `Enter pages (1–${pageCount}). Example: 1-3,5,7-9`
                        : `Enter groups separated by semicolon. Example: 1-3; 4,6-7`}
                    </label>
                    <input
                      value={rangeText}
                      onChange={(e) => setRangeText(e.target.value)}
                      placeholder={mode === 'extract-range' ? '1-3,5,7-9' : '1-3; 4,6-7'}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}

                {/* Info row */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                  <span className="inline-flex items-center bg-gray-100 px-3 py-1 rounded-xl">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                    Pages: {pageCount}
                  </span>
                  {error && (
                    <span className="inline-flex items-center bg-red-100 px-3 py-1 rounded-xl text-red-700">
                      <X className="w-4 h-4 mr-1" />
                      {error}
                    </span>
                  )}
                </div>

                {/* Progress */}
                {busy && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-blue-900">Processing...</span>
                      <span className="text-blue-600 font-bold">{Math.max(0, Math.min(100, Math.round(progress)))}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <button
                    onClick={handleStart}
                    disabled={
                      busy ||
                      !file ||
                      (mode === 'extract-range' && rangeText.trim().length === 0) ||
                      (mode === 'multi-ranges' && rangeText.trim().length === 0)
                    }
                    className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                  >
                    {busy ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-3"></div>
                        Working...
                      </>
                    ) : (
                      <>
                        <Scissors className="w-5 h-5 inline mr-3" />
                        {mode === 'split-all' ? 'Split: One File per Page / Every N' : mode === 'extract-range' ? 'Extract Range' : 'Create PDFs'}
                      </>
                    )}
                  </button>
                </div>

                {/* Outputs */}
                {outputs.length > 0 && (
                  <div className="mt-8 space-y-3">
                    <h4 className="text-lg font-semibold text-gray-900">Downloads</h4>
                    {outputs.map((o) => (
                      <div key={o.url} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <DownloadIcon className="w-5 h-5 text-gray-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{o.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(o.size)}</p>
                          </div>
                        </div>
                        <a
                          href={o.url}
                          download={o.name}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SplitPdfPage;
