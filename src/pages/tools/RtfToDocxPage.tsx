// src/pages/tools/RtfToDocxPage.tsx
import React, { useState } from 'react';
import JSZip from 'jszip';
import UploadZone from '../../components/UploadZone';
import AdSpace from '../../components/AdSpace';
import { ToolSeo } from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';
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
 * It strips most RTF control words and wraps the plain text in a basic
 * OpenXML package (word/document.xml). Best for unformatted RTF.
 */
const RtfToDocxPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- SEO data (route key must match toolSeoData.ts) ---
  const { title, description, canonical, breadcrumb } =
    TOOL_SEO_DATA['/tools/rtf-to-docx'];

  // Rough RTF -> plain text stripper (handles hex escapes + control words)
  const stripRtf = (rtf: string): string => {
    // convert hex escapes like \'e2 to characters
    let text = rtf.replace(/\\'[0-9a-fA-F]{2}/g, (m) =>
      String.fromCharCode(parseInt(m.slice(2), 16))
    );
    // remove unicode escapes like \u1234?
    text = text.replace(/\\u-?\d+\??/g, '');
    // remove control words and their optional numeric params (e.g., \b0, \par)
    text = text.replace(/\\[a-zA-Z]+-?\d* ?/g, '');
    // remove groups/braces and backslashes left behind
    text = text.replace(/[{}]/g, '').replace(/\\~/g, ' ').replace(/\\-/g, '');
    // collapse whitespace
    text = text.replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ');
    return text.trim();
  };

  // Build a minimal DOCX (word/document.xml + rels + content types)
  const buildDocx = async (plain: string): Promise<Blob> => {
    const zip = new JSZip();

    // _rels/.rels
    zip.file(
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
    );

    // [Content_Types].xml
    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
    );

    // word/document.xml
    const escaped = plain.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Split text by newline into <w:p> paragraphs
    const paras = escaped
      .split(/\r?\n/)
      .map(
        (line) =>
          `<w:p><w:r><w:t xml:space="preserve">${line || ''}</w:t></w:r></w:p>`
      )
      .join('\n');

    zip.file(
      'word/document.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paras}
  </w:body>
</w:document>`
    );

    return zip.generateAsync({ type: 'blob' });
  };

  const convert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setDownloadUrl(null);

    try {
      const rtf = await file.text();
      const plain = stripRtf(rtf);
      const blob = await buildDocx(plain || '');
      setDownloadUrl(URL.createObjectURL(blob));
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
      />

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
              <p className="text-gray-700 text-lg leading-relaxed">
                Convert basic RTF documents to editable DOCX files.
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

          {/* Upload & Convert */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Upload RTF File</h3>
            <UploadZone
              accept=".rtf,application/rtf,text/rtf"
              multiple={false}
              title="Drop your RTF file here"
              buttonLabel="Choose File"
              supportedFormats="RTF"
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
              {isProcessing ? 'Processing…' : 'Convert to DOCX'}
            </button>
            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>

          {/* Download */}
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

          {/* Ad placement */}
          <AdSpace />
        </div>
      </div>
    </>
  );
};

export default RtfToDocxPage;
