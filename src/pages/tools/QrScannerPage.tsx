import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import { ToolSeo } from '../../components/ToolSeo';
import { TOOL_SEO_DATA } from '../../seo/toolSeoData';
import {
  ArrowLeft,
  Sparkles,
  ScanLine,
  Shield,
  Zap,
  Star,
  Copy as CopyIcon,
  ExternalLink,
} from 'lucide-react';

const QrScannerPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

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
  };

  const startCamera = async () => {
    resetState();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      const scanFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.videoWidth && video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);
            if (code && code.data) {
              setResult(code.data);
              stopCamera();
              return;
            }
          }
        }
        rafRef.current = requestAnimationFrame(scanFrame);
      };

      rafRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      console.error(err);
      setError('Unable to access camera. Please allow camera permission or try Upload mode.');
      setMode('upload');
      stopCamera();
    }
  };

  useEffect(() => {
    // Clean up on unmount
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilesSelected = (files: File[]) => {
    const f = files[0] || null;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const scanImage = async () => {
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
          const code = jsQR(imageData.data, img.width, img.height);
          if (code && code.data) {
            setResult(code.data);
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
  };

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
    } catch {
      // ignore
    }
  };

  const isLikelyUrl = (val: string) => /^https?:\/\/|^www\./i.test(val);

  const { title, description, canonical, breadcrumb } = TOOL_SEO_DATA['/tools/qr-scanner'];

  return (
    <>
      <ToolSeo
        title={title}
        description={description}
        canonical={canonical}
        breadcrumb={breadcrumb}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Decorative background pulses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 space-x-4">
              <a href="/" className="p-3 rounded-xl hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </a>
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
                <p className="text-xs text-gray-500 font-medium">QR Scanner</p>
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
            <div className="flex space-x-4 mb-6">
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
            </div>

            {/* Upload mode */}
            {mode === 'upload' && (
              <>
                <UploadZone
                  accept="image/png,image/jpeg"
                  multiple={false}
                  title="Drop your image here"
                  buttonLabel="Choose File"
                  supportedFormats="PNG, JPEG"
                  onFilesSelected={handleFilesSelected}
                />
                <div className="mt-6">
                  <button
                    onClick={scanImage}
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
              <div className="space-y-6">
                <video ref={videoRef} className="w-full rounded-xl" autoPlay muted playsInline />
                <button
                  onClick={stopCamera}
                  className="w-full px-4 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all"
                >
                  Stop Camera
                </button>
              </div>
            )}

            {/* Hidden canvas for processing */}
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
                  onClick={copyResult}
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

          {/* Ad space */}
          <AdSpace />
        </div>
      </div>
    </>
  );
};

export default QrScannerPage;
