// src/pages/tools/XlsxToCsvPage.tsx

import React, { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
import ToolsMenu from '../../components/ToolsMenu';
import {
  Sparkles,
  Table,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';

type SheetMeta = { name: string; relId: string; path?: string };

type Options = {
  delimiter: 'comma' | 'semicolon' | 'tab' | 'custom';
  customDelimiter: string;
  includeHeader: boolean;
  trimCells: boolean;
  quoteAll: boolean;
  preserveTrailingEmpty: boolean;
};

const defaultOpts: Options = {
  delimiter: 'comma',
  customDelimiter: '',
  includeHeader: true,
  trimCells: true,
  quoteAll: false,
  preserveTrailingEmpty: true,
};

/**
 * XLSX -> CSV
 * - Detects sheets via xl/workbook.xml + xl/_rels/workbook.xml.rels
 * - Parses sharedStrings + a chosen sheet's XML
 * - Can export one sheet (single CSV) or "All sheets" (ZIP)
 */
const XlsxToCsvPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  // workbook state
  const [zip, setZip] = useState<JSZip | null>(null);
  const [sharedStrings, setSharedStrings] = useState<string[] | null>(null);
  const [sheets, setSheets] = useState<SheetMeta[]>([]);
  const [selectedSheetRelId, setSelectedSheetRelId] = useState<string>(''); // '' means none, '__ALL__' means all

  // ui
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opts, setOpts] = useState<Options>(defaultOpts);

  // SEO (Home → Tools → XLSX to CSV)
  const { title, description, canonical, breadcrumb } =
    TOOL_SEO_DATA['/tools/xlsx-to-csv'];

  const delimiterChar = useMemo(() => {
    if (opts.delimiter === 'comma') return ',';
    if (opts.delimiter === 'semicolon') return ';';
    if (opts.delimiter === 'tab') return '\t';
    // custom
    return opts.customDelimiter || ',';
  }, [opts]);

  // ---- helpers ----
  const columnIndex = (cellRef: string): number => {
    // extract letters from cell reference, convert to index starting at 0 (A->0, B->1, ... AA->26, etc.)
    const letters = cellRef.replace(/\d/g, '');
    let idx = 0;
    for (let i = 0; i < letters.length; i++) {
      idx = idx * 26 + (letters.charCodeAt(i) - 64);
    }
    return idx - 1;
  };

  const readSharedStrings = async (z: JSZip): Promise<string[]> => {
    const out: string[] = [];
    const ss = z.files['xl/sharedStrings.xml'];
    if (!ss) return out;
    const ssXml = await ss.async('string');
    const parser = new DOMParser();
    const doc = parser.parseFromString(ssXml, 'application/xml');
    const siNodes = Array.from(doc.getElementsByTagName('si'));
    for (const si of siNodes) {
      // A shared string can be plain <t> or rich <r><t/>...</r>
      const tNodes = si.getElementsByTagName('t');
      if (tNodes && tNodes.length > 0) {
        // concatenate all <t> nodes
        let s = '';
        for (const t of Array.from(tNodes)) s += t.textContent || '';
        out.push(s);
      } else {
        out.push('');
      }
    }
    return out;
  };

  const discoverSheets = async (z: JSZip): Promise<SheetMeta[]> => {
    const wb = z.files['xl/workbook.xml'];
    if (!wb) throw new Error('Invalid XLSX: missing xl/workbook.xml');

    const rels = z.files['xl/_rels/workbook.xml.rels'];
    if (!rels) throw new Error('Invalid XLSX: missing xl/_rels/workbook.xml.rels');

    const wbXml = await wb.async('string');
    const relsXml = await rels.async('string');

    const parser = new DOMParser();
    const wbDoc = parser.parseFromString(wbXml, 'application/xml');
    const relsDoc = parser.parseFromString(relsXml, 'application/xml');

    const relMap = new Map<string, string>(); // r:id -> target path like "worksheets/sheet1.xml"
    Array.from(relsDoc.getElementsByTagName('Relationship')).forEach((r) => {
      const id = r.getAttribute('Id') || '';
      const target = r.getAttribute('Target') || '';
      if (id && target) relMap.set(id, target);
    });

    const list: SheetMeta[] = [];
    Array.from(wbDoc.getElementsByTagName('sheet')).forEach((s) => {
      const name = s.getAttribute('name') || 'Sheet';
      const relId = s.getAttribute('r:id') || '';
      list.push({ name, relId, path: undefined });
    });

    // resolve paths
    for (const s of list) {
      const relTarget = relMap.get(s.relId || '');
      if (relTarget) {
        // normalize to xl/<target>
        s.path = `xl/${relTarget.replace(/^\//, '')}`;
      }
    }

    return list;
  };

  const parseSheetToCsv = async (
    z: JSZip,
    sheetPath: string,
    ss: string[],
    delimiter: string,
    options: Options
  ): Promise<string> => {
    const file = z.files[sheetPath];
    if (!file) throw new Error(`Worksheet not found: ${sheetPath}`);
    const sheetXml = await file.async('string');
    const parser = new DOMParser();
    const doc = parser.parseFromString(sheetXml, 'application/xml');
    const rows = Array.from(doc.getElementsByTagName('row'));

    const csvRows: string[] = [];
    const total = rows.length || 1;
    const quote = (val: string) => {
      // Basic CSV quoting. Quote if requested or value contains delimiter, quotes, or newline.
      let v = options.trimCells ? val.trim() : val;
      if (options.quoteAll || /["\r\n]/.test(v) || v.includes(delimiter)) {
        v = v.replace(/"/g, '""');
        return `"${v}"`;
      }
      return v;
    };

    // optional header from inferred max columns of first row (only if includeHeader true)
    // We don't know column names; use A, B, C ... for convenience.
    let headerEmitted = false;
    let inferredMaxCols = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = Array.from(row.getElementsByTagName('c'));
      const rowArr: string[] = [];
      let maxCol = -1;

      // figure max column index seen in this row
      cells.forEach((c) => {
        const ref = c.getAttribute('r') || '';
        const idx = columnIndex(ref);
        if (idx > maxCol) maxCol = idx;
      });

      inferredMaxCols = Math.max(inferredMaxCols, maxCol + 1);

      // initialize row array
      for (let k = 0; k <= maxCol; k++) rowArr[k] = '';

      // fill values
      cells.forEach((c) => {
        const ref = c.getAttribute('r') || '';
        const idx = columnIndex(ref);
        const type = c.getAttribute('t'); // 's' -> shared string
        const v = c.getElementsByTagName('v')[0];
        let value = v?.textContent || '';
        if (type === 's') {
          const n = parseInt(value, 10);
          value = ss[n] ?? '';
        }
        rowArr[idx] = value;
      });

      // preserve trailing empties?
      const arr = options.preserveTrailingEmpty ? rowArr : trimRightEmpties(rowArr);
      csvRows.push(arr.map(quote).join(delimiter));

      setProgress(Math.round(((i + 1) / total) * 100));
      // yield to UI
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 0));

      // emit header (A,B,C,...) once after first data line if requested
      if (!headerEmitted && options.includeHeader && csvRows.length === 1) {
        const hdr: string[] = [];
        for (let c = 0; c < inferredMaxCols; c++) hdr.push(colNameFromIndex(c));
        csvRows.unshift(hdr.map(quote).join(delimiter));
        headerEmitted = true;
      }
    }

    // empty sheet fallback header
    if (rows.length === 0 && options.includeHeader) {
      csvRows.push(['A'].map((h) => `"${h}"`).join(delimiter));
    }

    return csvRows.join('\n');
  };

  const trimRightEmpties = (arr: string[]) => {
    let end = arr.length - 1;
    while (end >= 0 && (arr[end] ?? '') === '') end--;
    return arr.slice(0, end + 1);
  };

  const colNameFromIndex = (i: number) => {
    // 0 -> A, 25 -> Z, 26 -> AA
    let n = i + 1;
    let s = '';
    while (n > 0) {
      const r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };

  // ---- file load: pre-parse workbook + sharedStrings ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!file) {
        setZip(null);
        setSharedStrings(null);
        setSheets([]);
        setSelectedSheetRelId('');
        setDownloadUrl(null);
        setError(null);
        return;
      }
      try {
        setIsProcessing(true);
        setProgress(5);
        setError(null);
        setDownloadUrl(null);

        const z = await JSZip.loadAsync(await file.arrayBuffer());
        if (cancelled) return;
        setZip(z);

        const ss = await readSharedStrings(z);
        if (cancelled) return;
        setSharedStrings(ss);

        const metas = await discoverSheets(z);
        if (cancelled) return;

        // Ensure at least one sheet with resolved path
        const resolved = metas.map((m) => ({
          ...m,
          path: m.path || 'xl/worksheets/sheet1.xml',
        }));

        setSheets(resolved);
        setSelectedSheetRelId(resolved[0]?.relId || '');
        setProgress(15);
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setError(e?.message || 'Failed to read XLSX.');
      } finally {
        if (!cancelled) setIsProcessing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  // ---- convert handler ----
  const convert = async () => {
    if (!file || !zip || !sharedStrings || sheets.length === 0) return;

    setIsProcessing(true);
    setProgress(20);
    setError(null);
    setDownloadUrl(null);

    try {
      if (selectedSheetRelId === '__ALL__') {
        // export each sheet to CSV, zip them
        const outZip = new JSZip();
        for (let i = 0; i < sheets.length; i++) {
          const s = sheets[i];
          const p = s.path!;
          const csv = await parseSheetToCsv(zip, p, sharedStrings, delimiterChar, opts);
          const safeName = s.name.replace(/[\\/:*?"<>|]/g, '_');
          outZip.file(`${safeName || `Sheet${i + 1}`}.csv`, csv);
          setProgress(Math.round(20 + ((i + 1) / sheets.length) * 75));
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 0));
        }
        const blob = await outZip.generateAsync({ type: 'blob' });
        setDownloadUrl(URL.createObjectURL(blob));
      } else {
        // single sheet
        const s = sheets.find((x) => x.relId === selectedSheetRelId) || sheets[0];
        const csv = await parseSheetToCsv(zip, s.path!, sharedStrings, delimiterChar, opts);
        const blob = new Blob([csv], { type: 'text/csv' });
        setDownloadUrl(URL.createObjectURL(blob));
      }
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to convert file.');
    } finally {
      setIsProcessing(false);
    }
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
        {/* Animated BG */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no arrow; Tools button on right) */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-">
              <div className="relative shrink-0">
                <img
                  src={FileNovaIcon}
                  alt="Files Nova"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"

                 draggable={false}
                />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Files Nova
                </h1>
                <p className="text-xs text-gray-500 font-medium">XLSX to CSV</p>
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
                <Table className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">XLSX to CSV</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Choose the sheet, delimiter, and export as a single CSV or a ZIP with all sheets — fast and private in your browser.
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

          {/* Uploader + Options */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload XLSX File</h3>
            <UploadZone
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              multiple={false}
              title="Drop your XLSX file here"
              buttonLabel="Choose File"
              supportedFormats="XLSX"
              onFilesSelected={(fs) => {
                const f = fs[0] || null;
                setFile(f);
                setDownloadUrl(null);
                setError(null);
              }}
            />

            {/* Sheet + Delimiter + CSV options */}
            {file && sheets.length > 0 && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-xl border border-gray-200 bg-white/70">
                  <h4 className="font-semibold text-gray-900 mb-3">Sheet</h4>
                  <div className="flex flex-col gap-3">
                    <select
                      value={selectedSheetRelId}
                      onChange={(e) => setSelectedSheetRelId(e.target.value)}
                      className="p-2 border border-gray-300 rounded-lg bg-white"
                    >
                      {sheets.map((s) => (
                        <option key={s.relId} value={s.relId}>
                          {s.name || 'Sheet'}
                        </option>
                      ))}
                      <option value="__ALL__">All sheets (ZIP)</option>
                    </select>
                    <p className="text-xs text-gray-600">
                      Export a single sheet as CSV, or choose <em>All sheets</em> to download a ZIP of CSVs.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white/70">
                  <h4 className="font-semibold text-gray-900 mb-3">CSV Format</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Delimiter</label>
                      <select
                        value={opts.delimiter}
                        onChange={(e) => setOpts((o) => ({ ...o, delimiter: e.target.value as Options['delimiter'] }))}
                        className="p-2 border border-gray-300 rounded-lg bg-white w-full"
                      >
                        <option value="comma">Comma (,)</option>
                        <option value="semicolon">Semicolon (;)</option>
                        <option value="tab">Tab (\t)</option>
                        <option value="custom">Custom…</option>
                      </select>
                      {opts.delimiter === 'custom' && (
                        <input
                          value={opts.customDelimiter}
                          onChange={(e) => setOpts((o) => ({ ...o, customDelimiter: e.target.value }))}
                          placeholder="Enter delimiter"
                          className="mt-2 w-full p-2 border border-gray-300 rounded-lg"
                        />
                      )}
                    </div>

                    <div className="grid gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={opts.includeHeader}
                          onChange={(e) => setOpts((o) => ({ ...o, includeHeader: e.target.checked }))}
                        />
                        <span className="text-sm text-gray-700">Include header (A, B, C…)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={opts.quoteAll}
                          onChange={(e) => setOpts((o) => ({ ...o, quoteAll: e.target.checked }))}
                        />
                        <span className="text-sm text-gray-700">Quote all values</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={opts.trimCells}
                          onChange={(e) => setOpts((o) => ({ ...o, trimCells: e.target.checked }))}
                        />
                        <span className="text-sm text-gray-700">Trim cell values</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={opts.preserveTrailingEmpty}
                          onChange={(e) => setOpts((o) => ({ ...o, preserveTrailingEmpty: e.target.checked }))}
                        />
                        <span className="text-sm text-gray-700">Preserve trailing empty cells</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={convert}
              disabled={!file || sheets.length === 0 || isProcessing}
              className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Convert to {selectedSheetRelId === '__ALL__' ? 'ZIP' : 'CSV'}
            </button>

            {isProcessing && (
              <div className="mt-4 w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all"
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
                  selectedSheetRelId === '__ALL__'
                    ? (file?.name.replace(/\.xlsx$/i, '_sheets.zip') || 'sheets.zip')
                    : (file?.name.replace(/\.xlsx$/i, '.csv') || 'sheet.csv')
                }
                className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Download {selectedSheetRelId === '__ALL__' ? 'ZIP' : 'CSV'}
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default XlsxToCsvPage;
