import React, { useState } from 'react';
import pica from 'pica';
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
  Crop,
} from 'lucide-react';

/**
 * ImageResizerPage lets users upload an image, specify width and height, preview the result and download it.
 * The design matches the modern conversion pages with fixed header and gradient backgrounds.
 */
const ImageResizerPage: React.FC = () => {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(300);
  const [height, setHeight] = useState<number>(300);
  const [isResizing, setIsResizing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    // Reset resized image
    setResizedUrl(null);
  };

  const resizeImage = async () => {
    if (!originalUrl) return;
    setIsResizing(true);
    const img = new Image();
    img.src = originalUrl;
    await img.decode();
    const offScreen = document.createElement('canvas');
    offScreen.width = img.width;
    offScreen.height = img.height;
    const offCtx = offScreen.getContext('2d');
    offCtx?.drawImage(img, 0, 0);
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    const p = pica();
    await p.resize(offScreen, out, { width, height });
    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'));
    if (blob) {
      const resUrl = URL.createObjectURL(blob);
      setResizedUrl(resUrl);
    }
    setIsResizing(false);
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
              <p className="text-xs text-gray-500 font-medium">Image Resizer</p>
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
              <Crop className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Image Resizer</h2>
            <p className="text-gray-700 text-lg leading-relaxed">Resize your images to any dimensions and download the result</p>
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
        {/* Upload & Resize section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload Image &amp; Set Size</h3>
          <UploadZone
            accept="image/*"
            multiple={false}
            title="Drop your image here"
            buttonLabel="Choose Image"
            supportedFormats="Image files"
            onFilesSelected={(fs) => {
              const file = fs[0];
              if (!file) return;
              const url = URL.createObjectURL(file);
              setOriginalUrl(url);
              setResizedUrl(null);
            }}
          />
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label htmlFor="resize-width" className="block text-sm font-medium text-gray-700 mb-1">Width</label>
              <input
                id="resize-width"
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="resize-height" className="block text-sm font-medium text-gray-700 mb-1">Height</label>
              <input
                id="resize-height"
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <button
            onClick={resizeImage}
            disabled={!originalUrl || isResizing}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Resize Image
          </button>
        </div>
        {/* Preview & Download */}
        {originalUrl && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">2. Preview</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Original Image</h4>
                <img src={originalUrl} alt="Original" className="max-w-full rounded-xl" />
              </div>
              {resizedUrl && (
                <div>
                  <h4 className="font-semibold mb-2">Resized Image</h4>
                  <img src={resizedUrl} alt="Resized" className="max-w-full rounded-xl" />
                </div>
              )}
            </div>
            {/* Download section */}
            {resizedUrl && (
              <div className="mt-6">
                <a
                  href={resizedUrl}
                  download="resized.png"
                  className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" /> Download Resized Image
                </a>
              </div>
            )}
        {/* Ad space below the conversion area */}
        <AdSpace />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageResizerPage;