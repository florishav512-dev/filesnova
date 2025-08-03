import React, { useState } from 'react';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import {
  ArrowLeft,
  Sparkles,
  Table,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';

/**
 * XlsxToCsvPage converts the first worksheet of an XLSX spreadsheet to CSV.
 * It parses the OpenXML parts directly using JSZip and DOMParser, extracting
 * shared strings and cell values to generate a comma separated values file.
 */
const XlsxToCsvPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setDownloadUrl(null);
    setError(null);
  };

  const columnIndex = (cellRef: string): number => {
    // extract letters from cell reference, convert to index starting at 0
    const letters = cellRef.replace(/\d/g, '');
    let idx = 0;
    for (let i = 0; i < letters.length; i++) {
      idx = idx * 26 + (letters.charCodeAt(i) - 64);
    }
    return idx - 1;
  };

  const parseXlsx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const sharedStrings: string[] = [];
    if (zip.files['xl/sharedStrings.xml']) {
      const ssXml = await zip.files['xl/sharedStrings.xml'].async('string');
      const parser = new DOMParser();
      const doc = parser.parseFromString(ssXml, 'application/xml');
      const siNodes = Array.from(doc.getElementsByTagName('si'));
      for (const si of siNodes) {
        const t = si.getElementsByTagName('t')[0];
        sharedStrings.push(t?.textContent || '');
      }
    }
    // assume first worksheet sheet1.xml
    const sheetPath = Object.keys(zip.files).find((p) => /xl\/worksheets\/sheet1.xml$/.test(p));
    if (!sheetPath) throw new Error('sheet1.xml not found');
    const sheetXml = await zip.files[sheetPath].async('string');
    const parser = new DOMParser();
    const doc = parser.parseFromString(sheetXml, 'application/xml');
    const rows = Array.from(doc.getElementsByTagName('row'));
    const csvRows: string[] = [];
    const total = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = Array.from(row.getElementsByTagName('c'));
      const rowArr: string[] = [];
      let maxCol = 0;
      cells.forEach((c) => {
        const ref = c.getAttribute('r') || '';
        const idx = columnIndex(ref);
        if (idx > maxCol) maxCol = idx;
      });
      // initialize row array with blanks
      for (let k = 0; k <= maxCol; k++) rowArr[k] = '';
      cells.forEach((c) => {
        const ref = c.getAttribute('r') || '';
        const idx = columnIndex(ref);
        const type = c.getAttribute('t');
        const v = c.getElementsByTagName('v')[0];
        let value = v?.textContent || '';
        if (type === 's') {
          const n = parseInt(value, 10);
          value = sharedStrings[n] || '';
        }
        rowArr[idx] = value.replace(/"/g, '""');
      });
      csvRows.push(rowArr.map((cell) => `"${cell}"`).join(','));
      setProgress(Math.round(((i + 1) / total) * 100));
      await new Promise((res) => setTimeout(res, 0));
    }
    return csvRows.join('\n');
  };

  const convert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const csv = await parseXlsx(arrayBuffer);
      const blob = new Blob([csv], { type: 'text/csv' });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to convert file.');
    }
    setIsProcessing(false);
  };

  return (
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
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Files Nova
              </h1>
              <p className="text-xs text-gray-500 font-medium">XLSX to CSV</p>
            </div>
          </div>
        </div>
      </header>
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <Table className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">XLSX to CSV</h2>
            <p className="text-gray-700 text-lg leading-relaxed">Convert spreadsheets into simple CSV files with ease.</p>
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
          <button
            onClick={convert}
            disabled={!file || isProcessing}
            className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Convert to CSV
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
        </div>
        {downloadUrl && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
            <a
              href={downloadUrl}
              download={file?.name.replace(/\.xlsx$/i, '.csv') || 'spreadsheet.csv'}
              className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
            >
              <DownloadIcon className="w-5 h-5 mr-2" /> Download CSV
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default XlsxToCsvPage;