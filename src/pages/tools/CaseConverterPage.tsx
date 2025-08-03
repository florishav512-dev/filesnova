import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Text as TextIcon,
  Shield,
  Zap,
  Star,
  Clipboard as ClipboardIcon,
} from 'lucide-react';
import AdSpace from '../../components/AdSpace';

/**
 * CaseConverterPage allows users to convert text between different cases: upper,
 * lower, title and sentence. Results can be copied to the clipboard.
 */
const CaseConverterPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const toSentenceCase = (str: string) => {
    return str
      .toLowerCase()
      .replace(/(^\s*[a-z])|([.!?]\s*[a-z])/g, (c) => c.toUpperCase());
  };

  const convert = (mode: 'upper' | 'lower' | 'title' | 'sentence') => {
    try {
      let result = '';
      switch (mode) {
        case 'upper':
          result = input.toUpperCase();
          break;
        case 'lower':
          result = input.toLowerCase();
          break;
        case 'title':
          result = toTitleCase(input);
          break;
        case 'sentence':
          result = toSentenceCase(input);
          break;
      }
      setOutput(result);
      setCopied(false);
    } catch (err: any) {
      console.error(err);
      setError('Failed to convert text');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
              <p className="text-xs text-gray-500 font-medium">Case Converter</p>
            </div>
          </div>
        </div>
      </header>
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <TextIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Case Converter</h2>
            <p className="text-gray-700 text-lg leading-relaxed">Transform your text between upper, lower, title and sentence case.</p>
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
          <h3 className="text-xl font-bold text-gray-900 mb-4">1. Enter Text</h3>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste text here..."
            className="w-full h-40 p-4 mb-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <button
              onClick={() => convert('upper')}
              disabled={!input}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              UPPERCASE
            </button>
            <button
              onClick={() => convert('lower')}
              disabled={!input}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              lowercase
            </button>
            <button
              onClick={() => convert('title')}
              disabled={!input}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Title Case
            </button>
            <button
              onClick={() => convert('sentence')}
              disabled={!input}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sentence
            </button>
          </div>
          {error && <p className="text-red-600 mb-4">{error}</p>}
        </div>
        {output && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">2. Result</h3>
            <textarea
              value={output}
              readOnly
              className="w-full h-40 p-4 mb-4 rounded-xl border border-gray-300 bg-gray-50"
            ></textarea>
            <button
              onClick={copyToClipboard}
              className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center"
            >
              <ClipboardIcon className="w-5 h-5 mr-2" />
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        )}
        {/* Ad space below the conversion area */}
        <AdSpace />
      </div>
    </div>
  );
};

export default CaseConverterPage;