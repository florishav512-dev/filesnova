import React, { useState } from 'react';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
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
 * ExtractImagesPage extracts image files from a ZIP archive. It filters for
 * common image extensions (png, jpg, jpeg, gif, webp, svg) and allows users
 * to download the images individually or as a combined ZIP archive.
 */
const ExtractImagesPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setImages([]);
    setError(null);
  };

  const extract = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buf);
      const entries = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
      const imgExt = /\.(png|jpe?g|gif|webp|svg)$/i;
      const imgs: { name: string; url: string }[] = [];
      let processed = 0;
      const total = entries.length;
      for (const name of entries) {
        processed++;
        setProgress(Math.round((processed / total) * 100));
        if (!imgExt.test(name)) continue;
        const blob = await zip.files[name].async('blob');
        const url = URL.createObjectURL(blob);
        imgs.push({ name, url });
        await new Promise((res) => setTimeout(res, 0));
      }
      setImages(imgs);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to extract images');
    }
    setIsProcessing(false);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    for (const img of images) {
      const resp = await fetch(img.url);
      const blob = await resp.blob();
      zip.file(img.name.split('/').pop() || img.name, blob);
    }
    const out = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(out);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images.zip';
    a.click();
    URL.revokeObjectURL(url);
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
              <p className="text-xs text-gray-500 font-medium">Extract Images</p>
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
            <h2 className="text-3xl font-black text-gray-900 mb-2">Extract Images</h2>
            <p className="text-gray-700 text-lg leading-relaxed">Pull out all images from a ZIP archive.</p>
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
          <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload ZIP File</h3>
          <UploadZone
            accept="application/zip,application/x-zip-compressed"
            multiple={false}
            title="Drop your ZIP file here"
            buttonLabel="Choose File"
            supportedFormats="ZIP"
            onFilesSelected={(fs) => {
              const f = fs[0] || null;
              setFile(f);
              setImages([]);
              setError(null);
            }}
          />
          <button
            onClick={extract}
            disabled={!file || isProcessing}
            className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Extract Images
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
        {images.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">2. Extracted Images</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {images.map((img) => (
                <li key={img.url} className="flex justify-between items-center bg-white/60 backdrop-blur-sm p-2 rounded-lg">
                  <span className="text-sm break-all">{img.name}</span>
                  <a
                    href={img.url}
                    download={img.name.split('/').pop() || img.name}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
            <button
              onClick={downloadAll}
              className="mt-6 w-full px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
            >
              Download All as ZIP
            </button>
          </div>
        )}
        {/* Ad space below the conversion area */}
        <AdSpace />
      </div>
    </div>
  );
};

export default ExtractImagesPage;