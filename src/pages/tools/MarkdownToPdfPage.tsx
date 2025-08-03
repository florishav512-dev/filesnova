import React, { useState } from 'react';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import UploadZone from '../../components/UploadZone';
import {
  ArrowLeft,
  Sparkles,
  FileCode,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';

/**
 * MarkdownToPdfPage converts uploaded Markdown files into a single PDF.
 * It follows the same modern design used across Files Nova tools and runs entirely in the browser.
 */
const MarkdownToPdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setDownloadUrl(null);
    setError(null);
  };

  const convertMdToPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const text = await file.text();
      // Split by newline and wrap long lines
      const lines: string[] = [];
      text.split(/\r?\n/).forEach((ln) => {
        // wrap at ~100 chars for better formatting
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
        // update progress
        setProgress(Math.round(((i + 1) / totalLines) * 100));
        await new Promise((res) => setTimeout(res, 0));
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err: any) {
      console.error(err);
      setError('Failed to convert file.');
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20 space-x-4">
            {/* Return arrow */}
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
              <p className="text-xs text-gray-500 font-medium">Markdown to PDF</p>
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
              <FileCode className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Markdown to PDF</h2>
            <p className="text-gray-700 text-lg leading-relaxed">Convert your Markdown files into beautifully formatted PDFs.</p>
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
        {/* Upload & Convert */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload Markdown File</h3>
          <UploadZone
            accept=".md,.markdown,text/markdown"
            multiple={false}
            title="Drop your Markdown file here"
            buttonLabel="Choose File"
            supportedFormats="MD"
            onFilesSelected={(fs) => {
              const f = fs[0] || null;
              setFile(f);
              setDownloadUrl(null);
              setError(null);
            }}
          />
          <button
            onClick={convertMdToPdf}
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
        {/* Download */}
        {downloadUrl && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
            <a
              href={downloadUrl}
              download={file?.name.replace(/\.md$/i, '.pdf') || 'document.pdf'}
              className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
            >
              <DownloadIcon className="w-5 h-5 mr-2" /> Download PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownToPdfPage;