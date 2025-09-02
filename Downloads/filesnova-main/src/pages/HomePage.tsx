import React, { useState, useRef, useEffect } from 'react';
import AdSpace from '../components/AdSpace';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Shield,
  Zap,
  Smartphone,
  FileText,
  Image as ImageIcon,
  Archive,
  Type,
  ChevronRight,
  Gauge,
  Facebook,
  Instagram,
  Linkedin,
} from 'lucide-react';

// Inline chevron-down (avoids lucide version issues)
const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props} xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Minimal "X" (Twitter rebrand) icon
const XLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" role="img" {...props} xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2H21l-6.56 7.49L22 22h-6.83l-4.77-6.36L4.88 22H2.12l6.99-7.98L2 2h6.83l4.36 5.81L18.24 2Z" fill="currentColor"/>
  </svg>
);

// ===== Tool categories (unchanged) =====
const toolCategories = [
  {
    id: 'documents',
    name: 'Documents',
    icon: FileText,
    gradient: 'from-blue-500 via-blue-600 to-indigo-700',
    bgGradient: 'from-blue-50 to-indigo-100',
    tools: [
      { name: 'JPG to PDF', desc: 'Convert images to PDF instantly', route: '/tools/jpg-to-pdf' },
      { name: 'PNG to PDF', desc: 'High-quality image to PDF', route: '/tools/png-to-pdf' },
      { name: 'DOCX to PDF', desc: 'Word documents to PDF', route: '/tools/docx-to-pdf' },
      { name: 'Text to PDF', desc: 'Plain text to formatted PDF', route: '/tools/text-to-pdf' },
      { name: 'Markdown to PDF', desc: 'Markdown files to PDF', route: '/tools/markdown-to-pdf' },
      { name: 'RTF to DOCX', desc: 'Rich text format conversion', route: '/tools/rtf-to-docx' },
      { name: 'HTML to PDF', desc: 'Web pages to PDF', route: '/tools/html-to-pdf' },
      { name: 'EPUB to PDF', desc: 'eBooks to PDF format', route: '/tools/epub-to-pdf' },
      { name: 'XLSX to CSV', desc: 'Excel to CSV conversion', route: '/tools/xlsx-to-csv' },
      { name: 'PPTX to PDF', desc: 'PowerPoint to PDF', route: '/tools/pptx-to-pdf' },
    ],
  },
  {
    id: 'pdf',
    name: 'PDF Tools',
    icon: FileText,
    gradient: 'from-red-500 via-pink-500 to-rose-600',
    bgGradient: 'from-red-50 to-pink-100',
    tools: [
      { name: 'PDF to JPG', desc: 'Extract images from PDF', route: '/tools/pdf-to-jpg' },
      { name: 'Merge PDFs', desc: 'Combine multiple PDFs', route: '/tools/merge-pdfs' },
      { name: 'Split PDF', desc: 'Extract specific pages', route: '/tools/split-pdf' },
      { name: 'Unlock PDF', desc: 'Remove password protection', route: '/tools/unlock-pdf' },
      { name: 'Extract Text', desc: 'Get text from PDF files', route: '/tools/extract-text' },
      { name: 'Extract Images', desc: 'Get all images from PDF', route: '/tools/extract-images' },
    ],
  },
  {
    id: 'images',
    name: 'Images & Media',
    icon: ImageIcon,
    gradient: 'from-green-500 via-emerald-500 to-teal-600',
    bgGradient: 'from-green-50 to-emerald-100',
    tools: [
      { name: 'Image Resizer', desc: 'Resize images perfectly', route: '/tools/image-resizer' },
      { name: 'Compress Images', desc: 'Reduce file size', route: '/tools/compress-images' },
      { name: 'WebP Converter', desc: 'Modern image format', route: '/tools/webp-converter' },
      { name: 'SVG to PNG', desc: 'Vector to raster conversion', route: '/tools/svg-to-png' },
      { name: 'GIF to MP4', desc: 'Animated GIF to video', route: '/tools/gif-to-mp4' },
      { name: 'Background Remover', desc: 'AI-powered removal', route: '/tools/background-remover' },
    ],
  },
  {
    id: 'archives',
    name: 'Archives',
    icon: Archive,
    gradient: 'from-purple-500 via-violet-500 to-indigo-600',
    bgGradient: 'from-purple-50 to-violet-100',
    tools: [
      { name: 'Create ZIP', desc: 'Bundle files together', route: '/tools/create-zip' },
      { name: 'Extract ZIP', desc: 'Unpack archive files', route: '/tools/extract-zip' },
      { name: 'Combine ZIPs', desc: 'Merge multiple archives', route: '/tools/combine-zips' },
      { name: 'TAR to ZIP', desc: 'Convert archive formats', route: '/tools/tar-to-zip' },
    ],
  },
  {
    id: 'text',
    name: 'Text Utilities',
    icon: Type,
    gradient: 'from-orange-500 via-amber-500 to-yellow-600',
    bgGradient: 'from-orange-50 to-amber-100',
    tools: [
      { name: 'Word Counter', desc: 'Count words and characters', route: '/tools/word-counter' },
      { name: 'Case Converter', desc: 'Change text formatting', route: '/tools/case-converter' },
      { name: 'QR Generator', desc: 'Create QR codes instantly', route: '/tools/qr-generator' },
      { name: 'QR Scanner', desc: 'Read QR codes from images', route: '/tools/qr-scanner' },
    ],
  },
];

