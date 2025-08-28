import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { ArrowLeft, Sparkles, ScanLine, Shield, Zap, Star } from 'lucide-react';

interface QrScannerState {
  file: File | null;
  result: string | null;
  isProcessing: boolean;
  error: string | null;
  mode: 'upload' | 'camera';
}

const QrScannerPage: React.FC = () => {
  const [state, setState] = useState<QrScannerState>({
    file: null,
    result: null,
    isProcessing: false,
    error: null,
    mode: 'upload'
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setState(prev => ({ ...prev, error: 'File size must be less than 10MB' }));
        return;
      }
      if (!file.type.startsWith('image/')) {
        setState(prev => ({ ...prev, error: 'Please upload an image file' }));
        return;
      }
    }
    setState(prev => ({ ...prev, file, result: null, error: null }));
  };

  const scanImage = async () => {
    const { file } = state;
    if (!file) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null, result: null }));
    
    let imageUrl: string | null = null;
    try {
      imageUrl = URL.createObjectURL(file);
      const img = new Image();
      
      const imageLoadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
      });

      img.src = imageUrl;
      await imageLoadPromise;

      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      
      const code = jsQR(imageData.data, img.width, img.height);
      
      if (code) {
        setState(prev => ({ ...prev, result: code.data }));
      } else {
        throw new Error('No QR code detected');
      }
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to scan QR code'
      }));
    } finally {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const startCamera = async () => {
    setState(prev => ({ ...prev, error: null, result: null }));
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('Video element not available');

      video.srcObject = stream;
      await video.play();
      
      setState(prev => ({ ...prev, mode: 'camera' }));
    } catch (err) {
      console.error('Camera access error:', err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Unable to access camera',
        mode: 'upload' 
      }));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    let animationId: number;
    
    const scanFrame = () => {
      if (state.mode === 'camera') {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (video?.readyState === video.HAVE_ENOUGH_DATA && canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);
            
            if (code) {
              setState(prev => ({ ...prev, result: code.data }));
              stopCamera();
              return;
            }
          }
        }
        animationId = requestAnimationFrame(scanFrame);
      }
    };

    if (state.mode === 'camera') {
      scanFrame();
    }

    return () => {
      cancelAnimationFrame(animationId);
      stopCamera();
    };
  }, [state.mode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
      {/* Your existing JSX here - keep UI exactly the same */}
    </div>
  );
};

export default QrScannerPage;