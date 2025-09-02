// src/pages/tools/GifToMp4Page.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import { Sparkles, Film, Shield, Zap, Star, Download as DownloadIcon } from 'lucide-react';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import ToolsMenu from '../../components/ToolsMenu';

// ---- dynamic import shim for @ffmpeg/ffmpeg (avoids Rollup named-export validation) ----
type FfmpegNS = typeof import('@ffmpeg/ffmpeg');
let _ffmpegNsPromise: Promise<FfmpegNS> | null = null;
const loadFfmpegNs = () => (_ffmpegNsPromise ??= import('@ffmpeg/ffmpeg'));

const GifToMp4Page: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const seo = TOOL_SEO_DATA['/tools/gif-to-mp4'];

  const ffmpegRef = useRef<any>(null);
  const revokeUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (revokeUrlRef.current) {
        URL.revokeObjectURL(revokeUrlRef.current);
        revokeUrlRef.current = null;
      }
      // optional: terminate worker if supported
      try { ffmpegRef.current?.exit?.(); } catch {}
    };
  }, []);

  const ensureFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;

    const ffmpegNs: any = await loadFfmpegNs();
    // Support both shapes: ESM named exports and default-exported namespace
    const createFFmpeg =
      ffmpegNs.createFFmpeg ?? ffmpegNs.default?.createFFmpeg;
    const fetchFile =
      ffmpegNs.fetchFile ?? ffmpegNs.default?.fetchFile;

    if (!createFFmpeg || !fetchFile) {
      throw new Error('FFmpeg wasm exports not found. Check @ffmpeg/ffmpeg version.');
    }

    const ffmpeg = createFFmpeg({
      log: false,
      // Use a stable CDN path so Netlify can fetch the core files
      corePath: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
    });

    // ✅ Correct progress hook
    ffmpeg.setProgress(({ ratio }: { ratio?: number }) => {
      const pct = Math.max(0, Math.min(99, Math.round((ratio || 0) * 100)));
      setProgress(pct);
    });

    await ffmpeg.load();
    // stash helpers
    ffmpeg.__fetchFile = fetchFile;
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const handleFilesSelected = (fs: File[]) => {
    const f = fs?.[0] || null;
    setFile(f);
    setError(null);
    setProgress(0);
    if (revokeUrlRef.current) {
      URL.revokeObjectURL(revokeUrlRef.current);
      revokeUrlRef.current = null;
    }
    setDownloadUrl(null);
  };

  const convert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    try {
      const ffmpeg = await ensureFFmpeg();
      const fetchFile = ffmpeg.__fetchFile as (f: File | string) => Promise<Uint8Array>;

      const inName = 'input.gif';
      const outName = 'output.mp4';

      // Write input GIF into the ffmpeg FS
      ffmpeg.FS('writeFile', inName, await fetchFile(file));

      // Common args
      const commonArgs = [
        '-i', inName,
        '-vf', 'fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-pix_fmt', 'yuv420p',
        '-movflags', 'faststart',
      ];

      // Try H.264, fall back to MPEG-4 if not in the wasm build
      try {
        await ffmpeg.run(
          ...commonArgs,
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '28',
          outName
        );
      } catch {
        await ffmpeg.run(
          ...commonArgs,
          '-c:v', 'mpeg4',
          '-qscale:v', '3',
          outName
        );
      }

      const data = ffmpeg.FS('readFile', outName);
      // clean temp files (non-fatal if they’re missing)
      try { ffmpeg.FS('unlink', inName); } catch {}
      try { ffmpeg.FS('unlink', outName); } catch {}

      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      revokeUrlRef.current = url;
      setDownloadUrl(url);
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError('Failed to convert GIF to MP4. Please try another file.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <ToolSeo {...seo} />
      <Helmet>
        <title>GIF to MP4 – Convert GIF Animations to MP4 Video | FilesNova</title>
        <meta
          name="description"
          content="Convert GIF animations into MP4 video files instantly. Fast, free, and secure—no watermarks or signup required."
        />
        <link rel="canonical" href="https://filesnova.com/tools/gif-to-mp4" />
      </Helmet>

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "GIF to MP4 – FilesNova",
        "url": "https://filesnova.com/tools/gif-to-mp4",
        "applicationCategory": "FileConverter",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      }} />

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://filesnova.com/" },
          { "@type": "ListItem", "position": 2, "name": "GIF to MP4", "item": "https://filesnova.com/tools/gif-to-mp4" }
        ]
      }} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from	pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no back arrow) */}
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
                <p className="text-xs text-gray-500 font-medium">GIF to MP4</p>
              </div>

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
                <Film className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">GIF to MP4</h2>
              <p className="text-gray-700 text-lg leading-relaxed">Convert GIF animations into MP4 video files.</p>
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload GIF File</h3>
            <UploadZone
              accept="image/gif"
              multiple={false}
              title="Drop your GIF here"
              buttonLabel="Choose File"
              supportedFormats="GIF"
              onFilesSelected={handleFilesSelected}
            />
            <button
              onClick={convert}
              disabled={!file || isProcessing}
              className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Converting…' : 'Convert to MP4'}
            </button>

            {isProcessing && (
              <div className="mt-4 w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all animate-pulse"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

          {downloadUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
              <a
                href={downloadUrl}
                download={file?.name.replace(/\.gif$/i, '.mp4') || 'video.mp4'}
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download MP4
              </a>
            </div>
          )}

          <AdSpace />
        </div>
      </div>
    </>
  );
};

export default GifToMp4Page;
