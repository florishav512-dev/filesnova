import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';

/**
 * RtfToDocxPage converts simple RTF documents into minimal DOCX files.
 * The conversion strips RTF control words and embeds the plain text into
 * a basic OpenXML package. This tool is not perfect but works for
 * unformatted RTF files.
 */
const RtfToDocxPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setDownloadUrl(null);
    setError(null);
  };

  const stripRtf = (rtf: string): string => {
    // convert hex escapes to characters
    let text = rtf.replace(/\\'[0-9a-fA-F]{2}/g, (match) => {
      const hex = match.substring(2);
      return String.fromCharCode(parseInt(hex, 16));
    });
    // remove control words (e.g. \b0, \par, etc.)
    text = text.replace(/\\[a-zA-Z]+\d* ?/g, '');
    // remove braces
    text = text.replace(/[{}]/g, '');
    return text.trim();
  };

  const buildDocx = async (plain: string): Promise<Blob> => {
    const zip = new JSZip();
    // relationships
    const rels = `<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n</Relationships>`;
    zip.file('_rels/.rels', rels);
    // content types
    const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n <Default Extension="xml" ContentType="application/xml"/>\n <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n</Types>`;
    zip.file('[Content_Types].xml', contentTypes);
    // document xml
    const escaped = plain
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n <w:body>\n  <w:p>\n   <w:r>\n    <w:t>${escaped}</w:t>\n   </w:r>\n  </w:p>\n </w:body>\n</w:document>`;
    zip.file('word/document.xml', docXml);
    const blob = await zip.generateAsync({ type: 'blob' });
    return blob;
  };

  const convert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const rtf = await file.text();
      const plain = stripRtf(rtf);
      const blob = await buildDocx(plain);
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      console.error(err);
      setError('Failed to convert file.');
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      {/* Header */}
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
              <p className="text-xs text-gray-500 font-medium">RTF to DOCX</p>
            </div>
          </div>
        </div>
      </header>
      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        {/* Tool header */}
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">RTF to DOCX</h2>
            <p className="text-gray-700 text-lg leading-relaxed">Convert basic RTF documents to editable DOCX files.</p>
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
        {/* Upload & Convert */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload RTF File</h3>
          <input type="file" accept=".rtf,application/rtf,text/rtf" onChange={handleFileChange} className="mb-4" />
          <button
            onClick={convert}
            disabled={!file || isProcessing}
            className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Convert to DOCX
          </button>
          {isProcessing && <p className="mt-4 text-center">Processing...</p>}
          {error && <p className="text-red-600 mt-4">{error}</p>}
        </div>
        {downloadUrl && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>
            <a
              href={downloadUrl}
              download={file?.name.replace(/\.rtf$/i, '.docx') || 'document.docx'}
              className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
            >
              <DownloadIcon className="w-5 h-5 mr-2" /> Download DOCX
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default RtfToDocxPage;