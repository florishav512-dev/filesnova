// src/pages/tools/TextToPdfPage.tsx

import React, { useState } from 'react';
import { ArrowLeft, FileText, Shield, Zap, Star, Download as DownloadIcon } from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const TextToPdfPage: React.FC = () => {
  const [text, setText] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    const cleaned = text.trim();
    if (!cleaned) return;

    setIsConverting(true);
    setPdfUrl(null);

    try {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const lineHeight = fontSize + 4;
      const margin = 50;
      const maxWidth = 500; // Adjust max text width per line

      let page = doc.addPage();
      const { width, height } = page.getSize();
      let y = height - margin;

      const words = cleaned.split(/\s+/);
      let line = '';

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth) {
          if (y < margin) {
            page = doc.addPage();
            y = height - margin;
          }
          page.drawText(line.trim(), { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
          y -= lineHeight;
          line = words[i] + ' ';
        } else {
          line = testLine;
        }
      }

      if (line.trim()) {
        if (y < margin) {
          page = doc.addPage();
          y = height - margin;
        }
        page.drawText(line.trim(), { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
      }

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('Failed to convert text to PDF', err);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex items-center mb-6">
          <a href="/" className="p-2 hover:bg-gray-200 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </a>
          <h1 className="ml-4 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-pink-600">
            Files Nova
          </h1>
        </header>

        {/* Info Card (like Extract Text style) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-8 shadow-lg flex items-center">
          <div className="p-4 bg-blue-100 rounded-xl mr-6">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">Text to PDF Converter</h2>
            <p className="text-gray-600 mb-4">Enter or paste text to create a high-quality PDF document</p>
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm text-sm">
                <Shield className="w-4 h-4 text-green-600 mr-2" />
                100% Secure
              </span>
              <span className="flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm text-sm">
                <Zap className="w-4 h-4 text-yellow-500 mr-2" />
                Lightning Fast
              </span>
              <span className="flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm text-sm">
                <Star className="w-4 h-4 text-purple-600 mr-2" />
                Premium Quality
              </span>
            </div>
          </div>
        </div>

        {/* Text Input + Convert */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-8 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">1. Enter Text</h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            rows={10}
            className="w-full p-4 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={handleConvert}
            disabled={isConverting}
            className="mt-6 w-full py-3 bg-gradient-to-r from-blue-600 to-pink-600 text-white font-bold rounded-2xl hover:shadow-xl transition disabled:opacity-50"
          >
            {isConverting ? 'Converting…' : 'Convert to PDF'}
          </button>
        </div>

        {/* Download Button */}
        {pdfUrl && !isConverting && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-8 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">2. Download PDF</h3>
            <a
              href={pdfUrl}
              download="converted-text.pdf"
              className="w-full inline-flex items-center justify-center py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition"
            >
              <DownloadIcon className="w-5 h-5 mr-2" />
              Download PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextToPdfPage;
