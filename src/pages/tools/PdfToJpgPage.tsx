import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import {
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';

/**
 * PdfToJpgPage provides a very basic conversion of PDF pages into images by
 * extracting plain text from each page and rendering it on a canvas. This
 * approach does not preserve original layout or fonts but gives you a
 * quick way to visualise the contents offline. Images are packaged into a
 * ZIP archive for download.
 */
const PdfToJpgPage: React.FC = () => {
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

  // extract text from pdf bytes using regex
  const extractTextFromPdfBytes = (bytes: Uint8Array): string => {
    let data = '';
    for (let i = 0; i < bytes.length; i++) {
      data += String.fromCharCode(bytes[i]);
    }
    const matches = data.match(/\([^()]*\)/g) || [];
    const pieces: string[] = [];
    matches.forEach((m) => {
      const inner = m.slice(1, -1);
      if (/^[\x00-\x1F]*$/.test(inner)) return;
      pieces.push(inner);
    });
    return pieces.join(' ');
  };

  const convert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buf);
      const pageCount = pdfDoc.getPageCount();
      const zip = new JSZip();
      for (let i = 0; i < pageCount; i++) {
        const newDoc = await PDFDocument.create();
        const [copied] = await newDoc.copyPages(pdfDoc, [i]);
        newDoc.addPage(copied);
        const pageBytes = await newDoc.save();
        const text = extractTextFromPdfBytes(new Uint8Array(pageBytes));
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#000000';
          ctx.font = '14px sans-serif';
          const words = text.split(/\s+/);
          let x = 20;
          let y = 30;
          const maxWidth = canvas.width - 40;
          const lineHeight = 20;
          let line = '';
          for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth) {
              ctx.fillText(line, x, y);
              line = word + ' ';
              y += lineHeight;
              if (y > canvas.height - 40) break;
            } else {
              line = testLine;
            }
          }
          if (y <= canvas.height - 40) {
            ctx.fillText(line, x, y);
          }
        }
        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', 0.9),
        );
        if (blob) {
          zip.file(`page-${i + 1}.jpg`, blob);
        }
        setProgress(Math.round(((i + 1) / pageCount) * 100));
        await new Promise((res) => setTimeout(res, 0));
      }
      const resultBlob = await zip.generateAsync({ type: 'blob' });
      setDownloadUrl(URL.createObjectURL(resultBlob));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to convert PDF.');
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
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
              <p className="text-xs text-gray-500 font-medium">PDF to JPG</p>
            </div>
          </div>
        </div>
      </header>
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">PDF to JPG</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Create simple images from each page of your PDF.
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
          <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload PDF File</h3>
          <UploadZone
            accept="application/pdf"
            multiple={false}
            title="Drop your PDF here"
            buttonLabel="Choose File"
            supportedFormats="PDF"
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
            Convert to Images
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
              download="images.zip"
              className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
            >
              <DownloadIcon className="w-5 h-5 mr-2" /> Download ZIP
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfToJpgPage;