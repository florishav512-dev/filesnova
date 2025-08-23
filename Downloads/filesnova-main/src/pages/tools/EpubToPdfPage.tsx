// src/pages/tools/EpubToPdfPage.tsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import {
  Sparkles,
  BookOpen,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';

// ✅ keep existing SEO wiring as-is
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';

// ✅ use shared animated ToolsMenu (gradient, continuous animation)
import ToolsMenu from '../../components/ToolsMenu';

const EpubToPdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setDownloadUrl(null);
    setError(null);
  };

  const extractTextFromHtml = (html: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return (doc.body?.textContent || doc.documentElement?.textContent || '').trim();
    } catch {
      return html;
    }
  };

  const convert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      const htmlFiles = Object.keys(zip.files).filter((name) => /\.x?html$/i.test(name));
      if (htmlFiles.length === 0) {
        throw new Error('No HTML chapters found in EPUB.');
      }

      const allText: string[] = [];
      for (let i = 0; i < htmlFiles.length; i++) {
        const name = htmlFiles[i];
        const content = await zip.files[name].async('string');
        const text = extractTextFromHtml(content);
        if (text) allText.push(text);
        setProgress(Math.round(((i + 1) / htmlFiles.length) * 50));
        await new Promise((res) => setTimeout(res, 0));
      }

      const combined = allText.join('\n\n');

      // simple line-wrap @ 100 chars to keep pdf-lib simple
      const lines: string[] = [];
      combined.split(/\r?\n/).forEach((ln) => {
        if (ln.length <= 100) {
          lines.push(ln);
        } else {
          let s = ln;
          while (s.length > 100) {
            lines.push(s.slice(0, 100));
            s = s.slice(100);
          }
          if (s.length) lines.push(s);
        }
      });

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const margin = 50;
      let y = height - margin;
      const lineHeight = 14;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (y < margin) {
          page = pdfDoc.addPage();
          y = height - margin;
        }
        page.drawText(line, { x: margin, y: y - lineHeight, size: 12, font });
        y -= lineHeight;
        setProgress(50 + Math.round(((i + 1) / lines.length) * 50));
        await new Promise((res) => setTimeout(res, 0));
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to convert file.');
    }
    setIsProcessing(false);
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
          content="Instantly convert EPUB eBooks to PDF while preserving formatting. 100% free, no signup, no watermarks—fast, secure, and reliable on FilesNova."
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

        {/* Header (arrow removed) */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20">
              {/* left: brand */}
              <div className="flex items-center gap-4">
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
                  <p className="text-xs text-gray-500 font-medium">EPUB to PDF</p>
                </div>
              </div>

              {/* right: Tools button */}
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              {/* ✅ fixed icon tile: consistent gradient + white icon */}
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <BookOpen className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl font-black text-gray-900 mb-2">EPUB to PDF</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert your eBooks into simple PDFs for easy reading anywhere.
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

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload EPUB File</h3>
            <UploadZone
              accept=".epub,application/epub+zip"
              multiple={false}
              title="Drop your EPUB file here"
              buttonLabel="Choose File"
              supportedFormats="EPUB"
              onFilesSelected={(fs) => {
                const f = fs[0] || null;
                setFile(f);
                setDownloadUrl(null);
                setError(null);
              }}
            />
            <button
              onClick={convert}
              disabled={!file || isProcessing}
              className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Convert to PDF
            </button>

            {isProcessing && (
              <div className="mt-4 w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}

            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

          {downloadUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
              <a
                href={downloadUrl}
                download={file?.name.replace(/\.epub$/i, '.pdf') || 'ebook.pdf'}
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download PDF
              </a>
            </div>
          )}

          {/* Ad space */}
          <AdSpace />
        </div>
      </div>
    </>
  );
};

export default EpubToPdfPage;
