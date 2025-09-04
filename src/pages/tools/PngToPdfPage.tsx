// src/pages/tools/PngToPdfPage.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import { PDFDocument, rgb } from 'pdf-lib';
import UploadZone from '../../components/UploadZone';
import {
  Sparkles,
  Shield,
  Zap,
  Star,
  Upload as UploadIcon,
  Clock,
  X,
  CheckCircle,
  MoveUpRight,
  MoveDownRight,
  Download as DownloadIcon,
} from 'lucide-react';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

// ✅ SEO imports
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';

// ✅ Tools dropdown (gradient, animated)
import ToolsMenu from '../../components/ToolsMenu';

type FileItem = { id: string; file: File; status: 'ready' | 'completed' };

type PageSizeKey = 'Auto' | 'A4' | 'Letter';
type Orientation = 'portrait' | 'landscape';
type MarginPreset = 'compact' | 'normal' | 'wide';
type FitMode = 'fit' | 'fill' | 'stretch';
type OrderMode = 'manual' | 'name' | 'size';

const PAGE_SIZES: Record<Exclude<PageSizeKey, 'Auto'>, { w: number; h: number }> = {
  // PDF points (1pt = 1/72")
  A4: { w: 595, h: 842 },
  Letter: { w: 612, h: 792 },
};

const marginValue = (m: MarginPreset) => (m === 'compact' ? 24 : m === 'wide' ? 72 : 48);

