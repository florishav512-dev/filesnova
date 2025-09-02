// src/pages/tools/PptxToPdfPage.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  Sparkles,
  Presentation,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  MoveUpRight,
  MoveDownRight,
  FileText,
  BookOpenCheck,
} from 'lucide-react';

// ✅ SEO
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

// ✅ Tools dropdown (gradient, animated)
import ToolsMenu from '../../components/ToolsMenu';

/** ---------- Page types & helpers ---------- */
type SlideChunk = {
  index: number;
  title?: string;
  body: string;
  notes?: string;
};

type PageSizeKey = 'Auto' | 'A4' | 'Letter';
type Orientation = 'portrait' | 'landscape';
type MarginPreset = 'compact' | 'normal' | 'wide';

const PAGE_SIZES: Record<Exclude<PageSizeKey, 'Auto'>, { w: number; h: number }> = {
  // PDF points (1pt = 1/72")
  A4: { w: 595, h: 842 },
  Letter: { w: 612, h: 792 },
};
const marginValue = (m: MarginPreset) => (m === 'compact' ? 36 : m === 'wide' ? 72 : 54);

const hexToRgb = (hex: string) => {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

/**
 * Extract text + best-effort titles + notes from PPTX.
 * Keeps everything on-device (privacy), no external renderers.
 */
async function extractSlidesWithNotes(arrayBuffer: ArrayBuffer): Promise<SlideChunk[]> {
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Collect slide XML paths
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      return na - nb;
    });

  // Map slideN -> notesN if exists
  const notesPaths = Object.keys(zip.files)
    .filter((p) => /ppt\/notesSlides\/notesSlide\d+\.xml$/.test(p))
    .reduce<Record<number, string>>((acc, path) => {
      const n = parseInt(path.match(/notesSlide(\d+)\.xml/)?.[1] || '0', 10);
      acc[n] = path;
      return acc;
    }, {});

  const chunks: SlideChunk[] = [];

  for (const sp of slidePaths) {
    const slideNum = parseInt(sp.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
    const xml = await zip.files[sp].async('string');
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');

    // Gather text from a:t nodes
    const tNodes = Array.from(doc.getElementsByTagName('a:t'));
    const allTexts = tNodes.map((n) => n.textContent || '');

    // Best-effort title detection: first unique line, or placeholder title (p:ph type="title")
    let title: string | undefined;
    try {
      const ph = Array.from(doc.getElementsByTagName('p:ph')).find(
        (node) => node.getAttribute('type') === 'title'
      );
      if (ph) {
        // Find the nearest a:t within this shape tree (heuristic)
        const shape = ph.parentElement?.parentElement; // p:nvPr -> p:nvSpPr -> p:sp
        const tInShape = shape ? Array.from(shape.getElementsByTagName('a:t')) : [];
        if (tInShape.length) title = tInShape.map((n) => n.textContent || '').join(' ').trim();
      }
    } catch {}

    if (!title && allTexts.length) {
      title = allTexts[0].trim();
    }

    const body = allTexts.join('\n').trim();

    // Notes (if any)
    let notes: string | undefined;
    const np = notesPaths[slideNum];
    if (np) {
      const notesXml = await zip.files[np].async('string');
      const ndoc = parser.parseFromString(notesXml, 'application/xml');
      const nts = Array.from(ndoc.getElementsByTagName('a:t')).map((n) => n.textContent || '');
      const joined = nts.join('\n').trim();
      notes = joined || undefined;
    }

    chunks.push({ index: slideNum, title, body, notes });
  }

  // Sort by slide index (safety)
  chunks.sort((a, b) => a.index - b.index);
  return chunks;
}

