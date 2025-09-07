import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import {
  Sparkles,
  Code,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

// ✅ SEO imports
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';

// ✅ Animated Tools dropdown (same as ExtractTextPage)
import ToolsMenu from '../../components/ToolsMenu';

/**
 * HtmlToPdfPage converts HTML files into a PDF. Advanced options blend into existing UI.
 */
const HtmlToPdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [htmlText, setHtmlText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ✅ SEO config for this tool
  const seo = TOOL_SEO_DATA['/tools/html-to-pdf'];

  /** ---------- Advanced Options (persisted) ---------- */
  type PageSize = 'A4' | 'Letter';
  type Orientation = 'portrait' | 'landscape';
  type MarginPreset = 'compact' | 'normal' | 'wide';

  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal');
  const [headerText, setHeaderText] = useState<string>('');
  const [footerText, setFooterText] = useState<string>('');
  const [pageNumbers, setPageNumbers] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Load saved settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fn_html2pdf_settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.pageSize) setPageSize(s.pageSize);
        if (s.orientation) setOrientation(s.orientation);
        if (s.marginPreset) setMarginPreset(s.marginPreset);
        if (typeof s.headerText === 'string') setHeaderText(s.headerText);
        if (typeof s.footerText === 'string') setFooterText(s.footerText);
        if (typeof s.pageNumbers === 'boolean') setPageNumbers(s.pageNumbers);
      }
    } catch {}
  }, []);

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem(
        'fn_html2pdf_settings',
        JSON.stringify({ pageSize, orientation, marginPreset, headerText, footerText, pageNumbers })
      );
    } catch {}
  }, [pageSize, orientation, marginPreset, headerText, footerText, pageNumbers]);

  /** ---------- Helpers ---------- */

  // Parse HTML into simple content blocks (keeps headings readable)
  const htmlToBlocks = (html: string): Array<{ type: 'h1'|'h2'|'h3'|'p'; text: string }> => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const blocks: Array<{ type: 'h1'|'h2'|'h3'|'p'; text: string }> = [];
      const walker = doc.body ? doc.body : doc;

      walker.querySelectorAll('h1,h2,h3,p,div,li').forEach((el) => {
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || '').replace(/\s+\n/g, '\n').replace(/\s+/g, ' ').trim();
        if (!text) return;
        if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
          blocks.push({ type: tag as 'h1'|'h2'|'h3', text });
        } else {
          blocks.push({ type: 'p', text });
        }
      });

      if (blocks.length === 0) {
        const txt = (doc.body?.textContent || doc.documentElement?.textContent || '').trim();
        if (txt) blocks.push({ type: 'p', text: txt });
      }
      return blocks;
    } catch {
      const plain = html.replace(/<[^>]+>/g, ' ');
      return [{ type: 'p', text: plain }];
    }
  };

  // Word wrap using font metrics
  const wrapText = (
    text: string,
    font: any,
    fontSize: number,
    maxWidth: number
  ): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';

    for (let i = 0; i < words.length; i++) {
      const tentative = current ? `${current} ${words[i]}` : words[i];
      const w = font.widthOfTextAtSize(tentative, fontSize);
      if (w <= maxWidth) {
        current = tentative;
      } else {
        if (current) lines.push(current);
        if (font.widthOfTextAtSize(words[i], fontSize) > maxWidth) {
          let chunk = words[i];
          while (font.widthOfTextAtSize(chunk, fontSize) > maxWidth && chunk.length > 1) {
            let lo = 1, hi = chunk.length, pos = 1;
            while (lo <= hi) {
              const mid = Math.floor((lo + hi) / 2);
              const part = chunk.slice(0, mid);
              if (font.widthOfTextAtSize(part, fontSize) <= maxWidth) {
                pos = mid; lo = mid + 1;
              } else hi = mid - 1;
            }
            lines.push(chunk.slice(0, pos));
            chunk = chunk.slice(pos);
          }
          current = chunk;
        } else {
          current = words[i];
        }
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  const getPageSize = (ps: PageSize, orient: Orientation) => {
    // Points: A4 595x842, Letter 612x792
    let w = ps === 'A4' ? 595 : 612;
    let h = ps === 'A4' ? 842 : 792;
    if (orient === 'landscape') [w, h] = [h, w];
    return { width: w, height: h };
  };

  const getMargin = (preset: MarginPreset) => {
    if (preset === 'compact') return 36; // 0.5in
    if (preset === 'wide') return 72;    // 1in
    return 50;                           // default
  };

  /** ---------- Conversion ---------- */

  const convertToPdf = async () => {
    if (!htmlText.trim() && !file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      let rawHtml = htmlText.trim();
      if (!rawHtml && file) {
        rawHtml = await file.text();
      }

      const blocks = htmlToBlocks(rawHtml);

      const pdfDoc = await PDFDocument.create();
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      const { width: pageW, height: pageH } = getPageSize(pageSize, orientation);
      const margin = getMargin(marginPreset);
      const contentWidth = pageW - margin * 2;

      let page = pdfDoc.addPage([pageW, pageH]);
      let y = pageH - margin;

      const lineGap = 4;

      const drawHeader = () => {
        if (!headerText) return;
        const size = 10;
        page.drawText(headerText, {
          x: margin,
          y: pageH - margin + 12,
          size,
          font: fontItalic,
        });
      };

      const drawFooter = (pageIndex: number, totalPages?: number) => {
        const size = 10;
        let footer = footerText || '';
        if (pageNumbers) {
          const num = `Page ${pageIndex + 1}${totalPages ? ` of ${totalPages}` : ''}`;
          footer = footer ? `${footer} — ${num}` : num;
        }
        if (!footer) return;
        const w = fontRegular.widthOfTextAtSize(footer, size);
        page.drawText(footer, {
          x: (pageW - w) / 2,
          y: margin - 24,
          size,
          font: fontRegular,
        });
      };

      // preflight to count pages (for "X of Y")
      const simulate = () => {
        let simY = pageH - margin;
        let pages = 1;

        const para = (
          text: string,
          size: number,
          font: any,
          spacing: number
        ) => {
          const lines = wrapText(text, font, size, contentWidth);
          const lineHeight = size + lineGap;
          for (const ln of lines) {
            if (simY - lineHeight < margin) {
              pages++;
              simY = pageH - margin;
            }
            simY -= lineHeight;
          }
          simY -= spacing;
        };

        blocks.forEach((b) => {
          if (b.type === 'h1') para(b.text, 18, fontBold, 8);
          else if (b.type === 'h2') para(b.text, 16, fontBold, 6);
          else if (b.type === 'h3') para(b.text, 14, fontBold, 6);
          else para(b.text, 12, fontRegular, 10);
        });

        return pages;
      };

      const totalPages = simulate();

      const print = async () => {
        let currentPageIndex = 0;

        const newPage = () => {
          page = pdfDoc.addPage([pageW, pageH]);
          currentPageIndex++;
          y = pageH - margin;
          drawHeader();
        };

        drawHeader();

        const para = async (
          text: string,
          size: number,
          font: any,
          spacing: number
        ) => {
          const lines = wrapText(text, font, size, contentWidth);
          const lineHeight = size + lineGap;

          for (let i = 0; i < lines.length; i++) {
            if (y - lineHeight < margin) {
              drawFooter(currentPageIndex, totalPages);
              newPage();
              await new Promise((res) => setTimeout(res, 0));
            }
            page.drawText(lines[i], { x: margin, y: y - lineHeight, size, font });
            y -= lineHeight;
            setProgress((prev) => Math.min(99, prev + 0.3));
          }
          y -= spacing;
        };

        for (const b of blocks) {
          if (b.type === 'h1') await para(b.text, 18, fontBold, 8);
          else if (b.type === 'h2') await para(b.text, 16, fontBold, 6);
          else if (b.type === 'h3') await para(b.text, 14, fontBold, 6);
          else await para(b.text, 12, fontRegular, 10);
        }

        drawFooter(currentPageIndex, totalPages);
      };

      await print();

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError('Failed to convert file.');
    }
    setIsProcessing(false);
  };

  return (
    <>
      {/* ✅ Injects Breadcrumb + WebPage + SoftwareApplication + meta */}
      <ToolSeo {...seo} />

      <Helmet>
        <title>HTML to PDF – Convert HTML Files to PDF Online | FilesNova</title>
        <meta
          name="description"
          content="Convert HTML to PDF instantly. Paste HTML or upload .html files and get a clean text-based PDF. Fast, free, and secure—no signup."
        />
        <link rel="canonical" href="https://filesnova.com/tools/html-to-pdf" />
      </Helmet>

      {/* ✅ WebApplication schema */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'HTML to PDF – Files Nova',
          url: 'https://filesnova.com/tools/html-to-pdf',
          applicationCategory: 'FileConverter',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />

      {/* ✅ BreadcrumbList schema */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://filesnova.com/' },
            { '@type': 'ListItem', position: 2, name: 'HTML to PDF', item: 'https://filesnova.com/tools/html-to-pdf' },
          ],
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (matches ExtractText header: brand left, TOOLS dropdown right) */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-">
              <div className="relative shrink-0">
                <picture>
                  <source srcSet={FileNovaIconWebp} type="image/webp" />
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
                <p className="text-xs text-gray-500 font-medium">HTML to PDF Converter</p>
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
                <Code className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">HTML to PDF</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert HTML documents to clean PDF files by extracting the text from your markup.
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

          {/* Input & Upload & Convert */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Enter HTML or Upload File</h3>
            {/* HTML text editor */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">HTML Content</label>
              <textarea
                id="html-input"
                value={htmlText}
                onChange={(e) => {
                  setHtmlText(e.target.value);
                  if (e.target.value.trim().length > 0) setFile(null);
                }}
                placeholder="Type or paste your HTML here..."
                rows={8}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl focus:border-blue-500 outline-none bg-white/60 backdrop-blur-sm"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setHtmlText('');
                    setFile(null);
                    setDownloadUrl(null);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Or Upload HTML File</h4>
              <UploadZone
                accept=".html,.htm,text/html"
                multiple={false}
                title="Drop your HTML file here"
                buttonLabel="Choose File"
                supportedFormats="HTML"
                onFilesSelected={(fs) => {
                  const f = fs[0] || null;
                  setFile(f);
                  setHtmlText('');
                  setDownloadUrl(null);
                  setError(null);
                }}
              />
            </div>

            {/* ---------- Advanced options ---------- */}
            <div className="mt-6 bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-4">
              <button
                type="button"
                className="w-full text-left font-semibold text-gray-800"
                onClick={() => setShowAdvanced((s) => !s)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>

              {showAdvanced && (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Page Size</label>
                    <select
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value as PageSize)}
                    >
                      <option value="A4">A4</option>
                      <option value="Letter">Letter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Orientation</label>
                    <select
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                      value={orientation}
                      onChange={(e) => setOrientation(e.target.value as Orientation)}
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Margins</label>
                    <select
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                      value={marginPreset}
                      onChange={(e) => setMarginPreset(e.target.value as MarginPreset)}
                    >
                      <option value="compact">Compact</option>
                      <option value="normal">Normal</option>
                      <option value="wide">Wide</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 mt-6 md:mt-8">
                    <input
                      id="pgnums"
                      type="checkbox"
                      className="h-4 w-4"
                      checked={pageNumbers}
                      onChange={(e) => setPageNumbers(e.target.checked)}
                    />
                    <label htmlFor="pgnums" className="text-sm text-gray-800">Show page numbers</label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Header (optional)</label>
                    <input
                      type="text"
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      placeholder="e.g., Company • HTML to PDF"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Footer (optional)</label>
                    <input
                      type="text"
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder="e.g., Confidential — Do not distribute"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={convertToPdf}
              disabled={(!htmlText.trim() && !file) || isProcessing}
              className="w-full mt-6 px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Convert to PDF
            </button>

            {isProcessing && (
              <div className="mt-4">
                <p className="text-center">Processing... {Math.round(progress)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

          {downloadUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
              <a
                href={downloadUrl}
                download={file?.name.replace(/\.html?$/i, '.pdf') || 'document.pdf'}
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download PDF
              </a>
            </div>
          )}

          {/* Ad space below the conversion area */}
          <AdSpace />
        </div>
      </div>
    </>
  );
};

export default HtmlToPdfPage;
v>
      </div>
    </>
  );
};

export default HtmlToPdfPage;
