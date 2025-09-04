// src/pages/tools/RtfToDocxPage.tsx
import React, { useMemo, useState } from 'react';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import { ToolSeo } from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import ToolsMenu from '../../components/ToolsMenu';
import {
  Sparkles,
  FileText,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  MoveUpRight,
  MoveDownRight,
  X as XIcon,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

/* ==================== Types ==================== */
type OrderMode = 'manual' | 'name' | 'size';
type OutputMode = 'merged' | 'splitzip';

type FileItem = { id: string; file: File; status: 'ready' | 'completed' };

type Span = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};
type Paragraph = Span[];

type ParsedDoc = {
  title: string;
  paragraphs: Paragraph[]; // simple structure we can render to DOCX and preview
  richHints?: boolean;     // true when we have style hints (RTF)
};

/* ==================== Minimal RTF Parser (bold/italic/underline + \par) ==================== */
const decodeHexEscapes = (rtf: string) =>
  rtf.replace(/\\'[0-9a-fA-F]{2}/g, m => String.fromCharCode(parseInt(m.slice(2), 16)));
const removeUnicodeEscapes = (rtf: string) => rtf.replace(/\\u-?\d+\??/g, '');

const tokenizeMinimalRtf = (rtf: string): Paragraph[] => {
  let s = decodeHexEscapes(rtf);
  s = removeUnicodeEscapes(s)
    .replace(/[{}]/g, '')
    .replace(/\\~/g, ' ')
    .replace(/\\-/g, '');

  const tokens = s.split(/(\\[a-zA-Z]+-?\d*\s?)/g).filter(t => t !== '');

  let bold = false, italic = false, underline = false;
  let current: Span = { text: '', bold, italic, underline };
  const paras: Paragraph[] = [];
  let p: Paragraph = [];

  const flushSpan = () => {
    if (!current.text) return;
    p.push({ ...current });
    current = { text: '', bold, italic, underline };
  };
  const flushParagraph = () => {
    flushSpan();
    if (p.length === 0) p.push({ text: '' });
    paras.push(p);
    p = [];
  };
  const startNewSpanIfStyleChanged = () => {
    if (
      current.text !== '' &&
      (current.bold !== bold || current.italic !== italic || current.underline !== underline)
    ) {
      flushSpan();
    }
    current.bold = bold;
    current.italic = italic;
    current.underline = underline;
  };

  for (const t of tokens) {
    if (t.startsWith('\\')) {
      const cmd = t.trim();
      if (/^\\b0\b/.test(cmd)) { bold = false; startNewSpanIfStyleChanged(); continue; }
      if (/^\\b\b/.test(cmd))  { bold = true;  startNewSpanIfStyleChanged(); continue; }
      if (/^\\i0\b/.test(cmd)) { italic = false; startNewSpanIfStyleChanged(); continue; }
      if (/^\\i\b/.test(cmd))  { italic = true;  startNewSpanIfStyleChanged(); continue; }
      if (/^\\ul0\b/.test(cmd)){ underline = false; startNewSpanIfStyleChanged(); continue; }
      if (/^\\ul\b/.test(cmd)) { underline = true;  startNewSpanIfStyleChanged(); continue; }
      if (/^\\par\b/.test(cmd)){ flushParagraph(); continue; }
      continue;
    } else {
      const clean = t.replace(/\r/g, '');
      if (!clean) continue;
      current.text += clean;
    }
  }
  flushParagraph();
  return paras;
};

/* ==================== ODT Parser (best-effort text extraction) ==================== */
const parseOdt = async (buf: ArrayBuffer): Promise<Paragraph[]> => {
  const zip = await JSZip.loadAsync(buf);
  const contentXml = await zip.file('content.xml')?.async('string');
  if (!contentXml) return [[{ text: '(No content.xml found in ODT)' }]];
  // Extract text inside <text:p> … Allow nested <text:span> but treat as plain
  const paras: Paragraph[] = [];
  const pMatches = contentXml.match(/<text:p[\s\S]*?<\/text:p>/g) || [];
  for (const p of pMatches) {
    // strip tags, keep text
    const text = p
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    paras.push([{ text }]);
  }
  if (paras.length === 0) paras.push([{ text: '(No paragraphs found)' }]);
  return paras;
};

/* ==================== DOC (binary) Parser (very light heuristic) ==================== */
/* We scan for long ASCII or UTF-16LE string runs and join them into paragraphs. */
const parseDocBinary = async (buf: ArrayBuffer): Promise<Paragraph[]> => {
  const bytes = new Uint8Array(buf);

  // Heuristic: prefer UTF-16LE if we detect a lot of zero bytes between chars
  let zeroCount = 0;
  for (let i = 1; i < Math.min(bytes.length, 4096); i += 2) if (bytes[i] === 0) zeroCount++;
  const maybeUtf16 = zeroCount > 256;

  const paras: Paragraph[] = [];
  const pushParaFromText = (t: string) => {
    const clean = t.replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
    if (clean) paras.push([{ text: clean }]);
  };

  if (maybeUtf16) {
    // Collect UTF-16LE runs of letters, numbers, punctuation
    let run: number[] = [];
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      const lo = bytes[i], hi = bytes[i + 1];
      const code = lo + (hi << 8);
      if (code >= 0x09 && code <= 0xFFFF) {
        run.push(code);
        if (run.length > 8000) { // chunk
          pushParaFromText(String.fromCharCode(...run));
          run = [];
        }
      } else {
        if (run.length > 20) pushParaFromText(String.fromCharCode(...run));
        run = [];
      }
    }
    if (run.length > 0) pushParaFromText(String.fromCharCode(...run));
  } else {
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b === 0x0A || b === 0x0D || (b >= 32 && b < 127)) {
        out += String.fromCharCode(b);
      } else {
        if (out.length > 100) {
          pushParaFromText(out);
        }
        out = '';
      }
    }
    if (out.length > 0) pushParaFromText(out);
  }

  if (paras.length === 0) paras.push([{ text: '(No readable text found — .doc support is best-effort)' }]);
  return paras;
};