/** ---------- Component ---------- */
const PptxToPdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [slides, setSlides] = useState<SlideChunk[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Advanced options (persisted)
  const [pageSizeKey, setPageSizeKey] = useState<PageSizeKey>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal');
  const [pageBg, setPageBg] = useState<string>('#ffffff');
  const [includeSlideNumbers, setIncludeSlideNumbers] = useState<boolean>(true);
  const [emphasizeTitles, setEmphasizeTitles] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(false);
  const [createOutline, setCreateOutline] = useState<boolean>(true);

  // Load & persist user prefs
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fn_pptx2pdf_settings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.pageSizeKey) setPageSizeKey(s.pageSizeKey);
      if (s.orientation) setOrientation(s.orientation);
      if (s.marginPreset) setMarginPreset(s.marginPreset);
      if (typeof s.pageBg === 'string') setPageBg(s.pageBg);
      if (typeof s.includeSlideNumbers === 'boolean') setIncludeSlideNumbers(s.includeSlideNumbers);
      if (typeof s.emphasizeTitles === 'boolean') setEmphasizeTitles(s.emphasizeTitles);
      if (typeof s.includeNotes === 'boolean') setIncludeNotes(s.includeNotes);
      if (typeof s.createOutline === 'boolean') setCreateOutline(s.createOutline);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        'fn_pptx2pdf_settings',
        JSON.stringify({
          pageSizeKey,
          orientation,
          marginPreset,
          pageBg,
          includeSlideNumbers,
          emphasizeTitles,
          includeNotes,
          createOutline,
        })
      );
    } catch {}
  }, [
    pageSizeKey,
    orientation,
    marginPreset,
    pageBg,
    includeSlideNumbers,
    emphasizeTitles,
    includeNotes,
    createOutline,
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = (fs: File[]) => {
    const f = fs[0] || null;
    setFile(f);
    setSlides([]);
    setDownloadUrl(null);
    setError(null);
  };

  const moveSlide = (idx: number, dir: 'up' | 'down') => {
    setSlides((prev) => {
      const ni = dir === 'up' ? idx - 1 : idx + 1;
      if (ni < 0 || ni >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[ni]] = [copy[ni], copy[idx]];
      return copy;
    });
  };

  const prepare = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const extracted = await extractSlidesWithNotes(buf);
      setSlides(extracted);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to read PPTX.');
    } finally {
      setIsProcessing(false);
    }
  };

  const convert = async () => {
    if (!slides.length) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setDownloadUrl(null);

    try {
      const pdfDoc = await PDFDocument.create();
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Page metrics
      const base = pageSizeKey === 'Auto' ? { w: 842, h: 595 } : PAGE_SIZES[pageSizeKey]; // default wide for Auto
      const rotated = pageSizeKey === 'Auto' ? base : orientation === 'landscape' ? { w: base.h, h: base.w } : base;
      const pageW = rotated.w;
      const pageH = rotated.h;
      const margin = marginValue(marginPreset);

      // Colors
      const bg = hexToRgb(pageBg);

      // Build outline/bookmarks (pdf-lib uses "outline" via setOutlines in newer versions; fallback via page labels)
      const outlineTargets: { title: string; pageIndex: number }[] = [];

      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        const page = pdfDoc.addPage([pageW, pageH]);
        const { width, height } = page.getSize();

        // Paint background
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(bg.r / 255, bg.g / 255, bg.b / 255),
        });

        let y = height - margin;
        const maxWidth = width - margin * 2;
        const lineGap = 16;

        // Slide number (optional)
        if (includeSlideNumbers) {
          const label = `Slide ${i + 1}`;
          const w = fontRegular.widthOfTextAtSize(label, 10);
          page.drawText(label, { x: width - margin - w, y: height - margin + 2, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
        }

        // Title
        const titleText = (s.title || '').trim();
        if (titleText && emphasizeTitles) {
          const size = 18;
          const wrapped = wrapLines(titleText, fontBold, size, maxWidth);
          wrapped.forEach((ln) => {
            y -= size + 4;
            page.drawText(ln, { x: margin, y, size, font: fontBold, color: rgb(0.05, 0.05, 0.05) });
          });
          y -= 8;
        }

        // Body
        const bodyText = (s.body || '').trim();
        if (bodyText) {
          const size = 12;
          const wrapped = wrapLines(bodyText, fontRegular, size, maxWidth);
          wrapped.forEach((ln) => {
            y -= size + 2;
            if (y < margin) {
              // simple overflow notice
              page.drawText('…', { x: margin, y, size, font: fontRegular });
              return;
            }
            page.drawText(ln, { x: margin, y, size, font: fontRegular, color: rgb(0, 0, 0) });
          });
        }

        // Notes
        if (includeNotes && s.notes) {
          y -= 14;
          page.drawText('Notes:', { x: margin, y, size: 12, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
          const size = 11;
          const wrapped = wrapLines(s.notes, fontRegular, size, maxWidth);
          wrapped.forEach((ln) => {
            y -= size + 2;
            if (y < margin) return;
            page.drawText(ln, { x: margin, y, size, font: fontRegular, color: rgb(0.12, 0.12, 0.12) });
          });
        }

        if (createOutline) {
          outlineTargets.push({ title: titleText || `Slide ${i + 1}`, pageIndex: i });
        }

        setProgress(Math.round(((i + 1) / slides.length) * 100));
        if (i % 2 === 1) await new Promise((res) => setTimeout(res, 0));
      }

      // Try to set simple page labels (acts like a light outline in some viewers)
      try {
        // Some pdf-lib versions expose setPageLabels; if not present, this will no-op.
        // @ts-ignore
        if (pdfDoc.setPageLabels) {
          // @ts-ignore
          pdfDoc.setPageLabels(outlineTargets.map((o) => ({ pageIndex: o.pageIndex, label: o.title })));
        }
      } catch {}

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to convert file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Centralized SEO */}
      <ToolSeo {...TOOL_SEO_DATA['/tools/pptx-to-pdf']} />

      {/* Page-specific Helmet */}
      <Helmet>
        <title>PPTX to PDF – Fast & Free Online Converter | FilesNova</title>
        <meta
          name="description"
          content="Convert PPTX slides to PDF in your browser. Advanced options: page size, orientation, margins, titles, notes & outline. Private, fast, free."
        />
        <link rel="canonical" href="https://filesnova.com/tools/pptx-to-pdf" />
      </Helmet>

      {/* WebApplication JSON-LD */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'PPTX to PDF – Files Nova',
          url: 'https://filesnova.com/tools/pptx-to-pdf',
          applicationCategory: 'FileConverter',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />

      {/* BreadcrumbList JSON-LD */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://filesnova.com/' },
            { '@type': 'ListItem', position: 2, name: 'PPTX to PDF', item: 'https://filesnova.com/tools/pptx-to-pdf' },
          ],
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Background pulses */}
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
                />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Files Nova
                </h1>
                <p className="text-xs text-gray-500 font-medium">PPTX to PDF Converter</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>
        {/* Main content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Tool Header */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <Presentation className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">PPTX to PDF</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert your slides to clean, readable PDFs — with options for titles, notes, page size, and outline.
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

          {/* Upload + Prepare */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload PPTX File</h3>
            <UploadZone
              accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              multiple={false}
              title="Drop your PPTX file here"
              buttonLabel="Choose File"
              supportedFormats="PPTX"
              onFilesSelected={handleFilesSelected}
            />

            <div className="mt-6 grid md:grid-cols-2 gap-4 bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-4">
              {/* Left column – page & style */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Page Size</label>
                  <select
                    value={pageSizeKey}
                    onChange={(e) => setPageSizeKey(e.target.value as PageSizeKey)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                    <option value="Auto">Auto (widescreen)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Orientation</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as Orientation)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    disabled={pageSizeKey === 'Auto'}
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Margins</label>
                  <select
                    value={marginPreset}
                    onChange={(e) => setMarginPreset(e.target.value as MarginPreset)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="compact">Compact</option>
                    <option value="normal">Normal</option>
                    <option value="wide">Wide</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Page Background</label>
                  <input
                    type="color"
                    value={pageBg}
                    onChange={(e) => setPageBg(e.target.value)}
                    className="h-10 w-14 border rounded-lg"
                    title="Shown behind text"
                  />
                </div>
              </div>

              {/* Right column – content controls */}
              <div className="grid gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeSlideNumbers}
                    onChange={(e) => setIncludeSlideNumbers(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Include slide numbers
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={emphasizeTitles}
                    onChange={(e) => setEmphasizeTitles(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-2">
                    <BookOpenCheck className="w-4 h-4" /> Emphasize titles
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={(e) => setIncludeNotes(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-2">
                    <Presentation className="w-4 h-4" /> Include speaker notes
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createOutline}
                    onChange={(e) => setCreateOutline(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-2">
                    <Star className="w-4 h-4" /> Add outline/bookmarks
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                onClick={prepare}
                disabled={!file || isProcessing}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Read Slides
              </button>
              <button
                onClick={convert}
                disabled={!slides.length || isProcessing}
                className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50"
              >
                Convert to PDF
              </button>
            </div>

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

          {/* Slide Review & Reorder */}
          {slides.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Review & Reorder Slides ({slides.length})</h3>
              <div className="space-y-4">
                {slides.map((s, idx) => (
                  <div
                    key={`${s.index}-${idx}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {s.title?.trim() || `Slide ${idx + 1}`}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{s.body.slice(0, 120) || '(no text)'}</p>
                      {s.notes && <p className="text-xs text-gray-500 mt-1 truncate">Notes: {s.notes.slice(0, 100)}</p>}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => moveSlide(idx, 'up')}
                        disabled={idx === 0}
                        className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40"
                        title="Move up"
                      >
                        <MoveUpRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveSlide(idx, 'down')}
                        disabled={idx === slides.length - 1}
                        className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40"
                        title="Move down"
                      >
                        <MoveDownRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download */}
          {downloadUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">3. Download</h3>
              <a
                href={downloadUrl}
                download={file?.name.replace(/\.pptx$/i, '.pdf') || 'presentation.pdf'}
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download PDF
              </a>
            </div>
          )}
        </div>

        {/* Footer Ad Space */}
        <AdSpace />
      </div>
    </>
  );
};

/** Simple word-wrap for a given width/font/size */
function wrapLines(text: string, font: any, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const words = text.split(/\s+/);
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    const width = font.widthOfTextAtSize(test, size);
    if (width > maxWidth) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default PptxToPdfPage;
