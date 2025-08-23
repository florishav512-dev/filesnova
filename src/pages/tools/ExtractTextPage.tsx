// src/pages/tools/ExtractTextPage.tsx

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
// import { Link } from 'react-router-dom'; // ← not needed after removing back arrow
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import {
  Sparkles,
  FileText,
  Shield,
  Zap,
  Star,
  Clipboard as ClipboardIcon,
  Download as DownloadIcon,
} from 'lucide-react';

// ✅ SEO component + data
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';

// ✅ Animated Tools dropdown
import ToolsMenu from '../../components/ToolsMenu';

const ExtractTextPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [text, setText] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  // ✅ Pick SEO config for this tool
  const seo = TOOL_SEO_DATA['/tools/extract-text'];

  const handleFiles = (files: File[]) => {
    setFile(files[0] || null);
    setText('');
    setDownloadUrl('');
    setError('');
  };

  const extractText = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError('');
    setText('');
    setDownloadUrl('');

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('language', 'eng');
      form.append('isOverlayRequired', 'false');
      form.append('apikey', 'helloworld'); // Replace with actual API key
      form.append('OCREngine', '2');

      const res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: form,
      });

      const json = await res.json();
      const parsed = json?.ParsedResults?.[0]?.ParsedText || '';
      setText(parsed);

      const blob = new Blob([parsed], { type: 'text/plain' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
      setError('Extraction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* ✅ Injects Breadcrumb + WebPage + SoftwareApplication + meta */}
      <ToolSeo {...seo} />

      <Helmet>
        <title>Extract Text from PDFs & Images – Free OCR Converter | FilesNova</title>
        <meta
          name="description"
          content="Instantly extract text from PDF documents and images with advanced OCR. 100% free, no signup, no watermarks—fast, accurate, and secure online tool by FilesNova."
        />
        <link rel="canonical" href="https://filesnova.com/tools/extract-text" />
      </Helmet>

      {/* Keep your existing WebApplication schema */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Extract Text – Files Nova",
        "url": "https://filesnova.com/tools/extract-text",
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
          { "@type": "ListItem", "position": 2, "name": "Extract Text", "item": "https://filesnova.com/tools/extract-text" }
        ]
      }} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Background Pulses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (back arrow removed, Tools on right) */}
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
                <p className="text-xs text-gray-500 font-medium">Extract Text</p>
              </div>

              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Extract Text</h2>
              <p className="text-gray-700 text-lg leading-relaxed">Convert your PDF into editable text instantly.</p>
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

          {/* Upload & Extract */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload PDF File</h3>
            <UploadZone
              accept="application/pdf"
              multiple={false}
              title="Drop your PDF here"
              buttonLabel="Choose File"
              supportedFormats="PDF"
              onFilesSelected={handleFiles}
            />
            <button
              onClick={extractText}
              disabled={!file || isProcessing}
              className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing…' : 'Extract Text'}
            </button>
            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

          {/* Output Section */}
          {text && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Text Output</h3>
              <textarea
                readOnly
                value={text}
                className="w-full h-48 p-4 border border-gray-300 rounded-lg mb-4 text-sm"
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigator.clipboard.writeText(text)}
                  className="flex-1 flex items-center justify-center py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition"
                >
                  <ClipboardIcon className="w-5 h-5 mr-2" />
                  Copy to Clipboard
                </button>
                <a
                  href={downloadUrl}
                  download="extracted-text.txt"
                  className="flex-1 flex items-center justify-center py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Download .txt
                </a>
              </div>
            </div>
          )}

          <AdSpace />
        </div>
      </div>
    </>
  );
};

export default ExtractTextPage;
