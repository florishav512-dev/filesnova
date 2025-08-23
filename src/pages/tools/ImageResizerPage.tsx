import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import pica from 'pica';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import {
  Sparkles,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  Crop,
} from 'lucide-react';

// ✅ SEO
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';

// ✅ TOOLS dropdown in the header (same component used on other tools)
import ToolsMenu from '../../components/ToolsMenu';

/**
 * ImageResizerPage: header updated to match other tools (no back arrow, TOOLS dropdown).
 * Advanced features (blend with UI):
 * - Units: px or %
 * - Fit mode: Fit within (keep ratio) or Exact stretch
 * - Keep aspect ratio toggle
 * - Presets (1080p/720p, Instagram, YouTube, etc.)
 * - Output: PNG / JPG / WEBP + quality slider
 * - Transparency flattening for JPG/WEBP with selectable background
 * - Settings persisted in localStorage
 */
const ImageResizerPage: React.FC = () => {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a hidden Image element to retrieve natural dimensions
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [naturalW, setNaturalW] = useState<number>(0);
  const [naturalH, setNaturalH] = useState<number>(0);

  // Basic dimensions (editable)
  const [width, setWidth] = useState<number>(300);
  const [height, setHeight] = useState<number>(300);

  // Advanced
  type Unit = 'px' | '%';
  type FitMode = 'fit' | 'exact';
  type Format = 'png' | 'jpeg' | 'webp';

  const [unit, setUnit] = useState<Unit>('px');
  const [fitMode, setFitMode] = useState<FitMode>('fit');
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const [format, setFormat] = useState<Format>('png');
  const [quality, setQuality] = useState<number>(90); // for jpeg/webp
  const [bgColor, setBgColor] = useState<string>('#ffffff'); // used when flattening transparency
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [preset, setPreset] = useState<string>('custom');

  // ✅ SEO data
  const seo = TOOL_SEO_DATA['/tools/image-resizer'];

  // Persist settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fn_image_resizer_settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.unit) setUnit(s.unit);
        if (s.fitMode) setFitMode(s.fitMode);
        if (typeof s.keepAspect === 'boolean') setKeepAspect(s.keepAspect);
        if (s.format) setFormat(s.format);
        if (typeof s.quality === 'number') setQuality(s.quality);
        if (typeof s.bgColor === 'string') setBgColor(s.bgColor);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'fn_image_resizer_settings',
        JSON.stringify({ unit, fitMode, keepAspect, format, quality, bgColor })
      );
    } catch {}
  }, [unit, fitMode, keepAspect, format, quality, bgColor]);

  // Load natural dimensions whenever originalUrl changes
  useEffect(() => {
    if (!originalUrl) return;
    const img = new Image();
    imgRef.current = img;
    img.onload = () => {
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);

      if (unit === '%') {
        setWidth(100);
        setHeight(100);
      } else {
        const initW = Math.min(img.naturalWidth, 1920);
        const ratio = img.naturalWidth ? initW / img.naturalWidth : 1;
        setWidth(initW);
        setHeight(Math.round(img.naturalHeight * ratio));
      }
      setResizedUrl(null);
      setPreset('custom');
    };
    img.onerror = () => {
      setError('Could not load the image.');
    };
    (img as any).decoding = 'async';
    (img as any).fetchPriority = 'low';
    img.src = originalUrl;
  }, [originalUrl, unit]);

  // Aspect lock: adjust height when width changes (px mode)
  useEffect(() => {
    if (!keepAspect || !naturalW || !naturalH) return;
    if (unit === '%') {
      setHeight(width);
    } else {
      const ratio = naturalH / naturalW;
      setHeight(Math.max(1, Math.round(width * ratio)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, keepAspect, unit, naturalW, naturalH]);

  const handleFiles = (fs: File[]) => {
    const file = fs[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setResizedUrl(null);
    setError(null);
  };

  // Presets
  const presets: Record<string, { w: number; h: number; label: string }> = useMemo(
    () => ({
      '1080p': { w: 1920, h: 1080, label: 'HD 1080p' },
      '720p': { w: 1280, h: 720, label: 'HD 720p' },
      instaSquare: { w: 1080, h: 1080, label: 'Instagram Square' },
      instaStory: { w: 1080, h: 1920, label: 'Instagram Story' },
      ytThumb: { w: 1280, h: 720, label: 'YouTube Thumb' },
      fbCover: { w: 820, h: 312, label: 'Facebook Cover' },
      twHeader: { w: 1500, h: 500, label: 'X/Twitter Header' },
      smallThumb: { w: 320, h: 240, label: 'Small Thumb' },
    }),
    []
  );

  const applyPreset = (key: string) => {
    setPreset(key);
    const p = presets[key];
    if (!p) return;
    if (unit === '%') {
      if (!naturalW || !naturalH) return;
      setWidth(Math.round((p.w / naturalW) * 100));
      setHeight(Math.round((p.h / naturalH) * 100));
    } else {
      setWidth(p.w);
      setHeight(p.h);
    }
    setKeepAspect(false); // presets set both explicitly
  };

  const computeTargetSize = (): { w: number; h: number } => {
    const baseW = naturalW || width || 1;
    const baseH = naturalH || height || 1;

    const targetW = unit === 'px' ? width : Math.max(1, Math.round((baseW * width) / 100));
    const targetH = unit === 'px' ? height : Math.max(1, Math.round((baseH * height) / 100));

    if (fitMode === 'fit' && naturalW && naturalH) {
      const scale = Math.min(targetW / naturalW, targetH / naturalH);
      return {
        w: Math.max(1, Math.round(naturalW * scale)),
        h: Math.max(1, Math.round(naturalH * scale)),
      };
    }
    return { w: Math.max(1, targetW), h: Math.max(1, targetH) };
  };

  const hasTransparency = (canvas: HTMLCanvasElement): boolean => {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      const { width, height } = canvas;
      const data = ctx.getImageData(0, 0, Math.min(64, width), Math.min(64, height)).data; // small sample
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resizeImage = async () => {
    try {
      if (!originalUrl) return;
      setIsResizing(true);
      setError(null);
      setResizedUrl(null);

      // Load
      const srcImg = new Image();
      (srcImg as any).decoding = 'async';
      (srcImg as any).fetchPriority = 'high';
      srcImg.src = originalUrl;
      await srcImg.decode();

      // Source canvas
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = srcImg.naturalWidth || srcImg.width;
      srcCanvas.height = srcImg.naturalHeight || srcImg.height;
      const sctx = srcCanvas.getContext('2d');
      if (!sctx) throw new Error('Canvas not supported');
      sctx.drawImage(srcImg, 0, 0);

      // Target
      const { w: targetW, h: targetH } = computeTargetSize();
      const outCanvas = document.createElement('canvas');
      outCanvas.width = targetW;
      outCanvas.height = targetH;

      // Resize with pica (high quality)
      const p = pica();
      await p.resize(srcCanvas, outCanvas, {
        quality: 3,         // 0..3
        alpha: true,
        transferable: true,
      });

      // For JPEG/WEBP, flatten transparency onto bgColor
      let exportCanvas = outCanvas;
      if ((format === 'jpeg' || format === 'webp') && hasTransparency(outCanvas)) {
        const flat = document.createElement('canvas');
        flat.width = targetW;
        flat.height = targetH;
        const fctx = flat.getContext('2d');
        if (!fctx) throw new Error('Canvas not supported');
        fctx.fillStyle = bgColor || '#ffffff';
        fctx.fillRect(0, 0, targetW, targetH);
        fctx.drawImage(outCanvas, 0, 0);
        exportCanvas = flat;
      }

      const mime = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp';
      const q = format === 'png' ? undefined : Math.min(1, Math.max(0.1, quality / 100));

      const blob = await new Promise<Blob | null>((resolve) =>
        exportCanvas.toBlob(resolve, mime, q)
      );
      if (!blob) throw new Error('Failed to export image');
      const url = URL.createObjectURL(blob);
      setResizedUrl(url);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Resize failed. Please try again.');
    } finally {
      setIsResizing(false);
    }
  };

  const downloadName = useMemo(() => {
    const base = 'resized';
    const ext = format === 'png' ? 'png' : format === 'jpeg' ? 'jpg' : 'webp';
    return `${base}.${ext}`;
  }, [format]);

  return (
    <>
      {/* ✅ Injects Breadcrumb + WebPage + SoftwareApplication + meta */}
      <ToolSeo {...seo} />

      <Helmet>
        <title>Image Resizer – Resize Images Online (PNG/JPG/WEBP) | FilesNova</title>
        <meta
          name="description"
          content="Resize images by pixels or percentage, keep aspect ratio, choose PNG/JPG/WEBP, and set quality. Fast, free, secure—right in your browser."
        />
        <link rel="canonical" href="https://filesnova.com/tools/image-resizer" />
      </Helmet>

      {/* ✅ WebApplication schema */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Image Resizer – Files Nova",
        "url": "https://filesnova.com/tools/image-resizer",
        "applicationCategory": "FileConverter",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      }} />

      {/* ✅ BreadcrumbList schema */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://filesnova.com/" },
          { "@type": "ListItem", "position": 2, "name": "Image Resizer", "item": "https://filesnova.com/tools/image-resizer" }
        ]
      }} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (brand left, animated TOOLS dropdown right) */}
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
                <p className="text-xs text-gray-500 font-medium">Image Resizer</p>
              </div>

              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Tool header */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <Crop className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Image Resizer</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Resize your images to any dimensions and download the result.
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

          {/* Upload & Resize */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload Image &amp; Set Size</h3>

            <UploadZone
              accept="image/*"
              multiple={false}
              title="Drop your image here"
              buttonLabel="Choose Image"
              supportedFormats="Image files"
              onFilesSelected={handleFiles}
            />

            {/* Basic controls */}
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as Unit)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="px">Pixels (px)</option>
                  <option value="%">Percent (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fit Mode</label>
                <select
                  value={fitMode}
                  onChange={(e) => setFitMode(e.target.value as FitMode)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="fit">Fit within (keep ratio)</option>
                  <option value="exact">Exact (stretch)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex-1">
                <label htmlFor="resize-width" className="block text-sm font-medium text-gray-700 mb-1">
                  Width ({unit})
                </label>
                <input
                  id="resize-width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Math.max(1, parseInt(e.target.value || '1')))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  min={1}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="resize-height" className="block text-sm font-medium text-gray-700 mb-1">
                  Height ({unit})
                </label>
                <input
                  id="resize-height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value || '1')))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  min={1}
                  disabled={keepAspect && unit === 'px'}
                />
              </div>
            </div>

            {/* Keep aspect + Preset (mobile-safe) */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <input
                  id="keep-aspect"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={keepAspect}
                  onChange={(e) => setKeepAspect(e.target.checked)}
                />
                <label htmlFor="keep-aspect" className="text-sm text-gray-800">
                  Keep aspect ratio
                </label>
              </div>

              <div className="sm:ml-auto flex items-center gap-2 w-full sm:w-auto">
                <label className="text-sm text-gray-700 whitespace-nowrap">Preset</label>
                <select
                  value={preset}
                  onChange={(e) => applyPreset(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg bg-white w-full sm:w-56 max-w-full"
                >
                  <option value="custom">Custom</option>
                  <option value="1080p">HD 1080p (1920×1080)</option>
                  <option value="720p">HD 720p (1280×720)</option>
                  <option value="instaSquare">Instagram Square (1080×1080)</option>
                  <option value="instaStory">Instagram Story (1080×1920)</option>
                  <option value="ytThumb">YouTube Thumb (1280×720)</option>
                  <option value="fbCover">Facebook Cover (820×312)</option>
                  <option value="twHeader">X/Twitter Header (1500×500)</option>
                  <option value="smallThumb">Small Thumb (320×240)</option>
                </select>
              </div>
            </div>

            {/* Advanced inline block (blends with card) */}
            <div className="mt-6 bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-4">
              <button
                type="button"
                className="w-full text-left font-semibold text-gray-800"
                onClick={() => setShowAdvanced((s) => !s)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>

              {showAdvanced && (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Output Format</label>
                    <select
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                      value={format}
                      onChange={(e) => setFormat(e.target.value as Format)}
                    >
                      <option value="png">PNG (lossless)</option>
                      <option value="jpeg">JPG (compressed)</option>
                      <option value="webp">WEBP (modern)</option>
                    </select>
                  </div>

                  {(format === 'jpeg' || format === 'webp') && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Quality: <span className="font-medium">{quality}</span>
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={1}
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}

                  {(format === 'jpeg' || format === 'webp') && (
                    <div className="md:col-span-2 flex items-center gap-3">
                      <label className="block text-sm text-gray-700">Background (for transparency)</label>
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="h-10 w-14 border rounded-lg"
                        title="Used when flattening transparent PNGs to JPG/WEBP"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={resizeImage}
              disabled={!originalUrl || isResizing}
              className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResizing ? 'Resizing…' : 'Resize Image'}
            </button>
            {error && <p className="text-red-600 mt-3">{error}</p>}
          </div>

          {/* Preview & Download */}
          {originalUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Preview</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Original Image ({naturalW}×{naturalH})</h4>
                  <img src={originalUrl} alt="Original" className="max-w-full rounded-xl" />
                </div>
                {resizedUrl && (
                  <div>
                    <h4 className="font-semibold mb-2">Resized Image</h4>
                    <img src={resizedUrl} alt="Resized" className="max-w-full rounded-xl" />
                  </div>
                )}
              </div>

              {resizedUrl && (
                <div className="mt-6">
                  <a
                    href={resizedUrl}
                    download={downloadName}
                    className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
                  >
                    <DownloadIcon className="w-5 h-5 mr-2" /> Download Resized Image
                  </a>
                </div>
              )}

              <AdSpace />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ImageResizerPage;
