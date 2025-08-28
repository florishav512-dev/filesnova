// src/pages/tools/CompressImagesPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import {
  Sparkles,
  Image as CompressIcon,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  X,
  Clock,
  CheckCircle,
  FolderOpen,
  StopCircle,
} from 'lucide-react';
import { getToolSeoByPath } from '../../components/seo/toolSeoData';
import ToolsMenu from '../../components/ToolsMenu'; // animated gradient Tools button

type Item = {
  id: string;
  file: File;
  status: 'ready' | 'completed';
  outSize?: number;
  previewUrl?: string;
};

type OutputFormat = 'auto' | 'image/jpeg' | 'image/webp';

const acceptTypes = ['image/jpeg', 'image/png', 'image/webp'];

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const sanitizeSelection = (list: FileList | null): File[] => {
  if (!list) return [];
  return Array.from(list).filter((f) => acceptTypes.includes(f.type));
};

const makeId = (seed: string) => `${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const CompressImagesPage: React.FC = () => {
  // SEO
  const seo = getToolSeoByPath('/tools/compress-images');

  const inputRef = useRef<HTMLInputElement | null>(null);
  const folderRef = useRef<HTMLInputElement | null>(null);
  const cancelledRef = useRef(false);
  const lastZipUrlRef = useRef<string | null>(null);

  const [files, setFiles] = useState<Item[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Controls
  const [quality, setQuality] = useState(0.8);               // 0.1–1.0
  const [maxSizeMB, setMaxSizeMB] = useState(1);             // per-image cap
  const [maxWH, setMaxWH] = useState(4000);                  // resize bound
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('auto'); // auto | jpeg | webp
  const [renamePattern, setRenamePattern] = useState('{name}_compressed'); // tokens: {name}, {index}, {ext}

  // cleanup object URLs (thumbnails + last zip)
  useEffect(() => {
    return () => {
      files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
      if (lastZipUrlRef.current) URL.revokeObjectURL(lastZipUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearOutputs = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
  };

  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    const next: Item[] = incoming.map((f) => ({
      id: makeId(f.name),
      file: f,
      status: 'ready',
      previewUrl: URL.createObjectURL(f),
    }));
    setFiles((prev) => [...prev, ...next]);
    setError(null);
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = sanitizeSelection(e.target.files);
    if (chosen.length === 0) {
      setError('Please select JPG, PNG, or WebP images.');
      return;
    }
    addFiles(chosen);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = sanitizeSelection(e.dataTransfer.files);
    if (dropped.length === 0) {
      setError('Please drop JPG, PNG, or WebP images.');
      return;
    }
    addFiles(dropped);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const clearAll = () => {
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setError(null);
    clearOutputs();
  };

  // filename builder using pattern tokens
  const buildOutName = (f: File, index1: number, forcedType?: OutputFormat) => {
    const m = f.name.match(/^(.*?)(\.[^.]+)?$/);
    const base = (m?.[1] ?? 'image').trim();
    const extIn = (m?.[2] ?? '').toLowerCase() || '.jpg';

    const forcedExt =
      forcedType === 'image/webp' ? '.webp' :
      forcedType === 'image/jpeg' ? '.jpg' :
      extIn;

    return renamePattern
      .replace(/\{name\}/g, base)
      .replace(/\{index\}/g, String(index1))
      .replace(/\{ext\}/g, forcedExt)
      // safety: if user forgets {ext}, append it
      .replace(/\s+/g, ' ')
      .trim()
      .concat(renamePattern.includes('{ext}') ? '' : forcedExt);
  };

  // totals
  const totals = useMemo(() => {
    const inBytes = files.reduce((sum, f) => sum + f.file.size, 0);
    const outBytes = files.reduce((sum, f) => sum + (f.outSize || 0), 0);
    const saved = outBytes > 0 ? Math.max(0, inBytes - outBytes) : 0;
    const pct = outBytes > 0 ? Math.max(0, (saved / inBytes) * 100) : 0;
    return { inBytes, outBytes, saved, pct };
  }, [files]);

  // cancel handler
  const cancelCompression = () => {
    cancelledRef.current = true;
  };

  // Core: compress all -> zip
  const compressAll = async () => {
    if (files.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    clearOutputs();
    cancelledRef.current = false;

    try {
      const zip = new JSZip();
      for (let i = 0; i < files.length; i++) {
        if (cancelledRef.current) break;

        const f = files[i].file;

        // browser-image-compression options
        const options: imageCompression.Options = {
          maxSizeMB: Math.max(0.05, maxSizeMB),
          maxWidthOrHeight: Math.max(100, maxWH),
          useWebWorker: true,
          initialQuality: Math.max(0.1, Math.min(1, quality)),
          fileType: outputFormat === 'auto' ? undefined : outputFormat,
          onProgress: (p: number) => {
            // local per-file progress is noisy; keep the overall progress smooth
          },
        };

        const compressedFile: File = await imageCompression(f, options);
        const outBlob: Blob = compressedFile;

        const outName = buildOutName(
          f,
          i + 1,
          outputFormat === 'auto' ? (f.type as OutputFormat) : outputFormat
        );

        zip.file(outName, outBlob);

        // mark item done
        setFiles((prev) =>
          prev.map((x) =>
            x.id === files[i].id ? { ...x, status: 'completed', outSize: outBlob.size } : x
          )
        );

        setProgress(Math.round(((i + 1) / files.length) * 100));
        await new Promise((r) => setTimeout(r, 0)); // yield to UI
      }

      if (!cancelledRef.current) {
        const outZip = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(outZip);
        if (lastZipUrlRef.current) URL.revokeObjectURL(lastZipUrlRef.current);
        lastZipUrlRef.current = url;
        setDownloadUrl(url);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to compress images.');
    } finally {
      setIsProcessing(false);
      cancelledRef.current = false;
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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header */}
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
                <p className="text-xs text-gray-500 font-medium">Compress Images</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <CompressIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Compress Images</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Reduce JPG/PNG/WebP file sizes while keeping crisp quality. Fast, private, in-browser.
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

          {/* Uploader + Controls */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8">
            <div className="p-8">
              <div
                className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="mb-6">
                  <CompressIcon className="w-16 h-16 mx-auto text-gray-400 group-hover:text-blue-500 group-hover:animate-bounce transition-all" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {files.length ? 'Add more images' : 'Drop your images here'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {files.length ? `${files.length} selected` : 'or click to browse from your device'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:-translate-y-1">
                    Choose Images
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      folderRef.current?.click();
                    }}
                    className="px-4 py-3 rounded-xl font-semibold bg-white border hover:bg-gray-50 flex items-center gap-2"
                    title="Pick an entire folder"
                  >
                    <FolderOpen className="w-4 h-4" /> Pick Folder
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-4">Supported: JPG, PNG, WebP</p>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept={acceptTypes.join(',')}
                multiple
                className="hidden"
                onChange={handlePick}
              />
              {/* folder picker (webkitdirectory) */}
              <input
                ref={folderRef}
                type="file"
                accept={acceptTypes.join(',')}
                multiple
                // @ts-expect-error — non-standard attribute for folder selection
                webkitdirectory="true"
                className="hidden"
                onChange={handlePick}
              />
            </div>

            {/* Controls */}
            <div className="px-8 pb-8">
              <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quality ({quality.toFixed(2)})
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Lower = smaller size, Higher = better quality. Default 0.8
                  </p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max size per image (MB)
                  </label>
                  <input
                    type="number"
                    min={0.05}
                    step={0.05}
                    value={maxSizeMB}
                    onChange={(e) => setMaxSizeMB(Math.max(0.05, parseFloat(e.target.value) || 0.05))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2">Hard cap target for each output image.</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Resize bound (max width or height, px)
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={maxWH}
                    onChange={(e) => setMaxWH(Math.max(100, parseInt(e.target.value) || 4000))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2">Preserves aspect ratio. Default 4000.</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Output format
                  </label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="auto">Auto (keep original)</option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/webp">WebP</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    WebP/JPEG can greatly reduce file sizes vs PNG.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Batch rename pattern
                  </label>
                  <input
                    type="text"
                    value={renamePattern}
                    onChange={(e) => setRenamePattern(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                    placeholder="{name}_compressed"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Tokens: <code className="font-mono">{'{name}'}</code>,{' '}
                    <code className="font-mono">{'{index}'}</code> (1-based),{' '}
                    <code className="font-mono">{'{ext}'}</code>. Example: <code className="font-mono">photo_{'{index}'}{'{ext}'}</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="border-t border-gray-200 p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Selected Files ({files.length})
                  </h3>
                  <button
                    onClick={clearAll}
                    className="text-sm px-3 py-2 rounded-lg border hover:bg-gray-50"
                  >
                    Clear all
                  </button>
                </div>

                <div className="space-y-4">
                  {files.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white ring-1 ring-gray-200 flex items-center justify-center">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt=""
                              className="w-12 h-12 object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <CompressIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate" title={item.file.name}>
                            {item.file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(item.file.size)}
                            {typeof item.outSize === 'number' && (
                              <>
                                {' '}
                                →{' '}
                                <span className="text-green-700">
                                  {formatFileSize(item.outSize)}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">#{idx + 1}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.status === 'completed' ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <Clock className="w-6 h-6 text-gray-400" />
                        )}
                        <button
                          onClick={() => removeFile(item.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall progress + totals */}
                {(isProcessing || totals.outBytes > 0) && (
                  <div className="mt-8 grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-blue-50 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-bold text-blue-900">
                          {isProcessing ? 'Compressing your images...' : 'Completed'}
                        </span>
                        <span className="text-blue-600 font-bold">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {isProcessing && (
                        <button
                          onClick={cancelCompression}
                          className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border text-sm hover:bg-gray-50"
                          title="Cancel processing"
                        >
                          <StopCircle className="w-4 h-4" /> Cancel
                        </button>
                      )}
                    </div>

                    {totals.outBytes > 0 && (
                      <div className="p-6 bg-green-50 rounded-2xl">
                        <div className="font-bold text-green-900 mb-2">Total savings</div>
                        <div className="text-sm text-green-800 space-y-1">
                          <div>Original: {formatFileSize(totals.inBytes)}</div>
                          <div>Compressed: {formatFileSize(totals.outBytes)}</div>
                          <div>
                            Saved:{' '}
                            <span className="font-semibold">
                              {formatFileSize(totals.saved)} ({totals.pct.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={compressAll}
                    disabled={files.length === 0 || isProcessing}
                    className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-3"></div>
                        Compressing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 inline mr-3" />
                        Start Compression
                      </>
                    )}
                  </button>

                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      download="compressed-images.zip"
                      className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <DownloadIcon className="w-5 h-5 inline mr-2" />
                      Download ZIP
                    </a>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CompressImagesPage;
