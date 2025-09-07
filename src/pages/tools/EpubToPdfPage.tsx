// src/pages/tools/EpubToPdfPage.tsx
import React, { useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import {
  Sparkles,
  BookOpen,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  Settings,
  Info,
} from 'lucide-react';

// ✅ keep existing SEO wiring as-is
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';
import FileNovaIconWebp from '../../assets/FILESNOVANEWICON.png'; // Temporarily use PNG until WebP is generated

// ✅ shared Tools menu (animated gradient)
import ToolsMenu from '../../components/ToolsMenu';

type PageSizeKey = 'A4' | 'Letter';
type FontKey = 'Helvetica' | 'TimesRoman' | 'Courier';

const PAGE_SIZES: Record<PageSizeKey, { width: number; height: number }> = {
  A4: { width: 595.28, height: 841.89 },     // 72 dpi points
  Letter: { width: 612, height: 792 },
};

const EpubToPdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepNote, setStepNote] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Options
  const [pageSize, setPageSize] = useState<PageSizeKey>('A4');
  const [margins, setMargins] = useState({ top: 54, right: 54, bottom: 54, left: 54 }); // 0.75"
  const [fontKey, setFontKey] = useState<FontKey>('Helvetica');
  const [fontSize, setFontSize] = useState(12);
  const [lineHeight, setLineHeight] = useState(1.4); // multiplier
  const [addPageNumbers, setAddPageNumbers] = useState(true);
  const [respectSpine, setRespectSpine] = useState(true); // reading order

  // Derived page metrics
  const { width: PAGE_W, height: PAGE_H } = useMemo(() => PAGE_SIZES[pageSize], [pageSize]);
  const contentW = useMemo(() => PAGE_W - margins.left - margins.right, [PAGE_W, margins.left, margins.right]);
  const contentH = useMemo(() => PAGE_H - margins.top - margins.bottom, [PAGE_H, margins.top, margins.bottom]);

  const revokeUrlRef = useRef<string | null>(null);
  const setDownloadObjectUrl = (url: string | null) => {
    if (revokeUrlRef.current) URL.revokeObjectURL(revokeUrlRef.current);
    revokeUrlRef.current = url;
    setDownloadUrl(url);
  };

  const handleFiles = (fs: File[]) => {
    const f = fs[0] || null;
    setFile(f);
    setDownloadObjectUrl(null);
    setError(null);
    setProgress(0);
    setStepNote('');
  };

  // --- EPUB parsing helpers ---
  const textFromHTML = (html: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      // remove scripts/styles
      doc.querySelectorAll('script,style,noscript').forEach((n) => n.remove());
      const out = (doc.body?.textContent || doc.documentElement?.textContent || '').replace(/\s+\n/g, '\n');
      return out.trim();
    } catch {
      return html;
    }
  };

  const readText = async (zip: JSZip, path: string) => {
    const f = zip.file(path);
    if (!f) throw new Error(`Missing file in EPUB: ${path}`);
    return await f.async('string');
  };

  const dirname = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
  const joinPath = (dir: string, rel: string) => (dir ? `${dir}/${rel}`.replace(/\/+/g, '/') : rel);

  const parseXml = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml');

  // Returns ordered list of (chapter path, type)
  const getReadingOrder = async (zip: JSZip) => {
    // META-INF/container.xml -> rootfile full-path (OPF)
    const container = await readText(zip, 'META-INF/container.xml');
    const cdoc = parseXml(container);
    const rootfileEl = cdoc.querySelector('rootfile');
    const opfPath = rootfileEl?.getAttribute('full-path') || '';
    if (!opfPath) throw new Error('Invalid EPUB: OPF not found');

    const opf = await readText(zip, opfPath);
    const opfDoc = parseXml(opf);
    const base = dirname(opfPath);

    // Metadata (title)
    const title = opfDoc.querySelector('metadata > *[property="title"], metadata > dc\\:title, metadata > title')?.textContent?.trim() || '';

    // manifest id->href, media-type
    const manifest: Record<string, { href: string; type: string }> = {};
    opfDoc.querySelectorAll('manifest > item').forEach((it) => {
      const id = it.getAttribute('id') || '';
      const href = it.getAttribute('href') || '';
      const type = it.getAttribute('media-type') || '';
      if (id && href) manifest[id] = { href: joinPath(base, href), type };
    });

    // spine order
    const order: string[] = [];
    opfDoc.querySelectorAll('spine > itemref').forEach((ir) => {
      const idref = ir.getAttribute('idref') || '';
      if (idref && manifest[idref]) order.push(idref);
    });

    // filter to html/xhtml in order; fallback: all html files if spine empty
    let chapters: { path: string; type: string }[] = [];
    if (order.length) {
      chapters = order
        .map((id) => manifest[id])
        .filter(Boolean)
        .filter((m) => /html/i.test(m.type) || /\.x?html$/i.test(m.href))
        .map(m => ({ path: m.href, type: m.type }));
    } else {
      // Rare epubs with no spine fallback
      chapters = Object.values(manifest)
        .filter((m) => /html/i.test(m.type) || /\.x?html$/i.test(m.href))
        .map(m => ({ path: m.href, type: m.type }));
    }

    return { title, chapters, opfPath };
  };

  // --- PDF helpers ---
  const embedStandardFont = async (pdf: PDFDocument, key: FontKey): Promise<PDFFont> => {
    switch (key) {
      case 'TimesRoman': return await pdf.embedFont(StandardFonts.TimesRoman);
      case 'Courier': return await pdf.embedFont(StandardFonts.Courier);
      default: return await pdf.embedFont(StandardFonts.Helvetica);
    }
  };

  // wrap by measuring width with pdf-lib font metrics
  const wrapParagraph = (text: string, maxWidth: number, font: PDFFont, size: number) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const test = line ? `${line} ${words[i]}` : words[i];
      const width = font.widthOfTextAtSize(test, size);
      if (width <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        // if a single word longer than max, hard-break it
        if (font.widthOfTextAtSize(words[i], size) > maxWidth) {
          const chars = words[i].split('');
          let chunk = '';
          for (const ch of chars) {
            const t = chunk + ch;
            if (font.widthOfTextAtSize(t, size) <= maxWidth) {
              chunk = t;
            } else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          if (chunk) lines.push(chunk);
          line = '';
        } else {
          line = words[i];
        }
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const drawTextBlock = (
    page: PDFPage,
    paragraphs: string[],
    font: PDFFont,
    size: number,
    lhMult: number,
    startX: number,
    startY: number,
    maxWidth: number,
    yMin: number,
  ) => {
    const lineGap = size * lhMult;
    let y = startY;
    for (const p of paragraphs) {
      // blank line
      const trimmed = p.replace(/\s+/g, ' ').trim();
      if (!trimmed) {
        y -= lineGap;
        if (y <= yMin) return y;
        continue;
      }
      const lines = wrapParagraph(trimmed, maxWidth, font, size);
      for (const ln of lines) {
        if (y <= yMin) return y;
        page.drawText(ln, { x: startX, y, size, font });
        y -= lineGap;
      }
      // paragraph spacing
      y -= lineGap * 0.4;
    }
    return y;
  };

  const convert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setStepNote('Reading EPUB…');
    setDownloadObjectUrl(null);

    try {
      const buf = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buf);

      // Detect DRM-ish encryption manifest (we can only warn)
      if (zip.file('META-INF/encryption.xml')) {
        // Not always DRM, but often indicates encrypted resources
        console.warn('EPUB has encryption.xml; some content may be protected.');
      }

      const { title, chapters } = await getReadingOrder(zip);

      if (!chapters.length) throw new Error('No HTML/XHTML chapters found in EPUB.');

      // Collect text content in proper order
      const order = respectSpine ? chapters : chapters.sort((a, b) => a.path.localeCompare(b.path));
      const texts: string[] = [];
      for (let i = 0; i < order.length; i++) {
        setStepNote(`Extracting chapter ${i + 1}/${order.length}`);
        const raw = await readText(zip, order[i].path);
        texts.push(textFromHTML(raw));
        setProgress(Math.round(((i + 1) / order.length) * 40)); // 0-40%
        await new Promise((r) => setTimeout(r, 0));
      }

      // Build PDF
      setStepNote('Building PDF…');
      const pdf = await PDFDocument.create();
      const font = await embedStandardFont(pdf, fontKey);
      const page = pdf.addPage([PAGE_W, PAGE_H]);
      let currentPage = page;
      let y = PAGE_H - margins.top;
      const x = margins.left;
      const maxW = contentW;
      const yMin = margins.bottom;

      // Title (if exists)
      if (title) {
        const tSize = Math.min(fontSize * 1.6, 22);
        const tGap = tSize * (lineHeight + 0.2);
        const titleLines = wrapParagraph(title, maxW, font, tSize);
        for (const ln of titleLines) {
          currentPage.drawText(ln, { x, y, size: tSize, font });
          y -= tGap;
          if (y <= yMin) {
            currentPage = pdf.addPage([PAGE_W, PAGE_H]);
            y = PAGE_H - margins.top;
          }
        }
        y -= tGap * 0.5;
      }

      // Paragraphs flow
      const paragraphs = texts.join('\n\n').split(/\r?\n/);
      const lineGap = fontSize * lineHeight;

      const addFooterPageNumber = (pg: PDFPage, index: number) => {
        if (!addPageNumbers) return;
        const label = `${index}`;
        const w = font.widthOfTextAtSize(label, 10);
        pg.drawText(label, {
          x: PAGE_W / 2 - w / 2,
          y: margins.bottom * 0.5,
          size: 10,
          font,
        });
      };

      // Page index starts at 1
      let pageIndex = 1;
      addFooterPageNumber(currentPage, pageIndex);

      for (let i = 0; i < paragraphs.length; i++) {
        setStepNote(`Laying out text ${Math.round((i / paragraphs.length) * 100)}%`);
        // draw returns last y used
        const newY = drawTextBlock(currentPage, [paragraphs[i]], font, fontSize, lineHeight, x, y, maxW, yMin);
        if (newY <= yMin) {
          // new page
          currentPage = pdf.addPage([PAGE_W, PAGE_H]);
          pageIndex++;
          addFooterPageNumber(currentPage, pageIndex);
          // draw paragraph on fresh page
          y = PAGE_H - margins.top;
          const after = drawTextBlock(currentPage, [paragraphs[i]], font, fontSize, lineHeight, x, y, maxW, yMin);
          y = after;
        } else {
          y = newY;
        }

        const base = 40 + Math.round(((i + 1) / paragraphs.length) * 60); // 40-100%
        setProgress(Math.min(99, base));
        // yield to UI
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 0));
      }

      const bytes = await pdf.save();
      const buffer = Buffer.from(bytes);
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadObjectUrl(url);
      setProgress(100);
      setStepNote('Done');
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to convert EPUB.');
      setProgress(0);
      setStepNote('');
    } finally {
      setIsProcessing(false);
    }
  };

  // keep existing SEO config
  const seo = TOOL_SEO_DATA['/tools/epub-to-pdf'];

  return (
    <>
      {/* SEO */}
      <ToolSeo {...seo} />
      <Helmet>
        <title>Convert EPUB to PDF – Fast &amp; Free Online Converter | FilesNova</title>
        <meta
          name="description"
          content="Convert EPUB ebooks to clean, readable PDFs with proper chapter order, margins, and fonts. 100% free, private, and fast on Files Nova."
        />
        <link rel="canonical" href="https://filesnova.com/tools/epub-to-pdf" />
      </Helmet>

      {/* Structured data */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "EPUB to PDF – Files Nova",
        "url": "https://filesnova.com/tools/epub-to-pdf",
        "applicationCategory": "FileConverter",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://filesnova.com/" },
          { "@type": "ListItem", "position": 2, "name": "EPUB to PDF", "item": "https://filesnova.com/tools/epub-to-pdf" }
        ]
      }} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-">
              <div className="relative shrink-0">
                <picture>
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
                <p className="text-xs text-gray-500 font-medium">EPUB to PDF</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <BookOpen className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl font-black text-gray-900 mb-2">EPUB to PDF</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert your eBooks into clean PDFs with proper chapter order, readable fonts, and neat margins.
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
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload EPUB File</h3>
            <UploadZone
              accept=".epub,application/epub+zip"
              multiple={false}
              title="Drop your EPUB file here"
              buttonLabel="Choose File"
              supportedFormats="EPUB"
              onFilesSelected={handleFiles}
            />

            {/* Options */}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold">Layout</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Page size</span>
                    <select
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value as PageSizeKey)}
                    >
                      <option value="A4">A4</option>
                      <option value="Letter">Letter</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Font</span>
                    <select
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      value={fontKey}
                      onChange={(e) => setFontKey(e.target.value as FontKey)}
                    >
                      <option value="Helvetica">Helvetica</option>
                      <option value="TimesRoman">Times</option>
                      <option value="Courier">Courier</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Font size</span>
                    <input
                      type="number" min={9} max={20}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value || '12', 10))}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Line height</span>
                    <input
                      type="number" step="0.1" min={1.1} max={2}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      value={lineHeight}
                      onChange={(e) => setLineHeight(parseFloat(e.target.value || '1.4'))}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Margins (top/left)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number" min={24} max={96}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        value={margins.top}
                        onChange={(e) => setMargins({ ...margins, top: parseInt(e.target.value || '54', 10) })}
                      />
                      <input
                        type="number" min={24} max={96}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        value={margins.left}
                        onChange={(e) => setMargins({ ...margins, left: parseInt(e.target.value || '54', 10) })}
                      />
                    </div>
                  </label>
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Margins (right/bottom)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number" min={24} max={96}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        value={margins.right}
                        onChange={(e) => setMargins({ ...margins, right: parseInt(e.target.value || '54', 10) })}
                      />
                      <input
                        type="number" min={24} max={96}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        value={margins.bottom}
                        onChange={(e) => setMargins({ ...margins, bottom: parseInt(e.target.value || '54', 10) })}
                      />
                    </div>
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={respectSpine}
                      onChange={(e) => setRespectSpine(e.target.checked)}
                    />
                    Respect EPUB reading order (spine)
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={addPageNumbers}
                      onChange={(e) => setAddPageNumbers(e.target.checked)}
                    />
                    Add page numbers
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-amber-600" />
                  <h4 className="font-semibold">Notes</h4>
                </div>
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                  <li>All processing happens in your browser. Nothing is uploaded.</li>
                  <li>This converter focuses on clean text for universal readability.</li>
                  <li>If an EPUB uses DRM/encrypted content, some chapters may be missing.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={convert}
              disabled={!file || isProcessing}
              className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Convert to PDF
            </button>

            {(isProcessing || progress > 0) && (
              <div className="mt-4">
                <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {stepNote && (
                  <div className="mt-2 text-xs text-gray-600 truncate">
                    {stepNote}
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

          {/* Download + Preview */}
          {downloadUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
              <a
                href={downloadUrl}
                download={file?.name.replace(/\.epub$/i, '.pdf') || 'ebook.pdf'}
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download PDF
              </a>

              {/* quick preview */}
              <div className="mt-6">
                <iframe
                  title="Preview"
                  src={downloadUrl}
                  className="w-full h-[420px] rounded-xl border"
                />
              </div>
            </div>
          )}

          <AdSpace />
        </div>
      </div>
    </>
  );
};

export default EpubToPdfPage;
