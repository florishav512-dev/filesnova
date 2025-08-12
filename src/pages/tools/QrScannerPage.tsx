import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import { ToolSeo } from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
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
            if (code?.data) {
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

  useEffect(() => () => stopCamera(), []);

  const handleFilesSelected = (files: File[]) => {
    const f = files[0] || null;
    setFile(f);
    resetState();
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
          if (code?.data) {
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

      {/* UI remains unchanged */}
      {/* ... (rest of your JSX exactly as you posted it) ... */}
    </>
  );
};

export default QrScannerPage;
