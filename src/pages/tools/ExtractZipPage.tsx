// src/pages/tools/ExtractZipPage.tsx

import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import {
  Sparkles,
  FolderOpen,
  Shield,
  Zap,
  Star,
} from 'lucide-react';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';
import FileNovaIconWebp from '../../assets/FILESNOVANEWICON.webp';

// ✅ SEO component + data
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';

// ✅ Animated Tools dropdown
import ToolsMenu from '../../components/ToolsMenu';

type Extracted = {
  name: string;     // original path inside zip
  url: string;      // blob URL
  size: number;     // bytes
  selected: boolean;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * ExtractZipPage unpacks a ZIP in-browser.
 * Upgrades:
 *  • Select + download only chosen files as a new ZIP
 *  • Optional: preserve original folder structure in the new ZIP
 *  • Search filter, file sizes, totals
 *  • Handles password-protected ZIPs gracefully
 */
const ExtractZipPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedFiles, setExtractedFiles] = useState<Extracted[]>([]);
  const [error, setError] = useState<string | null>(null);

  // UX extras
  const [query, setQuery] = useState('');
  const [preservePaths, setPreservePaths] = useState(false);
  const [selectAll, setSelectAll] = useState(true);

  // ✅ Pick SEO config for this tool
  const seo = TOOL_SEO_DATA['/tools/extract-zip'];

  const handleFiles = (fs: File[]) => {
    const f = fs[0] || null;
    setFile(f);
    setExtractedFiles([]);
    setError(null);
    setProgress(0);
    setQuery('');
    setSelectAll(true);
  };

  const extract = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setExtractedFiles([]);
    try {
      const buf = await file.arrayBuffer();

      let zip: JSZip;
      try {
        zip = await JSZip.loadAsync(buf);
      } catch (e: any) {
        // JSZip throws on encrypted/password zips — give a nicer message
        setError('This ZIP may be password-protected or corrupted. Encrypted archives are not supported.');
        setIsProcessing(false);
        return;
      }

      const entries = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
      const out: Extracted[] = [];
      for (let i = 0; i < entries.length; i++) {
        const name = entries[i];
        const blob = await zip.files[name].async('blob');
        const url = URL.createObjectURL(blob);
        out.push({ name, url, size: blob.size, selected: true });
        setProgress(Math.round(((i + 1) / entries.length) * 100));
        // yield to UI
        await new Promise((res) => setTimeout(res, 0));
      }
      setExtractedFiles(out);
      setSelectAll(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to extract ZIP.');
    }
    setIsProcessing(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return extractedFiles;
    return extractedFiles.filter((f) => f.name.toLowerCase().includes(q));
  }, [extractedFiles, query]);

  const totals = useMemo(() => {
    const all = filtered.length;
    const allSize = filtered.reduce((s, f) => s + f.size, 0);
    const sel = filtered.filter((f) => f.selected);
    const selCount = sel.length;
    const selSize = sel.reduce((s, f) => s + f.size, 0);
    return { all, allSize, selCount, selSize };
  }, [filtered]);

  const toggleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setExtractedFiles((prev) =>
      prev.map((f) =>
        filtered.some((ff) => ff.url === f.url) ? { ...f, selected: checked } : f
      )
    );
  };

  // create a new ZIP from the selected files
  const downloadSelectedZip = async () => {
    const zip = new JSZip();
    const selected = filtered.filter((f) => f.selected);
    if (selected.length === 0) return;

    for (const ef of selected) {
      const resp = await fetch(ef.url);
      const blob = await resp.blob();
      const name = preservePaths ? ef.name : (ef.name.split('/').pop() || ef.name);
      zip.file(name, blob);
    }
    const out = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(out);
    const a = document.createElement('a');
    a.href = url;
    a.download = selected.length === extractedFiles.length ? 'extracted.zip' : 'selected-files.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* ✅ Injects Breadcrumb + WebPage + SoftwareApplication + meta */}
      <ToolSeo {...seo} />

      <Helmet>
        <title>Extract ZIP – Unpack Archives Online | FilesNova</title>
        <meta
          name="description"
          content="Unpack ZIP archives in your browser. Fast, free, and secure—download files individually or repackage selected files into a new ZIP. No signup."
        />
        <link rel="canonical" href="https://filesnova.com/tools/extract-zip" />
      </Helmet>

      {/* ✅ WebApplication schema */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Extract ZIP – Files Nova",
        "url": "https://filesnova.com/tools/extract-zip",
        "applicationCategory": "FileConverter",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      }} />

      {/* ✅ BreadcrumbList schema */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://filesnova.com/" },
          { "@type": "ListItem", "position": 2, "name": "Extract ZIP", "item": "https://filesnova.com/tools/extract-zip" }
        ]
      }} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header: back arrow removed; Tools on right with animated gradient */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-">
              <div className="relative shrink-0">
                <picture>
                  <source srcSet={FileNovaIconWebp} type="image/webp" />
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
                <p className="text-xs text-gray-500 font-medium">Extract ZIP</p>
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
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Extract ZIP</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Unpack the contents of a ZIP file. Search, select, and re-zip exactly what you need.
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

          {/* Upload + Controls */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload ZIP File</h3>
            <UploadZone
              accept="application/zip,application/x-zip-compressed"
              multiple={false}
              title="Drop your ZIP file here"
              buttonLabel="Choose File"
              supportedFormats="ZIP"
              onFilesSelected={handleFiles}
            />

            <button
              onClick={extract}
              disabled={!file || isProcessing}
              className="mt-4 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Extract ZIP
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

            {/* Ad space below the conversion area */}
            <div className="mt-6">
              <AdSpace />
            </div>
          </div>

          {/* Extracted list + actions */}
          {extractedFiles.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Extracted Files</h3>

              {/* Top toolbar */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectAll}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Select all (filtered)</span>
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={preservePaths}
                      onChange={(e) => setPreservePaths(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Preserve folder structure</span>
                  </label>
                </div>

                <div className="flex-1 md:max-w-sm">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search files…"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Totals */}
              <div className="text-sm text-gray-600 mb-3">
                Showing <b>{totals.all}</b> files • {formatBytes(totals.allSize)} total • Selected{' '}
                <b>{totals.selCount}</b> • {formatBytes(totals.selSize)}
              </div>

              {/* List */}
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {filtered.map((ef) => (
                  <li
                    key={ef.url}
                    className="flex items-center justify-between bg-white/60 backdrop-blur-sm p-2 rounded-lg"
                  >
                    <label className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={ef.selected}
                        onChange={(e) =>
                          setExtractedFiles((prev) =>
                            prev.map((f) => (f.url === ef.url ? { ...f, selected: e.target.checked } : f))
                          )
                        }
                      />
                      <span className="text-sm break-all truncate">{ef.name}</span>
                    </label>
                    <span className="ml-3 text-xs text-gray-500 whitespace-nowrap">{formatBytes(ef.size)}</span>
                    <a
                      href={ef.url}
                      download={ef.name.split('/').pop() || ef.name}
                      className="ml-4 text-blue-600 hover:underline text-sm whitespace-nowrap"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>

              <button
                onClick={downloadSelectedZip}
                disabled={totals.selCount === 0}
                className="mt-6 w-full px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
              >
                Download Selected as ZIP
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};



export default ExtractZipPage;
