// src/pages/tools/MarkdownToPdfPage.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import UploadZone from '../../components/UploadZone';
import {
  Sparkles,
  FileCode,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  Eye,
  Hash as TocIcon,
} from 'lucide-react';

// ✅ SEO
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';

// ✅ Animated Tools dropdown (same as other pages)
import ToolsMenu from '../../components/ToolsMenu';

/** Types for advanced options */
type PageSizeKey = 'Auto' | 'A4' | 'Letter';
type Orientation = 'portrait' | 'landscape';
type MarginPreset = 'compact' | 'normal' | 'wide';
type FontFamily = 'Helvetica' | 'Times' | 'Courier';

const PAGE_SIZES: Record<Exclude<PageSizeKey, 'Auto'>, { w: number; h: number }> = {
  // PDF points (1pt = 1/72 inch)
  A4: { w: 595, h: 842 },
  Letter: { w: 612, h: 792 },
};
const marginValue = (m: MarginPreset) => (m === 'compact' ? 36 : m === 'wide' ? 72 : 54);

const MarkdownToPdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mdText, setMdText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Advanced options (persisted)
  const [pageSizeKey, setPageSizeKey] = useState<PageSizeKey>('Auto');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal');
  const [fontFamily, setFontFamily] = useState<FontFamily>('Helvetica');
  const [bodySize, setBodySize] = useState<number>(12);
  const [headingBase, setHeadingBase] = useState<number>(20); // H1
  const [includeHeader, setIncludeHeader] = useState<boolean>(true);
  const [includeFooter, setIncludeFooter] = useState<boolean>(true);
  const [includeToc, setIncludeToc] = useState<boolean>(true);
  const [docTitle, setDocTitle] = useState<string>('Document');
  const [docAuthor, setDocAuthor] = useState<string>('');
  const [docDate, setDocDate] = useState<string>(() => new Date().toLocaleDateString());

  // ✅ per-page SEO config
  const seo = TOOL_SEO_DATA['/tools/markdown-to-pdf'];

  // Load settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fn_md2pdf_settings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.pageSizeKey) setPageSizeKey(s.pageSizeKey);
      if (s.orientation) setOrientation(s.orientation);
      if (s.marginPreset) setMarginPreset(s.marginPreset);
      if (s.fontFamily) setFontFamily(s.fontFamily);
      if (typeof s.bodySize === 'number') setBodySize(s.bodySize);
      if (typeof s.headingBase === 'number') setHeadingBase(s.headingBase);
      if (typeof s.includeHeader === 'boolean') setIncludeHeader(s.includeHeader);
      if (typeof s.includeFooter === 'boolean') setIncludeFooter(s.includeFooter);
      if (typeof s.includeToc === 'boolean') setIncludeToc(s.includeToc);
      if (typeof s.docTitle === 'string') setDocTitle(s.docTitle);
      if (typeof s.docAuthor === 'string') setDocAuthor(s.docAuthor);
      if (typeof s.docDate === 'string') setDocDate(s.docDate);
    } catch {}
  }, []);

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem(
        'fn_md2pdf_settings',
        JSON.stringify({
          pageSizeKey,
          orientation,
          marginPreset,
          fontFamily,
          bodySize,
          headingBase,
          includeHeader,
          includeFooter,
          includeToc,
          docTitle,
          docAuthor,
          docDate,
        })
      );
    } catch {}
  }, [
    pageSizeKey,
    orientation,
    marginPreset,
    fontFamily,
    bodySize,
    headingBase,
    includeHeader,
    includeFooter,
    includeToc,
    docTitle,
    docAuthor,
    docDate,
  ]);

  // Tiny Markdown tokenizer (headings, lists, blockquotes, code fences, inline * _ ** __ `)
  type Block =
    | { t: 'p'; text: string }
    | { t: 'h'; level: number; text: string }
    | { t: 'ul'; items: string[] }
    | { t: 'ol'; items: string[] }
    | { t: 'blockquote'; lines: string[] }
    | { t: 'code'; lang: string | null; lines: string[] }
    | { t: 'hr' };

  const tokenize = (src: string): Block[] => {
    const lines = src.replace(/\r\n/g, '\n').split('\n');
    const blocks: Block[] = [];
    let i = 0;
    while (i < lines.length) {
      let line = lines[i];

      // code fence
      const fence = line.match(/^```(\w+)?\s*$/);
      if (fence) {
        const lang = fence[1] || null;
        i++;
        const buf: string[] = [];
        while (i < lines.length && !lines[i].match(/^```\s*$/)) {
          buf.push(lines[i]);
          i++;
        }
        // skip closing ```
        if (i < lines.length) i++;
        blocks.push({ t: 'code', lang, lines: buf });
        continue;
      }

      // hr
      if (/^(\*\s*\*\s*\*|-\s*-\s*-|_\s*_\s_)\s*$/.test(line)) {
        blocks.push({ t: 'hr' });
        i++;
        continue;
      }

      // heading
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        blocks.push({ t: 'h', level: h[1].length, text: h[2].trim() });
        i++;
        continue;
      }

      // blockquote
      if (/^>\s?/.test(line)) {
        const buf: string[] = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          buf.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        blocks.push({ t: 'blockquote', lines: buf });
        continue;
      }

      // list (ul or ol)
      if (/^\s*([-*+])\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*([-*+])\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
          i++;
        }
        blocks.push({ t: 'ul', items });
        continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
          i++;
        }
        blocks.push({ t: 'ol', items });
        continue;
      }

      // paragraph / blank lines join
      if (line.trim() === '') {
        i++;
        continue;
      }
      const buf: string[] = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,6})\s+/.test(lines[i])) {
        // stop at next block starter-ish
        if (/^```/.test(lines[i]) || /^>\s?/.test(lines[i]) || /^\s*([-*+])\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i])) break;
        buf.push(lines[i]);
        i++;
      }
      blocks.push({ t: 'p', text: buf.join(' ') });
    }
    return blocks;
  };

  // Inline formatting: **bold**, *italic*, __bold__, _italic_, `code`
  const inlineSegments = (txt: string) => {
    // returns segments as {text, style: 'b'|'i'|'code'|undefined}
    const segs: { text: string; style?: 'b' | 'i' | 'code' }[] = [];
    let rest = txt;
    // simple iterative parse; avoid nested heavy parsing for speed
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|`[^`]+`)/;
    while (rest.length) {
      const m = rest.match(regex);
      if (!m) {
        segs.push({ text: rest });
        break;
      }
      const idx = m.index || 0;
      if (idx > 0) segs.push({ text: rest.slice(0, idx) });
      const token = m[0];
      let style: 'b' | 'i' | 'code' | undefined;
      let inner = token;
      if ((/^\*\*.*\*\*$/.test(token)) || (/^__.*__$/.test(token))) {
        style = 'b'; inner = token.slice(2, -2);
      } else if ((/^\*.*\*$/.test(token)) || (/^_.*_$/.test(token))) {
        style = 'i'; inner = token.slice(1, -1);
      } else if (/^`.*`$/.test(token)) {
        style = 'code'; inner = token.slice(1, -1);
      }
      segs.push({ text: inner, style });
      rest = rest.slice(idx + token.length);
    }
    return segs;
  };

  const convertMdToPdf = async () => {
    const typed = mdText.trim();
    if (!typed && !file) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setDownloadUrl(null);

    try {
      let textContent = typed;
      if (!textContent && file) {
        textContent = await file.text();
      }

      // Tokenize
      const blocks = tokenize(textContent);
      // Gather headings for TOC
      const headings = blocks.filter((b) => b.t === 'h') as { t: 'h'; level: number; text: string }[];

      // Prepare PDF
      const pdfDoc = await PDFDocument.create();

      // Font selection
      let bodyFontRef, boldFontRef, monoFontRef;
      if (fontFamily === 'Times') {
        bodyFontRef = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        boldFontRef = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      } else if (fontFamily === 'Courier') {
        bodyFontRef = await pdfDoc.embedFont(StandardFonts.Courier);
        boldFontRef = await pdfDoc.embedFont(StandardFonts.CourierBold);
      } else {
        bodyFontRef = await pdfDoc.embedFont(StandardFonts.Helvetica);
        boldFontRef = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      }
      monoFontRef = await pdfDoc.embedFont(StandardFonts.Courier);

      // Page size
      const base = pageSizeKey === 'Auto' ? { w: 612, h: 792 } : PAGE_SIZES[pageSizeKey];
      const size = orientation === 'landscape' ? { w: base.h, h: base.w } : base;

      const margin = marginValue(marginPreset);
      const contentW = Math.max(1, size.w - margin * 2);
      const lineGap = 0.35 * bodySize;
      const paraGap = bodySize * 0.8;

      const hSizes = {
        h1: headingBase,
        h2: headingBase - 2,
        h3: headingBase - 4,
        h4: headingBase - 6,
        h5: headingBase - 8,
        h6: headingBase - 10,
      };

      // Utility: add page and draw header/footer
      let page = pdfDoc.addPage([size.w, size.h]);
      let y = size.h - margin;

      const drawHeader = () => {
        if (!includeHeader) return;
        const title = docTitle || '';
        const meta = [docAuthor, docDate].filter(Boolean).join(' • ');
        const titleSize = 10;
        const metaSize = 9;
        page.drawText(title, { x: margin, y: size.h - margin + 10, size: titleSize, font: boldFontRef, color: rgb(0.15, 0.15, 0.2) });
        if (meta) {
          const wMeta = bodyFontRef.widthOfTextAtSize(meta, metaSize);
          page.drawText(meta, { x: size.w - margin - wMeta, y: size.h - margin + 10, size: metaSize, font: bodyFontRef, color: rgb(0.35, 0.35, 0.4) });
        }
      };

      const drawFooter = (pageNum: number) => {
        if (!includeFooter) return;
        const s = `Page ${pageNum}`;
        const sz = 9;
        const w = bodyFontRef.widthOfTextAtSize(s, sz);
        page.drawText(s, { x: (size.w - w) / 2, y: margin - 24, size: sz, font: bodyFontRef, color: rgb(0.4, 0.4, 0.45) });
      };

      const newPage = (pageNum: number) => {
        drawFooter(pageNum);
        page = pdfDoc.addPage([size.w, size.h]);
        y = size.h - margin;
        drawHeader();
      };

      // Initial header
      drawHeader();
      let pageNum = 1;

      // Optional TOC (no page numbers to keep it single-pass & fast)
      if (includeToc && headings.length) {
        const titleSz = hSizes.h2;
        const tocTitle = 'Table of Contents';
        page.drawText(tocTitle, { x: margin, y: y - titleSz, size: titleSz, font: boldFontRef });
        y -= titleSz + paraGap;

        const itemSize = bodySize;
        for (let i = 0; i < headings.length; i++) {
          const h = headings[i];
          const indent = (h.level - 1) * 12;
          const bullet = h.level === 1 ? '• ' : h.level === 2 ? '– ' : '· ';
          const line = `${bullet}${h.text}`;
          // wrap if needed
          const words = line.split(/\s+/);
          let current = '';
          const maxW = contentW - indent;
          for (const w of words) {
            const test = current ? current + ' ' + w : w;
            const testWidth = bodyFontRef.widthOfTextAtSize(test, itemSize);
            if (testWidth > maxW && current) {
              if (y < margin + 40) { newPage(pageNum++); }
              page.drawText(current, { x: margin + indent, y: y - itemSize, size: itemSize, font: bodyFontRef, color: rgb(0.2, 0.2, 0.25) });
              y -= itemSize + 2;
              current = w;
            } else {
              current = test;
            }
          }
          if (current) {
            if (y < margin + 40) { newPage(pageNum++); }
            page.drawText(current, { x: margin + indent, y: y - itemSize, size: itemSize, font: bodyFontRef, color: rgb(0.2, 0.2, 0.25) });
            y -= itemSize + 2;
          }
        }
        y -= paraGap;
        // rule
        if (y < margin + 20) { newPage(pageNum++); }
        page.drawLine({ start: { x: margin, y: y - 8 }, end: { x: size.w - margin, y: y - 8 }, thickness: 1, color: rgb(0.85, 0.85, 0.9) });
        y -= 20;
      }

      // Drawing helpers
      const ensureSpace = (need: number) => {
        if (y - need < margin) {
          newPage(pageNum++);
        }
      };

      const drawParagraphText = (text: string, sizePt: number, opt?: { bold?: boolean; color?: { r: number; g: number; b: number } }) => {
        // inline segments & wrap
        const segs = inlineSegments(text);
        const color = opt?.color ? rgb(opt.color.r, opt.color.g, opt.color.b) : rgb(0, 0, 0);
        const lineH = sizePt + lineGap;
        let line = '';
        let lineParts: { text: string; style?: 'b' | 'i' | 'code' }[] = [];
        const flushLine = () => {
          ensureSpace(lineH);
          let x = margin;
          for (const part of lineParts) {
            const font =
              part.style === 'code' ? monoFontRef : part.style === 'b' || opt?.bold ? boldFontRef : bodyFontRef;
            const t = part.text;
            page.drawText(t, { x, y: y - sizePt, size: sizePt, font, color });
            x += font.widthOfTextAtSize(t, sizePt);
          }
          y -= lineH;
          line = '';
          lineParts = [];
        };

        for (const seg of segs) {
          const font =
            seg.style === 'code' ? monoFontRef : seg.style === 'b' || opt?.bold ? boldFontRef : bodyFontRef;
          for (const word of seg.text.split(/(\s+)/)) {
            const tentative = line + word;
            const tentativeWidth = (function calc() {
              let sum = 0;
              let curX = 0;
              const parts = [...lineParts, { text: word, style: seg.style }];
              for (const p of parts) {
                const f = p.style === 'code' ? monoFontRef : p.style === 'b' || opt?.bold ? boldFontRef : bodyFontRef;
                sum += f.widthOfTextAtSize(p.text, sizePt);
                curX = sum;
              }
              return curX;
            })();
            if (tentativeWidth > contentW && line) {
              flushLine();
            }
            line += word;
            lineParts.push({ text: word, style: seg.style });
          }
        }
        if (lineParts.length) flushLine();
        y -= paraGap / 2;
      };

      const drawList = (items: string[], ordered: boolean) => {
        const sz = bodySize;
        const bulletWidth = bodyFontRef.widthOfTextAtSize('• ', sz);
        for (let idx = 0; idx < items.length; idx++) {
          const prefix = ordered ? `${idx + 1}. ` : '• ';
          const prefixW = bodyFontRef.widthOfTextAtSize(prefix, sz);
          const textW = contentW - prefixW;
          // wrap item
          const words = inlineSegments(items[idx]); // treat as inline formats too
          let xStart = margin + prefixW;
          let x = xStart;
          let line = '';
          let lineParts: { text: string; style?: 'b' | 'i' | 'code' }[] = [];

          const drawPrefix = () => {
            ensureSpace(sz + lineGap);
            page.drawText(prefix, { x: margin, y: y - sz, size: sz, font: bodyFontRef });
          };

          const flushLine = (drawPref: boolean) => {
            if (drawPref) drawPrefix();
            let curX = xStart;
            for (const p of lineParts) {
              const f = p.style === 'code' ? monoFontRef : p.style === 'b' ? boldFontRef : bodyFontRef;
              page.drawText(p.text, { x: curX, y: y - sz, size: sz, font: f });
              curX += f.widthOfTextAtSize(p.text, sz);
            }
            y -= sz + lineGap;
            line = '';
            lineParts = [];
          };

          let firstLine = true;
          for (const seg of words) {
            const f = seg.style === 'code' ? monoFontRef : seg.style === 'b' ? boldFontRef : bodyFontRef;
            for (const piece of seg.text.split(/(\s+)/)) {
              const pw = f.widthOfTextAtSize(piece, sz);
              if ((firstLine ? bodyFontRef.widthOfTextAtSize(line + piece, sz) : bodyFontRef.widthOfTextAtSize(line + piece, sz)) > (firstLine ? textW : contentW)) {
                flushLine(firstLine);
                firstLine = false;
              }
              line += piece;
              lineParts.push({ text: piece, style: seg.style });
            }
          }
          if (lineParts.length) flushLine(firstLine);
        }
        y -= paraGap / 2;
      };

      const drawCodeBlock = (lines: string[]) => {
        const sz = bodySize * 0.9;
        const lh = sz + lineGap * 0.6;
        const pad = 8;
        // compute box height
        const boxHeight = lines.length * lh + pad * 2;
        ensureSpace(boxHeight + paraGap);
        // background
        page.drawRectangle({
          x: margin - 2,
          y: y - boxHeight + sz - 2,
          width: contentW + 4,
          height: boxHeight + 4,
          color: rgb(0.95, 0.96, 0.98),
        });
        // text
        let curY = y - pad;
        for (const ln of lines) {
          page.drawText(ln.replace(/\t/g, '  '), {
            x: margin + pad,
            y: curY - sz,
            size: sz,
            font: monoFontRef,
            color: rgb(0.15, 0.2, 0.3),
          });
          curY -= lh;
        }
        y -= boxHeight + paraGap / 2;
      };

      // Render blocks
      const total = blocks.length || 1;
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];

        if (b.t === 'h') {
          const size =
            b.level === 1 ? hSizes.h1 :
            b.level === 2 ? hSizes.h2 :
            b.level === 3 ? hSizes.h3 :
            b.level === 4 ? hSizes.h4 :
            b.level === 5 ? hSizes.h5 : hSizes.h6;
          ensureSpace(size + paraGap);
          page.drawText(b.text, { x: margin, y: y - size, size, font: boldFontRef, color: rgb(0.05, 0.1, 0.2) });
          y -= size + paraGap / 2;
        } else if (b.t === 'p') {
          drawParagraphText(b.text, bodySize);
        } else if (b.t === 'ul') {
          drawList(b.items, false);
        } else if (b.t === 'ol') {
          drawList(b.items, true);
        } else if (b.t === 'blockquote') {
          // left bar + italic text
          const barW = 3;
          const sz = bodySize;
          const lh = sz + lineGap;
          const needed = b.lines.length * lh + paraGap;
          ensureSpace(needed);
          // bar
          page.drawRectangle({ x: margin - 8, y: y - needed + sz, width: barW, height: needed - paraGap, color: rgb(0.7, 0.8, 0.95) });
          // text
          for (const q of b.lines) {
            drawParagraphText(q, sz, { bold: false, color: { r: 0.15, g: 0.2, b: 0.35 } });
          }
          y -= paraGap / 2;
        } else if (b.t === 'code') {
          drawCodeBlock(b.lines);
        } else if (b.t === 'hr') {
          ensureSpace(16);
          page.drawLine({ start: { x: margin, y: y - 8 }, end: { x: size.w - margin, y: y - 8 }, thickness: 1, color: rgb(0.85, 0.85, 0.9) });
          y -= 20;
        }

        setProgress(Math.round(((i + 1) / total) * 100));
        if (i % 8 === 0) await new Promise((r) => setTimeout(r, 0));
      }

      // Finish last page footer
      if (includeFooter) {
        const s = `Page ${pageNum}`;
        const sz = 9;
        const w = bodyFontRef.widthOfTextAtSize(s, sz);
        page.drawText(s, { x: (size.w - w) / 2, y: margin - 24, size: sz, font: bodyFontRef, color: rgb(0.4, 0.4, 0.45) });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err: any) {
      console.error(err);
      setError('Failed to convert file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const previewHtml = useMemo(() => {
    if (!showPreview) return '';
    // super lightweight HTML preview (safe subset; no external HTML rendering libs)
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const blocks = tokenize(mdText);
    const toHtml = (b: ReturnType<typeof tokenize>[number]) => {
      if (b.t === 'h') return `<h${b.level} class="font-bold mt-3 mb-1">${escape(b.text)}</h${b.level}>`;
      if (b.t === 'p') {
        // inline formatting for preview
        let x = escape(b.text);
        x = x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>');
        x = x.replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/_([^_]+)_/g, '<em>$1</em>');
        x = x.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-gray-100">$1</code>');
        return `<p class="my-2">${x}</p>`;
      }
      if (b.t === 'ul') return `<ul class="list-disc ml-6 my-2">${b.items.map((i) => `<li>${escape(i)}</li>`).join('')}</ul>`;
      if (b.t === 'ol') return `<ol class="list-decimal ml-6 my-2">${b.items.map((i) => `<li>${escape(i)}</li>`).join('')}</ol>`;
      if (b.t === 'blockquote') return `<blockquote class="border-l-4 pl-3 my-2 text-gray-600">${b.lines.map(escape).join('<br/>')}</blockquote>`;
      if (b.t === 'code') return `<pre class="bg-gray-100 rounded p-3 text-sm overflow-x-auto my-2"><code>${escape(b.lines.join('\n'))}</code></pre>`;
      if (b.t === 'hr') return `<hr class="my-3 border-gray-200" />`;
      return '';
    };
    const parts: string[] = [];
    if (includeToc) {
      const heads = blocks.filter((b) => b.t === 'h') as { t: 'h'; level: number; text: string }[];
      if (heads.length) {
        parts.push(`<h3 class="font-bold mt-2 mb-1 flex items-center gap-2"><span>Table of Contents</span></h3>`);
        parts.push('<ul class="ml-4 my-2 text-sm">');
        for (const h of heads) {
          parts.push(`<li class="my-0.5" style="margin-left:${(h.level - 1) * 12}px">• ${escape(h.text)}</li>`);
        }
        parts.push('</ul><hr class="my-3 border-gray-200" />');
      }
    }
    parts.push(...blocks.map(toHtml));
    return parts.join('');
  }, [mdText, showPreview, includeToc]);

  return (
    <>
      {/* ✅ Injects Breadcrumb + WebPage/SoftwareApplication + meta from centralized data */}
      <ToolSeo {...seo} />

      {/* ✅ Page-specific title/description + canonical */}
      <Helmet>
        <title>Markdown to PDF – Fast & Free Online Converter | FilesNova</title>
        <meta
          name="description"
          content="Convert Markdown (.md) to PDF with headings, lists, code blocks, TOC, page numbers, and custom fonts. Fast, private, in-browser."
        />
        <link rel="canonical" href="https://filesnova.com/tools/markdown-to-pdf" />
      </Helmet>

      {/* ✅ WebApplication JSON-LD */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Markdown to PDF – Files Nova',
          url: 'https://filesnova.com/tools/markdown-to-pdf',
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
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Markdown to PDF',
              item: 'https://filesnova.com/tools/markdown-to-pdf',
            },
          ],
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (brand left, Tools on right; no back arrow) */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-4">
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
                <p className="text-xs text-gray-500 font-medium">Markdown to PDF</p>
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
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-6 00 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <FileCode className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Markdown to PDF</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert Markdown into a beautifully typeset PDF with headings, lists, code blocks, TOC, and page numbers.
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
            {/* Quick options row */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Page Size</label>
                  <select
                    value={pageSizeKey}
                    onChange={(e) => setPageSizeKey(e.target.value as PageSizeKey)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="Auto">Auto</option>
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
                    disabled={pageSizeKey === 'Auto'}
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times">Times</option>
                    <option value="Courier">Courier</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Typography controls */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Body Size: {bodySize}px</label>
                <input
                  type="range"
                  min={10}
                  max={16}
                  step={1}
                  value={bodySize}
                  onChange={(e) => setBodySize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">H1 Size: {headingBase}px</label>
                <input
                  type="range"
                  min={16}
                  max={28}
                  step={1}
                  value={headingBase}
                  onChange={(e) => setHeadingBase(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Document meta */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Document Title"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Author</label>
                <input
                  type="text"
                  value={docAuthor}
                  onChange={(e) => setDocAuthor(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Date</label>
                <input
                  type="text"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="2025-08-20"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={includeHeader} onChange={(e) => setIncludeHeader(e.target.checked)} />
                <span className="text-sm text-gray-700">Header (title/author/date)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={includeFooter} onChange={(e) => setIncludeFooter(e.target.checked)} />
                <span className="text-sm text-gray-700">Footer (page numbers)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={includeToc} onChange={(e) => setIncludeToc(e.target.checked)} />
                <span className="text-sm text-gray-700">Table of Contents (no page #s)</span>
              </label>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Enter Markdown or Upload File</h3>

            {/* Markdown text editor */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Markdown Content</label>
              <textarea
                value={mdText}
                onChange={(e) => {
                  setMdText(e.target.value);
                  if (e.target.value.trim().length > 0) setFile(null);
                }}
                placeholder="Type or paste your Markdown here..."
                rows={10}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl focus:border-blue-500 outline-none bg-white/60 backdrop-blur-sm"
              />
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPreview((s) => !s);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMdText('');
                    setFile(null);
                    setDownloadUrl(null);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
                >
                  Clear
                </button>
              </div>

              {/* Live preview (blends in; mobile-safe) */}
              {showPreview && (
                <div className="mt-4 border border-gray-200 rounded-2xl p-4 bg-white/70 overflow-x-auto">
                  <div
                    className="prose max-w-none prose-p:my-2 prose-pre:my-2 prose-code:px-1 prose-code:py-0.5"
                    // Safe subset preview: we only inject our own sanitized HTML from tokenize()
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Or Upload Markdown File</h4>
              <UploadZone
                accept=".md,.markdown,text/markdown"
                multiple={false}
                title="Drop your Markdown file here"
                buttonLabel="Choose File"
                supportedFormats="MD"
                onFilesSelected={(fs) => {
                  const f = fs[0] || null;
                  setFile(f);
                  setMdText('');
                  setDownloadUrl(null);
                  setError(null);
                }}
              />
            </div>

            <button
              onClick={convertMdToPdf}
              disabled={(!mdText.trim() && !file) || isProcessing}
              className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Convert to PDF
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
                download={file?.name?.replace(/\.md$/i, '.pdf') || 'document.pdf'}
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

export default MarkdownToPdfPage;
