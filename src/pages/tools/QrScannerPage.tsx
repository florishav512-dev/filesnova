import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import UploadZone from '../../components/UploadZone';
import {
  ArrowLeft,
  Sparkles,
  ScanLine,
  Shield,
  Zap,
  Star,
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

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    setError(null);
  };

  // Scan uploaded image for QR
  const scanImage = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);
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
          if (code) {
            setResult(code.data);
          } else {
            setError('No QR code detected');
          }
          setIsProcessing(false);
        };
        img.onerror = () => {
          setError('Failed to load image');
          setIsProcessing(false);
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError('Failed to scan QR code');
      setIsProcessing(false);
    }
  };

  // Start camera for live scanning
  const startCamera = async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      console.error(err);
      setError('Unable to access camera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // Live scan frames
  useEffect(() => {
    let animationId: number;
    const scanFrame = () => {
      if (mode === 'camera') {
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
            if (code) {
              setResult(code.data);
              stopCamera();
              return;
            }
          }
        }
        animationId = requestAnimationFrame(scanFrame);
      }
    };
    if (mode === 'camera') scanFrame();
    return () => cancelAnimationFrame(animationId);
  }, [mode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
      {/* Header and hero omitted for brevity, keep unchanged */}

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl mr-4">
              <ScanLine className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900">QR Scanner</h2>
          </div>
          <p className="text-gray-700 text-lg mb-6">Choose how you'd like to scan:</p>

          {/* Mode Tabs */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => { setMode('upload'); stopCamera(); setResult(null); setError(null); }}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors ${mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-white/60 text-gray-700'}`}
            >
              Upload Image
            </button>
            <button
              onClick={() => { setMode('camera'); setFile(null); setResult(null); setError(null); startCamera(); }}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors ${mode === 'camera' ? 'bg-green-600 text-white' : 'bg-white/60 text-gray-700'}`}
            >
              Scan QR Code
            </button>
          </div>

          {/* Conditional Content */}
          {mode === 'upload' ? (
            <>
              <UploadZone
                accept="image/png,image/jpeg"
                multiple={false}
                title="Drop your image here"
                buttonLabel="Choose File"
                supportedFormats="PNG, JPEG"
                onFilesSelected={(fs) => setFile(fs[0] || null)}
              />
              <div className="mt-6">
                <button
                  onClick={scanImage}
                  disabled={!file || isProcessing}
                  className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'Scanning...' : 'Scan Uploaded Image'}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div>
                <video ref={videoRef} className="w-full rounded-xl mb-4" autoPlay muted playsInline />
                <button
                  onClick={stopCamera}
                  className="w-full px-4 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all"
                >
                  Stop Camera
                </button>
              </div>
            </div>
          )}

          {/* Canvas for processing frames */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Error Message */}
          {error && <p className="text-red-600 mt-4">{error}</p>}
        </div>

        {/* Result Section */}
        {result && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Result</h3>
            <p className="text-gray-700 break-all">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrScannerPage;