const hexToRgb = (hex: string) => {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const PngToPdfPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ✅ Per-page SEO config
  const seo = TOOL_SEO_DATA['/tools/png-to-pdf'];

  // Advanced options (persisted)
  const [orderMode, setOrderMode] = useState<OrderMode>('manual');
  const [pageSizeKey, setPageSizeKey] = useState<PageSizeKey>('Auto');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal');
  const [fitMode, setFitMode] = useState<FitMode>('fit');
  const [pageBg, setPageBg] = useState<string>('#ffffff'); // visible around transparent PNGs
  const [optimizeToJpeg, setOptimizeToJpeg] = useState<boolean>(false);
  const [jpegQuality, setJpegQuality] = useState<number>(85); // 10..100
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Load prefs
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fn_png2pdf_settings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.orderMode) setOrderMode(s.orderMode);
      if (s.pageSizeKey) setPageSizeKey(s.pageSizeKey);
      if (s.orientation) setOrientation(s.orientation);
      if (s.marginPreset) setMarginPreset(s.marginPreset);
      if (s.fitMode) setFitMode(s.fitMode);
      if (typeof s.pageBg === 'string') setPageBg(s.pageBg);
      if (typeof s.optimizeToJpeg === 'boolean') setOptimizeToJpeg(s.optimizeToJpeg);
      if (typeof s.jpegQuality === 'number') setJpegQuality(s.jpegQuality);
    } catch {}
  }, []);
  // Save prefs
  useEffect(() => {
    try {
      localStorage.setItem(
        'fn_png2pdf_settings',
        JSON.stringify({
          orderMode,
          pageSizeKey,
          orientation,
          marginPreset,
          fitMode,
          pageBg,
          optimizeToJpeg,
          jpegQuality,
        })
      );
    } catch {}
  }, [orderMode, pageSizeKey, orientation, marginPreset, fitMode, pageBg, optimizeToJpeg, jpegQuality]);

  // Ordering helpers
  const orderedFiles = useMemo(() => {
    if (orderMode === 'manual') return files;
    const copy = [...files];
    if (orderMode === 'name') copy.sort((a, b) => a.file.name.localeCompare(b.file.name));
    if (orderMode === 'size') copy.sort((a, b) => a.file.size - b.file.size);
    return copy;
  }, [files, orderMode]);

  const moveItem = (id: string, dir: 'up' | 'down') => {
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx === -1) return prev;
      const copy = [...prev];
      const swapWith = dir === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= copy.length) return prev;
      [copy[idx], copy[swapWith]] = [copy[swapWith], copy[idx]];
      return copy;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected) {
      const pngs = Array.from(selected).filter((file) => file.type === 'image/png');
      const mapped = pngs.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        status: 'ready' as const,
      }));
      setFiles((prev) => [...prev, ...mapped]);
    }
  };

  const handleDropZone = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files;
    if (dropped) {
      const pngs = Array.from(dropped).filter((file) => file.type === 'image/png');
      const mapped = pngs.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        status: 'ready' as const,
      }));
      setFiles((prev) => [...prev, ...mapped]);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleConvert = async () => {
    if (orderedFiles.length === 0) return;
    setIsConverting(true);
    setPdfUrl(null);
    setProgress(0);
    try {
      const pdfDoc = await PDFDocument.create();

      for (let idx = 0; idx < orderedFiles.length; idx++) {
        const item = orderedFiles[idx];

        // Load image in DOM to get its natural size
        const imgUrl = URL.createObjectURL(item.file);
        const img = new Image();
        (img as any).decoding = 'async';
        img.src = imgUrl;
        await img.decode();
        URL.revokeObjectURL(imgUrl);

        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;

        // Determine page size
        let pageW: number;
        let pageH: number;
        if (pageSizeKey === 'Auto') {
          pageW = srcW;
          pageH = srcH;
        } else {
          const base = PAGE_SIZES[pageSizeKey];
          const rotated = orientation === 'landscape' ? { w: base.h, h: base.w } : base;
          pageW = rotated.w;
          pageH = rotated.h;
        }

        const margin = marginValue(marginPreset);
        const contentW = Math.max(1, pageW - margin * 2);
        const contentH = Math.max(1, pageH - margin * 2);

        // Optionally recompress PNG as JPEG to reduce PDF size dramatically
        let embedBytes: ArrayBuffer;
        let useJpeg = false;

        if (optimizeToJpeg) {
          const canvas = document.createElement('canvas');
          canvas.width = srcW;
          canvas.height = srcH;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas not supported');
          // Paint background to avoid black transparency when flattening
          const bg = hexToRgb(pageBg);
          ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
          ctx.fillRect(0, 0, srcW, srcH);
          ctx.drawImage(img, 0, 0, srcW, srcH);
          const blob: Blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', Math.min(1, Math.max(0.1, jpegQuality / 100)))
          );
          embedBytes = await blob.arrayBuffer();
          useJpeg = true;
        } else {
          embedBytes = await item.file.arrayBuffer();
        }

        const embedded = useJpeg
          ? await pdfDoc.embedJpg(embedBytes)
          : await pdfDoc.embedPng(new Uint8Array(embedBytes));

        // Fit into content rect
        const dims = embedded.scale(1);
        let drawW = contentW;
        let drawH = contentH;

        if (fitMode === 'fit') {
          const scale = Math.min(contentW / dims.width, contentH / dims.height);
          drawW = Math.max(1, Math.round(dims.width * scale));
          drawH = Math.max(1, Math.round(dims.height * scale));
        } else if (fitMode === 'fill') {
          const scale = Math.max(contentW / dims.width, contentH / dims.height);
          drawW = Math.max(1, Math.round(dims.width * scale));
          drawH = Math.max(1, Math.round(dims.height * scale));
        } else {
          drawW = contentW;
          drawH = contentH;
        }

        const x = margin + (contentW - drawW) / 2;
        const y = margin + (contentH - drawH) / 2;

        const page = pdfDoc.addPage([pageW, pageH]);

        // Paint page background (visible on margins / behind transparency)
        const pg = hexToRgb(pageBg);
        page.drawRectangle({
          x: 0,
          y: 0,
          width: pageW,
          height: pageH,
          color: rgb(pg.r / 255, pg.g / 255, pg.b / 255),
        });

        page.drawImage(embedded, { x, y, width: drawW, height: drawH });

        setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: 'completed' } : f)));
        setProgress(Math.round(((idx + 1) / orderedFiles.length) * 100));

        if (idx % 2 === 1) await new Promise((res) => setTimeout(res, 0));
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsConverting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      {/* ✅ Centralized SEO */}
      <ToolSeo {...seo} />

      {/* ✅ Page-specific Helmet */}
      <Helmet>
        <title>PNG to PDF – Convert PNG Images to PDF | FilesNova</title>
        <meta
          name="description"
          content="Convert PNG images to a single PDF with ordering, page size, margins, fit & background color. Fast, private, no watermarks."
        />
        <link rel="canonical" href="https://filesnova.com/tools/png-to-pdf" />
      </Helmet>

      {/* ✅ WebApplication JSON-LD */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'PNG to PDF – Files Nova',
          url: 'https://filesnova.com/tools/png-to-pdf',
          applicationCategory: 'FileConverter',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />

      {/* ✅ BreadcrumbList JSON-LD */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://filesnova.com/' },
            { '@type': 'ListItem', position: 2, name: 'PNG to PDF', item: 'https://filesnova.com/tools/png-to-pdf' },
          ],
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no back arrow; TOOLS on the right) */}
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
                <p className="text-xs text-gray-500 font-medium">PNG to PDF Converter</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Tool Header (unchanged visual) */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <UploadIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">PNG to PDF Converter</h2>
              <p className="text-gray-700 text-lg leading-relaxed">Upload PNG images to create a PDF document</p>
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

          {/* Upload Area (kept), plus unobtrusive advanced controls */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8">
            <div className="p-8">
              <div
                className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
                onClick={() => inputRef.current?.click()}
                onDrop={handleDropZone}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="mb-6">
                  <UploadIcon className="w-16 h-16 mx-auto text-gray-400 group-hover:text-blue-500 group-hover:animate-bounce transition-all" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Drop your files here</h3>
                <p className="text-gray-600 mb-4">or click to browse from your device</p>
                <button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:-translate-y-1">
                  Choose Files
                </button>
                <p className="text-xs text-gray-500 mt-4">Supported formats: PNG</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/png"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {orderedFiles.length > 0 && (
              <div className="border-t border-gray-200 p-8">
                {/* Quick controls (blend with UI) */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-700 whitespace-nowrap">Order</label>
                    <select
                      value={orderMode}
                      onChange={(e) => setOrderMode(e.target.value as OrderMode)}
                      className="p-2 border border-gray-300 rounded-lg bg-white w-full sm:w-56 max-w-full"
                    >
                      <option value="manual">Manual (buttons)</option>
                      <option value="name">By Name (A→Z)</option>
                      <option value="size">By Size (small→large)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-700 whitespace-nowrap">Fit</label>
                    <select
                      value={fitMode}
                      onChange={(e) => setFitMode(e.target.value as FitMode)}
                      className="p-2 border border-gray-300 rounded-lg bg-white w-full sm:w-56 max-w-full"
                    >
                      <option value="fit">Fit (no crop)</option>
                      <option value="fill">Fill (cover)</option>
                      <option value="stretch">Stretch</option>
                    </select>
                  </div>
                </div>

                {/* Advanced options */}
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
                        <label className="block text-sm text-gray-700 mb-1">Page Size</label>
                        <select
                          value={pageSizeKey}
                          onChange={(e) => setPageSizeKey(e.target.value as PageSizeKey)}
                          className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                        >
                          <option value="Auto">Auto (image size)</option>
                          <option value="A4">A4</option>
                          <option value="Letter">Letter</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Orientation</label>
                        <select
                          value={orientation}
                          onChange={(e) => setOrientation(e.target.value as Orientation)}
                          className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                          disabled={pageSizeKey === 'Auto'}
                        >
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Margins</label>
                        <select
                          value={marginPreset}
                          onChange={(e) => setMarginPreset(e.target.value as MarginPreset)}
                          className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                        >
                          <option value="compact">Compact</option>
                          <option value="normal">Normal</option>
                          <option value="wide">Wide</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Page Background</label>
                        <input
                          type="color"
                          value={pageBg}
                          onChange={(e) => setPageBg(e.target.value)}
                          className="h-10 w-14 border rounded-lg"
                          title="Shown around the image and behind transparency"
                        />
                      </div>

                      <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={optimizeToJpeg}
                            onChange={(e) => setOptimizeToJpeg(e.target.checked)}
                          />
                          <span className="text-sm text-gray-700">
                            Optimize size by embedding as JPEG (flattens transparency)
                          </span>
                        </label>

                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            JPEG Quality <span className="font-medium">{jpegQuality}</span>
                          </label>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            step={1}
                            value={jpegQuality}
                            onChange={(e) => setJpegQuality(parseInt(e.target.value))}
                            className="w-full"
                            disabled={!optimizeToJpeg}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mt-6 mb-4">
                  Selected Files ({orderedFiles.length})
                </h3>

                <div className="space-y-4">
                  {orderedFiles.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                          <UploadIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(item.file.size)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {orderMode === 'manual' && (
                          <>
                            <button
                              onClick={() => moveItem(item.id, 'up')}
                              disabled={idx === 0}
                              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40"
                              title="Move up"
                            >
                              <MoveUpRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveItem(item.id, 'down')}
                              disabled={idx === orderedFiles.length - 1}
                              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40"
                              title="Move down"
                            >
                              <MoveDownRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
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

                {/* Conversion Progress */}
                {isConverting && (
                  <div className="mt-8 p-6 bg-blue-50 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold text-blue-900">Converting your files...</span>
                      <span className="text-blue-600 font-bold">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Action Buttons (unchanged look) */}
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={handleConvert}
                    disabled={orderedFiles.length === 0 || isConverting}
                    className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                  >
                    {isConverting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-3"></div>
                        Converting...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 inline mr-3" />
                        Start Conversion
                      </>
                    )}
                  </button>
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      download="images.pdf"
                      className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <DownloadIcon className="w-5 h-5 inline mr-2" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PngToPdfPage;
