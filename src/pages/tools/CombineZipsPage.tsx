// src/pages/tools/CombineZipsPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import JSZip, { JSZipObject } from 'jszip';
import UploadZone from '../../components/UploadZone';
import {
  Sparkles,
  Archive,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  PauseCircle,
  PlayCircle,
  XCircle,
  Eye,
  Filter,
  FolderTree,
  Layers,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import AdSpace from '../../components/AdSpace';

// ✅ Tools button (animated gradient) & SEO resolver
import ToolsMenu from '../../components/ToolsMenu';
import { getToolSeoByPath } from '../../components/seo/toolSeoData';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

type CollisionStrategy = 'increment' | 'skip' | 'overwrite';

type QueueZip = {
  file: File;
  name: string; // filename without .zip
  zip?: JSZip;
  error?: string;
};

type EntryRow = {
  sourceZip: string;
  originalPath: string;
  baseName: string;
  size: number;
  isDir: boolean;
  isJunk: boolean;
  maybeEncrypted: boolean;
};

const CombineZipsPage: React.FC = () => {
  // ✅ Centralized SEO (no undefined crashes)
  const seo = getToolSeoByPath('/tools/combine-zips');

  // State
  const [queue, setQueue] = useState<QueueZip[]>([]);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [flatten, setFlatten] = useState(false);
  const [collision, setCollision] = useState<CollisionStrategy>('increment');
  const [excludeJunk, setExcludeJunk] = useState(true);
  const [includeExt, setIncludeExt] = useState<string>(''); // e.g. "png,jpg,pdf"
  const [excludeExt, setExcludeExt] = useState<string>(''); // e.g. "exe,bat"

  const [isProcessing, setIsProcessing] = useState(false);
  const [paused, setPaused] = useState(false);
  const cancelRef = useRef(false);

  const [progress, setProgress] = useState(0);
  const [perFileNote, setPerFileNote] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showManifestPreview, setShowManifestPreview] = useState(false);
  const [manifestPreview, setManifestPreview] = useState<string>('');

  const revokeDownload = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
  };

  useEffect(() => () => revokeDownload(), []); // revoke on unmount

  // Helpers
  const junkNames = useMemo(() => new Set(['.DS_Store', 'Thumbs.db']), []);
  const isJunkPath = (path: string) => {
    const base = path.split('/').pop() || path;
    if (path.startsWith('__MACOSX/')) return true;
    return junkNames.has(base);
  };
  const extOf = (name: string) => {
    const idx = name.lastIndexOf('.');
    return idx === -1 ? '' : name.slice(idx + 1).toLowerCase();
  };
  const baseOf = (name: string) => {
    const idx = name.lastIndexOf('.');
    return idx === -1 ? name : name.slice(0, idx);
  };
  const uniqueName = (proposed: string, taken: Set<string>, strategy: CollisionStrategy) => {
    if (!taken.has(proposed)) {
      taken.add(proposed);
      return proposed;
    }
    if (strategy === 'skip') return null;
    if (strategy === 'overwrite') {
      // allow overwrite: do not add to taken again to keep same path
      return proposed;
    }
    // increment pattern
    const dot = proposed.lastIndexOf('.');
    const hasExt = dot !== -1 && dot !== 0;
    const stem = hasExt ? proposed.slice(0, dot) : proposed;
    const ext = hasExt ? proposed.slice(dot) : '';
    let i = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const alt = `${stem} (${i})${ext}`;
      if (!taken.has(alt)) {
        taken.add(alt);
        return alt;
      }
      i++;
    }
  };

  // File selection via UploadZone
  const onFilesSelected = async (fs: File[]) => {
    revokeDownload();
    setError(null);
    setEntries([]);
    setManifestPreview('');
    setShowManifestPreview(false);

    // Filter to .zip only (friendly error if none)
    const zips = fs.filter((f) => /\.zip$/i.test(f.name));
    if (zips.length === 0) {
      setError('Please select one or more .zip files.');
      setQueue([]);
      return;
    }
    const q: QueueZip[] = zips.map((f) => ({
      file: f,
      name: f.name.replace(/\.zip$/i, ''),
    }));
    setQueue(q);
  };

  // Analyze zips (dry run): enumerate entries, size, encrypted status guess
  const analyze = async () => {
    if (!queue.length) return;
    setIsAnalyzing(true);
    setError(null);
    setEntries([]);
    try {
      const all: EntryRow[] = [];
      for (const q of queue) {
        try {
          const buf = await q.file.arrayBuffer();
          const z = await JSZip.loadAsync(buf);
          q.zip = z;
          const paths = Object.keys(z.files);
          for (const p of paths) {
            const obj = z.files[p];
            const base = p.split('/').pop() || p;
            const isDir = obj.dir === true;
            // Guess encrypted: JSZip exposes _data?.compressedContent? Not public.
            // Heuristic: if obj._data is undefined until async read && obj._compressionOptions?.password? Not available.
            // Practical approach: try to read small files and catch error.
            let maybeEncrypted = false;
            if (!isDir) {
              if ((obj as any).options && (obj as any).options.password) {
                maybeEncrypted = true;
              } else if ((obj as any).unsafeOriginalName?.endsWith('.enc')) {
                maybeEncrypted = true;
              }
            }
            // Size: JSZipObject has _data unexposed before async read; use obj._data?. unavail. Use obj._dataCompressed? Not public.
            // We’ll estimate using compressedSize if present; otherwise 0 and fill later on combine.
            const size =
              (obj as any).compressedSize ??
              (obj as any).uncompressedSize ??
              0;

            all.push({
              sourceZip: q.name,
              originalPath: p,
              baseName: base,
              size,
              isDir,
              isJunk: isJunkPath(p),
              maybeEncrypted,
            });
          }
        } catch (e: any) {
          q.error = e?.message || 'Failed to read this ZIP.';
        }
      }
      setEntries(all);
      buildManifestPreview(all);
    } catch (e: any) {
      setError(e?.message || 'Failed to analyze archives.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const buildManifestPreview = (rows: EntryRow[]) => {
    const inc = includeSet();
    const exc = excludeSet();
    const filtered = rows.filter((r) => {
      if (r.isDir) return false;
      if (excludeJunk && r.isJunk) return false;
      const e = extOf(r.baseName);
      if (inc.size && !inc.has(e)) return false;
      if (exc.size && exc.has(e)) return false;
      return true;
    });
    const lines = [
      `FilesNova Combine ZIP — Dry Run`,
      `Archives: ${queue.length}`,
      `Candidate files: ${filtered.length}`,
      flatten ? `Layout: FLATTENED` : `Layout: Keep per-ZIP folders`,
      `Collision: ${collision.toUpperCase()}`,
      excludeJunk ? `Junk excluded: yes` : `Junk excluded: no`,
      `Include ext: ${includeExt || '(none)'}`,
      `Exclude ext: ${excludeExt || '(none)'}`,
      ``,
      ...filtered.slice(0, 500).map((r) => `- ${r.sourceZip}:${r.originalPath}`),
      filtered.length > 500 ? `...and ${filtered.length - 500} more` : '',
    ].filter(Boolean);
    setManifestPreview(lines.join('\n'));
  };

  const includeSet = () =>
    new Set(
      includeExt
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    );
  const excludeSet = () =>
    new Set(
      excludeExt
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    );

  // Combine action
  const combine = async () => {
    if (!queue.length) return;

    revokeDownload();
    setError(null);
    setPerFileNote('');
    cancelRef.current = false;
    setPaused(false);
    setIsProcessing(true);
    setProgress(0);

    try {
      // Ensure zip instances exist from analysis; load if user skipped Analyze
      for (const q of queue) {
        if (!q.zip) {
          const buf = await q.file.arrayBuffer();
          q.zip = await JSZip.loadAsync(buf);
        }
      }

      const outZip = new JSZip();
      const taken = new Set<string>();
      const manifest: string[] = [];

      const inc = includeSet();
      const exc = excludeSet();

      // Pre-count eligible entries
      let totalEntries = 0;
      const eligible: { q: QueueZip; obj: JSZipObject; path: string }[] = [];
      for (const q of queue) {
        const z = q.zip!;
        for (const p of Object.keys(z.files)) {
          const obj = z.files[p];
          if (obj.dir) continue;
          if (excludeJunk && isJunkPath(p)) continue;
          const base = p.split('/').pop() || p;
          const e = extOf(base);
          if (inc.size && !inc.has(e)) continue;
          if (exc.size && exc.has(e)) continue;
          eligible.push({ q, obj, path: p });
          totalEntries++;
        }
      }

      let processed = 0;

      for (const item of eligible) {
        // Pause support
        // eslint-disable-next-line no-loop-func
        while (paused) {
          await new Promise((r) => setTimeout(r, 80));
        }
        if (cancelRef.current) throw new Error('Operation cancelled.');

        const { q, obj, path } = item;
        setPerFileNote(`${q.name}/${path}`);

        // Read blob; encrypted entries will throw
        let blob: Blob;
        try {
          blob = await obj.async('blob');
        } catch (e: any) {
          manifest.push(`${q.name}:${path}  ->  [SKIPPED: encrypted or unreadable]`);
          processed++;
          setProgress(Math.min(99, Math.round((processed / Math.max(1, totalEntries)) * 100)));
          continue;
        }

        const base = path.split('/').pop() || path;
        const rawTarget = flatten ? base : `${q.name}/${base}`;

        const safeTarget = uniqueName(rawTarget, taken, collision);
        if (!safeTarget) {
          // skipped due to collision
          manifest.push(`${q.name}:${path}  ->  [SKIPPED: collision]`);
        } else {
          if (collision === 'overwrite' && taken.has(safeTarget)) {
            // overwrite: remove old then set
            (outZip as any).files[safeTarget] = undefined;
          }
          outZip.file(safeTarget, blob);
          manifest.push(`${q.name}:${path}  ->  ${safeTarget}`);
        }

        processed++;
        setProgress(Math.min(99, Math.round((processed / Math.max(1, totalEntries)) * 100)));

        // Yield to UI to stay smooth
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 0));
      }

      // Add manifest
      outZip.file(
        'combined_manifest.txt',
        [
          `FilesNova Combine ZIP Manifest`,
          `Archives: ${queue.length}`,
          `Total files merged: ${eligible.length}`,
          `Flatten: ${flatten ? 'yes' : 'no'}`,
          `Collision strategy: ${collision}`,
          `Junk excluded: ${excludeJunk ? 'yes' : 'no'}`,
          `Include ext: ${includeExt || '(none)'}`,
          `Exclude ext: ${excludeExt || '(none)'}`,
          ``,
          `Original -> Output mapping:`,
          ...manifest.map((l) => `- ${l}`),
          ``,
        ].join('\n'),
      );

      const outBlob = await outZip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(outBlob);
      setDownloadUrl(url);
      setProgress(100);
      setPerFileNote('');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to combine ZIP files.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
      setPaused(false);
    }
  };

  // UI computed bits
  const totalFiles = useMemo(
    () => entries.filter((e) => !e.isDir && (!excludeJunk || !e.isJunk)).length,
    [entries, excludeJunk],
  );
  const encryptedCount = useMemo(
    () => entries.filter((e) => e.maybeEncrypted && !e.isDir).length,
    [entries],
  );
  const junkCount = useMemo(() => entries.filter((e) => e.isJunk).length, [entries]);

  const totalBytesEst = useMemo(() => {
    const inc = includeSet();
    const exc = excludeSet();
    let sum = 0;
    for (const e of entries) {
      if (e.isDir) continue;
      if (excludeJunk && e.isJunk) continue;
      const ext = extOf(e.baseName);
      if (inc.size && !inc.has(ext)) continue;
      if (exc.size && exc.has(ext)) continue;
      sum += e.size || 0;
    }
    return sum;
  }, [entries, excludeJunk, includeExt, excludeExt]);

  const human = (n: number) => {
    if (!n) return '0 B';
    const u = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let x = n;
    while (x >= 1024 && i < u.length - 1) {
      x /= 1024;
      i++;
    }
    return `${x.toFixed(1)} ${u[i]}`;
  };

  // Controls
  const onPauseResume = () => setPaused((p) => !p);
  const onCancel = () => {
    cancelRef.current = true;
    setPaused(false);
  };

  // Keyboard: Esc closes manifest preview, Space toggles pause (when processing)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowManifestPreview(false);
      if (e.key === ' ' && isProcessing) {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isProcessing]);

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

        {/* ✅ Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-">
              <div className="relative shrink-0">
                <img
                  src={FileNovaIcon}
                  alt="Files Nova"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  draggable={false}
                  loading="lazy"
                  width="96"
                  height="96"
                />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Files Nova
                </h1>
                <p className="text-xs text-gray-500 font-medium">Combine ZIPs</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <Archive className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Combine ZIPs</h2>
              <p className="text-gray-700 text-lg leading-relaxed">Merge multiple ZIP archives into one unified file.</p>
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

          {/* Options + Upload */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload ZIP Files</h3>
            <UploadZone
              accept="application/zip,application/x-zip-compressed"
              multiple={true}
              title="Drop your ZIP files here"
              buttonLabel="Choose Files"
              supportedFormats="ZIP"
              onFilesSelected={onFilesSelected}
            />

            {/* Settings */}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <FolderTree className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold">Layout</h4>
                </div>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-blue-600 w-4 h-4"
                      checked={flatten}
                      onChange={(e) => setFlatten(e.target.checked)}
                    />
                    <span className="text-sm">Flatten into a single folder</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Off = keep per-ZIP folders like <code>Album1/</code>, <code>Docs/</code>.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <h4 className="font-semibold">Collision strategy</h4>
                </div>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="collide"
                      className="accent-purple-600"
                      checked={collision === 'increment'}
                      onChange={() => setCollision('increment')}
                    />
                    <span className="text-sm">Increment (safe) — <code>(2)</code>, <code>(3)</code>…</span>
                  </label>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="collide"
                      className="accent-purple-600"
                      checked={collision === 'skip'}
                      onChange={() => setCollision('skip')}
                    />
                    <span className="text-sm">Skip duplicates</span>
                  </label>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="collide"
                      className="accent-purple-600"
                      checked={collision === 'overwrite'}
                      onChange={() => setCollision('overwrite')}
                    />
                    <span className="text-sm">Overwrite duplicates</span>
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-teal-600" />
                  <h4 className="font-semibold">Filters</h4>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-teal-600 w-4 h-4"
                    checked={excludeJunk}
                    onChange={(e) => setExcludeJunk(e.target.checked)}
                  />
                  <span className="text-sm">Exclude junk files (<code>.DS_Store</code>, <code>Thumbs.db</code>, <code>__MACOSX/</code>)</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  <input
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Include only extensions (e.g. png,jpg,pdf)"
                    value={includeExt}
                    onChange={(e) => setIncludeExt(e.target.value)}
                  />
                  <input
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Exclude extensions (e.g. exe,bat)"
                    value={excludeExt}
                    onChange={(e) => setExcludeExt(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Leave blank to include everything. Extensions are case-insensitive, comma-separated.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-amber-600" />
                  <h4 className="font-semibold">Tips & Privacy</h4>
                </div>
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                  <li>All processing happens in your browser. Nothing uploads to servers.</li>
                  <li>Encrypted ZIP entries cannot be merged (you’ll see them listed).</li>
                  <li>Use <span className="font-medium">Analyze</span> to preview a manifest before combining.</li>
                </ul>
              </div>
            </div>

            {/* Analyze / Manifest */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={analyze}
                disabled={!queue.length || isAnalyzing || isProcessing}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                Analyze (Dry-Run)
              </button>

              <button
                onClick={() => { buildManifestPreview(entries); setShowManifestPreview(true); }}
                disabled={!entries.length}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                View Manifest Preview
              </button>
            </div>

            {/* Queue / Summary */}
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="font-semibold">Selected archives:</span>
                {queue.length ? (
                  <span>{queue.map((q) => q.file.name).join(', ')}</span>
                ) : (
                  <span className="text-gray-500">none</span>
                )}
              </div>
              {!!entries.length && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{totalFiles.toLocaleString()} files</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-medium">{junkCount.toLocaleString()} junk entries</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{encryptedCount.toLocaleString()} maybe encrypted</span>
                  </div>
                  <div className="sm:col-span-3 text-xs text-gray-600">
                    Estimated size (compressed/uncompressed unknown): {human(totalBytesEst)}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={combine}
                disabled={!queue.length || isProcessing}
                className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Combine ZIPs
              </button>
              <button
                onClick={onPauseResume}
                disabled={!isProcessing}
                className="w-full px-4 py-4 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
                title="Space to toggle while processing"
              >
                {paused ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={onCancel}
                disabled={!isProcessing}
                className="w-full px-4 py-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Cancel
              </button>
            </div>

            {/* Progress */}
            {(isProcessing || progress > 0) && (
              <div className="mt-4">
                <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                {perFileNote && (
                  <div className="mt-2 text-xs text-gray-600 truncate">
                    Processing: <span className="font-mono">{perFileNote}</span>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

          {/* Download */}
          {downloadUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
              <a
                href={downloadUrl}
                download="combined.zip"
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download ZIP
              </a>
            </div>
          )}

          <AdSpace />
        </div>
      </div>

      {/* Manifest Preview Modal */}
      {showManifestPreview && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold">Manifest Preview (dry run)</span>
              </div>
              <button
                onClick={() => setShowManifestPreview(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <XCircle className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            <div className="p-4 overflow-auto text-sm font-mono whitespace-pre-wrap">
              {manifestPreview || 'No analysis available yet. Run Analyze first.'}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CombineZipsPage;
