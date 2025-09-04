// src/pages/tools/DocxToPdfPage.tsx
import React, { useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import {
  PDFDocument,
  StandardFonts,
  PDFFont,
  PDFPage
} from 'pdf-lib';
import mammoth from 'mammoth';
import {
  Sparkles,
  FileUp,
  Shield,
  Zap,
  Star,
  CheckCircle,
  X,
  Download as DownloadIcon,
  Settings,
  Info
} from 'lucide-react';
import AdSpace from '../../components/AdSpace';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import ToolsMenu from '../../components/ToolsMenu';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

type PageSizeKey = 'A4' | 'Letter';
type FontFamilyKey = 'Helvetica' | 'TimesRoman' | 'Courier';

const PAGE_SIZES: Record<PageSizeKey, { width: number; height: number }> = {
  A4: { width: 595.28, height: 841.89 },  // 72pt
  Letter: { width: 612, height: 792 }
};

type Block =
  | { kind: 'heading', level: 1 | 2 | 3, text: string }
  | { kind: 'paragraph', text: string }
  | { kind: 'image', dataUrl: string, width?: number, height?: number }
  | { kind: 'list', ordered: boolean, items: string[] };

const DocxToPdfPage: React.FC = () => {
  const seo = TOOL_SEO_DATA['/tools/docx-to-pdf'];

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'ready' | 'converting' | 'completed'>('ready');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [stepNote, setStepNote] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Options
  const [pageSize, setPageSize] = useState<PageSizeKey>('A4');
  const [margins, setMargins] = useState({ top: 54, right: 54, bottom: 54, left: 54 }); // ~0.75"
  const [fontFamily, setFontFamily] = useState<FontFamilyKey>('Helvetica');
  const [baseFontSize, setBaseFontSize] = useState<number>(12);
  const [lineHeight, setLineHeight] = useState<number>(1.45);
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  const [pageNumbers, setPageNumbers] = useState<boolean>(true);

  const { width: PAGE_W, height: PAGE_H } = useMemo(() => PAGE_SIZES[pageSize], [pageSize]);
  const contentW = useMemo(() => PAGE_W - margins.left - margins.right, [PAGE_W, margins.left, margins.right]);
  const yMin = useMemo(() => margins.bottom, [margins.bottom]);

  const resetOutput = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && /\.docx$/i.test(selected.name)) {
      setFile(selected);
      setStatus('ready');
      resetOutput();
      setStepNote('');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && /\.docx$/i.test(dropped.name)) {
      setFile(dropped);
      setStatus('ready');
      resetOutput();
      setStepNote('');
    }
  };

  const removeFile = () => {
    setFile(null);
    resetOutput();
    setStatus('ready');
    setStepNote('');
  };

  // ---- HTML → block model (simple & robust) ----
  const htmlToBlocks = (html: string): Block[] => {
    const blocks: Block[] = [];
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const walk = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();

        if (/^h[1-6]$/.test(tag)) {
          const level = Math.min(3, Math.max(1, parseInt(tag.replace('h',''), 10))) as 1|2|3;
          const text = el.textContent?.trim() ?? '';
          if (text) blocks.push({ kind: 'heading', level, text });
          return;
        }
        if (tag === 'p') {
          let text = '';
          // Replace <a> with "text (url)" for visibility in PDF
          const clone = el.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('a[href]').forEach(a => {
            const t = (a.textContent || '').trim();
            const href = a.getAttribute('href') || '';
            a.replaceWith(`${t} (${href})`);
          });
          text = clone.textContent?.replace(/\s+/g, ' ').trim() ?? '';
          blocks.push({ kind: 'paragraph', text });
          return;
        }
        if (tag === 'ul' || tag === 'ol') {
          const items = Array.from(el.querySelectorAll(':scope > li')).map(li =>
            (li.textContent || '').replace(/\s+/g, ' ').trim()
          ).filter(Boolean);
          if (items.length) blocks.push({ kind: 'list', ordered: tag === 'ol', items });
          return;
        }
        if (tag === 'img') {
          const src = el.getAttribute('src') || '';
          if (src && includeImages) blocks.push({ kind: 'image', dataUrl: src });
          return;
        }
        // continue into children for wrappers (div/section/body)
        el.childNodes.forEach(walk);
      }
    };

    doc.body.childNodes.forEach(walk);
    // collapse empty paras
    return blocks.filter(b => !(b.kind === 'paragraph' && !b.text));
  };

  // ---- pdf-lib helpers ----
  const embedFamily = async (pdf: PDFDocument, family: FontFamilyKey) => {
    const regular =
      family === 'TimesRoman' ? await pdf.embedFont(StandardFonts.TimesRoman) :
      family === 'Courier'    ? await pdf.embedFont(StandardFonts.Courier) :
                                await pdf.embedFont(StandardFonts.Helvetica);
    const bold =
      family === 'TimesRoman' ? await pdf.embedFont(StandardFonts.TimesBold) :
      family === 'Courier'    ? await pdf.embedFont(StandardFonts.CourierBold) :
                                await pdf.embedFont(StandardFonts.HelveticaBold);
    return { regular, bold };
  };

  const wrapLine = (text: string, maxWidth: number, font: PDFFont, size: number) => {
    const words = text.split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) {
        line = test;
      } else {
        if (line) out.push(line);
        // handle mega-word
        if (font.widthOfTextAtSize(w, size) > maxWidth) {
          let chunk = '';
          for (const ch of w.split('')) {
            const t = chunk + ch;
            if (font.widthOfTextAtSize(t, size) <= maxWidth) chunk = t;
            else { if (chunk) out.push(chunk); chunk = ch; }
          }
          if (chunk) { line = chunk; } else { line = ''; }
        } else {
          line = w;
        }
      }
    }
    if (line) out.push(line);
    return out;
  };

  const drawHeading = (
    page: PDFPage,
    text: string,
    fonts: { regular: PDFFont; bold: PDFFont },
    level: 1|2|3,
    x: number,
    y: number,
    maxW: number
  ) => {
    const size = level === 1 ? baseFontSize * 1.7 : level === 2 ? baseFontSize * 1.4 : baseFontSize * 1.2;
    const gap = size * (lineHeight + 0.1);
    const lines = wrapLine(text, maxW, fonts.bold, size);
    let cy = y;
    for (const line of lines) {
      page.drawText(line, { x, y: cy, size, font: fonts.bold });
      cy -= gap;
    }
    return cy - size * 0.2; // little extra spacing after heading
  };

  const drawParagraph = (
    page: PDFPage,
    text: string,
    font: PDFFont,
    size: number,
    x: number,
    y: number,
    maxW: number
  ) => {
    const gap = size * lineHeight;
    const lines = wrapLine(text, maxW, font, size);
    let cy = y;
    for (const line of lines) {
      page.drawText(line, { x, y: cy, size, font });
      cy -= gap;
    }
    return cy - gap * 0.25; // paragraph spacing
  };

  const drawList = (
    page: PDFPage,
    items: string[],
    ordered: boolean,
    font: PDFFont,
    size: number,
    x: number,
    y: number,
    maxW: number
  ) => {
    const bulletIndent = 14;
    const numberW = ordered ? font.widthOfTextAtSize(`${items.length}. `, size) : font.widthOfTextAtSize('• ', size);
    const gap = size * lineHeight;
    let cy = y;

    for (let i = 0; i < items.length; i++) {
      const label = ordered ? `${i + 1}. ` : '• ';
      const labelW = font.widthOfTextAtSize(label, size);
      // draw label
      page.drawText(label, { x, y: cy, size, font });
      // wrap item text
      const lines = wrapLine(items[i], maxW - labelW, font, size);
      let lx = x + labelW;
      for (let li = 0; li < lines.length; li++) {
        page.drawText(lines[li], { x: lx, y: cy, size, font });
        if (li < lines.length - 1) {
          cy -= gap;
          lx = x + bulletIndent; // subsequent lines align with text (not the bullet)
        }
      }
      cy -= gap;
    }
    return cy - gap * 0.1;
  };

  const drawImage = async (
    pdf: PDFDocument,
    page: PDFPage,
    dataUrl: string,
    x: number,
    y: number,
    maxW: number
  ) => {
    const isPng = dataUrl.startsWith('data:image/png');
    const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0));
    const img = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const { width, height } = img.scale(1);
    const ratio = Math.min(maxW / width, 1);
    const w = width * ratio;
    const h = height * ratio;
    page.drawImage(img, { x, y: y - h + baseFontSize * 0.2, width: w, height: h });
    return y - h - baseFontSize * 0.3; // spacing below image
  };

  const addFooterPageNumber = (
    page: PDFPage,
    index: number,
    font: PDFFont
  ) => {
    if (!pageNumbers) return;
    const label = `${index}`;
    const size = 10;
    const w = font.widthOfTextAtSize(label, size);
    page.drawText(label, {
      x: PAGE_W / 2 - w / 2,
      y: margins.bottom * 0.5,
      size,
      font
    });
  };

  // ---- Convert handler ----
  const handleConvert = async () => {
    if (!file) return;
    resetOutput();
    setStatus('converting');
    setStepNote('Reading DOCX…');

    try {
      const arrayBuffer = await file.arrayBuffer();
      // mammoth → HTML with inline images (data URLs)
      const { value: html } = await mammoth.convertToHtml(
        { arrayBuffer },
        includeImages ? {
          convertImage: mammoth.images.inline(async (element) => {
            const buffer = await element.read('base64');
            const mime = element.contentType || 'image/png';
            return { src: `data:${mime};base64,${buffer}` };
          })
        } : {}
      );

      setStepNote('Parsing content…');
      const blocks = htmlToBlocks(html);

      setStepNote('Building PDF…');
      const pdf = await PDFDocument.create();
      const fonts = await embedFamily(pdf, fontFamily);

      let page = pdf.addPage([PAGE_W, PAGE_H]);
      let pageIndex = 1;
      addFooterPageNumber(page, pageIndex, fonts.regular);

      let x = margins.left;
      let y = PAGE_H - margins.top;

      const ensureSpace = (need: number) => {
        if (y - need <= yMin) {
          page = pdf.addPage([PAGE_W, PAGE_H]);
          pageIndex++;
          addFooterPageNumber(page, pageIndex, fonts.regular);
          y = PAGE_H - margins.top;
        }
      };

      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        setStepNote(`Laying out ${i + 1}/${blocks.length}`);
        if (b.kind === 'heading') {
          ensureSpace(baseFontSize * 2.2);
          y = drawHeading(page, b.text, fonts, b.level, x, y, contentW);
        } else if (b.kind === 'paragraph') {
          ensureSpace(baseFontSize * lineHeight * 2);
          y = drawParagraph(page, b.text, fonts.regular, baseFontSize, x, y, contentW);
        } else if (b.kind === 'list') {
          ensureSpace(baseFontSize * lineHeight * (b.items.length + 1));
          y = drawList(page, b.items, b.ordered, fonts.regular, baseFontSize, x, y, contentW);
        } else if (b.kind === 'image' && includeImages) {
          // reserve space for image by drawing on a fresh line
          ensureSpace(200);
          y = await drawImage(pdf, page, b.dataUrl, x, y, contentW);
        }
      }

      const bytes = await pdf.save();
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      setPdfUrl(url);
      setStatus('completed');
      setStepNote('Done');
    } catch (err:any) {
      console.error(err);
      setStatus('ready');
      setStepNote('');
      alert('Failed to convert DOCX. Try a different file (or turn off images).');
    }
  };

  // ---- utils ----
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const k = 1024, sizes = ['Bytes','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes)/Math.log(k));
    return `${parseFloat((bytes/Math.pow(k,i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <>
      <ToolSeo {...seo} />
      <Helmet>
        <title>Convert DOCX to PDF – Fast &amp; Free Online Converter | FilesNova</title>
        <meta
          name="description"
          content="Convert DOCX to clean, readable PDFs with headings, lists, and images—right in your browser. Free, private, and fast."
        />
        <link rel="canonical" href="https://filesnova.com/tools/docx-to-pdf" />
      </Helmet>

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "DOCX to PDF – Files Nova",
        "url": "https://filesnova.com/tools/docx-to-pdf",
        "applicationCategory": "FileConverter",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://filesnova.com/" },
          { "@type": "ListItem", "position": 2, "name": "DOCX to PDF", "item": "https://filesnova.com/tools/docx-to-pdf" }
        ]
      }} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

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
                <p className="text-xs text-gray-500 font-medium">DOCX to PDF Converter</p>
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
                <FileUp className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">DOCX to PDF Converter</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Preserve structure (headings, lists) and images with clean, readable layout.
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload DOCX</h3>

            <div
              className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="mb-6">
                <FileUp className="w-16 h-16 mx-auto text-gray-400 group-hover:text-blue-500 group-hover:animate-bounce transition-all" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">Drop your DOCX file here</h4>
              <p className="text-gray-600 mb-4">or click to browse from your device</p>
              <button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:-translate-y-1">
                Choose File
              </button>
              <p className="text-xs text-gray-500 mt-4">Supported format: DOCX</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".docx"
              className="hidden"
              onChange={handleFileSelect}
            />

            {file && (
              <div className="mt-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                      <FileUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button onClick={removeFile} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

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
                          onChange={(e)=>setPageSize(e.target.value as PageSizeKey)}
                        >
                          <option value="A4">A4</option>
                          <option value="Letter">Letter</option>
                        </select>
                      </label>
                      <label className="text-sm">
                        <span className="block text-gray-600 mb-1">Font</span>
                        <select
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                          value={fontFamily}
                          onChange={(e)=>setFontFamily(e.target.value as FontFamilyKey)}
                        >
                          <option value="Helvetica">Helvetica</option>
                          <option value="TimesRoman">Times</option>
                          <option value="Courier">Courier</option>
                        </select>
                      </label>
                      <label className="text-sm">
                        <span className="block text-gray-600 mb-1">Font size</span>
                        <input
                          type="number" min={10} max={18}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                          value={baseFontSize}
                          onChange={(e)=>setBaseFontSize(parseInt(e.target.value || '12', 10))}
                        />
                      </label>
                      <label className="text-sm">
                        <span className="block text-gray-600 mb-1">Line height</span>
                        <input
                          type="number" step="0.1" min={1.2} max={2}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                          value={lineHeight}
                          onChange={(e)=>setLineHeight(parseFloat(e.target.value || '1.45'))}
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
                            onChange={(e)=>setMargins({...margins, top: parseInt(e.target.value || '54', 10)})}
                          />
                          <input
                            type="number" min={24} max={96}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                            value={margins.left}
                            onChange={(e)=>setMargins({...margins, left: parseInt(e.target.value || '54', 10)})}
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
                            onChange={(e)=>setMargins({...margins, right: parseInt(e.target.value || '54', 10)})}
                          />
                          <input
                            type="number" min={24} max={96}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                            value={margins.bottom}
                            onChange={(e)=>setMargins({...margins, bottom: parseInt(e.target.value || '54', 10)})}
                          />
                        </div>
                      </label>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-blue-600" checked={includeImages} onChange={(e)=>setIncludeImages(e.target.checked)} />
                        Include images
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-blue-600" checked={pageNumbers} onChange={(e)=>setPageNumbers(e.target.checked)} />
                        Page numbers
                      </label>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-amber-600" />
                      <h4 className="font-semibold">Notes</h4>
                    </div>
                    <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                      <li>Conversion happens entirely in your browser.</li>
                      <li>This prioritizes clean reading layout (headings, lists, images).</li>
                      <li>Complex Word layouts (columns, floating text boxes) are simplified.</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={handleConvert}
                  disabled={status === 'converting'}
                  className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'converting' ? 'Converting…' : 'Convert to PDF'}
                </button>

                {status === 'converting' && (
                  <div className="mt-4 w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '100%' }} />
                  </div>
                )}

                {stepNote && status === 'converting' && (
                  <div className="mt-2 text-xs text-gray-600 truncate">{stepNote}</div>
                )}
              </div>
            )}
          </div>

          {/* Result */}
          {status === 'completed' && pdfUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" /> Conversion Completed
              </h3>
              <p className="text-gray-700 mb-4">
                Your document has been converted. Download your PDF below.
              </p>
              <a
                href={pdfUrl}
                download={`${file?.name.replace(/\.docx$/i, '')}.pdf`}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download PDF
              </a>

              {/* quick preview */}
              <div className="mt-6">
                <iframe title="Preview" src={pdfUrl} className="w-full h-[420px] rounded-xl border" />
              </div>
            </div>
          )}
        </div>

        <AdSpace />
      </div>
    </>
  );
};

export default DocxToPdfPage;
