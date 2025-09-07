// src/pages/tools/BackgroundRemoverPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import '@tensorflow/tfjs'; // must be loaded once
import * as bodyPix from '@tensorflow-models/body-pix'; // fallback model
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import {
  Sparkles,
  Eraser,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';
import ToolsMenu from '../../components/ToolsMenu';
import { getToolSeoByPath } from '../../components/seo/toolSeoData';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

type SegmenterType = {
  segmentPeople: (input: CanvasImageSource) => Promise<any[]>;
  dispose?: () => void;
};

const MAX_BLUR = 12; // px for preview while processing

const BackgroundRemoverPage: React.FC = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [bpModel, setBpModel] = useState<any>(null);
  const segmenterRef = useRef<SegmenterType | null>(null);

  // live preview
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);   // current original
  const [previewOut, setPreviewOut] = useState<string | null>(null);   // current processed
  const [previewBlur, setPreviewBlur] = useState<number>(0);           // CSS blur based on progress

  const seo = getToolSeoByPath('/tools/background-remover');

  // Try to load body-segmentation, fallback to CDN (prevents Vite import error)
  const loadBodySeg = async () => {
    try {
      const mod = await import('@tensorflow-models/body-segmentation');
      return mod as any;
    } catch {
      const mod = await import(
        /* @vite-ignore */
        'https://esm.sh/@tensorflow-models/body-segmentation@1?external=@tensorflow/tfjs'
      );
      return mod as any;
    }
  };

  // Load primary (MediaPipe Selfie Segmentation) + BodyPix fallback
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const bodySeg = await loadBodySeg();
        const seg = await bodySeg.createSegmenter(
          bodySeg.SupportedModels.MediaPipeSelfieSegmentation,
          {
            runtime: 'mediapipe',
            solutionPath:
              'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
            modelType: 'general',
          }
        );
        if (!canceled) segmenterRef.current = seg as SegmenterType;
      } catch (e) {
        console.warn('SelfieSeg init failed, will rely on BodyPix/color sampling.', e);
      }

      try {
        const loaded = await bodyPix.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          multiplier: 0.75,
          quantBytes: 2,
        });
        if (!canceled) setBpModel(loaded);
      } catch (e) {
        console.warn('BodyPix failed to load.', e);
      }
    })();

    return () => {
      canceled = true;
      try {
        segmenterRef.current?.dispose?.();
      } catch {}
    };
  }, []);

  // ---------- image-mask utilities (1-channel alpha) ----------
  const dilate = (src: Uint8ClampedArray, w: number, h: number) => {
    const out = new Uint8ClampedArray(src.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let m = 0;
        for (let j = -1; j <= 1; j++) {
          for (let i = -1; i <= 1; i++) {
            const xx = Math.min(w - 1, Math.max(0, x + i));
            const yy = Math.min(h - 1, Math.max(0, y + j));
            m = Math.max(m, src[yy * w + xx]);
          }
        }
        out[y * w + x] = m;
      }
    }
    return out;
  };

  const erode = (src: Uint8ClampedArray, w: number, h: number) => {
    const out = new Uint8ClampedArray(src.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let m = 255;
        for (let j = -1; j <= 1; j++) {
          for (let i = -1; i <= 1; i++) {
            const xx = Math.min(w - 1, Math.max(0, x + i));
            const yy = Math.min(h - 1, Math.max(0, y + j));
            m = Math.min(m, src[yy * w + xx]);
          }
        }
        out[y * w + x] = m;
      }
    }
    return out;
  };

  const close3x3 = (src: Uint8ClampedArray, w: number, h: number) =>
    erode(dilate(src, w, h), w, h);

  // Fast separable blur for soft edges
  const blurAlpha = (src: Uint8ClampedArray, w: number, h: number, r = 2) => {
    const tmp = new Uint8ClampedArray(src.length);
    const out = new Uint8ClampedArray(src.length);
    const div = r * 2 + 1;

    // horizontal pass
    for (let y = 0; y < h; y++) {
      let acc = 0;
      for (let x = -r; x <= r; x++) acc += src[y * w + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        tmp[y * w + x] = acc / div;
        const xOut = x - r, xIn = x + r + 1;
        acc += src[y * w + Math.min(w - 1, xIn)] - src[y * w + Math.max(0, xOut)];
      }
    }
    // vertical pass
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = acc / div;
        const yOut = y - r, yIn = y + r + 1;
        acc += tmp[Math.min(h - 1, yIn) * w + x] - tmp[Math.max(0, yOut) * w + x];
      }
    }
    return out;
  };

  // halo cleanup: if very low alpha, darken RGB to kill color fringes
  const despill = (imgData: ImageData, alpha: Uint8ClampedArray) => {
    const d = imgData.data;
    for (let p = 0, i = 0; p < alpha.length; p++, i += 4) {
      const a = alpha[p];
      if (a < 24) {
        d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; // neutralize near-transparent edge
      }
    }
  };

  // solid-color fallback (top-left sampling)
  const removeBackgroundBySampling = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const r0 = data[0], g0 = data[1], b0 = data[2];
    const tolerance = 28;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (
        Math.abs(r - r0) <= tolerance &&
        Math.abs(g - g0) <= tolerance &&
        Math.abs(b - b0) <= tolerance
      ) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  // ---------- core remover with refinement ----------
  const removeBackgroundAI = async (img: HTMLImageElement): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Preferred: MediaPipe Selfie Segmentation
    if (segmenterRef.current) {
      try {
        const segs = await segmenterRef.current.segmentPeople(canvas);
        if (segs && segs[0]) {
          // Make an alpha mask (0..255)
          let alpha: Uint8ClampedArray | null = null;

          try {
            const bodySeg = await loadBodySeg();
            const maskImageData = await bodySeg.toBinaryMask(segs, {
              foregroundThreshold: 0.7,
              edgeBlur: 0,
            });
            alpha = new Uint8ClampedArray(maskImageData.data.length / 4);
            for (let i = 0, j = 3; i < alpha.length; i++, j += 4) alpha[i] = maskImageData.data[j];
          } catch {
            const m: any = (segs[0] as any).mask;
            if (m?.data) {
              alpha = new Uint8ClampedArray(m.width * m.height);
              for (let i = 0; i < alpha.length; i++) alpha[i] = m.data[i] ? 255 : 0;
            }
          }

          if (alpha) {
            const w = canvas.width, h = canvas.height;
            let refined = close3x3(alpha, w, h);     // fill pinholes
            refined = blurAlpha(refined, w, h, 2);   // soft feather

            const imgData = ctx.getImageData(0, 0, w, h);
            despill(imgData, refined);               // kill colored halos

            for (let i = 0, p = 0; i < imgData.data.length; i += 4, p++) {
              imgData.data[i + 3] = refined[p];
            }
            ctx.putImageData(imgData, 0, 0);
            return canvas;
          }
        }
      } catch (e) {
        console.warn('SelfieSeg inference failed, trying BodyPix.', e);
      }
    }

    // Fallback: BodyPix (person-only)
    if (bpModel) {
      try {
        const seg = await bpModel.segmentPerson(canvas, {
          internalResolution: 'high',
          segmentationThreshold: 0.75,
          scoreThreshold: 0.3,
        });
        const mask = seg.data as Uint8Array;
        const w = canvas.width, h = canvas.height;
        let alpha = new Uint8ClampedArray(w * h);
        for (let i = 0; i < alpha.length; i++) alpha[i] = mask[i] ? 255 : 0;

        alpha = close3x3(alpha, w, h);
        alpha = blurAlpha(alpha, w, h, 2);

        const imgData = ctx.getImageData(0, 0, w, h);
        despill(imgData, alpha);
        for (let i = 0, p = 0; i < imgData.data.length; i += 4, p++) {
          imgData.data[i + 3] = alpha[p];
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas;
      } catch (e) {
        console.warn('BodyPix failed, using color sampling.', e);
      }
    }

    // Last resort: solid color background
    removeBackgroundBySampling(ctx, canvas.width, canvas.height);
    return canvas;
  };

  // ---------- conversion & live preview ----------
  const convert = async () => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setPreviewOut(null);
    setError(null);
    try {
      const zip = new JSZip();
      const total = files.length;

      for (let i = 0; i < total; i++) {
        const file = files[i];

        // preview original (first frame)
        const originalUrl = URL.createObjectURL(file);
        setPreviewSrc(originalUrl);

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(file);
        });

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('Failed to load image'));
          image.src = dataUrl;
        });

        // live “processing blur”: from MAX_BLUR -> 0 as progress climbs
        const baseProgress = (i / total) * 100;
        setPreviewBlur(MAX_BLUR * (1 - baseProgress / 100));

        const processedCanvas = await removeBackgroundAI(img);

        const blob: Blob = await new Promise((resolve) =>
          processedCanvas.toBlob((b) => resolve((b as Blob) || new Blob()), 'image/png')
        );

        // update live preview with processed output
        const outUrl = URL.createObjectURL(blob);
        setPreviewOut(outUrl);

        zip.file(file.name.replace(/\.[^.]+$/, '') + '_transparent.png', blob);

        const pct = Math.round(((i + 1) / total) * 100);
        setProgress(pct);
        setPreviewBlur(MAX_BLUR * (1 - pct / 100)); // blur reduces smoothly

        // yield UI
        await new Promise((res) => setTimeout(res, 0));
      }

      const outBlob = await zip.generateAsync({ type: 'blob' });
      setDownloadUrl(URL.createObjectURL(outBlob));
      setPreviewBlur(0);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to remove background');
    }
    setIsProcessing(false);
  };

  // Keep preview blur in sync while progress bar moves
  useEffect(() => {
    if (isProcessing) {
      const b = MAX_BLUR * (1 - progress / 100);
      setPreviewBlur(b < 0 ? 0 : b);
    }
  }, [progress, isProcessing]);

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
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Background Remover – Files Nova',
          url: 'https://filesnova.com/tools/background-remover',
          applicationCategory: 'FileConverter',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://filesnova.com/' },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Background Remover',
              item: 'https://filesnova.com/tools/background-remover',
            },
          ],
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (unchanged) */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-">
              <div className="relative shrink-0">
                <picture>
                  <source srcSet={FileNovaIconWebp} type="image/webp" />
                  <source srcSet={FileNovaIcon} type="image/png" />
                  <img
                    src={FileNovaIcon}
                    alt="Files Nova"
                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                    draggable={false}
                    loading="lazy"
                    width="96"
                    height="96"
                  />
                </picture>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Files Nova
                </h1>
                <p className="text-xs text-gray-500 font-medium">Background Remover</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Hero (unchanged) */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <Eraser className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Background Remover</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Remove solid backgrounds from your images and download transparent PNGs.
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

          {/* Upload card (unchanged structure) */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload Images</h3>

            {/* Subject description (unchanged) */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Describe the subject (optional)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. person, product, pet..."
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-2xl focus:border-blue-500 outline-none bg-white/60 backdrop-blur-sm"
              />
            </div>

            <UploadZone
              accept="image/*"
              multiple={true}
              title="Drop your images here"
              buttonLabel="Choose Files"
              supportedFormats="Image files"
              onFilesSelected={(fs) => {
                const dt = new DataTransfer();
                fs.forEach((file) => dt.items.add(file));
                const list = dt.files;
                setFiles(list && list.length ? list : null);
                setDownloadUrl(null);
                setError(null);
                setPreviewSrc(null);
                setPreviewOut(null);
              }}
            />

            <button
              onClick={convert}
              disabled={!files || files.length === 0 || isProcessing}
              className="w-full mt-6 px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove Backgrounds
            </button>

            {isProcessing && (
              <div className="mt-4 w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}

            {/* Live Preview — same card, minimal footprint */}
            {(previewSrc || previewOut) && (
              <div className="mt-6 border border-dashed border-gray-300 rounded-2xl p-4 bg-white/60 backdrop-blur-sm">
                <p className="text-sm text-gray-600 mb-2">
                  Live Preview {isProcessing ? '(processing…) ' : ''} 
                </p>
                <div className="relative w-full overflow-hidden rounded-xl">
                  {/* show processed if present, else original */}
                  <img
                    src={previewOut ?? previewSrc ?? ''}
                    alt="Preview"
                    className="w-full h-auto block transition-filter duration-300"
                    style={{ filter: `blur(${previewBlur.toFixed(2)}px)` }}
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="px-3 py-1 text-xs font-semibold rounded-full bg-white/70 text-gray-700 shadow">
                        Enhancing… {progress}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

          {/* Download card (unchanged) */}
          {downloadUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
              <a
                href={downloadUrl}
                download="transparent-images.zip"
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

export default BackgroundRemoverPage;
 </div>
    </>
  );
};

export default BackgroundRemoverPage;