// Feature cards data
const features = [
  { icon: Shield, title: '100% Private & Secure', desc: 'Files never leave your device. Zero uploads, maximum privacy.', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Zap, title: 'Lightning Fast Conversion', desc: 'Instant processing powered by your browser. No waiting.', gradient: 'from-yellow-500 to-orange-500' },
  { icon: Smartphone, title: 'Works Everywhere', desc: 'Perfect experience on desktop, tablet, and mobile devices.', gradient: 'from-green-500 to-emerald-500' },
];

const HomePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // All Tools dropdown state
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const allTools = toolCategories.flatMap((c) => c.tools);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const filteredCategories =
    selectedCategory === 'all' ? toolCategories : toolCategories.filter((cat) => cat.id === selectedCategory);

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
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Sparkles className="w-7 h-7 text-white animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Files Nova
                </h1>
                <p className="text-xs text-gray-500 font-medium">File conversion reimagined</p>
              </div>
            </div>

            {/* Right side: nav + All Tools dropdown */}
            <div className="flex items-center">
              {/* Navigation Links (desktop) */}
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#tools" className="relative text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium group">
                  Tools
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
                <Link to="/help" className="relative text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium group">
                  Help
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/contact" className="relative text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium group">
                  Contact
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/privacy-policy" className="relative text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium group">
                  Privacy
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </nav>

              {/* All Tools dropdown */}
              <div className="relative ml-2" ref={toolsMenuRef}>
                <button
                  onClick={() => setToolsOpen((v) => !v)}
                  className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 bg-white/70 hover:bg-white shadow-sm ring-1 ring-black/5 backdrop-blur transition-all"
                  aria-haspopup="menu"
                  aria-expanded={toolsOpen}
                  aria-label="Open all tools menu"
                >
                  All Tools
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
                </button>

                <div
                  className={`absolute right-0 mt-2 w-80 max-h-[60vh] overflow-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 origin-top-right transform transition duration-150 ${
                    toolsOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                  role="menu"
                >
                  <div className="p-2">
                    {allTools.map((t) => (
                      <Link
                        key={t.route}
                        to={t.route}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setToolsOpen(false)}
                        role="menuitem"
                      >
                        <span>{t.name}</span>
                        <span className="text-gray-400">›</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-32 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 font-semibold mb-8 shadow-lg">
            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            <span>30+ Premium Tools • 100% Free Forever</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">
            Convert Files
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
              Like Magic ✨
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            The most powerful file converter on the web. <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">No uploads, no limits, no compromises.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <a href="#tools" className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center">
                Start Converting Now
                <ChevronRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
            <a href="#features" className="group border-3 border-gray-300 text-gray-700 px-10 py-5 rounded-2xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 hover:shadow-xl transition-all duration-300 hover:bg-blue-50">
              Watch Demo
            </a>
          </div>
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500">
            <div className="flex items-center gap-2"><span className="font-medium">No Registration Required</span></div>
            <div className="flex items-center gap-2"><span className="font-medium">100% Private</span></div>
            <div className="flex items-center gap-2"><span className="font-medium">Works Offline</span></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-4 bg-white/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-6">Why Choose Files Nova?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Experience the future of file conversion with our cutting-edge technology</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"></div>
                <div className="relative bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  <div className={`w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900 text-center">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed text-center">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="relative z-10 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-6">Powerful Tools at Your Fingertips</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Choose from our comprehensive collection of professional-grade conversion tools</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`group px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${selectedCategory === 'all' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl' : 'bg-white text-gray-700 hover:bg-gray-50 shadow-lg border border-gray-200'}`}
            >
              All Tools
            </button>
            {toolCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`group px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-3 ${selectedCategory === category.id ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl' : 'bg-white text-gray-700 hover:bg-gray-50 shadow-lg border border-gray-200'}`}
              >
                <category.icon className="w-5 h-5" />
                {category.name}
              </button>
            ))}
          </div>
          <div className="space-y-12">
            {filteredCategories.map((category, idx) => (
              <React.Fragment key={category.id}>
                <div className="group">
                  <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.bgGradient} opacity-0 group-hover:opacity-100 transition-all duration-700`}></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-6 mb-8">
                        <div className={`w-16 h-16 bg-gradient-to-r ${category.gradient} rounded-2xl flex items-center justify-center shadow-xl`}>
                          <category.icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-gray-900">{category.name}</h3>
                          <p className="text-gray-600 font-medium">{category.tools.length} tools</p>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {category.tools.map((tool, tIdx) => (
                          <Link
                            key={tIdx}
                            to={tool.route}
                            className="group/tool relative p-6 text-left bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-102"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 group-hover/tool:text-blue-600 transition-colors text-lg">
                                  {tool.name}
                                </h4>
                                <p className="text-gray-600 text-sm mt-1 leading-relaxed">{tool.desc}</p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover/tool:text-blue-600 group-hover/tool:translate-x-1 transition-all flex-shrink-0 ml-2" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 font-medium">Click to convert</span>
                              <Gauge className="w-4 h-4 text-green-500" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {idx < filteredCategories.length - 1 && <AdSpace />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
<footer className="relative z-10 bg-gray-900 text-white">
  <div className="max-w-7xl mx-auto px-4 py-12">
    {/* Top: 4 columns */}
    <div className="grid gap-10 md:grid-cols-4">
      {/* Brand column */}
      <div>
        <div className="flex items-center space-x-4 mb-6">
          {/* Make this wrapper relative so the dot positions to the logo, not the whole footer */}
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Sparkles className="w-7 h-7 text-white animate-pulse" />
            </div>
            {/* Bouncing dot pinned to the logo’s corner */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></span>
          </div>

          <div>
            <h3 className="text-2xl font-black">Files Nova</h3>
            <p className="text-gray-400 text-sm">File conversion reimagined</p>
          </div>
        </div>

        <p className="text-gray-400 text-sm leading-relaxed">
          The fastest, most secure, and most beautiful way to convert files online. Trusted by millions worldwide.
        </p>
      </div>

      {/* Popular Tools */}
      <div>
        <h4 className="font-bold mb-6 text-lg">Popular Tools</h4>
        <ul className="space-y-3 text-gray-400 text-sm">
          <li><Link to="/tools/docx-to-pdf" className="hover:text-white transition-colors">PDF Converter</Link></li>
          <li><Link to="/tools/image-resizer" className="hover:text-white transition-colors">Image Resizer</Link></li>
          <li><Link to="/tools/create-zip" className="hover:text-white transition-colors">ZIP Creator</Link></li>
          <li><Link to="/tools/qr-generator" className="hover:text-white transition-colors">QR Generator</Link></li>
        </ul>
      </div>

      {/* Support */}
      <div>
        <h4 className="font-bold mb-6 text-lg">Support</h4>
        <ul className="space-y-3 text-gray-400 text-sm">
          <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
          <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
          <li><Link to="/help" className="hover:text-white transition-colors">FAQ</Link></li>
          <li><Link to="/tutorials" className="hover:text-white transition-colors">Tutorials</Link></li>
        </ul>
      </div>

      {/* Legal */}
      <div>
        <h4 className="font-bold mb-6 text-lg">Legal</h4>
        <ul className="space-y-3 text-gray-400 text-sm">
          <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
          <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
          <li><Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
          <li><Link to="/gdpr" className="hover:text-white transition-colors">GDPR</Link></li>
        </ul>
      </div>
    </div>

    {/* Bottom bar: socials left, copyright right (stacks on mobile) */}
    <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex justify-center md:justify-start gap-6">
        <a href="https://facebook.com/filesnovaapp" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
          <Facebook className="w-6 h-6" />
        </a>
        <a href="https://twitter.com/filesnovaapp" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
          <XLogo className="w-6 h-6" />
        </a>
        <a href="https://instagram.com/filesnovaapp" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
          <Instagram className="w-6 h-6" />
        </a>
        <a href="https://linkedin.com/company/filesnovaapp" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
          <Linkedin className="w-6 h-6" />
        </a>
      </div>

      <div className="text-center md:text-right text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Files Nova. Made with ❤️ for the world. All rights reserved.
      </div>
    </div>
  </div>
</footer>
 </div>
);
};

export default HomePage;