/* ==================== DOCX Builders ==================== */
const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const buildWordBodyFromParagraphs = (paragraphs: Paragraph[]) => {
  const pXml: string[] = [];
  for (const para of paragraphs) {
    const runs: string[] = [];
    for (const span of para) {
      const safe = xmlEscape(span.text).replace(/\n{2,}/g, '\n').split('\n');
      const first = safe.shift() ?? '';
      const brs = safe.map(line => `<w:br/><w:t xml:space="preserve">${line}</w:t>`).join('');
      const rPr = [
        span.bold ? '<w:b/>' : '',
        span.italic ? '<w:i/>' : '',
        span.underline ? '<w:u w:val="single"/>' : '',
      ].join('');
      runs.push(
        `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ''}<w:t xml:space="preserve">${first}</w:t>${brs}</w:r>`
      );
    }
    pXml.push(`<w:p>${runs.join('')}</w:p>`);
  }
  return pXml.join('\n');
};

const buildSingleDocxBlob = async (
  items: { title?: string; paragraphs: Paragraph[] }[],
  opts: { addHeaders: boolean; pageBreaks: boolean },
): Promise<Blob> => {
  const zip = new JSZip();
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  const bodyParts: string[] = [];
  items.forEach((it, idx) => {
    if (opts.addHeaders && it.title) {
      bodyParts.push(
        `<w:p>
          <w:r>
            <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
            <w:t xml:space="preserve">${xmlEscape(it.title)}</w:t>
          </w:r>
        </w:p>`
      );
    }
    bodyParts.push(buildWordBodyFromParagraphs(it.paragraphs));
    if (opts.pageBreaks && idx < items.length - 1) {
      bodyParts.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
    }
  });

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyParts.join('\n')}
  </w:body>
