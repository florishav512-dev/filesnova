// src/pages/tools/UnlockPdfPage.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import UploadZone from '../../components/UploadZone';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import {
  Sparkles,
  Unlock,
  Lock,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  FileLock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// ✅ Animated Tools dropdown (same component used on other upgraded pages)
import ToolsMenu from '../../components/ToolsMenu';

type Job = {
  id: string;
  file: File;
  password: string;
  status: 'pending' | 'ok' | 'error';
  message?: string;
  url?: string;
  outName?: string;
};

type Mode = 'unlock' | 'protect';

const UnlockPdfPage: React.FC = () => {
  // SEO (Home → Tools → Unlock PDF)
  const { title, description, canonical, breadcrumb } = TOOL_SEO_DATA['/tools/unlock-pdf'];

  // UI state
  const [mode, setMode] = useState<Mode>('unlock');

  // Unlock state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Unlock options
  const [namePattern, setNamePattern] = useState<string>('{base}-unlocked.pdf');
  const [rememberPasswords, setRememberPasswords] = useState<boolean>(true);

  // Protect (lock) options (UI prepared; encryption requires tiny helper lib – see comment below)
  const [protectFiles, setProtectFiles] = useState<File[]>([]);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [protectOutputName, setProtectOutputName] = useState('protected.pdf');
  const [protectUrl, setProtectUrl] = useState<string | null>(null);

  // Local password memory (per filename)
  const passwordsRef = useRef<Record<string, string>>({});

  // Persist some settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fn_unlockpdf_settings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.namePattern === 'string') setNamePattern(s.namePattern);
      if (typeof s.rememberPasswords === 'boolean') setRememberPasswords(s.rememberPasswords);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('fn_unlockpdf_settings', JSON.stringify({ namePattern, rememberPasswords }));
    } catch {}
  }, [namePattern, rememberPasswords]);

  const resetJobsUrls = () => {
    setJobs((prev) => {
      prev.forEach((j) => j.url && URL.revokeObjectURL(j.url));
      return prev.map((j) => ({ ...j, url: undefined }));
    });
  };

  const onUnlockFilesSelected = (fs: File[]) => {
    resetJobsUrls();
    // prefill password from memory (filename key)
    const mapped: Job[] = fs.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      password: passwordsRef.current[file.name] || '',
      status: 'pending',
    }));
    setJobs((prev) => [...prev, ...mapped]);
    setProgress(0);
  };

  const onProtectFilesSelected = (fs: File[]) => {
    if (fs?.length) setProtectFiles(fs);
    setProtectUrl(null);
  };

  const formatOutputName = (file: File, pat: string) => {
    const base = file.name.replace(/\.pdf$/i, '');
    return pat.replace(/\{base\}/g, base).replace(/\/|\\|:/g, '_');
  };

  // Quick encrypted probe (true if password needed)
  const isEncrypted = async (file: File): Promise<boolean> => {
    try {
      // If we can load without password, it's not encrypted
      const buf = await file.arrayBuffer();
      await PDFDocument.load(buf);
      return false;
    } catch (e: any) {
      // If pdf-lib throws a password error, it's encrypted
      const msg = String(e?.message || e);
      return /password|encrypted/i.test(msg);
    }
  };

  const [error, setError] = useState<string | null>(null);

  const unlockAll = async () => {
    if (!self.crossOriginIsolated) {
      setError("Missing browser security isolation (COOP/COEP). Please reload on HTTPS.");
      return;
    }

    if (jobs.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const worker = new Worker(new URL('./qpdf-worker.js', import.meta.url), { type: 'module' });

    let processedCount = 0;

    worker.onmessage = (event) => {
      const { success, output, error: workerError } = event.data;
      const job = jobs[processedCount];

      if (success) {
        const blob = new Blob([output], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const outName = formatOutputName(job.file, namePattern);
        setJobs((prev) =>
          prev.map((x) =>
            x.id === job.id ? { ...x, status: 'ok', url, outName, message: undefined } : x
          )
        );
        if (rememberPasswords && job.password) {
          passwordsRef.current[job.file.name] = job.password;
        }
      } else {
        setJobs((prev) =>
          prev.map((x) => (x.id === job.id ? { ...x, status: 'error', message: workerError } : x))
        );
      }

      processedCount++;
      setProgress(Math.round((processedCount / jobs.length) * 100));

      if (processedCount === jobs.length) {
        worker.terminate();
        setIsProcessing(false);
      }
    };

    worker.onerror = (err) => {
      setError(`Worker error: ${err.message}`);
      setIsProcessing(false);
      worker.terminate();
    };

    jobs.forEach(job => {
      worker.postMessage({ file: job.file, password: job.password, action: 'decrypt' });
    });
  };

  // PROTECT (LOCK) – UI prepared; enable once an encrypt helper is available
  const canProtect = false;
  /* 
    pdf-lib (today) cannot *write* password-encrypted PDFs. 
    If/when you add a tiny helper (e.g. a pure-TS AES-256 PDF encryptor that accepts a pdf-lib Uint8Array),
    flip `canProtect` to true and implement below:

    Example (pseudo):
      const outBytes = await out.save();
      const encryptedBytes = await encryptPdfBytes(outBytes, {
        userPassword,
        ownerPassword,
        permissions: { printing: 'high', copying: false, modifying: false },
        algorithm: 'AES-256',
      });
      const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
      setProtectUrl(URL.createObjectURL(blob));

    Until then, we keep the Protect button disabled and clearly labeled as “coming soon”.
  */

  const protect = async () => {
    // Placeholder for future encryption helper integration.
    // Keeps UX and plumbing intact with zero UI restyle required.
  };

  const allOk = useMemo(() => jobs.every((j) => j.status === 'ok'), [jobs]);

  return (
    <>
      <ToolSeo title={title} description={description} canonical={canonical} breadcrumb={breadcrumb} showBreadcrumb />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Background pulses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no back arrow; Tools button on right) */}
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
                <p className="text-xs text-gray-500 font-medium">Unlock / Protect PDF</p>
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
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                {mode === 'unlock' ? <Unlock className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">
                {mode === 'unlock' ? 'Unlock PDF' : 'Protect (Lock) PDF'}
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                {mode === 'unlock'
                  ? 'Remove open-password from your PDFs (with the correct password). Private, fast, in your browser.'
                  : 'Add an open-password to your PDF (UI ready). Encryption enabling is coming soon.'}
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

          {/* Mode toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('unlock')}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors ${mode === 'unlock' ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-700'}`}
            >
              Unlock PDF
            </button>
            <button
              onClick={() => setMode('protect')}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors ${mode === 'protect' ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-700'}`}
            >
              Protect (Lock) PDF
            </button>
          </div>

          {/* UNLOCK PANEL */}
          {mode === 'unlock' && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload PDFs & Enter Passwords</h3>
              <UploadZone
                accept="application/pdf"
                multiple={true}
                title="Drop your encrypted PDFs here"
                buttonLabel="Choose Files"
                supportedFormats="PDF"
                onFilesSelected={onUnlockFilesSelected}
              />

              {jobs.length > 0 && (
                <>
                  {/* Options */}
                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Output name pattern</label>
                      <input
                        value={namePattern}
                        onChange={(e) => setNamePattern(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="{base}-unlocked.pdf"
                      />
                      <p className="text-xs text-gray-500 mt-1">Use <code className="font-mono bg-gray-100 px-1 rounded">{'{base}'}</code> for the original filename (without .pdf).</p>
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rememberPasswords}
                        onChange={(e) => setRememberPasswords(e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">Remember passwords (per filename) this session</span>
                    </label>
                  </div>

                  {/* File list */}
                  <div className="mt-6 space-y-3">
                    {jobs.map((j) => (
                      <div key={j.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                            <FileLock className="w-6 h-6 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{j.file.name}</p>
                            <p className="text-xs text-gray-500">{(j.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={j.password}
                            onChange={(e) =>
                              setJobs((prev) =>
                                prev.map((x) => (x.id === j.id ? { ...x, password: e.target.value } : x))
                              )
                            }
                            placeholder="Password"
                            className="w-40 p-2 border border-gray-300 rounded-lg"
                          />
                          {j.status === 'ok' && <CheckCircle className="w-5 h-5 text-green-600" title="Unlocked" />}
                          {j.status === 'error' && <XCircle className="w-5 h-5 text-red-600" title={j.message || 'Error'} />}
                        </div>

                        {/* Per-file download when ready */}
                        {j.status === 'ok' && j.url && (
                          <a
                            href={j.url}
                            download={j.outName || formatOutputName(j.file, namePattern)}
                            className="sm:ml-auto bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Progress + action */}
                  <button
                    onClick={unlockAll}
                    disabled={isProcessing || jobs.length === 0}
                    className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Unlocking…' : 'Unlock PDFs'}
                  </button>
                  {isProcessing && (
                    <div className="mt-4 w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  {/* Batch download tip */}
                  {allOk && (
                    <p className="text-sm text-gray-600 mt-4">
                      Tip: To download all, tap each green “Download” — (ZIP bundling intentionally avoided to keep everything client-side and simple).
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* PROTECT PANEL */}
          {mode === 'protect' && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload PDF to Protect</h3>
              <UploadZone
                accept="application/pdf"
                multiple={false}
                title="Drop your PDF here"
                buttonLabel="Choose File"
                supportedFormats="PDF"
                onFilesSelected={onProtectFilesSelected}
              />

              {protectFiles.length > 0 && (
                <>
                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Open Password (required)</label>
                      <input
                        type="password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="Password users must enter to open"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Owner Password (optional)</label>
                      <input
                        type="password"
                        value={ownerPassword}
                        onChange={(e) => setOwnerPassword(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="Grants full permissions to owner"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-1">Output Filename</label>
                      <input
                        value={protectOutputName}
                        onChange={(e) => setProtectOutputName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="protected.pdf"
                      />
                    </div>
                  </div>

                  <button
                    onClick={protect}
                    disabled={!userPassword || !protectFiles.length || !canProtect}
                    className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={canProtect ? 'Protect PDF' : 'Password encryption coming soon (requires tiny helper lib)'}
                  >
                    {canProtect ? 'Protect PDF (AES-256)' : 'Protect PDF (coming soon)'}
                  </button>

                  {!canProtect && (
                    <p className="text-xs text-gray-600 mt-3">
                      Note: <code className="font-mono bg-gray-100 px-1 rounded">pdf-lib</code> cannot write encrypted PDFs. 
                      This UI is ready; enable encryption later by adding a small helper that AES-encrypts the saved bytes. 
                      The rest of the page will work without any additional UI changes.
                    </p>
                  )}

                  {protectUrl && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mt-6 text-center">
                      <h4 className="text-lg font-bold text-gray-900 mb-3">2. Download</h4>
                      <a
                        href={protectUrl}
                        download={protectOutputName || 'protected.pdf'}
                        className="inline-flex items-center justify-center w-full px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
                      >
                        <DownloadIcon className="w-5 h-5 mr-2" /> Download Protected PDF
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UnlockPdfPage;
