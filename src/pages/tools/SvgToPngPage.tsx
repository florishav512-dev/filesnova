// src/pages/tools/SvgToPngPage.tsx
import React, { useState } from 'react';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import {
  Sparkles,
  PictureInPicture2,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

// Animated gradient "Tools" dropdown (right-most in header)
import ToolsMenu from '../../components/ToolsMenu';

const SvgToPngPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Advanced options
  const [scale, setScale] = useState<number>(1);               // 0.25..5
  const [maxDim, setMaxDim] = useState<number>(4096);          // 512..8192
  const [bg, setBg] = useState<string>('');                    // empty = transparent
  const [namePattern, setNamePattern] = useState<string>('{base}.png');
  const [trim, setTrim] = useState<boolean>(false);            // trim transparent edges

  // SEO data
  const { title, description, canonical, breadcrumb } =
    TOOL_SEO_DATA['/tools/svg-to-png'];

  // ---------- helpers ----------
  const parseNumberWithUnits = (val: string | null): number | null => {
    if (!val) return null;
    const m = val.trim().match(/^([\d.]+)\s*(px|pt|in|cm|mm|pc)?$/i);
    if (!m) return null;
    const num = parseFloat(m[1]);
    const unit = (m[2] || 'px').toLowerCase();
    const pxPer: Record<string, number> = {
      px: 1,
      pt: 96 / 72,
      in: 96,
      cm: 96 / 2.54,
      mm: 96 / 25.4,
      pc: 16,
    };
    return num * (pxPer[unit] ?? 1);
  };

  const getSvgSize = (svgText: string): { w: number; h: number } => {
    const widthAttr = svgText.match(/\bwidth="([^"]+)"/i)?.[1] ?? null;
    const heightAttr = svgText.match(/\bheight="([^"]+)"/i)?.[1] ?? null;
    let w = parseNumberWithUnits(widthAttr);
    let h = parseNumberWithUnits(heightAttr);
    if (!w || !h) {
      const vb = svgText.match(/\bviewBox="([^"]+)"/i)?.[1];
      if (vb) {
        const p = vb.trim().split(/\s+/).map(Number);
        if (p.length === 4 && isFinite(p[2]) && isFinite(p[3])) {
          w = w || p[2];
          h = h || p[3];
        }
      }
    }
    if (!w || !h) return { w: 1024, h: 1024 }; // sane default
    return { w, h };
  };

  const clampDims = (w: number, h: number): { w: number; h: number } => {
    // apply scale + clamp by maxDim while preserving aspect
    let W = Math.max(1, Math.round(w * Math.max(0.25, Math.min(5, scale))));
    let H = Math.max(1, Math.round(h * Math.max(0.25, Math.min(5, scale))));
    const max = Math.max(512, Math.min(8192, Math.floor(maxDim)));
    const r = Math.max(W / max, H / max, 1);
    if (r > 1) {
      W = Math.floor(W / r);
      H = Math.floor(H / r);
    }
    return { w: W, h: H };
  };

  const patternName = (original: string, i: number): string => {
    const base = original.replace(/\.[^.]+$/i, '');
    return (
      namePattern.replace(/{base}/g, base).replace(/{i}/g, String(i + 1)) ||
      `${base}.png`
    );
  };

  const trimTransparent = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    const { width, height } = canvas;
    const img = ctx.getImageData(0, 0, width, height).data;

    let top = 0, left = 0, right = width - 1, bottom = height - 1;
    let found = false;

    // top
    for (let y = 0; y < height && !found; y++) {
      for (let x = 0; x < width; x++) {
        if (img[(y * width + x) * 4 + 3] !== 0) { top = y; found = true; break; }
      }
    }
    // bottom
    found = false;
    for (let y = height - 1; y >= top && !found; y--) {
      for (let x = 0; x < width; x++) {
        if (img[(y * width + x) * 4 + 3] !== 0) { bottom = y; found = true; break; }
      }
    }
    // left
    found = false;
    for (let x = 0; x < width && !found; x++) {
      for (let y = top; y <= bottom; y++) {
        if (img[(y * width + x) * 4 + 3] !== 0) { left = x; found = true; break; }
      }
    }
    // right
    found = false;
    for (let x = width - 1; x >= left && !found; x--) {
      for (let y = top; y <= bottom; y++) {
        if (img[(y * width + x) * 4 + 3] !== 0) { right = x; found = true; break; }
      }
    }

    const tw = Math.max(1, right - left + 1);
    const th = Math.max(1, bottom - top + 1);
    if (tw === width && th === height) return canvas; // nothing to trim

    const out = document.createElement('canvas');
    out.width = tw;
    out.height = th;
    out.getContext('2d')!.drawImage(canvas, left, top, tw, th, 0, 0, tw, th);
    return out;
  };

  // ---------- core ----------
  const convert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const svgText = await f.text();

        const { w: iw, h: ih } = getSvgSize(svgText);
        const { w, h } = clampDims(iw, ih);

        const img = new Image();
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        // @ts-ignore
        img.decoding = 'async';
        img.src = url;
        await img.decode();

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');

        // Optional background (keeps transparency if left empty)
        if (bg && /^#|rgb|hsl/i.test(bg)) {
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, w, h);
        }

        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);

        const finalCanvas = trim ? trimTransparent(canvas) : canvas;

        const pngBlob: Blob | null = await new Promise((resolve) =>
          finalCanvas.toBlob(resolve, 'image/png')
        );
        if (pngBlob) {
          const outName = patternName(f.name.replace(/\.svg$/i, '.png'), i);
          zip.file(outName, pngBlob);
        }

        setProgress(Math.round(((i + 1) / files.length) * 100));
        if (i % 2 === 1) await new Promise((r) => setTimeout(r, 0)); // allow UI to breathe
      }

      const out = await zip.generateAsync({ type: 'blob' });
      setDownloadUrl(URL.createObjectURL(out));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to convert SVG.');
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
        {/* Animated background pulses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no back arrow; Tools at right) */}
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
                <p className="text-xs text-gray-500 font-medium">SVG to PNG</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <PictureInPicture2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">SVG to PNG</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert vector graphics into crisp PNGs. Keep transparency, or add a background—your choice.
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

          {/* Uploader + Advanced */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload SVG Files</h3>
            <UploadZone
              accept="image/svg+xml"
              multiple
              title="Drop your SVG files here"
              buttonLabel="Choose Files"
              supportedFormats="SVG"
              onFilesSelected={(fs) => {
                setFiles(fs);
                setDownloadUrl(null);
                setError(null);
              }}
            />

            {files.length > 0 && (
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Scale</label>
                  <input
                    type="number"
                    min={0.25}
                    max={5}
                    step={0.25}
                    value={scale}
                    onChange={(e) => setScale(Math.max(0.25, Math.min(5, Number(e.target.value) || 1)))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Max dimension (px)</label>
                  <input
                    type="number"
                    min={512}
                    max={8192}
                    step={128}
                    value={maxDim}
                    onChange={(e) => setMaxDim(Math.max(512, Math.min(8192, Number(e.target.value) || 4096)))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Background (optional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bg || '#ffffff'}
                      onChange={(e) => setBg(e.target.value)}
                      className="h-10 w-14 border rounded-lg"
                      title="Leave blank to keep transparency"
                    />
                    <input
                      value={bg}
                      onChange={(e) => setBg(e.target.value)}
                      placeholder="(transparent)  e.g. #ffffff"
                      className="flex-1 p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Name pattern</label>
                  <input
                    value={namePattern}
                    onChange={(e) => setNamePattern(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="{base}.png"
                    title="{base} = original filename (no extension), {i} = index"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="trim"
                    type="checkbox"
                    checked={trim}
                    onChange={(e) => setTrim(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="trim" className="text-sm text-gray-700">Trim transparent edges</label>
                </div>
              </div>
            )}

            <button
              onClick={convert}
              disabled={files.length === 0 || isProcessing}
              className="mt-4 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Convert to PNG
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
                download="svgs_to_png.zip"
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

export default SvgToPngPage;
