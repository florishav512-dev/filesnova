import React, { useState } from 'react';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import {
  ArrowLeft,
  Sparkles,
  Archive,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';
import AdSpace from '../../components/AdSpace';

/**
 * CombineZipsPage merges multiple ZIP archives into a single ZIP. It flattens
 * directory structures and prefixes duplicate file names with the original
 * archive name to avoid collisions. All processing happens on device.
 */
const CombineZipsPage: React.FC = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    setFiles(list && list.length ? list : null);
    setDownloadUrl(null);
    setError(null);
  };

  const combine = async () => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const outZip = new JSZip();
      let totalEntries = 0;
      // pre-count entries to compute progress
      const zipFiles: { name: string; zip: JSZip }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const buf = await f.arrayBuffer();
        const z = await JSZip.loadAsync(buf);
        zipFiles.push({ name: f.name.replace(/\.zip$/i, ''), zip: z });
        totalEntries += Object.keys(z.files).filter((p) => !z.files[p].dir).length;
      }
      let processed = 0;
      for (const { name: prefix, zip } of zipFiles) {
        const entries = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
        for (const entry of entries) {
          const data = await zip.files[entry].async('blob');
          // prefix duplicate names with archive prefix
          const baseName = entry.split('/').pop() || entry;
          const newName = `${prefix}/${baseName}`;
          outZip.file(newName, data);
          processed++;
          setProgress(Math.round((processed / totalEntries) * 100));
          await new Promise((res) => setTimeout(res, 0));
        }
      }
      const outBlob = await outZip.generateAsync({ type: 'blob' });
      setDownloadUrl(URL.createObjectURL(outBlob));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to combine ZIP files.');
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
              <p className="text-xs text-gray-500 font-medium">Combine ZIPs</p>
            </div>
          </div>
        </div>
      </header>
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <Archive className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Combine ZIPs</h2>
            <p className="text-gray-700 text-lg leading-relaxed">Merge multiple ZIP archives into one unified file.</p>
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
          <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload ZIP Files</h3>
          <UploadZone
            accept="application/zip,application/x-zip-compressed"
            multiple={true}
            title="Drop your ZIP files here"
            buttonLabel="Choose Files"
            supportedFormats="ZIP"
            onFilesSelected={(fs) => {
              const dt = new DataTransfer();
              fs.forEach((file) => dt.items.add(file));
              const list = dt.files;
              setFiles(list && list.length ? list : null);
              setDownloadUrl(null);
              setError(null);
            }}
          />
          <button
            onClick={combine}
            disabled={!files || files.length === 0 || isProcessing}
            className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Combine ZIPs
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
              download="combined.zip"
              className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
            >
              <DownloadIcon className="w-5 h-5 mr-2" /> Download ZIP
            </a>
          </div>
        )}
        <AdSpace />
      </div>
    </div>
  );
};

export default CombineZipsPage;