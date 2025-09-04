// src/pages/tools/CreateZipPage.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import JSZip from 'jszip';
import {
  Sparkles,
  Archive,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  File as FileIcon,
  Folder as FolderIcon,
} from 'lucide-react';

// ✅ animated Tools menu button (already in your app)
import ToolsMenu from '../../components/ToolsMenu';

// ✅ Safe SEO resolver
import { getToolSeoByPath } from '../../components/seo/toolSeoData';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

type CompressionLevel = 'store' | 'fast' | 'balanced' | 'max';

const CreateZipPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // options
  const [preservePaths, setPreservePaths] = useState(true);
  const [compression, setCompression] = useState<CompressionLevel>('balanced');

  // centralized SEO
  const seo = getToolSeoByPath('/tools/create-zip');

  // cleanup URL + cancel guard
  const lastUrlRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = null;
      }
    };
  }, []);

  // Timestamped output name
  const archiveName = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const y = now.getFullYear();
    const m = pad(now.getMonth() + 1);
    const d = pad(now.getDate());
    const hh = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    return `filesnova-zip-${y}-${m}-${d}_${hh}-${mm}-${ss}.zip`;
  }, [files.length, isProcessing]);

  // handle files
  const handleFilesSelected = (selected: File[]) => {
    setFiles(selected);
    setDownloadUrl(null);
    setError(null);
    setProgress(0);
  };

  // heuristics: already-compressed file?
  const isAlreadyCompressed = (name: string, type: string) => {
    const ext = name.toLowerCase().split('.').pop() || '';
    const set = new Set([
      'jpg','jpeg','png','webp','gif','avif',
      'mp4','mkv','mov','avi','webm',
      'mp3','aac','m4a','ogg','flac','wav',
      'pdf','zip','rar','7z','gz','bz2','xz','zst','lz','lz4','tgz','tbz','txz',
      'apk','ipa','dmg',
      'docx','xlsx','pptx','odt','ods','odp',
      'otf','ttf','woff','woff2','exe','dll','so','bin','iso','heic','heif','tiff'
    ]);
    if (set.has(ext)) return true;
    if (type.startsWith('image/') || type.startsWith('audio/') || type.startsWith('video/')) return true;
    return false;
  };

  // normalized path (preserve subfolders if available)
  const normalizedRelPath = (f: File) => {
    const rel = (f as any).webkitRelativePath as string | undefined;
    const raw = (rel && rel.length > 0 && preservePaths) ? rel : f.name;
    return raw.replace(/^\.\/+/, '').replace(/\\/g, '/');
  };

  const createZip = async () => {
    if (files.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const zip = new JSZip();
      zip.comment = 'Created with Files Nova — privacy-first, in-browser ZIP';

      const levelMap: Record<CompressionLevel, number> = {
        store: 0,
        fast: 1,
        balanced: 6,
        max: 9,
      };

      // stage files
      for (const f of files) {
        const relPath = normalizedRelPath(f);
        const alreadyCompressed = isAlreadyCompressed(f.name, f.type);

        zip.file(relPath, f, {
          date: new Date(f.lastModified || Date.now()),
          compression: alreadyCompressed || compression === 'store' ? 'STORE' : 'DEFLATE',
          compressionOptions: alreadyCompressed ? undefined : { level: levelMap[compression] },
        });

        await new Promise((r) => setTimeout(r)); // yield
        if (cancelledRef.current) return;
      }

      // generate with progress
      const blob = await zip.generateAsync(
        { type: 'blob', streamFiles: true },
        (meta) => !cancelledRef.current && setProgress(Math.round(meta.percent))
      );

      if (cancelledRef.current) return;

      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = null;
      }
      const url = URL.createObjectURL(blob);
      lastUrlRef.current = url;
      setDownloadUrl(url);
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.message ||
        (err?.name === 'QuotaExceededError'
          ? 'Not enough memory to create ZIP in-browser.'
          : 'Failed to create ZIP.');
      setError(msg);
    } finally {
      if (!cancelledRef.current) setIsProcessing(false);
    }
  };

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={seo.canonical} />
        <meta property="og:image" content="https://filesnova.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Structured data */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Create ZIP – Files Nova",
        "url": "https://filesnova.com/tools/create-zip",
        "applicationCategory": "FileConverter",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://filesnova.com/" },
          { "@type": "ListItem", "position": 2, "name": "Create ZIP", "item": "https://filesnova.com/tools/create-zip" }
        ]
      }} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Animated BG */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* ✅ YOUR ORIGINAL HEADER (unchanged) */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-">
              <div className="relative shrink-0">
                <img
                  src={FileNovaIcon}
                  alt="Files Nova"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  draggable={false}
                  loading="lazy"
                  width="96"
                  height="96"
                />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Files Nova
                </h1>
                <p className="text-xs text-gray-500 font-medium">Create ZIP</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>
        {/* Main */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <Archive className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Create ZIP</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Bundle multiple files or folders into a single ZIP archive.
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

          {/* Uploader + Options */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload Files or Folders</h3>
            <UploadZone
              multiple
              directory
              accept=""
              onFilesSelected={handleFilesSelected}
              supportedFormats="All file types"
            />

            {files.length > 0 && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preservePaths}
                    onChange={(e) => setPreservePaths(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">Preserve folder paths</span>
                </label>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Compression level</label>
                  <select
                    value={compression}
                    onChange={(e) => setCompression(e.target.value as CompressionLevel)}
                    className="p-2 border border-gray-300 rounded-lg bg-white w-full"
                  >
                    <option value="store">Store (no compression)</option>
                    <option value="fast">Fast</option>
                    <option value="balanced">Balanced (default)</option>
                    <option value="max">Maximum</option>
                  </select>
                </div>
              </div>
            )}

            {/* File list preview */}
            {files.length > 0 && (
              <ul className="mt-6 max-h-40 overflow-y-auto text-sm text-gray-700 border rounded-lg bg-white/60 p-3">
                {files.map((f, i) => {
                  const rel = normalizedRelPath(f);
                  const isFolderish = (f as any).webkitRelativePath && rel.includes('/');
                  return (
                    <li key={i} className="flex items-center gap-2 py-1 border-b last:border-none">
                      {isFolderish ? (
                        <FolderIcon className="w-4 h-4 text-gray-500" />
                      ) : (
                        <FileIcon className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="truncate">{rel}</span>
                      <span className="ml-auto text-xs text-gray-500">{(f.size / 1024).toFixed(1)} KB</span>
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              onClick={createZip}
              disabled={files.length === 0 || isProcessing}
              className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create ZIP
            </button>

            {isProcessing && (
              <div className="mt-4 w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

          {/* Download */}
          {downloadUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
              <a
                href={downloadUrl}
                download={archiveName}
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download ZIP
              </a>
            </div>
          )}

          <AdSpace />
        </div>
      </div>
    </>
  );
};

export default CreateZipPage;
