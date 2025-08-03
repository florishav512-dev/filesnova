import React, { useState } from 'react';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import {
  ArrowLeft,
  Sparkles,
  TextCursor,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  Clipboard as ClipboardIcon,
} from 'lucide-react';

/**
 * ExtractTextPage pulls plain text out of PDF files by scanning for text
 * literals inside the file content. This is a simple heuristic and may not
 * work for all PDFs but performs reasonably well on many documents. No
 * external libraries are used, keeping the tool lightweight.
 */
const ExtractTextPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [text, setText] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setText('');
    setDownloadUrl(null);
    setError(null);
  };

  const extract = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const uint8 = new Uint8Array(buf);
      let data = '';
      for (let i = 0; i < uint8.length; i++) {
        data += String.fromCharCode(uint8[i]);
      }
      const matches = data.match(/\([^()]*\)/g) || [];
      const pieces: string[] = [];
      matches.forEach((m) => {
        const inner = m.slice(1, -1);
        if (/^[\x00-\x1F]*$/.test(inner)) return;
        pieces.push(inner);
      });
      const extracted = pieces.join(' ');
      setText(extracted);
      const blob = new Blob([extracted], { type: 'text/plain' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      console.error(err);
      setError('Failed to extract text.');
    }
    setIsProcessing(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error(err);
    }
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
              <p className="text-xs text-gray-500 font-medium">Extract Text</p>
            </div>
          </div>
        </div>
      </header>
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <TextCursor className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Extract Text</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Retrieve plain text from your PDF documents.
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
              setText('');
              setDownloadUrl(null);
              setError(null);
            }}
          />
          <button
            onClick={extract}
            disabled={!file || isProcessing}
            className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Extract Text
          </button>
          {isProcessing && <p className="mt-4 text-center">Processing...</p>}
          {error && <p className="text-red-600 mt-4">{error}</p>}
        </div>
        {text && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">2. Text Output</h3>
            <textarea
              className="w-full h-48 p-3 border border-gray-300 rounded-lg mb-4"
              readOnly
              value={text}
            ></textarea>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={copyToClipboard}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
              >
                <ClipboardIcon className="w-5 h-5 mr-2" /> Copy to Clipboard
              </button>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={file?.name.replace(/\.pdf$/i, '.txt') || 'extracted.txt'}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" /> Download .txt
                </a>
              )}
            </div>
          </div>
        )}
        {/* Ad space below the conversion area */}
        <AdSpace />
      </div>
    </div>
  );
};

export default ExtractTextPage;