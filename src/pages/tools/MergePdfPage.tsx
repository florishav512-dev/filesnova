// src/pages/tools/MergePdfPage.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import { PDFDocument, degrees } from 'pdf-lib';
import UploadZone from '../../components/UploadZone';
import {
  Sparkles,
  Files,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  MoveUpRight,
  MoveDownRight,
  X,
} from 'lucide-react';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

// ✅ SEO imports
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';

// ✅ Animated Tools dropdown
import ToolsMenu from '../../components/ToolsMenu';

type Rotate = 0 | 90 | 180 | 270;
type OrderMode = 'manual' | 'name' | 'size' | 'date';

type Item = {
  id: string;
  file: File;
  pages?: number;
  range: string;     // e.g. "1-3,5"
  rotate: Rotate;    // rotation applied to selected pages
  status: 'ready' | 'loaded';
};

const parseRange = (range: string, total: number): number[] => {
  // returns 0-based page indices
  if (!range.trim()) return Array.from({ length: total }, (_, i) => i);
  const out: number[] = [];
  const parts = range.split(',').map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      let a = Math.max(1, parseInt(m[1], 10));
      let b = Math.min(total, parseInt(m[2], 10));
      if (a > b) [a, b] = [b, a];
      for (let i = a; i <= b; i++) out.push(i - 1);
    } else if (/^\d+$/.test(p)) {
      const num = Math.min(total, Math.max(1, parseInt(p, 10)));
      out.push(num - 1);
    }
  }
  return Array.from(new Set(out)).sort((a, b) => a - b);
};

