// src/pages/tools/PdfToJpgPage.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import {
  Sparkles,
  Image as ImageIcon,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  Clock,
} from 'lucide-react';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

// ✅ SEO imports
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';

// ✅ Animated Tools dropdown
import ToolsMenu from '../../components/ToolsMenu';

type ImgFormat = 'jpeg' | 'png';

const parseRange = (range: string, total: number): number[] => {
  // return 0-based indices
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

/**
 * Runtime loader for PDF.js from CDN to avoid bundler/Netlify issues.
 * Exposes window.pdfjsLib and configures worker.
 */
const usePdfJs = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as any;
    if (w.pdfjsLib) {
      setReady(true);
      return;
    }
    const script = document.createElement('script');
    // pinned version for stability
    script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
    script.async = true;
    script.onload = () => {
      try {
        const lib = (window as any).pdfjsLib;
        // worker
        lib.GlobalWorkerOptions.workerSrc =
          'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        setReady(true);
      } catch {
        setReady(false);
      }
    };
    script.onerror = () => setReady(false);
    document.head.appendChild(script);
    return () => {
      // keep it for subsequent visits (speeds up)
    };
  }, []);
  return ready;
};

const PdfToJpgPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Advanced options (persisted)
  const [pageRange, setPageRange] = useState<string>(''); // e.g., 1-3,5
  const [format, setFormat] = useState<ImgFormat>('jpeg');
  const [quality, setQuality] = useState<number>(90); // for jpeg
  const [scale, setScale] = useState<number>(2); // 1..4 (like DPI multiplier)
  const [transparent, setTransparent] = useState<boolean>(true); // png only
  const [zipName, setZipName] = useState<string>('images.zip');
  const [concurrency, setConcurrency] = useState<number>(2); // pages rendered in parallel

  // ✅ Per-page SEO data
  const seo = TOOL_SEO_DATA['/tools/pdf-to-jpg'];

  // PDF.js loader state
  const pdfJsReady = usePdfJs();

  // persist settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fn_pdf2img_settings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.pageRange === 'string') setPageRange(s.pageRange);
      if (s.format) setFormat(s.format);
      if (typeof s.quality === 'number') setQuality(s.quality);
      if (typeof s.scale === 'number') setScale(s.scale);
      if (typeof s.transparent === 'boolean') setTransparent(s.transparent);
      if (typeof s.zipName === 'string') setZipName(s.zipName);
      if (typeof s.concurrency === 'number') setConcurrency(s.concurrency);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        'fn_pdf2img_settings',
        JSON.stringify({ pageRange, format, quality, scale, transparent, zipName, concurrency })
      );
    } catch {}
  }, [pageRange, format, quality, scale, transparent, zipName, concurrency]);

  const convert = async () => {
    if (!file) return;
    if (!pdfJsReady) {
      setError('Renderer is still loading. Please wait a moment and try again.');
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setDownloadUrl(null);

    try {
      const arr = await file.arrayBuffer();
      const pdfjs = (window as any).pdfjsLib;
      const loadingTask = pdfjs.getDocument({ data: arr });
      const doc = await loadingTask.promise;
      const pageCount: number = doc.numPages;

      const targets = parseRange(pageRange, pageCount);
      const pages = targets.length ? targets : Array.from({ length: pageCount }, (_, i) => i);

      // render helper
      const renderPage = async (index: number) => {
        const page = await doc.getPage(index + 1); // 1-based in pdf.js
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: false });
        if (!ctx) throw new Error('Canvas not supported');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        // Transparent background for PNG (or white for JPEG)
        if (!(format === 'png' && transparent)) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        await page.render({
          canvasContext: ctx,
          viewport,
          background: format === 'png' && transparent ? 'rgba(0,0,0,0)' : '#ffffff',
          intent: 'print',
        }).promise;

        const blob: Blob = await new Promise((resolve) =>
          canvas.toBlob(
            resolve,
            format === 'png' ? 'image/png' : 'image/jpeg',
            format === 'png' ? undefined : Math.min(1, Math.max(0.2, quality / 100))
          )
        );
        return blob;
      };

      // throttle concurrency
      const zip = new JSZip();
      let done = 0;
      const queue = [...pages]; // 0-based indices
      const workers: Promise<void>[] = [];

      const pump = async () => {
        while (queue.length) {
          const idx = queue.shift()!;
          const blob = await renderPage(idx);
          zip.file(`page-${idx + 1}.${format === 'png' ? 'png' : 'jpg'}`, blob);
          done++;
          setProgress(Math.round((done / pages.length) * 100));
          // give UI a tick
          if (done % 2 === 0) await new Promise((r) => setTimeout(r, 0));
        }
      };

      const workerCount = Math.max(1, Math.min(6, Math.floor(concurrency)));
      for (let i = 0; i < workerCount; i++) workers.push(pump());
      await Promise.all(workers);

      const resultBlob = await zip.generateAsync({ type: 'blob' });
      setDownloadUrl(URL.createObjectURL(resultBlob));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to convert PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* ✅ Centralized SEO */}
      <ToolSeo {...seo} />

      {/* ✅ Page-specific Helmet */}
      <Helmet>
        <title>PDF to JPG – Convert PDF Pages to Images | FilesNova</title>
        <meta
          name="description"
          content="High-quality PDF to JPG/PNG converter in your browser. Page ranges, DPI/scale, transparency, and ZIP download. Private, fast, free."
        />
        <link rel="canonical" href="https://filesnova.com/tools/pdf-to-jpg" />
      </Helmet>

      {/* ✅ WebApplication JSON-LD */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'PDF to JPG – Files Nova',
          url: 'https://filesnova.com/tools/pdf-to-jpg',
          applicationCategory: 'FileConverter',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />

      {/* ✅ BreadcrumbList JSON-LD */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://filesnova.com/' },
            { '@type': 'ListItem', position: 2, name: 'PDF to JPG', item: 'https://filesnova.com/tools/pdf-to-jpg' },
          ],
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Background Pulses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no back arrow; TOOLS on the right) */}
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
                <p className="text-xs text-gray-500 font-medium">PDF to JPG Converter</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Tool header */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <ImageIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">PDF to JPG</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert each PDF page to a crisp image — fast, private, and with pro-level controls.
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

          {/* Uploader + options */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload PDF File</h3>

            <UploadZone
              accept="application/pdf"
              multiple={false}
              title="Drop your PDF here"
              buttonLabel="Choose File"
              supportedFormats="PDF"
              onFilesSelected={(fs) => {
                const f = fs[0] || null;
                setFile(f);
                setDownloadUrl(null);
                setError(null);
              }}
            />

            {/* Advanced controls (blend with UI) */}
            {file && (
              <div className="mt-6 grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Page Range</label>
                  <input
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="e.g., 1-3,5  (blank = all)"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Image Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as ImgFormat)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="jpeg">JPG (small size)</option>
                    <option value="png">PNG (lossless)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Quality {format === 'jpeg' ? <>(JPG)</> : <>(disabled for PNG)</>}
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    step={1}
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    disabled={format === 'png'}
                    className="w-full"
                    title="JPEG quality (%)"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Detail / DPI Scale</label>
                  <select
                    value={scale}
                    onChange={(e) => setScale(parseInt(e.target.value))}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    title="Higher scale = larger, sharper images"
                  >
                    <option value={1}>1× (fastest)</option>
                    <option value={2}>2× (recommended)</option>
                    <option value={3}>3× (high detail)</option>
                    <option value={4}>4× (max detail)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Parallel Renders</label>
                  <select
                    value={concurrency}
                    onChange={(e) => setConcurrency(parseInt(e.target.value))}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    title="Higher = faster, but uses more memory/CPU"
                  >
                    <option value={1}>1 (safe)</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6 (aggressive)</option>
                  </select>
                </div>

                {format === 'png' && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={transparent}
                      onChange={(e) => setTransparent(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Transparent background (PNG)</span>
                  </label>
                )}

                <div className="lg:col-span-3 sm:col-span-2 col-span-1">
                  <label className="block text-sm text-gray-700 mb-1">ZIP Filename</label>
                  <input
                    value={zipName}
                    onChange={(e) => setZipName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="images.zip"
                  />
                </div>
              </div>
            )}

            <button
              onClick={convert}
              disabled={!file || isProcessing || !pdfJsReady}
              className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfJsReady ? 'Convert to Images' : 'Loading renderer…'}
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
          </div>

          {/* Download */}
          {downloadUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
              <a
                href={downloadUrl}
                download={zipName || 'images.zip'}
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download ZIP
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PdfToJpgPage;
