import React, { useState } from 'react';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';

/**
 * TextToPdfPage allows users to enter text or paste content and convert it into a PDF file.
 * The page uses the new conversion layout with gradient header, badges and progress indicators.
 */
const TextToPdfPage: React.FC = () => {
  const [text, setText] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    if (!text.trim()) return;
    setIsConverting(true);
    const doc = await PDFDocument.create();
    let page = doc.addPage();
    const { width, height } = page.getSize();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    let y = height - 50;
    text.split('\n').forEach((line) => {
      if (y < 50) {
        page = doc.addPage();
        y = height - 50;
      }
      page.drawText(line, { x: 50, y, size: fontSize, font, color: [0, 0, 0] });
      y -= fontSize + 4;
    });
    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    setIsConverting(false);
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
              <p className="text-xs text-gray-500 font-medium">Text to PDF Converter</p>
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Text to PDF Converter</h2>
            <p className="text-gray-700 text-lg leading-relaxed">Enter or paste text to create a high-quality PDF document</p>
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
        {/* Text Input & Convert */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Enter Text</h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            rows={10}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl focus:border-blue-500 outline-none bg-white/60 backdrop-blur-sm"
          />
          <div className="mt-6">
            {isConverting ? (
              <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            ) : (
              <button
                onClick={handleConvert}
                disabled={!text.trim()}
                className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Convert to PDF
              </button>
            )}
            {pdfUrl && !isConverting && (
              <a
                href={pdfUrl}
                download="text.pdf"
                className="mt-4 inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download PDF
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToPdfPage;