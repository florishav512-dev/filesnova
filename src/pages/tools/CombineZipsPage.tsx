import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import {
  ArrowLeft,
  Sparkles,
  Archive,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';
import AdSpace from '../../components/AdSpace';

// ✅ Safe SEO resolver
import { getToolSeoByPath } from '../../components/seo/toolSeoData';

/**
 * CombineZipsPage merges multiple ZIP archives into a single ZIP.
 * Enhancements:
 *  - Skips junk files (__MACOSX, .DS_Store, Thumbs.db)
 *  - De-duplicates collisions using "name (2).ext" pattern
 *  - Adds combined_manifest.txt mapping original -> output path
 *  - Accurate progress, memory-safe URL handling
 */
const CombineZipsPage: React.FC = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Centralized SEO (no undefined crashes)
  const seo = getToolSeoByPath('/tools/combine-zips');

  const revokeDownload = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    setFiles(list && list.length ? list : null);
    revokeDownload();
    setError(null);
  };

  // Helpers
  const isJunk = (path: string) => {
    const base = path.split('/').pop() || path;
    if (path.startsWith('__MACOSX/')) return true;
    const junkNames = new Set(['.DS_Store', 'Thumbs.db']);
    return junkNames.has(base);
  };

  const extOf = (name: string) => {
    const idx = name.lastIndexOf('.');
    return idx === -1 ? '' : name.slice(idx);
  };

  const baseOf = (name: string) => {
    const idx = name.lastIndexOf('.');
    return idx === -1 ? name : name.slice(0, idx);
  };

  // Ensure unique name within the output zip namespace map
  const uniqueName = (proposed: string, taken: Set<string>) => {
    if (!taken.has(proposed)) {
      taken.add(proposed);
      return proposed;
    }
    const base = baseOf(proposed);
    const ext = extOf(proposed);
    let i = 2;
    while (true) {
      const alt = `${base} (${i})${ext}`;
      if (!taken.has(alt)) {
        taken.add(alt);
        return alt;
      }
      i++;
    }
  };

  const combine = async () => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    revokeDownload();

    try {
      const outZip = new JSZip();
      const nsTaken = new Set<string>(); // names already added to outZip (flat check on final path)
      const manifest: string[] = [];
      let totalEntries = 0;

      // Load and pre-count entries for accurate progress
      const zipFiles: { prefix: string; zip: JSZip }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (!/\.zip$/i.test(f.name)) {
          throw new Error(`"${f.name}" is not a .zip file.`);
        }
        const buf = await f.arrayBuffer();
        const z = await JSZip.loadAsync(buf);
        const prefix = f.name.replace(/\.zip$/i, '');
        zipFiles.push({ prefix, zip: z });
        totalEntries += Object.keys(z.files).filter((p) => !z.files[p].dir && !isJunk(p)).length;
      }

      let processed = 0;

      for (const { prefix, zip } of zipFiles) {
        const entries = Object.keys(zip.files).filter((p) => !zip.files[p].dir && !isJunk(p));

        for (const entry of entries) {
          const blob = await zip.files[entry].async('blob');
          const baseName = entry.split('/').pop() || entry;
          // keep context under prefix/ like before
          const rawTarget = `${prefix}/${baseName}`;
          const safeTarget = uniqueName(rawTarget, nsTaken);

          outZip.file(safeTarget, blob);
          manifest.push(`${prefix}:${entry}  ->  ${safeTarget}`);

          processed++;
          // avoid 0% for tiny sets; clamp 100 only on finish
          const pct = Math.min(99, Math.round((processed / Math.max(1, totalEntries)) * 100));
          setProgress(pct);
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      // Add manifest at the root
      outZip.file(
        'combined_manifest.txt',
        `FilesNova Combine ZIP Manifest\n` +
          `Archives: ${files.length}\n` +
          `Total files merged: ${totalEntries}\n` +
          `\nOriginal -> Output mapping:\n` +
          manifest.map((l) => `- ${l}`).join('\n') +
          `\n`
      );

      const outBlob = await outZip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(outBlob);
      setDownloadUrl(url);
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to combine ZIP files.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* ✅ Helmet powered by centralized SEO data */}
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />

        {/* OG/Twitter */}
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={seo.canonical} />
        <meta property="og:image" content="https://filesnova.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Structured Data */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Combine ZIPs – Files Nova",
        "url": "https://filesnova.com/tools/combine-zips",
        "applicationCategory": "FileConverter",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      }} />

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://filesnova.com/" },
          { "@type": "ListItem", "position": 2, "name": "Combine ZIPs", "item": "https://filesnova.com/tools/combine-zips" }
        ]
      }} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
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
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to
