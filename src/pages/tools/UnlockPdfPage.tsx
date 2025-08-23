// src/pages/tools/UnlockPdfPage.tsx
import React, { useMemo, useState } from 'react';
import UploadZone from '../../components/UploadZone';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import ToolsMenu from '../../components/ToolsMenu';
import {
  Sparkles,
  Unlock as UnlockIcon,
  Lock as LockIcon,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  Eye,
  EyeOff,
} from 'lucide-react';

// -----------------------------
// QPDF WASM loader
// -----------------------------
type QpdfModule = Awaited<ReturnType<typeof import('@jspawn/qpdf-wasm').init>>;
let _qpdfPromise: Promise<QpdfModule> | null = null;

async function getQpdf(): Promise<QpdfModule> {
  if (!_qpdfPromise) {
    _qpdfPromise = import('@jspawn/qpdf-wasm').then(qpdf => qpdf.init());
  }
  return _qpdfPromise;
}

// -----------------------------
// Remote additions preserved
// -----------------------------
type Job = {
  id: string;
  file: File;
  password: string;
  status: 'pending' | 'ok' | 'error';
  message?: string;
  url?: string;
  outName?: string;
};

// -----------------------------
// Page component
// -----------------------------
type Mode = 'unlock' | 'lock';

const UnlockPdfPage: React.FC = () => {
  // SEO data
  const { title, description, canonical, breadcrumb } =
    TOOL_SEO_DATA['/tools/unlock-pdf'];

  // Mode
  const [mode, setMode] = useState<Mode>('unlock');

  // Common state
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Unlock inputs
  const [openPassword, setOpenPassword] = useState('');
  const [showOpenPw, setShowOpenPw] = useState(false);

  // Lock inputs
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showUserPw, setShowUserPw] = useState(false);
  const [showOwnerPw, setShowOwnerPw] = useState(false);
  const [keyBits, setKeyBits] = useState<128 | 256>(256);

  // Permission toggles
  const [perm, setPerm] = useState({
    print: true,
    printHighRes: true,
    modify: true,
    annotate: true,
    form: true,
    assemble: true,
    extract: true,
    extractAccessibility: true,
  });

  const allowCsv = useMemo(() => {
    const list: string[] = [];
    if (perm.modify) list.push('modify');
    if (perm.extract) list.push('extract');
    if (perm.annotate) list.push('annotate');
    if (perm.form) list.push('form');
    if (perm.assemble) list.push('assemble');
    if (perm.print) list.push('print');
    if (perm.extractAccessibility) list.push('extract_for_accessibility');
    if (perm.printHighRes) list.push('print_highres');
    return list.join(',');
  }, [perm]);

  // ---- helpers ----
  const runQpdf = async (args: string[], inBytes: Uint8Array): Promise<Uint8Array> => {
    const qpdf = await getQpdf();
    const inName = 'input.pdf';
    const outName = 'output.pdf';

    const result = await qpdf.run(
      [...args, inName, outName],
      { [inName]: inBytes }
    );

    if (result.exitCode !== 0) {
      console.error('qpdf stderr:', result.stderr);
      throw new Error(result.stderr || 'qpdf failed to process the file.');
    }

    const out = result.files[outName];
    if (!out) {
      throw new Error('qpdf did not produce an output file.');
    }
    return out;
  };

  const handleUnlock = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(10);
    setError(null);
    setDownloadUrl(null);

    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const args: string[] = [];
      if (openPassword.trim()) args.push(`--password=${openPassword.trim()}`);
      args.push('--decrypt');

      const outBytes = await runQpdf(args, buf);
      setProgress(95);

      const blob = new Blob([outBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (e: any) {
      setError(e?.message?.toString() || 'Failed to unlock PDF. Check the password and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLock = async () => {
    if (!file) return;
    if (!ownerPassword.trim()) {
      setError('Owner password is required to set permissions.');
      return;
    }
    setIsProcessing(true);
    setProgress(10);
    setError(null);
    setDownloadUrl(null);

    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const args: string[] = [
        '--encrypt',
        userPassword.trim(),
        ownerPassword.trim(),
        String(keyBits),
      ];
      if (allowCsv) args.push(`--allow=${allowCsv}`);
      if (keyBits === 256) args.push('--use-aes=y');

      const outBytes = await runQpdf(args, buf);
      setProgress(95);

      const blob = new Blob([outBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch (e: any) {
      setError(e?.message?.toString() || 'Failed to encrypt PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onConvert = () => {
    if (mode === 'unlock') return void handleUnlock();
    return void handleLock();
  };

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
        {/* BG pulses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from	pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no arrow; Tools button at far right) */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Sparkles className="w-7 h-7 text-white animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Files Nova
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  {mode === 'unlock' ? 'Unlock PDF' : 'Lock PDF'}
                </p>
              </div>

              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                {mode === 'unlock' ? (
                  <UnlockIcon className="w-8 h-8 text-white" />
                ) : (
                  <LockIcon className="w-8 h-8 text-white" />
                )}
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">
                {mode === 'unlock' ? 'Unlock PDF' : 'Lock PDF'}
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                {mode === 'unlock'
                  ? 'Remove password protection from your PDFs (requires the correct password).'
                  : 'Protect your PDF with a password and fine-grained permissions, using strong AES-256 encryption.'}
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                  <Shield className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium">Private & Secure</span>
                </div>
                <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                  <Zap className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-sm font-medium">Fast In-Browser</span>
                </div>
                <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                  <Star className="w-4 h-4 mr-2 text-purple-600" />
                  <span className="text-sm font-medium">QPDF Engine</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            {/* Mode switch */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('unlock');
                  setError(null);
                  setDownloadUrl(null);
                }}
                className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                  mode === 'unlock' ? 'bg-blue-600 text-white' : 'bg-white/60 text-gray-700'
                }`}
                aria-pressed={mode === 'unlock'}
              >
                Unlock
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('lock');
                  setError(null);
                  setDownloadUrl(null);
                }}
                className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                  mode === 'lock' ? 'bg-blue-600 text-white' : 'bg-white/60 text-gray-700'
                }`}
                aria-pressed={mode === 'lock'}
              >
                Lock
              </button>
            </div>

            {/* Upload */}
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload PDF</h3>
            <UploadZone
              accept="application/pdf"
              multiple={false}
              title="Drop your PDF here"
              buttonLabel="Choose File"
              supportedFormats="PDF"
              onFilesSelected={(fs) => {
                const f = fs[0] || null;
                setFile(f);
                setDownloadUrl(null);
                setError(null);
              }}
            />

            {/* Inputs */}
            {mode === 'unlock' ? (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label htmlFor="openPw" className="block text-sm text-gray-700 mb-1">
                    Open Password (if required)
                  </label>
                  <div className="relative">
                    <input
                      id="openPw"
                      type={showOpenPw ? 'text' : 'password'}
                      value={openPassword}
                      onChange={(e) => setOpenPassword(e.target.value)}
                      className="w-full p-3 pr-12 border border-gray-300 rounded-lg"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenPw((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded hover:bg-gray-100"
                      aria-label={showOpenPw ? 'Hide password' : 'Show password'}
                    >
                      {showOpenPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label htmlFor="userPw" className="block text-sm text-gray-700 mb-1">
                      Open Password (user)
                    </label>
                    <div className="relative">
                      <input
                        id="userPw"
                        type={showUserPw ? 'text' : 'password'}
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className="w-full p-3 pr-12 border border-gray-300 rounded-lg"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUserPw((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded hover:bg-gray-100"
                        aria-label={showUserPw ? 'Hide password' : 'Show password'}
                      >
                        {showUserPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <label htmlFor="ownerPw" className="block text-sm text-gray-700 mb-1">
                      Owner Password (required)
                    </label>
                    <div className="relative">
                      <input
                        id="ownerPw"
                        type={showOwnerPw ? 'text' : 'password'}
                        value={ownerPassword}
                        onChange={(e) => setOwnerPassword(e.target.value)}
                        className="w-full p-3 pr-12 border border-gray-300 rounded-lg"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOwnerPw((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded hover:bg-gray-100"
                        aria-label={showOwnerPw ? 'Hide password' : 'Show password'}
                      >
                        {showOwnerPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-sm text-gray-700 mb-2">Key strength</span>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="keybits"
                          checked={keyBits === 128}
                          onChange={() => setKeyBits(128)}
                        />
                        <span className="text-sm">128-bit</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="keybits"
                          checked={keyBits === 256}
                          onChange={() => setKeyBits(256)}
                        />
                        <span className="text-sm">256-bit (recommended)</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="block text-sm text-gray-700 mb-2">Allow permissions</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {([
                      ['print', 'Print'],
                      ['printHighRes', 'High-res print'],
                      ['modify', 'Modify'],
                      ['annotate', 'Annotate'],
                      ['form', 'Fill forms'],
                      ['assemble', 'Assemble'],
                      ['extract', 'Extract text/images'],
                      ['extractAccessibility', 'Screen-reader extract'],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={perm[key]}
                          onChange={(e) =>
                            setPerm((p) => ({ ...p, [key]: e.target.checked }))
                          }
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Convert */}
            <button
              onClick={onConvert}
              disabled={!file || isProcessing || (mode === 'lock' && !ownerPassword.trim())}
              className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={isProcessing}
            >
              {isProcessing ? (mode === 'unlock' ? 'Unlocking…' : 'Encrypting…') : mode === 'unlock' ? 'Unlock PDF' : 'Lock PDF'}
            </button>

            {/* Progress / Errors */}
            {isProcessing && (
              <div className="mt-4 w-full bg-blue-200 rounded-full h-3 overflow-hidden" aria-live="polite">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"
                  style={{ width: `${progress}%` }}
                />
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
                download={
                  file
                    ? mode === 'unlock'
                      ? file.name.replace(/\.pdf$/i, '-unlocked.pdf')
                      : file.name.replace(/\.pdf$/i, '-locked.pdf')
                    : mode === 'unlock'
                    ? 'unlocked.pdf'
                    : 'locked.pdf'
                }
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" /> Download {mode === 'unlock' ? 'Unlocked' : 'Locked'} PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UnlockPdfPage;