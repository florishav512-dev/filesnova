// src/pages/tools/TextToPdfPage.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import {
  Sparkles,
  FileText,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from 'lucide-react';

// ✅ Animated Tools dropdown (gradient + continuous animation)
import ToolsMenu from '../../components/ToolsMenu';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

type PageSizeKey = 'A4' | 'Letter';
type Orientation = 'portrait' | 'landscape';
type MarginPreset = 'compact' | 'normal' | 'wide';
type Align = 'left' | 'center' | 'right';

const PAGE_SIZES: Record<PageSizeKey, { w: number; h: number }> = {
  // PDF points (1pt = 1/72")
  A4: { w: 595, h: 842 },
  Letter: { w: 612, h: 792 },
};

const marginValue = (m: MarginPreset) => (m === 'compact' ? 36 : m === 'wide' ? 72 : 54);

const TextToPdfPage: React.FC = () => {
  const [text, setText] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Advanced options
  const [pageSizeKey, setPageSizeKey] = useState<PageSizeKey>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal');
  const [fontFamily, setFontFamily] = useState<'Helvetica' | 'TimesRoman' | 'Courier'>('Helvetica');
  const [fontSize, setFontSize] = useState<number>(12);
  const [lineHeight, setLineHeight] = useState<number>(18);
  const [align, setAlign] = useState<Align>('left');
  const [addPageNumbers, setAddPageNumbers] = useState<boolean>(false);
  const [headerText, setHeaderText] = useState<string>('');
  const [footerText, setFooterText] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('Text Document');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [outputName, setOutputName] = useState<string>('text.pdf');

  // Import .txt helper
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // SEO data (Home → Tools → Text to PDF)
  const { title, description, canonical, breadcrumb } =
    TOOL_SEO_DATA['/tools/text-to-pdf'];

  // Persist + restore user content & settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fn_text2pdf_state');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.text === 'string') setText(s.text);
      if (s.pageSizeKey) setPageSizeKey(s.pageSizeKey);
      if (s.orientation) setOrientation(s.orientation);
      if (s.marginPreset) setMarginPreset(s.marginPreset);
      if (s.fontFamily) setFontFamily(s.fontFamily);
      if (typeof s.fontSize === 'number') setFontSize(s.fontSize);
      if (typeof s.lineHeight === 'number') setLineHeight(s.lineHeight);
      if (s.align) setAlign(s.align);
      if (typeof s.addPageNumbers === 'boolean') setAddPageNumbers(s.addPageNumbers);
      if (typeof s.headerText === 'string') setHeaderText(s.headerText);
      if (typeof s.footerText === 'string') setFooterText(s.footerText);
      if (typeof s.docTitle === 'string') setDocTitle(s.docTitle);
      if (typeof s.docAuthor === 'string') setDocAuthor(s.docAuthor);
      if (typeof s.outputName === 'string') setOutputName(s.outputName);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'fn_text2pdf_state',
        JSON.stringify({
          text,
          pageSizeKey,
          orientation,
          marginPreset,
          fontFamily,
          fontSize,
          lineHeight,
          align,
          addPageNumbers,
          headerText,
          footerText,
          docTitle,
          docAuthor,
          outputName,
        })
      );
    } catch {}
  }, [
    text,
    pageSizeKey,
    orientation,
    marginPreset,
    fontFamily,
    fontSize,
    lineHeight,
    align,
    addPageNumbers,
    headerText,
    footerText,
    docTitle,
    docAuthor,
    outputName,
  ]);

  const counts = useMemo(() => {
    const chars = text.length;
    const words = (text.match(/\S+/g) || []).length;
    const lines = (text.match(/\n/g) || []).length + 1;
    return { chars, words, lines };
  }, [text]);

  const handleTxtImport = async (f: File | null) => {
    if (!f) return;
    try {
      const t = await f.text();
      setText((prev) => (prev ? `${prev}\n${t}` : t));
    } catch {
      // ignore
    }
  };

  const convertTextToPdf = async () => {
    const cleaned = text.trim();
    if (!cleaned) return;

    setIsProcessing(true);
    setPdfUrl(null);

    try {
      const doc = await PDFDocument.create();

      // Metadata
      if (docTitle.trim()) doc.setTitle(docTitle.trim());
      if (docAuthor.trim()) doc.setAuthor(docAuthor.trim());

      // Font
      const font =
        fontFamily === 'TimesRoman'
          ? await doc.embedFont(StandardFonts.TimesRoman)
          : fontFamily === 'Courier'
          ? await doc.embedFont(StandardFonts.Courier)
          : await doc.embedFont(StandardFonts.Helvetica);

      // Page geometry
      const base = PAGE_SIZES[pageSizeKey];
      const rotated = orientation === 'landscape' ? { w: base.h, h: base.w } : base;
      const margin = marginValue(marginPreset);
      const contentW = Math.max(1, rotated.w - margin * 2);
      const contentH = Math.max(1, rotated.h - margin * 2);

      // Split into logical paragraphs (keep blank lines)
      const paragraphs = cleaned.split(/\r?\n/);

      let page = doc.addPage([rotated.w, rotated.h]);
      let y = rotated.h - margin;

      const drawLine = (line: string) => {
        // Alignment (left/center/right)
        const width = font.widthOfTextAtSize(line, fontSize);
        let x = margin;
        if (align === 'center') x = margin + (contentW - width) / 2;
        if (align === 'right') x = margin + Math.max(0, contentW - width);
        page.drawText(line, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
      };

      const addHeaderFooter = (pg: typeof page) => {
        const header = headerText.trim();
        const footer = footerText.trim();
        if (header) {
          const hw = font.widthOfTextAtSize(header, 10);
          pg.drawText(header, {
            x: (rotated.w - hw) / 2,
            y: rotated.h - margin + 14,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          });
        }
        if (footer) {
          const fw = font.widthOfTextAtSize(footer, 10);
          pg.drawText(footer, {
            x: (rotated.w - fw) / 2,
            y: margin - 24,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          });
        }
      };

      addHeaderFooter(page);

      // Word-wrap each paragraph
      for (let pi = 0; pi < paragraphs.length; pi++) {
        const raw = paragraphs[pi];
        const words = raw.length ? raw.split(/\s+/) : ['']; // keep blank lines

        let current = '';
        for (let wi = 0; wi < words.length; wi++) {
          const probe = (current ? current + ' ' : '') + words[wi];
          const w = font.widthOfTextAtSize(probe, fontSize);
          if (w > contentW && current) {
            // commit current line
            if (y - lineHeight < margin) {
              page = doc.addPage([rotated.w, rotated.h]);
              y = rotated.h - margin;
              addHeaderFooter(page);
            }
            y -= lineHeight;
            drawLine(current);
            current = words[wi];
          } else {
            current = probe;
          }
        }

        // commit final line in paragraph
        if (current) {
          if (y - lineHeight < margin) {
            page = doc.addPage([rotated.w, rotated.h]);
            y = rotated.h - margin;
            addHeaderFooter(page);
          }
          y -= lineHeight;
          drawLine(current);
        } else {
          // empty line (paragraph break)
          if (y - lineHeight < margin) {
            page = doc.addPage([rotated.w, rotated.h]);
            y = rotated.h - margin;
            addHeaderFooter(page);
          }
          y -= lineHeight;
        }
      }

      // Page numbers
      if (addPageNumbers) {
        const n = doc.getPageCount();
        for (let i = 0; i < n; i++) {
          const pg = doc.getPage(i);
          const s = `${i + 1} / ${n}`;
          const sz = 10;
          const width = font.widthOfTextAtSize(s, sz);
          pg.drawText(s, {
            x: (rotated.w - width) / 2,
            y: margin - 40,
            size: sz,
            font,
            color: rgb(0, 0, 0),
          });
        }
      }

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Text to PDF conversion failed:', error);
    } finally {
      setIsProcessing(false);
    }
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
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no back arrow; animated gradient Tools button on right) */}
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
                <p className="text-xs text-gray-500 font-medium">Text to PDF Converter</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main Section */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Tool Info Card */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Text to PDF</h2>
              <p className="text-gray-700 text-lg leading-relaxed">Convert typed or pasted text into clean, readable PDFs.</p>
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

          {/* Editor + Options */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Enter or Paste Text</h3>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">
                <span className="mr-3">Words: <b>{counts.words}</b></span>
                <span className="mr-3">Chars: <b>{counts.chars}</b></span>
                <span>Lines: <b>{counts.lines}</b></span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  onChange={(e) => handleTxtImport(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  <UploadIcon className="w-4 h-4 mr-2" /> Import .txt
                </button>
                <button
                  type="button"
                  onClick={() => { setText(''); setPdfUrl(null); }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-all"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your content here..."
              rows={10}
              className="mt-3 w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl focus:border-blue-500 outline-none bg-white/60 backdrop-blur-sm"
            />

            {/* Advanced options */}
            <div className="mt-6 bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Page Size</label>
                  <select
                    value={pageSizeKey}
                    onChange={(e) => setPageSizeKey(e.target.value as PageSizeKey)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Orientation</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as Orientation)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
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
                  <label className="block text-sm text-gray-700 mb-1">Font</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="Helvetica">Helvetica</option>
                    <option value="TimesRoman">Times New Roman</option>
                    <option value="Courier">Courier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Font Size: <span className="font-medium">{fontSize}</span>
                  </label>
                  <input
                    type="range"
                    min={8}
                    max={24}
                    step={1}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Line Spacing: <span className="font-medium">{lineHeight}</span>
                  </label>
                  <input
                    type="range"
                    min={12}
                    max={36}
                    step={1}
                    value={lineHeight}
                    onChange={(e) => setLineHeight(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Alignment</label>
                  <select
                    value={align}
                    onChange={(e) => setAlign(e.target.value as Align)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Header (optional)</label>
                  <input
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    placeholder="e.g. Project Notes"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Footer (optional)</label>
                  <input
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    placeholder="e.g. © Your Name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Document Title</label>
                  <input
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    placeholder="Text Document"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Author</label>
                  <input
                    value={docAuthor}
                    onChange={(e) => setDocAuthor(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    placeholder="Your Name"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="pgnums"
                    type="checkbox"
                    checked={addPageNumbers}
                    onChange={(e) => setAddPageNumbers(e.target.checked)}
                  />
                  <label htmlFor="pgnums" className="text-sm text-gray-700">Add page numbers</label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Output Filename</label>
                  <input
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    placeholder="text.pdf"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={convertTextToPdf}
              disabled={isProcessing || !text.trim()}
              className="w-full mt-6 px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Converting…' : 'Convert to PDF'}
            </button>
          </div>

          {/* Download Section */}
          {pdfUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
              <a
                href={pdfUrl}
                download={outputName || 'text.pdf'}
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

export default TextToPdfPage;
