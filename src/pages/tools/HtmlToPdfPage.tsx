import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import {
  ArrowLeft,
  Sparkles,
  Code,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';

/**
 * HtmlToPdfPage converts HTML files into a plain text PDF. It strips HTML tags and
 * renders the remaining text into a multi‑page PDF using pdf-lib.
 */
const HtmlToPdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  // allow typing raw HTML directly
  const [htmlText, setHtmlText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);


  const htmlToText = (html: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return (
        doc.body?.textContent || doc.documentElement?.textContent || ''
      ).trim();
    } catch (e) {
      return html;
    }
  };

  const convertToPdf = async () => {
    // Determine whether to use typed HTML or uploaded file
    if (!htmlText.trim() && !file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      let rawHtml = htmlText.trim();
      if (!rawHtml && file) {
        rawHtml = await file.text();
      }
      const text = htmlToText(rawHtml);
      const lines: string[] = [];
      text.split(/\r?\n/).forEach((ln) => {
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
      const totalLines = lines.length;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (y < margin) {
          page = pdfDoc.addPage();
          y = height - margin;
        }
        page.drawText(line, { x: margin, y: y - lineHeight, size: 12, font });
        y -= lineHeight;
        setProgress(Math.round(((i + 1) / totalLines) * 100));
        // Yield occasionally to keep UI responsive
        if (i % 50 === 0) {
          await new Promise((res) => setTimeout(res, 0));
        }
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      console.error(err);
      setError('Failed to convert file.');
    }
    setIsProcessing(false);
  };

  return (
    <>
      <Helmet>
        <title>HTML to PDF – Convert Webpages to PDF | FilesNova</title>
        <meta
          name="description"
          content="Convert HTML documents or code into clean PDF files instantly. Free, fast, and secure HTML-to-PDF converter by FilesNova. No ads or watermarks."
        />
        <link rel="canonical" href="https://filesnova.com/tools/html-to-pdf" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20 space-x-4">
            <a href="/" className="p-3 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </a>
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
              <p className="text-xs text-gray-500 font-medium">HTML to PDF</p>
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
          <button
            onClick={convertToPdf}
            disabled={(!htmlText.trim() && !file) || isProcessing}
            className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Convert to PDF
          </button>
          {isProcessing && (
            <div className="mt-4">
              <p className="text-center">Processing... {progress}%</p>
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