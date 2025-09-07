// src/pages/tools/QrScannerPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import jsQR from 'jsqr';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import { ToolSeo } from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import {
  Sparkles,
  ScanLine,
  Shield,
  Zap,
  Star,
  Copy as CopyIcon,
  ExternalLink,
  Flashlight,
  Camera as CameraIcon,
  Settings,
  Trash2,
} from 'lucide-react';
import ToolsMenu from '../../components/ToolsMenu';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';
import FileNovaIconWebp from '../../assets/FILESNOVANEWICON.webp';

type Mode = 'upload' | 'camera';
type Inversion = 'attemptBoth' | 'dontInvert' | 'onlyInvert' | 'invertFirst';

type HistoryItem = { id: string; value: string; ts: number };

const QrScannerPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('upload');

  // Pro options
  const [inversion, setInversion] = useState<Inversion>('attemptBoth');
  const [scanFps, setScanFps] = useState<number>(24);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);

  // Camera controls
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);        // processing (hidden)
  const overlayRef = useRef<HTMLCanvasElement>(null);       // on top of video for guides/bounds
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const { title, description, canonical, breadcrumb } = TOOL_SEO_DATA['/tools/qr-scanner'];

  // ---------- Helpers ----------
  const resetState = () => {
    setResult(null);
    setError(null);
  };

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setTorchSupported(false);
    setTorchOn(false);
  };

  const loadDevices = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const cams = list.filter((d) => d.kind === 'videoinput');
      setDevices(cams);
      if (!deviceId && cams.length) {
        // Prefer back camera if label hints it
        const back = cams.find((d) => /back|rear|environment/i.test(d.label));
        setDeviceId((back || cams[0]).deviceId);
      }
    } catch {
      // ignore
    }
  };

  const applyTorch = async (enable: boolean) => {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (!track) return;
      // @ts-ignore
      const capabilities = track.getCapabilities?.();
      if (capabilities && 'torch' in capabilities) {
        // @ts-ignore
        await track.applyConstraints({ advanced: [{ torch: enable }] });
        setTorchOn(enable);
      }
    } catch {
      setTorchOn(false);
    }
  };

  const startCamera = async () => {
    resetState();
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      // Torch support?
      try {
        const track = stream.getVideoTracks()[0];
        // @ts-ignore
        const caps = track.getCapabilities?.();
        if (caps && 'torch' in caps) setTorchSupported(true);
        else setTorchSupported(false);
      } catch {
        setTorchSupported(false);
      }

      // Prepare overlay to match video
      const overlay = overlayRef.current;
      if (overlay) {
        overlay.width = video.videoWidth || overlay.clientWidth;
        overlay.height = video.videoHeight || overlay.clientHeight;
      }

      // Throttled scanning loop
      const frame = (t: number) => {
        const targetInterval = 1000 / Math.max(1, scanFps);
        if (!lastScanTimeRef.current || t - lastScanTimeRef.current >= targetInterval) {
          lastScanTimeRef.current = t;
          tryScanFrame();
        }
        rafRef.current = requestAnimationFrame(frame);
      };
      rafRef.current = requestAnimationFrame(frame);
    } catch (err) {
      console.error(err);
      setError('Unable to access camera. Please allow permission or use Upload mode.');
      setMode('upload');
      stopCamera();
    }
  };

  const tryScanFrame = () => {
    const v = videoRef.current;
    const canvas = canvasRef.current;
    if (!(v && canvas && v.videoWidth && v.videoHeight)) return;

    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: inversion });

    // Clear overlay
    const overlay = overlayRef.current?.getContext('2d');
    if (overlay) {
      overlay.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);
      if (showOverlay) drawGuide(overlay);
    }

    if (code?.data) {
      if (overlay && showOverlay) drawBoundingBox(overlay, code.location);
      setResult(code.data);
      remember(code.data);
      stopCamera();
    }
  };

  const drawGuide = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    const s = Math.min(width, height) * 0.7;
    const x = (width - s) / 2;
    const y = (height - s) / 2;
    const r = Math.max(12, s * 0.04);
    ctx.strokeStyle = 'rgba(59,130,246,0.9)'; // blue-500
    ctx.lineWidth = Math.max(3, s * 0.01);
    // corner L-shapes
    const L = Math.max(24, s * 0.12);
    // top-left
    ctx.beginPath();
    ctx.moveTo(x, y + L); ctx.lineTo(x, y); ctx.lineTo(x + L, y); ctx.stroke();
    // top-right
    ctx.beginPath();
    ctx.moveTo(x + s - L, y); ctx.lineTo(x + s, y); ctx.lineTo(x + s, y + L); ctx.stroke();
    // bottom-right
    ctx.beginPath();
    ctx.moveTo(x + s, y + s - L); ctx.lineTo(x + s, y + s); ctx.lineTo(x + s - L, y + s); ctx.stroke();
    // bottom-left
    ctx.beginPath();
    ctx.moveTo(x + L, y + s); ctx.lineTo(x, y + s); ctx.lineTo(x, y + s - L); ctx.stroke();
  };

  const drawBoundingBox = (
    ctx: CanvasRenderingContext2D,
    loc: { topLeftCorner: any; topRightCorner: any; bottomRightCorner: any; bottomLeftCorner: any }
  ) => {
    ctx.strokeStyle = 'rgba(16,185,129,0.95)'; // emerald-500
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(loc.topLeftCorner.x, loc.topLeftCorner.y);
    ctx.lineTo(loc.topRightCorner.x, loc.topRightCorner.y);
    ctx.lineTo(loc.bottomRightCorner.x, loc.bottomRightCorner.y);
    ctx.lineTo(loc.bottomLeftCorner.x, loc.bottomLeftCorner.y);
    ctx.closePath();
    ctx.stroke();
  };

  const isLikelyUrl = (val: string) => /^https?:\/\/|^www\./i.test(val);

  const copyResult = async (val?: string) => {
    const v = val ?? result;
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
    } catch { /* ignore */ }
  };

  // History persistence
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fn_qr_history');
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  const remember = (val: string) => {
    const item: HistoryItem = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, value: val, ts: Date.now() };
    const next = [item, ...history].slice(0, 10);
    setHistory(next);
    try { localStorage.setItem('fn_qr_history', JSON.stringify(next)); } catch { /* ignore */ }
  };
  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem('fn_qr_history'); } catch { /* ignore */ }
  };

  // Unmount cleanup
  useEffect(() => () => stopCamera(), []);

  // When device changes, restart camera if in camera mode
  useEffect(() => {
    if (mode === 'camera') startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, inversion, scanFps]);

  // Load devices on first user interaction with camera
  useEffect(() => {
    if (mode === 'camera') loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ---------- UI ----------
  return (
    <>
      <ToolSeo title={title} description={description} canonical={canonical} breadcrumb={breadcrumb} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Decorative background pulses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no back arrow; Tools button on right) */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-">
              <div className="relative shrink-0">
                <picture>
                  <source srcSet={FileNovaIcon} type="image/webp" />
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
                <p className="text-xs text-gray-500 font-medium">QR Scanner</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Hero / badges */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <ScanLine className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">QR Scanner</h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                Upload an image containing a QR code to decode its contents — or scan live using your camera.
              </p>
              <div className="flex flex-wrap gap-3">
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

          {/* Controls */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            {/* Mode toggle */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => {
                  setMode('upload');
                  stopCamera();
                  resetState();
                }}
                className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                  mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-white/60 text-gray-700'
                }`}
              >
                Upload Image
              </button>
              <button
                onClick={() => {
                  setMode('camera');
                  setFile(null);
                  resetState();
                  startCamera();
                }}
                className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                  mode === 'camera' ? 'bg-green-600 text-white' : 'bg-white/60 text-gray-700'
                }`}
              >
                Scan with Camera
              </button>

              {/* Advanced toggle */}
              <span className="ml-auto" />
              <details className="ml-auto w-full sm:w-auto">
                <summary className="list-none inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 hover:bg-white cursor-pointer">
                  <Settings className="w-4 h-4" /> Advanced Options
                </summary>
                <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Inversion Attempts</label>
                    <select
                      value={inversion}
                      onChange={(e) => setInversion(e.target.value as Inversion)}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    >
                      <option value="attemptBoth">Attempt Both</option>
                      <option value="dontInvert">Don’t Invert</option>
                      <option value="onlyInvert">Only Invert</option>
                      <option value="invertFirst">Invert First</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Scan FPS</label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={scanFps}
                      onChange={(e) => setScanFps(Math.min(60, Math.max(5, parseInt(e.target.value) || 24)))}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input
                      id="overlay"
                      type="checkbox"
                      checked={showOverlay}
                      onChange={(e) => setShowOverlay(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="overlay" className="text-sm text-gray-700">Show scan overlay</label>
                  </div>

                  {/* Camera-only options */}
                  {mode === 'camera' && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block text-sm text-gray-700 mb-1">Camera</label>
                        <div className="flex items-center gap-2">
                          <CameraIcon className="w-4 h-4 text-gray-600" />
                          <select
                            className="flex-1 p-2 rounded-lg border border-gray-300 bg-white"
                            value={deviceId ?? ''}
                            onChange={(e) => setDeviceId(e.target.value || null)}
                          >
                            {devices.map((d) => (
                              <option key={d.deviceId} value={d.deviceId}>
                                {d.label || `Camera ${d.deviceId.slice(-4)}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!torchSupported}
                          onClick={() => applyTorch(!torchOn)}
                          className={`w-full inline-flex items-center justify-center px-3 py-2 rounded-xl ${
                            torchOn ? 'bg-yellow-500 text-white' : 'bg-white/70 text-gray-800'
                          } disabled:opacity-50`}
                          title={torchSupported ? 'Toggle flashlight' : 'Flashlight not supported on this camera'}
                        >
                          <Flashlight className="w-4 h-4 mr-2" />
                          {torchOn ? 'Flashlight ON' : 'Flashlight OFF'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </details>
            </div>

            {/* Upload mode */}
            {mode === 'upload' && (
              <>
                <UploadZone
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple={false}
                  title="Drop your image here"
                  buttonLabel="Choose File"
                  supportedFormats="PNG, JPEG, WEBP, GIF"
                  onFilesSelected={(files) => {
                    const f = files[0] || null;
                    setFile(f);
                    setResult(null);
                    setError(null);
                  }}
                />
                <div className="mt-6">
                  <button
                    onClick={async () => {
                      if (!file) return;
                      setIsProcessing(true);
                      resetState();
                      try {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = canvasRef.current!;
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d')!;
                            ctx.drawImage(img, 0, 0);
                            const imageData = ctx.getImageData(0, 0, img.width, img.height);
                            const code = jsQR(imageData.data, img.width, img.height, { inversionAttempts: inversion });
                            if (code?.data) {
                              setResult(code.data);
                              remember(code.data);
                            } else {
                              setError('No QR code detected in the image.');
                            }
                            setIsProcessing(false);
                          };
                          img.onerror = () => {
                            setError('Failed to load image.');
                            setIsProcessing(false);
                          };
                          img.src = reader.result as string;
                        };
                        reader.onerror = () => {
                          setError('Failed to read file.');
                          setIsProcessing(false);
                        };
                        reader.readAsDataURL(file);
                      } catch (err) {
                        console.error(err);
                        setError('Failed to scan QR code.');
                        setIsProcessing(false);
                      }
                    }}
                    disabled={!file || isProcessing}
                    className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Scanning…' : 'Scan Uploaded Image'}
                  </button>
                </div>
              </>
            )}

            {/* Camera mode */}
            {mode === 'camera' && (
              <div className="space-y-6 relative">
                <video ref={videoRef} className="w-full rounded-xl" autoPlay muted playsInline />
                {/* overlay */}
                <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none rounded-xl" />
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    onClick={startCamera}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
                  >
                    Restart Camera
                  </button>
                  <button
                    onClick={stopCamera}
                    className="w-full px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all"
                  >
                    Stop Camera
                  </button>
                </div>
              </div>
            )}

            {/* Hidden processing canvas */}
            <canvas ref={canvasRef} className="hidden" />
            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

          {/* Result */}
          {result && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Result</h3>
              <p className="text-gray-700 break-all mb-4">{result}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => copyResult()}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  title="Copy to clipboard"
                >
                  <CopyIcon className="w-5 h-5 mr-2" />
                  Copy
                </button>
                {isLikelyUrl(result) && (
                  <a
                    href={/^https?:\/\//i.test(result) ? result : `https://${result}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Open
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Scan History */}
          {history.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Recent Scans</h3>
                <button
                  onClick={clearHistory}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/70 hover:bg-white"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
              </div>
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="p-3 rounded-xl bg-gray-50 flex items-center gap-3">
                    <span className="flex-1 break-all text-gray-800">{h.value}</span>
                    <button
                      onClick={() => copyResult(h.value)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      title="Copy"
                    >
                      Copy
                    </button>
                    {isLikelyUrl(h.value) && (
                      <a
                        href={/^https?:\/\//i.test(h.value) ? h.value : `https://${h.value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700"
                        title="Open"
                      >
                        Open
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ad space */}
          <AdSpace />
        </div>
      </div>
    </>
  );
};

export default QrScannerPage;
