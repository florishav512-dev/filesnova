// src/pages/tools/JpgToPdfPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import { PDFDocument, rgb } from 'pdf-lib';
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
  Settings,
  Info,
  Image as ImageIcon,
} from 'lucide-react';

import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import ToolsMenu from '../../components/ToolsMenu';

type FileItem = { id: string; file: File; status: 'ready' | 'completed' };

type PageSizeKey = 'Auto' | 'A4' | 'Letter';
type Orientation = 'portrait' | 'landscape';
type MarginPreset = 'compact' | 'normal' | 'wide';
type FitMode = 'fit' | 'fill' | 'stretch';
type OrderMode = 'manual' | 'name' | 'size';

const PAGE_SIZES: Record<Exclude<PageSizeKey, 'Auto'>, { w: number; h: number }> = {
  A4: { w: 595.28, h: 841.89 },     // exact A4 points
  Letter: { w: 612, h: 792 },
};

const marginValue = (m: MarginPreset) => (m === 'compact' ? 24 : m === 'wide' ? 72 : 48);

// --- EXIF helpers (minimal JPEG EXIF parse for Orientation + Resolution) ---
type ExifInfo = { orientation?: number; xRes?: number; yRes?: number; resUnit?: number };
const readExif = (buf: ArrayBuffer): ExifInfo => {
  // Tiny parser: reads APP1 EXIF TIFF IFD0 entries we care about.
  try {
    const dv = new DataView(buf);
    // JPEG starts with 0xFFD8
    if (dv.getUint16(0) !== 0xffd8) return {};
    let offset = 2;
    while (offset + 4 <= dv.byteLength) {
      const marker = dv.getUint16(offset);
      offset += 2;
      if (marker === 0xffe1) { // APP1
        const size = dv.getUint16(offset); offset += 2;
        if (offset + size - 2 > dv.byteLength) break;
        // Check "Exif\0\0"
        if (
          dv.getUint8(offset) === 0x45 && dv.getUint8(offset + 1) === 0x78 &&
          dv.getUint8(offset + 2) === 0x69 && dv.getUint8(offset + 3) === 0x66 &&
          dv.getUint8(offset + 4) === 0x00 && dv.getUint8(offset + 5) === 0x00
        ) {
          const tiff = offset + 6;
          const little = dv.getUint16(tiff) === 0x4949;
          const get16 = (p: number) => little ? dv.getUint16(p, true) : dv.getUint16(p, false);
          const get32 = (p: number) => little ? dv.getUint32(p, true) : dv.getUint32(p, false);

          const ifd0 = tiff + get32(tiff + 4);
          const count = get16(ifd0);
          let orientation: number | undefined;
          let xRes: number | undefined;
          let yRes: number | undefined;
          let resUnit: number | undefined;

          for (let i = 0; i < count; i++) {
            const entry = ifd0 + 2 + i * 12;
            const tag = get16(entry);
            const type = get16(entry + 2);
            const num = get32(entry + 4);
            const valOff = entry + 8;
            const valuePtr = (type === 3 && num === 1) || (type === 1 && num <= 4) ? valOff : tiff + get32(valOff);

            if (tag === 0x0112) { // Orientation
              orientation = get16(valuePtr);
            } else if (tag === 0x011a) { // XResolution (RATIONAL)
              const nume = get32(valuePtr);
              const deno = get32(valuePtr + 4) || 1;
              xRes = nume / deno;
            } else if (tag === 0x011b) { // YResolution
              const nume = get32(valuePtr);
              const deno = get32(valuePtr + 4) || 1;
              yRes = nume / deno;
            } else if (tag === 0x0128) { // ResolutionUnit (2 = inch, 3 = cm)
              resUnit = get16(valuePtr);
            }
          }
          return { orientation, xRes, yRes, resUnit };
        }
        offset += size - 2;
      } else if ((marker & 0xff00) !== 0xff00) {
        break; // not a marker; bail
      } else if (marker === 0xffda /* SOS */ || marker === 0xffd9 /* EOI */) {
        break;
      } else {
        const size = dv.getUint16(offset); offset += 2 + size - 2;
      }
    }
  } catch { /* ignore */ }
  return {};
};