</w:document>`;

  zip.file('word/document.xml', documentXml);
  return zip.generateAsync({ type: 'blob' });
};

const buildZipOfDocx = async (items: { title: string; paragraphs: Paragraph[] }[]): Promise<Blob> => {
  const zip = new JSZip();
  for (const it of items) {
    const inner = new JSZip();
    inner.file(
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
    );
    inner.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
    );
    inner.file(
      'word/document.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${buildWordBodyFromParagraphs(it.paragraphs)}
  </w:body>
</w:document>`
    );
    const blob = await inner.generateAsync({ type: 'blob' });
    zip.file(`${it.title || 'document'}.docx`, blob);
  }
  return zip.generateAsync({ type: 'blob' });
};

/* ==================== Page ==================== */
const RtfToDocxPage: React.FC = () => {
  const { title, description, canonical, breadcrumb } =
    TOOL_SEO_DATA['/tools/rtf-to-docx'] || {
      title: 'RTF/ODT/DOC to DOCX – Fast & Private | FilesNova',
      description:
        'Convert RTF, ODT, and (best-effort) DOC to DOCX. Batch merge or export a ZIP, with basic bold/italic/underline from RTF preserved. 100% client-side.',
      canonical: 'https://filesnova.com/tools/rtf-to-docx',
      breadcrumb: [
        { name: 'Home', url: 'https://filesnova.com/' },
        { name: 'Tools', url: 'https://filesnova.com/tools' },
        { name: 'RTF to DOCX', url: 'https://filesnova.com/tools/rtf-to-docx' },
      ],
    };

  const [files, setFiles] = useState<FileItem[]>([]);
  const [orderMode, setOrderMode] = useState<OrderMode>('manual');
  const [outputMode, setOutputMode] = useState<OutputMode>('merged');
  const [addFileHeaders, setAddFileHeaders] = useState<boolean>(true);
  const [pageBreakBetween, setPageBreakBetween] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preview state
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewIndex, setPreviewIndex] = useState<number | 'merged'>(0);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  const orderedFiles = useMemo(() => {
    if (orderMode === 'manual') return files;
    const copy = [...files];
    if (orderMode === 'name') copy.sort((a, b) => a.file.name.localeCompare(b.file.name));
    if (orderMode === 'size') copy.sort((a, b) => a.file.size - b.file.size);
    return copy;
  }, [files, orderMode]);

  const moveItem = (id: string, dir: 'up' | 'down') => {
    setFiles(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx === -1) return prev;
      const swapWith = dir === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const clone = [...prev];
      [clone[idx], clone[swapWith]] = [clone[swapWith], clone[idx]];
      return clone;
    });
  };
  const removeItem = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const onFilesSelected = (fs: File[]) => {
    const mapped: FileItem[] = fs
      .filter(f =>
        /\.rtf$/i.test(f.name) || /\.odt$/i.test(f.name) || /\.doc$/i.test(f.name) ||
        f.type.includes('rtf') || f.type.includes('opendocument') || f.type.includes('msword')
      )
      .map(f => ({
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: f,
        status: 'ready',
      }));
    setFiles(prev => [...prev, ...mapped]);
    setDownloadUrl(null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const parseOne = async (fi: FileItem): Promise<ParsedDoc> => {
    const nameBase = fi.file.name.replace(/\.[^/.]+$/, '');
    const ext = (fi.file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'rtf') {
      const raw = await fi.file.text();
      return { title: nameBase, paragraphs: tokenizeMinimalRtf(raw), richHints: true };
    } else if (ext === 'odt') {
      const buf = await fi.file.arrayBuffer();
      return { title: nameBase, paragraphs: await parseOdt(buf) };
    } else if (ext === 'doc') {
      const buf = await fi.file.arrayBuffer();
      return { title: nameBase, paragraphs: await parseDocBinary(buf) };
    } else {
      // fallback: plain text
      const txt = await fi.file.text();
      const paras = txt.split(/\r?\n/).map(line => [{ text: line }]);
      return { title: nameBase, paragraphs: paras };
    }
  };

  const convert = async () => {
    if (orderedFiles.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setDownloadUrl(null);
    setError(null);

    try {
      const parsed: ParsedDoc[] = [];
      for (let i = 0; i < orderedFiles.length; i++) {
        const item = orderedFiles[i];
        const pd = await parseOne(item);
        parsed.push(pd);
        setFiles(prev => prev.map(f => (f.id === item.id ? { ...f, status: 'completed' } : f)));
        setProgress(Math.round(((i + 1) / orderedFiles.length) * 70));
        if (i % 3 === 0) await new Promise(res => setTimeout(res, 0));
      }

      let blob: Blob;
      if (outputMode === 'merged') {
        blob = await buildSingleDocxBlob(
          parsed.map(p => ({ title: p.title, paragraphs: p.paragraphs })),
          { addHeaders: addFileHeaders, pageBreaks: pageBreakBetween }
        );
      } else {
        blob = await buildZipOfDocx(parsed.map(p => ({ title: p.title, paragraphs: p.paragraphs })));
      }

      setProgress(100);
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to convert files.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------- Preview ----------
  const renderParagraphsToHtml = (paragraphs: Paragraph[]) => {
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html: string[] = [];
    for (const para of paragraphs) {
      const spans = para
        .map((sp) => {
          const t = esc(sp.text).replace(/\n/g, '<br/>');
          let open = '', close = '';
          if (sp.bold) { open += '<strong>'; close = '</strong>' + close; }
          if (sp.italic) { open += '<em>'; close = '</em>' + close; }
          if (sp.underline) { open += '<u>'; close = '</u>' + close; }
          return `${open}${t}${close}`;
        })
        .join('');
      html.push(`<p class="mb-2">${spans || '&nbsp;'}</p>`);
    }
    return html.join('');
  };

  const openPreview = async (which: number | 'merged') => {
    setPreviewIndex(which);
    setPreviewOpen(true);
    try {
      if (which === 'merged') {
        // parse all
        const parsedAll: ParsedDoc[] = [];
        for (const f of orderedFiles) parsedAll.push(await parseOne(f));
        const htmlParts: string[] = [];
        parsedAll.forEach((doc, idx) => {
          htmlParts.push(
            `<h3 class="text-lg font-semibold mb-2">${doc.title}</h3>`,
            renderParagraphsToHtml(doc.paragraphs),
            idx < parsedAll.length - 1 ? '<hr class="my-4"/>' : ''
          );
        });
        setPreviewHtml(htmlParts.join(''));
      } else {
        const f = orderedFiles[which];
        const parsed = await parseOne(f);
        setPreviewHtml(
          `<h3 class="text-lg font-semibold mb-2">${parsed.title}</h3>` +
          renderParagraphsToHtml(parsed.paragraphs)
        );
      }
    } catch {
      setPreviewHtml('<p class="text-red-600">Failed to render preview.</p>');
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewHtml('');
  };

  return (
    <>
      {/* SEO */}
      <ToolSeo title={title} description={description} canonical={canonical} breadcrumb={breadcrumb} />
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      {/* WebApplication JSON-LD */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'RTF/ODT/DOC to DOCX – Files Nova',
          url: canonical,
          applicationCategory: 'FileConverter',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />
      {/* Breadcrumb JSON-LD */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: (breadcrumb || []).map((b: any, idx: number) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: b.name,
            item: b.url,
          })),
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Background Pulses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no back arrow; animated Tools on right) */}
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
                <p className="text-xs text-gray-500 font-medium">RTF/ODT/DOC to DOCX</p>
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
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">RTF/ODT/DOC to DOCX</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert &amp; merge documents entirely in your browser. RTF keeps basic <strong>bold</strong>, <em>italic</em> and <u>underline</u>.
                ODT/DOC are parsed best-effort for fast, private conversion.
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

          {/* Uploader + Options */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload Files (RTF, ODT, DOC)</h3>
            <UploadZone
              accept=".rtf,.odt,.doc,application/rtf,text/rtf,application/vnd.oasis.opendocument.text,application/msword"
              multiple={true}
              title="Drop your RTF/ODT/DOC files here"
              buttonLabel="Choose Files"
              supportedFormats="RTF, ODT, DOC"
              onFilesSelected={onFilesSelected}
            />

            {/* Quick options */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
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
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700 whitespace-nowrap">Output</label>
                <select
                  value={outputMode}
                  onChange={(e) => setOutputMode(e.target.value as OutputMode)}
                  className="p-2 border border-gray-300 rounded-lg bg-white w-full sm:w-56 max-w-full"
                >
                  <option value="merged">Single merged DOCX</option>
                  <option value="splitzip">One DOCX per file (ZIP)</option>
                </select>
              </div>

              {outputMode === 'merged' && (
                <>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={addFileHeaders}
                      onChange={(e) => setAddFileHeaders(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Add file title headers</span>
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={pageBreakBetween}
                      onChange={(e) => setPageBreakBetween(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Page break between files</span>
                  </label>
                </>
              )}
            </div>

            {/* Selected files */}
            {orderedFiles.length > 0 && (
              <>
                <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  Selected Files ({orderedFiles.length})
                </h3>
                <div className="space-y-4">
                  {orderedFiles.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(item.file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {orderMode === 'manual' && (
                          <>
                            <button
                              onClick={() => moveItem(item.id, 'up')}
                              disabled={idx === 0}
                              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40"
                              title="Move up"
                            >
                              <MoveUpRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveItem(item.id, 'down')}
                              disabled={idx === orderedFiles.length - 1}
                              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40"
                              title="Move down"
                            >
                              <MoveDownRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openPreview(idx)}
                          className="p-2 rounded-lg hover:bg-blue-100"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        {item.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <XIcon className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick merged preview button */}
                <div className="mt-4">
                  <button
                    onClick={() => openPreview('merged')}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-white/70 border hover:bg-white transition"
                  >
                    <Eye className="w-4 h-4 mr-2" /> Preview merged
                  </button>
                </div>
              </>
            )}

            {/* Convert */}
            <button
              onClick={convert}
              disabled={orderedFiles.length === 0 || isProcessing}
              className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing
                ? outputMode === 'merged'
                  ? 'Merging…'
                  : 'Generating ZIP…'
                : outputMode === 'merged'
                ? 'Merge & Convert to DOCX'
                : 'Convert to ZIP of DOCX'}
            </button>

            {/* Progress */}
            {isProcessing && (
              <div className="mt-4 w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}

            {error && <p className="text-red-600 mt-4">{error}</p>}

            {/* Accuracy note */}
            <p className="mt-4 text-xs text-gray-500">
              Note: RTF preserves basic styles. ODT and legacy DOC are parsed best-effort for speed & privacy; complex layouts, images,
              and advanced formatting may not be preserved.
            </p>
          </div>

          {/* Download */}
          {downloadUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
              <a
                href={downloadUrl}
                download={outputMode === 'merged' ? 'documents-merged.docx' : 'documents-docx.zip'}
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download {outputMode === 'merged' ? 'DOCX' : 'ZIP'}
              </a>
            </div>
          )}

          {/* Inline Preview Drawer */}
          {previewOpen && (
            <div className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">
                    Preview {previewIndex === 'merged' ? '(Merged)' : orderedFiles[previewIndex]?.file.name}
                  </span>
                </div>
                <button
                  onClick={closePreview}
                  className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 inline-flex items-center"
                >
                  <EyeOff className="w-4 h-4 mr-1" /> Close
                </button>
              </div>
              <div
                className="prose max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}

          <AdSpace />
        </div>
      </div>
    </>
  );
};

export default RtfToDocxPage;
