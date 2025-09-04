// src/pages/tools/WebpConverterPage.tsx

import React, { useMemo, useState } from 'react';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import ToolsMenu from '../../components/ToolsMenu';
import {
  Sparkles,
  Image as ImageIcon,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

type BGFill = 'transparent' | 'white' | 'black' | 'checker';

const WebpConverterPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Advanced options
  const [quality, setQuality] = useState(85);
  const [lossless, setLossless] = useState(false);
  const [maxW, setMaxW] = useState<number | ''>('');
  const [maxH, setMaxH] = useState<number | ''>('');
  const [onlyShrink, setOnlyShrink] = useState(true);
  const [bgFill, setBgFill] = useState<BGFill>('transparent');
  const [namePattern, setNamePattern] = useState('{name}.webp');

  // SEO data: Home → Tools → WebP Converter
  const { title, description, canonical, breadcrumb } =
    TOOL_SEO_DATA['/tools/webp-converter'];

  const qualityParam = useMemo(() => {
    // canvas.toBlob quality is 0..1; ignore if lossless
    if (lossless) return undefined;
    const q = Math.max(1, Math.min(100, quality));
    return q / 100;
  }, [quality, lossless]);

  // Helper to get safe output name from pattern
  const makeName = (f: File) => {
    const base = f.name.replace(/\.[^.]+$/i, '');
    return namePattern
      .replace(/{name}/g, base)
      .replace(/{ext}/g, 'webp')
      .replace(/\s+/g, '_');
  };

  const drawCheckerBg = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const size = 16;
    for (let y = 0; y < h; y += size) {
      for (let x = 0; x < w; x += size) {
        const isDark = ((x / size) + (y / size)) % 2 < 1;
        ctx.fillStyle = isDark ? '#e5e7eb' : '#ffffff'; // gray-200 / white
        ctx.fillRect(x, y, size, size);
      }
    }
  };

  const loadBitmap = async (file: File): Promise<{ bmp: ImageBitmap | HTMLImageElement; w: number; h: number; isBitmap: boolean }> => {
    try {
      if ('createImageBitmap' in window) {
        // @ts-ignore
        const bmp: ImageBitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        return { bmp, w: bmp.width, h: bmp.height, isBitmap: true };
      }
    } catch {
      // fallback to <img>
    }
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    return { bmp: img, w: img.width, h: img.height, isBitmap: false };
  };

  const convert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setDownloadUrl(null);

    try {
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const f = files[i];

        // Load with orientation awareness when possible
        const { bmp, w, h, isBitmap } = await loadBitmap(f);

        let targetW = w;
        let targetH = h;

        const clamp = (val: number, max: number) => (max > 0 ? Math.min(val, max) : val);

        // Optional resize while keeping aspect ratio
        const mw = typeof maxW === 'number' ? maxW : 0;
        const mh = typeof maxH === 'number' ? maxH : 0;

        if (mw || mh) {
          // compute fit
          const rw = mw ? mw / w : Infinity;
          const rh = mh ? mh / h : Infinity;
          const r = Math.min(rw, rh);
          if (!Number.isFinite(r)) {
            // one of them was not set -> use the other
            if (mw) {
              const ratio = mw / w;
              targetW = mw;
              targetH = Math.round(h * ratio);
            } else if (mh) {
              const ratio = mh / h;
              targetH = mh;
              targetW = Math.round(w * ratio);
            }
          } else {
            // both set
            if (onlyShrink && r >= 1) {
              // do not enlarge
              targetW = w;
              targetH = h;
            } else {
              targetW = Math.max(1, Math.round(w * r));
              targetH = Math.max(1, Math.round(h * r));
            }
          }
          targetW = clamp(targetW, mw || targetW);
          targetH = clamp(targetH, mh || targetH);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('Canvas not supported in this browser.');

        // Background fill if requested (for visual consistency)
        if (bgFill === 'white') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);
        } else if (bgFill === 'black') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, targetW, targetH);
        } else if (bgFill === 'checker') {
          drawCheckerBg(ctx, targetW, targetH);
        } // 'transparent' -> leave alpha

        // Draw image
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bmp as any, 0, 0, targetW, targetH);

        // Release ObjectURL for <img> case
        if (!isBitmap && (bmp as HTMLImageElement).src.startsWith('blob:')) {
          URL.revokeObjectURL((bmp as HTMLImageElement).src);
        }
        // Close ImageBitmap if used
        if (isBitmap && 'close' in (bmp as ImageBitmap)) {
          (bmp as ImageBitmap).close();
        }

        // Convert to WebP
        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/webp', qualityParam)
        );

        if (blob) {
          const name = makeName(f);
          zip.file(name, blob);
        }

        setProgress(Math.round(((i + 1) / files.length) * 100));
        // yield to UI
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => setTimeout(res, 0));
      }

      const out = await zip.generateAsync({ type: 'blob' });
      setDownloadUrl(URL.createObjectURL(out));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to convert images.');
    }
    setIsProcessing(false);
  };

  return (
    <>
      <ToolSeo
        title={title}
        description={description}
        canonical={canonical}
        breadcrumb={breadcrumb}
        showBreadcrumb
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* BG pulses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no arrow; Tools button on right) */}
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
                <p className="text-xs text-gray-500 font-medium">WebP Converter</p>
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
                <ImageIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">WebP Converter</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert your images to WebP with quality control, optional resizing, and background fill.
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload Images</h3>
            <UploadZone
              accept="image/png,image/jpeg"
              multiple={true}
              title="Drop your images here"
              buttonLabel="Choose Files"
              supportedFormats="JPEG, PNG"
              onFilesSelected={(fs) => {
                setFiles(fs);
                setDownloadUrl(null);
                setError(null);
              }}
            />

            {files.length > 0 && (
              <>
                {/* Advanced controls */}
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-xl border border-gray-200 bg-white/70">
                    <h4 className="font-semibold text-gray-900 mb-3">Quality</h4>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={100}
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                        disabled={lossless}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-700 w-12 text-right">{quality}</span>
                    </div>
                    <label className="mt-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={lossless}
                        onChange={(e) => setLossless(e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">Lossless (ignores quality)</span>
                    </label>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-white/70">
                    <h4 className="font-semibold text-gray-900 mb-3">Resize (optional)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Max Width (px)</label>
                        <input
                          type="number"
                          min={1}
                          placeholder="e.g. 1920"
                          value={maxW}
                          onChange={(e) => setMaxW(e.target.value ? parseInt(e.target.value, 10) : '')}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Max Height (px)</label>
                        <input
                          type="number"
                          min={1}
                          placeholder="e.g. 1080"
                          value={maxH}
                          onChange={(e) => setMaxH(e.target.value ? parseInt(e.target.value, 10) : '')}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <label className="mt-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={onlyShrink}
                        onChange={(e) => setOnlyShrink(e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">Only shrink if larger (never upscale)</span>
                    </label>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-white/70">
                    <h4 className="font-semibold text-gray-900 mb-3">Background</h4>
                    <select
                      value={bgFill}
                      onChange={(e) => setBgFill(e.target.value as BGFill)}
                      className="p-2 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="transparent">Transparent</option>
                      <option value="white">White</option>
                      <option value="black">Black</option>
                      <option value="checker">Checkerboard (preview-like)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      Transparent works best for PNGs; JPEGs typically have no alpha.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-white/70">
                    <h4 className="font-semibold text-gray-900 mb-3">Filename Pattern</h4>
                    <input
                      value={namePattern}
                      onChange={(e) => setNamePattern(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="{name}.webp"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Use <code className="font-mono">{'{name}'}</code> for base filename and <code className="font-mono">{'{ext}'}</code> for extension (always webp).
                    </p>
                  </div>
                </div>

                <button
                  onClick={convert}
                  disabled={files.length === 0 || isProcessing}
                  className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Convert to WebP
                </button>
              </>
            )}

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
                download="images_webp.zip"
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download ZIP
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WebpConverterPage;
