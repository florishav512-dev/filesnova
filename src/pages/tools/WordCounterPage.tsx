import React, { useState } from 'react';
import UploadZone from '../../components/UploadZone';
import {
  ArrowLeft,
  Sparkles,
  AlignLeft,
  Shield,
  Zap,
  Star,
} from 'lucide-react';

/**
 * WordCounterPage provides a simple interface to count words, characters and lines
 * in a block of text. Users can type or paste text directly or upload a .txt file.
 */
const WordCounterPage: React.FC = () => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [counts, setCounts] = useState<{ words: number; chars: number; lines: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setCounts(null);
    setError(null);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setText(result);
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsText(f);
    } else {
      setText('');
    }
  };

  const computeCounts = () => {
    try {
      const trimmed = text.trim();
      const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
      const charCount = text.length;
      const lineCount = text ? text.split(/\r?\n/).length : 0;
      setCounts({ words: wordCount, chars: charCount, lines: lineCount });
    } catch (err: any) {
      console.error(err);
      setError('Failed to compute counts');
    }
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
              <p className="text-xs text-gray-500 font-medium">Word Counter</p>
            </div>
          </div>
        </div>
      </header>
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <AlignLeft className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Word Counter</h2>
            <p className="text-gray-700 text-lg leading-relaxed">Count words, characters and lines in your text or uploaded file.</p>
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
          <h3 className="text-xl font-bold text-gray-900 mb-4">1. Enter or Upload Text</h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste text here..."
            className="w-full h-40 p-4 mb-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
          <UploadZone
            accept="text/plain"
            multiple={false}
            title="Drop your TXT file here"
            buttonLabel="Choose File"
            supportedFormats="TXT"
            onFilesSelected={(fs) => {
              const f = fs[0] || null;
              setFile(f);
              setCounts(null);
              setError(null);
              if (f) {
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  setText(result);
                };
                reader.onerror = () => {
                  setError('Failed to read file');
                };
                reader.readAsText(f);
              } else {
                setText('');
              }
            }}
          />
          <button
            onClick={computeCounts}
            disabled={(!text && !file) || !!error}
            className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Count Words
          </button>
          {error && <p className="text-red-600 mt-4">{error}</p>}
        </div>
        {counts && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">2. Results</h3>
            <div className="flex flex-col items-center space-y-2 text-gray-700">
              <p><strong>Words:</strong> {counts.words}</p>
              <p><strong>Characters:</strong> {counts.chars}</p>
              <p><strong>Lines:</strong> {counts.lines}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordCounterPage;