import React, { useState } from 'react';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import {
  ArrowLeft,
  Sparkles,
  Box,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';

/**
 * TarToZipPage converts TAR archives to ZIP format directly in the browser.
 * It implements a lightweight TAR parser that reads 512‑byte headers and
 * extracts file data based on octal size fields. Only regular files are
 * supported; directories are ignored. All operations occur client‑side.
 */
const TarToZipPage: React.FC = () => {
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

  const parseTarToZip = async (arrayBuffer: ArrayBuffer) => {
    const zip = new JSZip();
    const view = new Uint8Array(arrayBuffer);
    let offset = 0;
    const totalSize = view.byteLength;
    while (offset + 512 <= totalSize) {
      // read header
      const nameBytes = view.subarray(offset, offset + 100);
      const name = new TextDecoder().decode(nameBytes).replace(/\0.*$/, '').trim();
      if (!name) break; // empty header indicates end of archive
      const sizeBytes = view.subarray(offset + 124, offset + 136);
      const sizeStr = new TextDecoder().decode(sizeBytes).replace(/\0.*$/, '').trim();
      const size = parseInt(sizeStr, 8) || 0;
      const fileDataStart = offset + 512;
      const fileDataEnd = fileDataStart + size;
      if (size > 0) {
        const fileBlob = new Blob([arrayBuffer.slice(fileDataStart, fileDataEnd)]);
        zip.file(name, fileBlob);
      }
      // advance offset to next header (512‑byte aligned)
      const blocks = Math.ceil(size / 512);
      offset = fileDataStart + blocks * 512;
      setProgress(Math.min(99, Math.round((offset / totalSize) * 100)));
      await new Promise((res) => setTimeout(res, 0));
    }
    const outBlob = await zip.generateAsync({ type: 'blob' });
    return outBlob;
  };

  const convert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const outBlob = await parseTarToZip(arrayBuffer);
      setDownloadUrl(URL.createObjectURL(outBlob));
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to convert TAR to ZIP.');
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
              <p className="text-xs text-gray-500 font-medium">TAR to ZIP</p>
            </div>
          </div>
        </div>
      </header>
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <Box className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">TAR to ZIP</h2>
            <p className="text-gray-700 text-lg leading-relaxed">Convert TAR archives into ZIP format quickly and securely.</p>
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
          <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload TAR File</h3>
          <UploadZone
            accept="application/x-tar,application/tar,.tar"
            multiple={false}
            title="Drop your TAR file here"
            buttonLabel="Choose File"
            supportedFormats="TAR"
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
            Convert to ZIP
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
              download={file?.name.replace(/\.tar$/i, '.zip') || 'archive.zip'}
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

export default TarToZipPage;