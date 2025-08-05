import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * PageLayout provides a consistent gradient background and a simple header
 * with the Files Nova branding. It renders a title and optional subtitle
 * followed by the provided children inside a card. Use this for support
 * and legal pages to match the site's design language.
 */
const PageLayout: React.FC<PageLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      {/* Brand Header with return arrow and page title */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center space-x-4">
          {/* Return arrow */}
          <a href="/" className="p-3 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </a>
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
          </div>
          <div>
            <span className="text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Files Nova
            </span>
            <p className="text-xs text-gray-500 font-medium">{title}</p>
          </div>
        </div>
      </header>
      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Title Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">{title}</h1>
          {subtitle && <p className="text-gray-600 text-lg mb-4">{subtitle}</p>}
          {children && <div className="mt-4 text-gray-700 space-y-4">{children}</div>}
        </div>
      </div>
    </div>
  );
};

export default PageLayout;