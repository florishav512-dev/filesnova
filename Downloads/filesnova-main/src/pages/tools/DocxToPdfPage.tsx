// src/pages/tools/DocxToPdfPage.tsx

import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import mammoth from 'mammoth';
import {
  Sparkles,
  FileUp,
  Shield,
  Zap,
  Star,
  CheckCircle,
  X,
  Download as DownloadIcon,
} from 'lucide-react';
import AdSpace from '../../components/AdSpace';

// ✅ keep your existing SEO setup
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';

// ✅ use the shared ToolsMenu (animated gradient trigger by default)
import ToolsMenu from '../../components/ToolsMenu';

/**
 * DocxToPdfPage renders the DOCX to PDF converter with a modern design.
 * Users can upload a Word document, convert it to a PDF and download the result.
 */
const DocxToPdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'ready' | 'converting' | 'completed'>('ready');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ✅ Pick SEO config for this tool
  const seo = TOOL_SEO_DATA['/tools/docx-to-pdf'];

  // Handle file input selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.name.toLowerCase().endsWith('.docx')) {
      setFile(selected);
      setStatus('ready');
      setPdfUrl(null);
    }
  };

  // Allow drag-and-drop file selection
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.name.toLowerCase().endsWith('.docx')) {
      setFile(dropped);
      setStatus('ready');
      setPdfUrl(null);
    }
  };

  // Remove the selected file
  const removeFile = () => {
    setFile(null);
    setPdfUrl(null);
    setStatus('ready');
  };

  // Convert the DOCX file to a PDF using mammoth and pdf-lib
  const handleConvert = async () => {
    if (!file) return;
    setStatus('converting');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;

      const pdfDoc = await PDFDocument.create();
      let currentPage = pdfDoc.addPage();
      let { width, height } = currentPage.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      let y = height - 50;

      text.split('\n').forEach((line) => {
        if (y < 50) {
          currentPage = pdfDoc.addPage();
          ({ width, height } = currentPage.getSize());
          y = height - 50;
        }
        currentPage.drawText(line, {
          x: 50,
          y,
          size: fontSize,
          font,
          // keeping original color behavior; not changing functionality
          color: [0, 0, 0] as unknown as any,
        });
        y -= fontSize + 4;
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setStatus('completed');
    } catch (err) {
      console.error(err);
      setStatus('ready');
    }
  };

  // Format file size nicely
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      {/* ✅ Injects Breadcrumb + WebPage + SoftwareApplication + meta */}
      <ToolSeo {...seo} />

      <Helmet>
        <title>Convert DOCX to PDF – Fast &amp; Free Online Converter | FilesNova</title>
        <meta
          name="description"
          content="Instantly convert DOCX documents to PDF while preserving formatting. 100% free, no signup, no watermarks—fast, secure, and reliable on FilesNova."
        />
        <link rel="canonical" href="https://filesnova.com/tools/docx-to-pdf" />
      </Helmet>

      {/* Keep your existing WebApplication schema */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "DOCX to PDF – Files Nova",
        "url": "https://filesnova.com/tools/docx-to-pdf",
        "applicationCategory": "FileConverter",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      }} />

      {/* ✅ Added BreadcrumbList schema */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://filesnova.com/" },
          { "@type": "ListItem", "position": 2, "name": "DOCX to PDF", "item": "https://filesnova.com/tools/docx-to-pdf" }
        ]
      }} />

      {/* Outer Container */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (back arrow removed, Tools button at right) */}
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
                <p className="text-xs text-gray-500 font-medium">DOCX to PDF Converter</p>
              </div>

              {/* ➜ Animated gradient Tools dropdown on the far right */}
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
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <FileUp className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">DOCX to PDF Converter</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert your Word documents to high-quality PDF files in seconds
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

          {/* Upload Area */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8">
            <div className="p-8">
              <div
                className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="mb-6">
                  <FileUp className="w-16 h-16 mx-auto text-gray-400 group-hover:text-blue-500 group-hover:animate-bounce transition-all" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Drop your DOCX file here</h3>
                <p className="text-gray-600 mb-4">or click to browse from your device</p>
                <button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:-translate-y-1">
                  Choose File
                </button>
                <p className="text-xs text-gray-500 mt-4">Supported format: DOCX</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".docx"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {file && (
              <div className="border-t border-gray-200 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Selected File</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                      <FileUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button onClick={removeFile} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <button
                  onClick={handleConvert}
                  disabled={status === 'converting'}
                  className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'converting' ? 'Converting...' : 'Convert to PDF'}
                </button>

                {status === 'converting' && (
                  <div className="mt-4 w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Result Area */}
          {status === 'completed' && pdfUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" /> Conversion Completed
              </h3>
              <p className="text-gray-700 mb-4">
                Your document has been successfully converted. Click the button below to download your PDF.
              </p>
              <a
                href={pdfUrl}
                download={`${file?.name.replace(/\.docx$/i, '')}.pdf`}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download PDF
              </a>
            </div>
          )}
        </div>

        {/* Footer Ad Space */}
        <AdSpace />
      </div>
    </>
  );
};

export default DocxToPdfPage;