// Canvas draw with EXIF orientation fix
const drawOriented = (img: HTMLImageElement | ImageBitmap, orientation?: number) => {
  const w = 'width' in img ? (img as any).width : (img as HTMLImageElement).naturalWidth;
  const h = 'height' in img ? (img as any).height : (img as HTMLImageElement).naturalHeight;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  // default
  canvas.width = w; canvas.height = h;

  // Orientation transforms 2..8
  switch (orientation) {
    case 2: canvas.width = w; canvas.height = h; ctx.translate(w, 0); ctx.scale(-1, 1); break;                 // flip X
    case 3: canvas.width = w; canvas.height = h; ctx.translate(w, h); ctx.rotate(Math.PI); break;               // 180
    case 4: canvas.width = w; canvas.height = h; ctx.translate(0, h); ctx.scale(1, -1); break;                  // flip Y
    case 5: canvas.width = h; canvas.height = w; ctx.rotate(0.5 * Math.PI); ctx.scale(1, -1); break;            // 90 CW + flip Y
    case 6: canvas.width = h; canvas.height = w; ctx.rotate(0.5 * Math.PI); ctx.translate(0, -h); break;        // 90 CW
    case 7: canvas.width = h; canvas.height = w; ctx.rotate(0.5 * Math.PI); ctx.translate(w, -h); ctx.scale(-1, 1); break; // 90 CW + flip X
    case 8: canvas.width = h; canvas.height = w; ctx.rotate(-0.5 * Math.PI); ctx.translate(-w, 0); break;       // 90 CCW
    default: /* do nothing */ ;
  }
  // draw
  // @ts-ignore
  ctx.drawImage(img as any, 0, 0);
  return canvas;
};

