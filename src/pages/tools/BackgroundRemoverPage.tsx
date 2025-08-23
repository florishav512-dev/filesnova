// src/pages/tools/BackgroundRemoverPage.tsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs';
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

import ToolsMenu from '../../components/ToolsMenu'; // ✅ Right-side Tools dropdown
import { getToolSeoByPath } from '../../components/seo/toolSeoData'; // ✅ Safe SEO resolver

/**
 * BackgroundRemoverPage removes a uniform background colour from images.
 * It tries BodyPix person segmentation; if unavailable, falls back to
 * simple colour sampling (top-left pixel).
 */
const BackgroundRemoverPage: React.FC = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [model, setModel] = useState<any>(null);

  // ✅ Centralized SEO (prevents undefined crashes)
  const seo = getToolSeoByPath('/tools/background-remover');

  // Load the BodyPix model once on mount
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const loaded = await bodyPix.load();
        if (!canceled) setModel(loaded);
      } catch (e) {
        console.error('Failed to load BodyPix model', e);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  const removeBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    // sample top-left pixel as background
    const r0 = data[0],
      g0 = data[1],
      b0 = data[2];
    const tolerance = 30;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (
        Math.abs(r - r0) <= tolerance &&
        Math.abs(g - g0) <= tolerance &&
        Math.abs(b - b0) <= tolerance
      ) {
        data[i + 3] = 0; // make transparent
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const removeBackgroundAI = async (img: HTMLImageElement): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0);

    if (model) {
      try {
        const segmentation = await model.segmentPerson(canvas, {
          internalResolution: 'medium',
          segmentationThreshold: 0.7,
        });
        const { data: mask } = segmentation;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        for (let i = 0; i < mask.length; i++) {
          if (mask[i] === 0) {
            pixels[i * 4 + 3] = 0; // make background transparent
          }
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
      } catch (e) {
        console.warn('AI segmentation failed, falling back to colour sampling', e);
      }
    }

    // Fallback to simple colour sampling
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = img.width;
    fallbackCanvas.height = img.height;
    const fctx = fallbackCanvas.getContext('2d');
    if (!fctx) throw new Error('Canvas not supported');
    fctx.drawImage(img, 0, 0);
    removeBackground(fctx, img.width, img.height);
    return fallbackCanvas;
  };

  const convert = async () => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const zip = new JSZip();
      let processed = 0;
      const total = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject('Failed to read image');
          reader.readAsDataURL(file);
        });

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject('Failed to load image');
          image.src = dataUrl;
        });

        const processedCanvas = await removeBackgroundAI(img);
        const blob: Blob = await new Promise((resolve) =>
          processedCanvas.toBlob((b) => resolve(b as Blob), 'image/png')
        );

        zip.file(file.name.replace(/\.[^.]+$/, '') + '_transparent.png', blob);
        processed++;
        setProgress(Math.round((processed / total) * 100));
        await new Promise((res) => setTimeout(res, 0)); // yield to UI
      }

      const outBlob = await zip.generateAsync({ type: 'blob' });
      setDownloadUrl(URL.createObjectURL(outBlob));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to remove background');
    }
    setIsProcessing(false);
  };

  return (
    <>
      {/* ✅ Single, safe Helmet block driven by centralized SEO data */}
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />

        {/* Open Graph / Twitter */}
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

        {/* Header: back arrow removed, Tools menu at right */}
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
                <p className="text-xs text-gray-500 font-medium">Background Remover</p>
              </div>

              {/* ✅ Pin Tools to the far right */}
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
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

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload Images</h3>

            {/* Subject description */}
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

            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

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

          {/* Ad space below the conversion area */}
          <AdSpace />
        </div>
      </div>
    </>
  );
};

export default BackgroundRemoverPage;
