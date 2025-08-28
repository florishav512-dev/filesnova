// src/pages/tools/GifToMp4Page.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import {
  Sparkles,
  Film,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  Settings,
  Info
} from 'lucide-react';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import ToolsMenu from '../../components/ToolsMenu';

// ---- dynamic import shim for @ffmpeg/ffmpeg (avoids Rollup named-export validation) ----
type FfmpegNS = typeof import('@ffmpeg/ffmpeg');
let _ffmpegNsPromise: Promise<FfmpegNS> | null = null;
const loadFfmpegNs = () => (_ffmpegNsPromise ??= import('@ffmpeg/ffmpeg'));

type FpsOpt = 'auto' | 24 | 25 | 30 | 50 | 60;
type ScaleOpt = 'auto' | 480 | 720 | 1080; // output width (keeps aspect)
type QualityOpt = 'smaller' | 'balanced' | 'higher'; // maps to CRF/qscale

const GifToMp4Page: React.FC = () => {
  const seo = TOOL_SEO_DATA['/tools/gif-to-mp4'];

  const [file, setFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stepNote, setStepNote] = useState('');

  // Simple options (safe defaults)
  const [fps, setFps] = useState<FpsOpt>('30');
  const [scale, setScale] = useState<ScaleOpt>('auto');
  const [quality, setQuality] = useState<QualityOpt>('balanced');
  const [loopPreview, setLoopPreview] = useState(true);
  const [mutePreview, setMutePreview] = useState(true);

  const ffmpegRef = useRef<any>(null);
  const revokeUrlRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (revokeUrlRef.current) {
        URL.revokeObjectURL(revokeUrlRef.current);
        revokeUrlRef.current = null;
      }
      try { ffmpegRef.current?.exit?.(); } catch {}
    };
  }, []);

  const resetOutput = () => {
    if (revokeUrlRef.current) {
      URL.revokeObjectURL(revokeUrlRef.current);
      revokeUrlRef.current = null;
    }
    setDownloadUrl(null);
  };

  const handleFilesSelected = (fs: File[]) => {
    const f = fs?.[0] || null;
    setFile(f);
    setError(null);
    setProgress(0);
    setStepNote('');
    resetOutput();
  };

  const ensureFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;

    const ffmpegNs: any = await loadFfmpegNs();
    const createFFmpeg = ffmpegNs.createFFmpeg ?? ffmpegNs.default?.createFFmpeg;
    const fetchFile   = ffmpegNs.fetchFile   ?? ffmpegNs.default?.fetchFile;
    if (!createFFmpeg || !fetchFile) throw new Error('FFmpeg wasm exports not found.');

    const ffmpeg = createFFmpeg({
      log: false,
      // Use a stable CDN path; ffmpeg-core.js will fetch wasm/worker from same dir
      corePath: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
    });

    ffmpeg.setProgress(({ ratio }: { ratio?: number }) => {
      const pct = Math.max(0, Math.min(99, Math.round((ratio || 0) * 100)));
      setProgress(pct);
    });

    setStepNote('Loading converter…');
    await ffmpeg.load();
    ffmpeg.__fetchFile = fetchFile;
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const vfChain = useMemo(() => {
    // fps
    const fpsPart = fps === 'auto' ? null : `fps=${fps}`;
    // scale: even dimensions for yuv420p
    const scalePart =
      scale === 'auto'
        ? 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
        : `scale=trunc(${scale}/2)*2:-2`;
    return [fpsPart, scalePart].filter(Boolean).join(',');
  }, [fps, scale]);

  const convert = async () => {
    if (!file) return;

    // Friendly guardrails
    if (file.size > 100 * 1024 * 1024) {
      setError('File is large; try a smaller GIF (<100 MB) to keep the browser happy.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setStepNote('Preparing…');
    resetOutput();

    try {
      const ffmpeg = await ensureFFmpeg();
      const fetchFile = ffmpeg.__fetchFile as (f: File | string) => Promise<Uint8Array>;

      const inName = 'input.gif';
      const outName = 'output.mp4';
      // Write input
      ffmpeg.FS('writeFile', inName, await fetchFile(file));

      // Build args
      const commonArgs = [
        '-i', inName,
        '-vf', vfChain || 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-pix_fmt', 'yuv420p',
        '-movflags', 'faststart',
      ];

      // Quality mapping
      const runH264 = async () => {
        const crf =
          quality === 'smaller'  ? '30' :
          quality === 'higher'   ? '22' :
                                   '28';
        await ffmpeg.run(
          ...commonArgs,
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', crf,
          outName
        );
      };

      const runMpeg4 = async () => {
        const q =
          quality === 'smaller'  ? '5' :
          quality === 'higher'   ? '2' :
                                   '3';
        await ffmpeg.run(
          ...commonArgs,
          '-c:v', 'mpeg4',
          '-qscale:v', q,
          outName
        );
      };

      setStepNote('Converting…');
      try {
        await runH264();
      } catch {
        // Some FFmpeg WASM builds don’t include libx264 (license); fall back gracefully.
        await runMpeg4();
      }

      setStepNote('Finishing…');
      const data = ffmpeg.FS('readFile', outName);

      // Cleanup temp files (best-effort)
      try { ffmpeg.FS('unlink', inName); } catch {}
      try { ffmpeg.FS('unlink', outName); } catch {}

      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      revokeUrlRef.current = url;
      setDownloadUrl(url);
      setProgress(100);
      setStepNote('Done');
    } catch (err: any) {
      console.error(err);
      setError('Failed to convert GIF to MP4. Try a different GIF or adjust options.');
      setProgress(0);
      setStepNote('');
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
          content="Convert GIF animations to MP4—fast, private, and hassle-free. Works in your browser with even-dimension scaling and mobile-friendly output."
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
        {/* Background blobs */}
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
                <p className="text-xs text-gray-500 font-medium">GIF to MP4</p>
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
                <Film className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">GIF to MP4</h2>
              <p className="text-gray-700 text-lg leading-relaxed">Convert GIF animations into MP4 video files in your browser—no upload.</p>
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

          {/* Upload + Options */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload GIF</h3>
            <UploadZone
              accept="image/gif"
              multiple={false}
              title="Drop your GIF here"
              buttonLabel="Choose File"
              supportedFormats="GIF"
              onFilesSelected={handleFilesSelected}
            />

            {/* Options */}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold">Output Settings</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Frames/sec</span>
                    <select
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      value={fps}
                      onChange={(e)=>setFps(e.target.value as FpsOpt)}
                    >
                      <option value="auto">Auto</option>
                      <option value="24">24</option>
                      <option value="25">25</option>
                      <option value="30">30</option>
                      <option value="50">50</option>
                      <option value="60">60</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Width</span>
                    <select
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      value={scale}
                      onChange={(e)=>setScale(e.target.value as ScaleOpt)}
                    >
                      <option value="auto">Original</option>
                      <option value="480">480 px</option>
                      <option value="720">720 px</option>
                      <option value="1080">1080 px</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Quality</span>
                    <select
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      value={quality}
                      onChange={(e)=>setQuality(e.target.value as QualityOpt)}
                    >
                      <option value="smaller">Smaller file</option>
                      <option value="balanced">Balanced</option>
                      <option value="higher">Higher quality</option>
                    </select>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Output uses <code>yuv420p</code> and even dimensions for best compatibility (iOS, players, social).
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-amber-600" />
                  <h4 className="font-semibold">Notes</h4>
                </div>
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                  <li>Conversion is 100% in your browser. Nothing uploads.</li>
                  <li>If H.264 isn’t available in this FFmpeg build, we fall back to MPEG-4 automatically.</li>
                  <li>Very large GIFs can exhaust memory. Keep under ~100 MB for smooth results.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={convert}
              disabled={!file || isProcessing}
              className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Converting…' : 'Convert to MP4'}
            </button>

            {(isProcessing || progress > 0) && (
              <div className="mt-4">
                <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {stepNote && (
                  <div className="mt-2 text-xs text-gray-600 truncate">
                    {stepNote}
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

          {/* Download + Preview */}
          {downloadUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
              <a
                href={downloadUrl}
                download={file?.name.replace(/\.gif$/i, '.mp4') || 'video.mp4'}
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download MP4
              </a>

              {/* Quick preview */}
              <div className="mt-6">
                <video
                  src={downloadUrl}
                  controls
                  playsInline
                  muted={mutePreview}
                  loop={loopPreview}
                  className="w-full rounded-xl border"
                />
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-700">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-blue-600" checked={loopPreview} onChange={(e)=>setLoopPreview(e.target.checked)} />
                    Loop preview
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-blue-600" checked={mutePreview} onChange={(e)=>setMutePreview(e.target.checked)} />
                    Mute preview
                  </label>
                </div>
              </div>
            </div>
          )}

          <AdSpace />
        </div>
      </div>
    </>
  );
};

export default GifToMp4Page;