const JpgToPdfPage: React.FC = () => {
  const seo = TOOL_SEO_DATA['/tools/jpg-to-pdf'];

  const [files, setFiles] = useState<FileItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const revokeUrlRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Advanced, persisted options
  const [orderMode, setOrderMode] = useState<OrderMode>('manual');
  const [pageSizeKey, setPageSizeKey] = useState<PageSizeKey>('Auto');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal');
  const [fitMode, setFitMode] = useState<FitMode>('fit');
  const [jpegQuality, setJpegQuality] = useState<number>(85); // 10..100
  const [pageBg, setPageBg] = useState<string>('#ffffff');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [compressPng, setCompressPng] = useState<boolean>(false); // new: option to recompress PNG as JPEG
  const [stepNote, setStepNote] = useState<string>('');

  useEffect(() => () => {
    if (revokeUrlRef.current) {
      URL.revokeObjectURL(revokeUrlRef.current);
      revokeUrlRef.current = null;
    }
  }, []);

  // Load & Save user prefs
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fn_jpg2pdf_settings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.orderMode) setOrderMode(s.orderMode);
      if (s.pageSizeKey) setPageSizeKey(s.pageSizeKey);
      if (s.orientation) setOrientation(s.orientation);
      if (s.marginPreset) setMarginPreset(s.marginPreset);
      if (s.fitMode) setFitMode(s.fitMode);
      if (typeof s.jpegQuality === 'number') setJpegQuality(s.jpegQuality);
      if (typeof s.pageBg === 'string') setPageBg(s.pageBg);
      if (typeof s.compressPng === 'boolean') setCompressPng(s.compressPng);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        'fn_jpg2pdf_settings',
        JSON.stringify({
          orderMode, pageSizeKey, orientation, marginPreset, fitMode,
          jpegQuality, pageBg, compressPng,
        })
      );
    } catch {}
  }, [orderMode, pageSizeKey, orientation, marginPreset, fitMode, jpegQuality, pageBg, compressPng]);

  // Ordering helpers
  const orderedFiles = useMemo(() => {
    if (orderMode === 'manual') return files;
    const copy = [...files];
    if (orderMode === 'name') copy.sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true }));
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

  // Upload/Drop
  const acceptTypes = "image/jpeg,image/jpg,image/png";
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const imgs = Array.from(selected).filter((file) => /image\/(jpeg|png)/i.test(file.type));
    addFiles(imgs);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files;
    const imgs = Array.from(dropped).filter((file) => /image\/(jpeg|png)/i.test(file.type));
    addFiles(imgs);
  };
  const addFiles = (imgs: File[]) => {
    const mapped = imgs.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status: 'ready' as const,
    }));
    setFiles((prev) => [...prev, ...mapped]);
  };
  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  // Utils
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };
  const hexToRgb = (hex: string) => {
    const m = hex.replace('#', '');
    const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
    const bigint = parseInt(full, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  };

  // Convert pixels → PDF points using EXIF DPI (fallback 72)
  const pxToPt = (px: number, dpi: number | undefined) => (px / (dpi || 72)) * 72;

  // Core: Images -> PDF
  const handleConvert = async () => {
    if (orderedFiles.length === 0) return;
    setIsConverting(true);
    setPdfUrl(null);
    if (revokeUrlRef.current) {
      URL.revokeObjectURL(revokeUrlRef.current);
      revokeUrlRef.current = null;
    }
    setProgress(0);
    setStepNote('Preparing…');

    try {
      const pdfDoc = await PDFDocument.create();

      for (let idx = 0; idx < orderedFiles.length; idx++) {
        const item = orderedFiles[idx];
        const f = item.file;
        setStepNote(`Loading ${f.name}…`);

        // Read first chunk for EXIF & density
        let exif: ExifInfo = {};
        if (/image\/jpeg/i.test(f.type)) {
          const head = await f.slice(0, 128 * 1024).arrayBuffer();
          exif = readExif(head);
        }

        // Load image efficiently
        const tmpUrl = URL.createObjectURL(f);
        // Use ImageBitmap when available for faster decode; fallback to HTMLImageElement
        let canvas: HTMLCanvasElement;
        try {
          const bitmap = await (window.createImageBitmap
            ? window.createImageBitmap(await fetch(tmpUrl).then(r => r.blob()))
            : null);
          if (bitmap) {
            canvas = drawOriented(bitmap, exif.orientation);
            bitmap.close?.();
          } else {
            const img = new Image();
            (img as any).decoding = 'async';
            img.src = tmpUrl;
            await img.decode();
            canvas = drawOriented(img, exif.orientation);
          }
        } finally {
          URL.revokeObjectURL(tmpUrl);
        }

        const srcW = canvas.width;
        const srcH = canvas.height;

        // Decide page size
        let pageW: number, pageH: number;
        if (pageSizeKey === 'Auto') {
          // Use physical size if EXIF DPI present (2=inches, 3=cm)
          const unit = exif.resUnit; // 2=in, 3=cm; others treated as pixels per inch
          const xDpi = exif.xRes && unit === 3 ? exif.xRes * 2.54 : exif.xRes; // convert px/cm -> px/in
          const yDpi = exif.yRes && unit === 3 ? exif.yRes * 2.54 : exif.yRes;
          pageW = Math.max(1, pxToPt(srcW, xDpi));
          pageH = Math.max(1, pxToPt(srcH, yDpi));
        } else {
          const base = PAGE_SIZES[pageSizeKey];
          const rotated = orientation === 'landscape' ? { w: base.h, h: base.w } : base;
          pageW = rotated.w;
          pageH = rotated.h;
        }

        const margin = marginValue(marginPreset);
        const contentW = Math.max(1, pageW - margin * 2);
        const contentH = Math.max(1, pageH - margin * 2);

        // Embed image
        let imageRef;
        if (/image\/png/i.test(f.type) && !compressPng) {
          // Keep PNG lossless
          const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
          const arr = await blob.arrayBuffer();
          imageRef = await pdfDoc.embedPng(arr);
        } else {
          // JPEG re-encode for size control (also converts PNG to JPEG when compressPng=true)
          const jpegBlob: Blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', Math.min(1, Math.max(0.1, jpegQuality / 100)))
          );
          const arr = await jpegBlob.arrayBuffer();
          imageRef = await pdfDoc.embedJpg(arr);
        }

        // Compute drawing rect
        const dims = imageRef.scale(1);
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
        } // else 'stretch' uses full contentW/H

        const x = margin + (contentW - drawW) / 2;
        const y = margin + (contentH - drawH) / 2;

        const page = pdfDoc.addPage([pageW, pageH]);

        // Page background (visible margins)
        const bg = hexToRgb(pageBg);
        page.drawRectangle({
          x: 0, y: 0, width: pageW, height: pageH,
          color: rgb(bg.r / 255, bg.g / 255, bg.b / 255),
        });

        page.drawImage(imageRef, { x, y, width: drawW, height: drawH });

        setFiles((prev) => prev.map((f2) => (f2.id === item.id ? { ...f2, status: 'completed' } : f2)));
        setProgress(Math.round(((idx + 1) / orderedFiles.length) * 100));
        if (idx % 2 === 1) await new Promise((res) => setTimeout(res, 0));
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      revokeUrlRef.current = url;
      setPdfUrl(url);
      setStepNote('Done');
    } catch (e) {
      console.error(e);
      setStepNote('');
      alert('Failed to convert images. Try fewer files or lower quality.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <>
      {/* SEO */}
      <ToolSeo {...seo} />
      <Helmet>
        <title>JPG to PDF – Convert Images to PDF (Fast, High-Quality) | FilesNova</title>
        <meta
          name="description"
          content="Convert multiple JPG/PNG images to a single PDF with page size, margins, orientation, ordering, and compression. Fast, private, no upload."
        />
        <link rel="canonical" href="https://filesnova.com/tools/jpg-to-pdf" />
      </Helmet>

      {/* WebApplication schema */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'JPG to PDF – Files Nova',
        url: 'https://filesnova.com/tools/jpg-to-pdf',
        applicationCategory: 'FileConverter',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      }} />
      {/* Breadcrumb */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://filesnova.com/' },
          { '@type': 'ListItem', position: 2, name: 'JPG to PDF', item: 'https://filesnova.com/tools/jpg-to-pdf' },
        ],
      }} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Background Pulses */}
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
                <p className="text-xs text-gray-500 font-medium">JPG to PDF Converter</p>
              </div>

              <div className="ml-auto">
                <ToolsMenu />
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
                <UploadIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">JPG to PDF Converter</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert your JPG/PNG images to a single, high-quality PDF — with full control over size, layout, and compression.
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

          {/* Upload Area */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8">
            <div className="p-8">
              <div
                className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="mb-6">
                  <ImageIcon className="w-16 h-16 mx-auto text-gray-400 group-hover:text-blue-500 group-hover:animate-bounce transition-all" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Drop your images here</h3>
                <p className="text-gray-600 mb-4">or click to browse from your device</p>
                <button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:-translate-y-1">
                  Choose Files
                </button>
                <p className="text-xs text-gray-500 mt-4">Supported formats: JPG, JPEG, PNG</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept={acceptTypes}
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {orderedFiles.length > 0 && (
              <div className="border-t border-gray-200 p-8">
                {/* Quick controls */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-700 whitespace-nowrap">Order</label>
                    <select
                      value={orderMode}
                      onChange={(e) => setOrderMode(e.target.value as OrderMode)}
                      className="p-2 border border-gray-300 rounded-lg bg-white w-full md:w-56 max-w-full"
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
                      className="p-2 border border-gray-300 rounded-lg bg-white w-full md:w-56 max-w-full"
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
                          <option value="Auto">Auto (use image DPI)</option>
                          <option value="A4">A4</option>
                          <option value="Letter">Letter</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          “Auto” uses EXIF DPI when present; otherwise assumes 72 DPI.
                        </p>
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
                        <label className="block text-sm text-gray-700 mb-1">
                          JPEG Quality: <span className="font-medium">{jpegQuality}</span>
                        </label>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          step={1}
                          value={jpegQuality}
                          onChange={(e) => setJpegQuality(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <input
                            id="compressPng"
                            type="checkbox"
                            className="accent-blue-600"
                            checked={compressPng}
                            onChange={(e) => setCompressPng(e.target.checked)}
                          />
                          <label htmlFor="compressPng" className="text-sm text-gray-700">
                            Re-compress PNG as JPEG (smaller PDF; removes transparency)
                          </label>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="block text-sm text-gray-700">Page Background (for margins)</label>
                          <input
                            type="color"
                            value={pageBg}
                            onChange={(e) => setPageBg(e.target.value)}
                            className="h-10 w-14 border rounded-lg"
                            title="Sets the visible margin color on each page"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 p-3 rounded-lg bg-yellow-50 text-xs text-yellow-900 border border-yellow-200">
                        <b>Tip:</b> We auto-fix camera rotation via EXIF. If your image looks sideways elsewhere,
                        export again — the PDF should be correct here.
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
                          <p className="text-sm text-gray-500">{formatFileSize(item.file.size)} · {(item.file.type || '').replace('image/','').toUpperCase()}</p>
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
                      <span className="font-bold text-blue-900">Converting your files…</span>
                      <span className="text-blue-600 font-bold">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {stepNote && <div className="mt-2 text-xs text-blue-900">{stepNote}</div>}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <button
                    onClick={handleConvert}
                    disabled={orderedFiles.length === 0 || isConverting}
                    className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                  >
                    {isConverting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-3"></div>
                        Converting…
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
                      className="flex-1 bg-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <DownloadIcon className="w-5 h-5 inline mr-2" />
                      Download PDF
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

export default JpgToPdfPage;
