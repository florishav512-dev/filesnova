import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
  Star,
  Upload as UploadIcon,
  Clock,
  X,
  CheckCircle,
  Download as DownloadIcon,
} from 'lucide-react';

const JpgToPdfPage: React.FC = () => {
  const [files, setFiles] = useState<{ id: string; file: File; status: 'ready' | 'completed' }[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected) {
      const jpgs = Array.from(selected).filter((file) => file.type === 'image/jpeg');
      const mapped = jpgs.map((file) => ({ id: `${file.name}-${Date.now()}-${Math.random()}`, file, status: 'ready' as const }));
      setFiles((prev) => [...prev, ...mapped]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files;
    if (dropped) {
      const jpgs = Array.from(dropped).filter((file) => file.type === 'image/jpeg');
      const mapped = jpgs.map((file) => ({ id: `${file.name}-${Date.now()}-${Math.random()}`, file, status: 'ready' as const }));
      setFiles((prev) => [...prev, ...mapped]);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsConverting(true);
    setProgress(0);
    // Create PDF
    const pdfDoc = await PDFDocument.create();
    let count = 0;
    for (const item of files) {
      const buffer = await item.file.arrayBuffer();
      const imageBytes = new Uint8Array(buffer);
      const embed = await pdfDoc.embedJpg(imageBytes);
      const dims = embed.scale(1);
      const page = pdfDoc.addPage([dims.width, dims.height]);
      page.drawImage(embed, { x: 0, y: 0, width: dims.width, height: dims.height });
      count++;
      setProgress((count / files.length) * 100);
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    setIsConverting(false);
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'completed' })));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20 space-x-4">
            {/* Return arrow */}
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
              <p className="text-xs text-gray-500 font-medium">JPG to PDF Converter</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        {/* Tool Header */}
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <UploadIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">JPG to PDF Converter</h2>
            <p className="text-gray-700 text-lg leading-relaxed">Convert your JPG images to high-quality PDF documents instantly</p>
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

        {/* Upload Area */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8">
          <div className="p-8">
            <div
              className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="mb-6">
                <UploadIcon className="w-16 h-16 mx-auto text-gray-400 group-hover:text-blue-500 group-hover:animate-bounce transition-all" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Drop your files here</h3>
              <p className="text-gray-600 mb-4">or click to browse from your device</p>
              <button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:-translate-y-1">
                Choose Files
              </button>
              <p className="text-xs text-gray-500 mt-4">Supported formats: JPG, JPEG</p>
            </div>
            <input ref={inputRef} type="file" accept="image/jpeg" multiple className="hidden" onChange={handleFileSelect} />
          </div>
          {files.length > 0 && (
            <div className="border-t border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Selected Files ({files.length})</h3>
              <div className="space-y-4">
                {files.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                        <UploadIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 truncate">{item.file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(item.file.size)}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {item.status === 'completed' && <CheckCircle className="w-6 h-6 text-green-500" />}
                        {item.status === 'ready' && <Clock className="w-6 h-6 text-gray-400" />}
                        <button onClick={() => removeFile(item.id)} className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Conversion Progress */}
              {isConverting && (
                <div className="mt-8 p-6 bg-blue-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-blue-900">Converting your files...</span>
                    <span className="text-blue-600 font-bold">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleConvert}
                  disabled={files.length === 0 || isConverting}
                  className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                >
                  {isConverting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-3"></div>
                      Converting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 inline mr-3" />
                      Start Conversion
                    </>
                  )}
                </button>
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    download="images.pdf"
                    className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <DownloadIcon className="w-5 h-5 inline mr-2" />
                    Download
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JpgToPdfPage;
