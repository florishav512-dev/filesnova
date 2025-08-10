import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import {
  ArrowLeft,
  Sparkles,
  Image as CompressIcon,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';

const CompressImagesPage: React.FC = () => {
  const seo = TOOL_SEO_DATA["/tools/compress-image"];

  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [maxSizeMB, setMaxSizeMB] = useState(1);

  const compress = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const zip = new JSZip();
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const options = {
          maxSizeMB: maxSizeMB,
          maxWidthOrHeight: 2000,
          useWebWorker: true,
          initialQuality: quality,
        } as any;

        const compressedFile: File = await imageCompression(f, options);
        const blob = compressedFile;

        zip.file(
          f.name.replace(/\.(jpg|jpeg|png)$/i, '_compressed.$1'),
          blob
        );

        setProgress(Math.round(((i + 1) / files.length) * 100));
        await new Promise((res) => setTimeout(res, 0));
      }

      const out = await zip.generateAsync({ type: 'blob' });
      setDownloadUrl(URL.createObjectURL(out));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to compress images.');
    }
    setIsProcessing(false);
  };

  return (
    <>
      <ToolSeo {...seo} />
      <Helmet>
        <title>Compress Images – Online Image Compressor | FilesNova</title>
        <meta
          name="description"
          content="Compress and reduce the size of JPG, PNG, and other images instantly. Free, fast, and secure online image compressor with no watermark or signup."
        />
        <link rel="canonical" href="https://filesnova.com/tools/compress-image" />
      </Helmet>

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Compress Images – Files Nova",
        "url": "https://filesnova.com/tools/compress-image",
        "applicationCategory": "FileConverter",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      }} />

      {/* BreadcrumbList schema */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://filesnova.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Compress Image",
            "item": "https://filesnova.com/tools/compress-image"
          }
        ]
      }} />

      {/* ======== UI BELOW ======== */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* ... keep your full UI code here exactly as before ... */}
      </div>
    </>
  );
};

export default CompressImagesPage;
