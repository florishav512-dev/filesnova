// src/pages/tools/TarToZipPage.tsx
import React, { useMemo, useState } from 'react';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import {
  Sparkles,
  Box,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  Filter as FilterIcon,
  FolderTree,
} from 'lucide-react';

// ✅ Animated gradient "Tools" dropdown (right-most in header)
import ToolsMenu from '../../components/ToolsMenu';

type TarEntry = {
  name: string;
  size: number;
  type: 'file' | 'dir' | 'symlink' | 'other';
  linkname?: string;
  offset: number; // start of data in the original (inflated) tar buffer
};

const TarToZipPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Advanced UI state
  const [entries, setEntries] = useState<TarEntry[] | null>(null);
  const [keepStructure, setKeepStructure] = useState(true);
  const [flattenRoot, setFlattenRoot] = useState(false); // remove top-level folder
  const [skipDotFiles, setSkipDotFiles] = useState(true);
  const [includeFilter, setIncludeFilter] = useState<string>(''); // e.g. .png,.jpg,report
  const [renameRoot, setRenameRoot] = useState<string>(''); // optional new root in zip

  // SEO data
  const { title, description, canonical, breadcrumb } =
    TOOL_SEO_DATA['/tools/tar-to-zip'];

  const readableSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const includeTokens = useMemo(() => {
    return includeFilter
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toLowerCase());
  }, [includeFilter]);

  const shouldInclude = (name: string) => {
    if (skipDotFiles && /(^|\/)\./.test(name)) return false;
    if (includeTokens.length === 0) return true;
    const lower = name.toLowerCase();
    return includeTokens.some((tok) => lower.includes(tok));
  };

  // ---- TAR parsing (handles USTAR prefix & GNU LongName/LongLink) ----
  const parseTar = async (buf: ArrayBuffer): Promise<TarEntry[]> => {
    const u8 = new Uint8Array(buf);
    const total = u8.byteLength;
    const td = new TextDecoder();

    const text = (bytes: Uint8Array) => td.decode(bytes).replace(/\0.*$/, '');
    const entries: TarEntry[] = [];

    let offset = 0;
    let pendingLongName: string | null = null;
    let pendingLongLink: string | null = null;

    while (offset + 512 <= total) {
      const header = u8.subarray(offset, offset + 512);
      // End of archive: two consecutive zero blocks or an empty name
      if (header.every((b) => b === 0)) break;

      // Basic header fields
      let name = text(header.subarray(0, 100));
      const mode = text(header.subarray(100, 108));
      const sizeStr = text(header.subarray(124, 136)).trim();
      const size = parseInt(sizeStr || '0', 8) || 0;
      const typeflag = header[156]; // numeric ASCII
      const linknameRaw = text(header.subarray(157, 257));

      // USTAR prefix (for long paths split across fields)
      const ustarMagic = text(header.subarray(257, 263));
      if (ustarMagic === 'ustar') {
        const prefix = text(header.subarray(345, 500)).trim();
        if (prefix) name = `${prefix}/${name}`;
      }

      const dataStart = offset + 512;
      const dataEnd = dataStart + size;

      // GNU long name / long link handling
      if (typeflag === 'L'.charCodeAt(0)) {
        // Next header's name is in this data
        const longNameBytes = u8.subarray(dataStart, dataEnd);
        pendingLongName = text(longNameBytes);
      } else if (typeflag === 'K'.charCodeAt(0)) {
        const longLinkBytes = u8.subarray(dataStart, dataEnd);
        pendingLongLink = text(longLinkBytes);
      } else {
        // Resolve any pending long fields
        if (pendingLongName) {
          name = pendingLongName;
          pendingLongName = null;
        }
        const linkname = pendingLongLink || (linknameRaw || undefined);
        pendingLongLink = null;

        // Determine kind
        let kind: TarEntry['type'] = 'other';
        if (typeflag === 0 || typeflag === '0'.charCodeAt(0)) kind = 'file';
        else if (typeflag === '5'.charCodeAt(0)) kind = 'dir';
        else if (typeflag === '2'.charCodeAt(0)) kind = 'symlink';
        else if (name.endsWith('/')) kind = 'dir';

        // Normalize directory names to end with /
        if (kind === 'dir' && !name.endsWith('/')) name += '/';

        entries.push({
          name,
          size,
          type: kind,
          linkname: linkname || undefined,
          offset: dataStart,
        });
      }

      const blocks = Math.ceil(size / 512);
      offset = dataStart + blocks * 512;

      // UI progress: header scan
      setProgress(Math.min(25, Math.round((offset / total) * 25)));
      // yield
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 0));
    }

    return entries;
  };

  // Try to inflate .tar.gz / .tgz (optional pako)
  const maybeGunzip = async (ab: ArrayBuffer): Promise<ArrayBuffer> => {
    try {
      const ext = (file?.name || '').toLowerCase();
      const isGz = ext.endsWith('.tgz') || ext.endsWith('.tar.gz') || /gzip|x-gzip/.test(file?.type || '');
      if (!isGz) return ab;
      const pako = await import('pako').catch(() => null as any);
      if (!pako?.ungzip) throw new Error('Compressed tar detected, but gunzip support is unavailable. Please install "pako" or upload an uncompressed .tar.');
      const out = pako.ungzip(new Uint8Array(ab)).buffer;
      return out;
    } catch (e: any) {
      throw new Error(e?.message || 'Failed to decompress .tar.gz');
    }
  };

  const buildZip = async (tarBuf: ArrayBuffer, list: TarEntry[]) => {
    const zip = new JSZip();
    const rootName = renameRoot.trim();
    const u8 = new Uint8Array(tarBuf);

    // Optionally flatten top-level folder
    const stripTop = (p: string) => {
      if (!flattenRoot) return p;
      const parts = p.split('/').filter(Boolean);
      return parts.slice(1).join('/');
    };

    // Where to write an entry path in ZIP
    const targetPath = (p: string) => {
      let path = keepStructure ? p : p.split('/').pop() || p;
      path = stripTop(path);
      // Prepend renamed root if provided
      if (rootName) path = `${rootName.replace(/\/+$/,'')}/${path}`;
      return path;
    };

    let processed = 0;
    const todo = list.length;

    for (const ent of list) {
      if (!shouldInclude(ent.name)) {
        processed++;
        setProgress(25 + Math.round((processed / todo) * 60));
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 0));
        continue;
      }

      if (ent.type === 'dir') {
        const dirPath = targetPath(ent.name).replace(/\/?$/, '/');
        zip.folder(dirPath);
      } else if (ent.type === 'file') {
        const data = tarBuf.slice(ent.offset, ent.offset + ent.size);
        const path = targetPath(ent.name);
        zip.file(path, new Blob([data]));
      } else if (ent.type === 'symlink') {
        // Store symlink as a small text file containing the link target (portable)
        const path = targetPath(ent.name.replace(/\/$/, ''));
        const content = `SYMLINK -> ${ent.linkname || ''}\n`;
        zip.file(path + '.symlink.txt', content);
      } else {
        // ignore other types (block/char devices, etc.)
      }

      processed++;
      setProgress(25 + Math.round((processed / todo) * 60));
      if (processed % 20 === 0) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    return blob;
  };

  const analyze = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setEntries(null);
    setDownloadUrl(null);
    setProgress(0);

    try {
      const raw = await file.arrayBuffer();
      const tarBuf = await maybeGunzip(raw);
      const list = await parseTar(tarBuf);
      setEntries(list);
      setProgress(30);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to read TAR file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const convert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setDownloadUrl(null);
    setProgress(30); // continue from analysis

    try {
      const raw = await file.arrayBuffer();
      const tarBuf = await maybeGunzip(raw);
      const list = entries ?? (await parseTar(tarBuf));
      const outBlob = await buildZip(tarBuf, list);
      setDownloadUrl(URL.createObjectURL(outBlob));
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to convert TAR to ZIP.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalSelected = useMemo(() => {
    if (!entries) return { count: 0, bytes: 0 };
    const filtered = entries.filter((e) => shouldInclude(e.name));
    return {
      count: filtered.length,
      bytes: filtered.reduce((a, b) => a + (b.type === 'file' ? b.size : 0), 0),
    };
  }, [entries, includeTokens, skipDotFiles]);

  return (
    <>
      <ToolSeo
        title={title}
        description={description}
        canonical={canonical}
        breadcrumb={breadcrumb}
        showBreadcrumb
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no back arrow; Tools at right) */}
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
                <p className="text-xs text-gray-500 font-medium">TAR to ZIP</p>
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
                <Box className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">TAR to ZIP</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert TAR (and .tar.gz) archives into ZIP — privately and fast, right in your browser.
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

          {/* Upload + Options */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload TAR File</h3>
            <UploadZone
              accept=".tar,.tgz,application/x-tar,application/tar,application/gzip,application/x-gzip"
              multiple={false}
              title="Drop your TAR or TAR.GZ file here"
              buttonLabel="Choose File"
              supportedFormats="TAR, TAR.GZ"
              onFilesSelected={(fs) => {
                const f = fs[0] || null;
                setFile(f);
                setEntries(null);
                setDownloadUrl(null);
                setError(null);
                setProgress(0);
              }}
            />

            {/* Advanced controls (appear after file is chosen) */}
            {file && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2">
                  <input
                    id="keepStructure"
                    type="checkbox"
                    checked={keepStructure}
                    onChange={(e) => setKeepStructure(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="keepStructure" className="text-sm text-gray-700 inline-flex items-center gap-2">
                    <FolderTree className="w-4 h-4" />
                    Keep folder structure
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="flattenRoot"
                    type="checkbox"
                    checked={flattenRoot}
                    onChange={(e) => setFlattenRoot(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="flattenRoot" className="text-sm text-gray-700">Flatten top folder</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="skipDot"
                    type="checkbox"
                    checked={skipDotFiles}
                    onChange={(e) => setSkipDotFiles(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="skipDot" className="text-sm text-gray-700">Skip hidden “dotfiles”</label>
                </div>
                <div className="flex items-center gap-2">
                  <FilterIcon className="w-4 h-4 text-gray-700" />
                  <input
                    value={includeFilter}
                    onChange={(e) => setIncludeFilter(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                    placeholder="Filter (e.g. .png,.jpg,report)"
                    title="Comma-separated; matches if the token appears in the path"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Rename ZIP root (optional)</label>
                  <input
                    value={renameRoot}
                    onChange={(e) => setRenameRoot(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="e.g. my-archive"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-2 flex gap-3">
                  <button
                    onClick={analyze}
                    disabled={!file || isProcessing}
                    className="flex-1 bg-white border border-gray-300 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
                    title="Scan archive and show manifest"
                  >
                    Analyze Archive
                  </button>
                  <button
                    onClick={convert}
                    disabled={!file || isProcessing}
                    className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
                  >
                    Convert to ZIP
                  </button>
                </div>
              </div>
            )}

            {/* Progress */}
            {isProcessing && (
              <div className="mt-4 w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

          {/* Manifest / Preview */}
          {entries && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">2. Review</h3>
              <p className="text-gray-600 mb-4">
                Found <span className="font-semibold">{entries.length}</span> items in the archive. With current filters,{' '}
                <span className="font-semibold">{totalSelected.count}</span> will be included
                (<span className="font-semibold">{readableSize(totalSelected.bytes)}</span> files).
              </p>
              <div className="max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2">Path</th>
                      <th className="text-left px-4 py-2">Type</th>
                      <th className="text-right px-4 py-2">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.slice(0, 500).map((e, i) => (
                      <tr key={i} className={`border-t ${shouldInclude(e.name) ? 'bg-white' : 'bg-gray-50 text-gray-400'}`}>
                        <td className="px-4 py-2 font-mono break-all">{e.name}</td>
                        <td className="px-4 py-2 capitalize">{e.type}</td>
                        <td className="px-4 py-2 text-right">{e.type === 'file' ? readableSize(e.size) : '-'}</td>
                      </tr>
                    ))}
                    {entries.length > 500 && (
                      <tr className="border-t bg-white/70">
                        <td className="px-4 py-3 italic" colSpan={3}>
                          Showing first 500 items…
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <button
                onClick={convert}
                disabled={isProcessing}
                className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                Convert to ZIP
              </button>
            </div>
          )}

          {/* Download */}
          {downloadUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">3. Download</h3>
              <a
                href={downloadUrl}
                download={(file?.name || 'archive.tar').replace(/(\.tar(\.gz)?|\.tgz)$/i, '') + '.zip'}
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download ZIP
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TarToZipPage;