const MergePdfPage: React.FC = () => {
  // files + UI
  const [items, setItems] = useState<Item[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // advanced options
  const [orderMode, setOrderMode] = useState<OrderMode>('manual');
  const [interleave, setInterleave] = useState(false);
  const [addPageNumbers, setAddPageNumbers] = useState(true);
  const [docTitle, setDocTitle] = useState('Merged Document');
  const [docAuthor, setDocAuthor] = useState('');
  const [outputName, setOutputName] = useState('merged.pdf');

  // ✅ Per-page SEO data
  const seo = TOOL_SEO_DATA['/tools/merge-pdf'];

  // Load persisted settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fn_mergepdf_settings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.orderMode) setOrderMode(s.orderMode);
      if (typeof s.interleave === 'boolean') setInterleave(s.interleave);
      if (typeof s.addPageNumbers === 'boolean') setAddPageNumbers(s.addPageNumbers);
      if (typeof s.docTitle === 'string') setDocTitle(s.docTitle);
      if (typeof s.docAuthor === 'string') setDocAuthor(s.docAuthor);
      if (typeof s.outputName === 'string') setOutputName(s.outputName);
    } catch {}
  }, []);
  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(
        'fn_mergepdf_settings',
        JSON.stringify({ orderMode, interleave, addPageNumbers, docTitle, docAuthor, outputName })
      );
    } catch {}
  }, [orderMode, interleave, addPageNumbers, docTitle, docAuthor, outputName]);

  // Handle file selection
  const onFilesSelected = async (fs: File[]) => {
    setDownloadUrl(null);
    setError(null);

    const mapped: Item[] = fs.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      pages: undefined,
      range: '',
      rotate: 0,
      status: 'ready',
    }));

    setItems((prev) => [...prev, ...mapped]);

    // Load page counts asynchronously
    for (const m of mapped) {
      try {
        const buf = await m.file.arrayBuffer();
        const doc = await PDFDocument.load(buf);
        const count = doc.getPageCount();
        setItems((prev) =>
          prev.map((it) =>
            it.id === m.id ? { ...it, pages: count, status: 'loaded' } : it
          )
        );
      } catch (e) {
        setItems((prev) => prev.map((it) => (it.id === m.id ? { ...it, pages: 0, status: 'loaded' } : it)));
      }
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const moveItem = (id: string, dir: 'up' | 'down') => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx === -1) return prev;
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[swap]] = [copy[swap], copy[idx]];
      return copy;
    });
  };

  const orderedItems = useMemo(() => {
    if (orderMode === 'manual') return items;
    const copy = [...items];
    if (orderMode === 'name') copy.sort((a, b) => a.file.name.localeCompare(b.file.name));
    if (orderMode === 'size') copy.sort((a, b) => a.file.size - b.file.size);
    if (orderMode === 'date') copy.sort((a, b) => a.file.lastModified - b.file.lastModified);
    return copy;
  }, [items, orderMode]);

  const merge = async () => {
    if (orderedItems.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setDownloadUrl(null);

    try {
      // preload docs + selected page indices
      const docs: { src: PDFDocument; pages: number; pick: number[]; rotate: Rotate }[] = [];
      for (let i = 0; i < orderedItems.length; i++) {
        const it = orderedItems[i];
        const buf = await it.file.arrayBuffer();
        const src = await PDFDocument.load(buf);
        const total = src.getPageCount();
        const pick = parseRange(it.range, total);
        docs.push({
          src,
          pages: total,
          pick: pick.length ? pick : Array.from({ length: total }, (_, j) => j),
          rotate: it.rotate,
        });
      }

      // compute total pages to copy for progress
      let totalCopy = 0;
      docs.forEach((d) => (totalCopy += d.pick.length));
      let copied = 0;

      const out = await PDFDocument.create();
      if (docTitle.trim()) out.setTitle(docTitle.trim());
      if (docAuthor.trim()) out.setAuthor(docAuthor.trim());

      if (!interleave) {
        for (const d of docs) {
          const copiedPages = await out.copyPages(d.src, d.pick);
          for (const p of copiedPages) {
            if (d.rotate) p.setRotation(degrees(d.rotate));
            out.addPage(p);
            copied++;
            if (copied % 3 === 0) await new Promise((r) => setTimeout(r, 0));
            setProgress(Math.round((copied / totalCopy) * 100));
          }
        }
      } else {
        const queues = docs.map((d) => [...d.pick]);
        let added = true;
        while (added) {
          added = false;
          for (let i = 0; i < docs.length; i++) {
            const d = docs[i];
            const nextIndex = queues[i].shift();
            if (typeof nextIndex === 'number') {
              const [p] = await out.copyPages(d.src, [nextIndex]);
              if (d.rotate) p.setRotation(degrees(d.rotate));
              out.addPage(p);
              copied++;
              added = true;
              if (copied % 3 === 0) await new Promise((r) => setTimeout(r, 0));
              setProgress(Math.round((copied / totalCopy) * 100));
            }
          }
        }
      }

      // Page numbers (footer)
      if (addPageNumbers) {
        const font = await out.embedFont('Helvetica');
        const n = out.getPageCount();
        for (let i = 0; i < n; i++) {
          const page = out.getPage(i);
          const s = `${i + 1} / ${n}`;
          const sz = 9;
          const width = font.widthOfTextAtSize(s, sz);
          const { width: W } = page.getSize();
          page.drawText(s, { x: (W - width) / 2, y: 24, font, size: sz });
        }
      }

      const bytes = await out.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to merge PDFs.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* ✅ Centralized SEO (includes structured data + meta if configured) */}
      <ToolSeo {...seo} />

      {/* Head */}
      <Helmet>
        <title>Merge PDF Files – Combine Multiple PDFs | FilesNova</title>
        <meta
          name="description"
          content="Reorder, select page ranges, rotate, and interleave PDFs into one file. Private, fast, and free—right in your browser."
        />
        <link rel="canonical" href="https://filesnova.com/tools/merge-pdf" />
      </Helmet>

      {/* JSON-LD */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Merge PDF – Files Nova',
          url: 'https://filesnova.com/tools/merge-pdf',
          applicationCategory: 'FileConverter',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://filesnova.com/' },
            { '@type': 'ListItem', position: 2, name: 'Merge PDF', item: 'https://filesnova.com/tools/merge-pdf' },
          ],
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* BG pulses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
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
                <p className="text-xs text-gray-500 font-medium">Merge PDFs</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Tool header */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <Files className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Merge PDFs</h2>
              <p className="text-gray-700 text-lg leading-relaxed">Combine, reorder, range-select, rotate, and interleave your PDFs.</p>
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

          {/* Uploader + controls */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload PDF Files</h3>
            <UploadZone
              accept="application/pdf"
              multiple={true}
              title="Drop your PDF files here"
              buttonLabel="Choose Files"
              supportedFormats="PDF"
              onFilesSelected={onFilesSelected}
            />

            {/* Global options */}
            {items.length > 0 && (
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700 whitespace-nowrap">Order</label>
                  <select
                    value={orderMode}
                    onChange={(e) => setOrderMode(e.target.value as OrderMode)}
                    className="p-2 border border-gray-300 rounded-lg bg-white w-full sm:w-56 max-w-full"
                  >
                    <option value="manual">Manual (buttons)</option>
                    <option value="name">By Name (A→Z)</option>
                    <option value="size">By Size (small→large)</option>
                    <option value="date">By Date (old→new)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={interleave}
                      onChange={(e) => setInterleave(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Interleave pages</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addPageNumbers}
                      onChange={(e) => setAddPageNumbers(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Add page numbers</span>
                  </label>
                </div>
              </div>
            )}

            {/* Document meta + output name */}
            {items.length > 0 && (
              <div className="mt-4 grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Title</label>
                  <input
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Merged Document"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Author</label>
                  <input
                    value={docAuthor}
                    onChange={(e) => setDocAuthor(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Output Filename</label>
                  <input
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="merged.pdf"
                  />
                </div>
              </div>
            )}

            {/* Items list */}
            {items.length > 0 && (
              <>
                <h4 className="text-lg font-semibold text-gray-800 mt-8 mb-3">
                  Files ({orderedItems.length})
                </h4>
                <div className="space-y-3">
                  {orderedItems.map((it, idx) => (
                    <div key={it.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                      {/* left: name + meta */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                          <Files className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{it.file.name}</p>
                          <p className="text-xs text-gray-500">
                            {it.pages != null ? `${it.pages} page${(it.pages || 0) > 1 ? 's' : ''}` : 'Loading…'} • {(it.file.size/1024/1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      {/* center: range + rotate (responsive fix) */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="flex items-center gap-2 min-w-0">
                          <label className="text-sm text-gray-700 whitespace-nowrap shrink-0">Pages</label>
                          <input
                            value={it.range}
                            onChange={(e) =>
                              setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, range: e.target.value } : p)))
                            }
                            placeholder="e.g. 1-3,5"
                            className="w-28 sm:w-32 p-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <label className="text-sm text-gray-700 whitespace-nowrap shrink-0">Rotate</label>
                          <select
                            value={it.rotate}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((p) =>
                                  p.id === it.id ? { ...p, rotate: parseInt(e.target.value, 10) as Rotate } : p
                                )
                              )
                            }
                            className="w-24 sm:w-[5.5rem] p-2 border border-gray-300 rounded-lg bg-white"
                          >
                            <option value={0}>0°</option>
                            <option value={90}>90°</option>
                            <option value={180}>180°</option>
                            <option value={270}>270°</option>
                          </select>
                        </div>
                      </div>

                      {/* right: controls */}
                      <div className="flex items-center gap-2 sm:ml-auto">
                        {orderMode === 'manual' && (
                          <>
                            <button
                              onClick={() => moveItem(it.id, 'up')}
                              disabled={idx === 0}
                              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40"
                              title="Move up"
                            >
                              <MoveUpRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveItem(it.id, 'down')}
                              disabled={idx === orderedItems.length - 1}
                              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40"
                              title="Move down"
                            >
                              <MoveDownRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => removeItem(it.id)}
                          className="p-2 rounded-lg hover:bg-red-100"
                          title="Remove"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Merge button + progress */}
                <button
                  onClick={merge}
                  disabled={isProcessing || orderedItems.length === 0}
                  className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Merging…' : 'Merge PDFs'}
                </button>
                {isProcessing && (
                  <div className="mt-4 w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                {error && <p className="text-red-600 mt-4">{error}</p>}
              </>
            )}
          </div>

          {/* Download */}
          {downloadUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
              <a
                href={downloadUrl}
                download={outputName || 'merged.pdf'}
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MergePdfPage;
