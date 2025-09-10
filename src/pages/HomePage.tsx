// src/pages/HomePage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
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
  Lock,
  WifiOff,
  UserX,
  Scissors,
  FolderArchive,
  Images,
  FileImage,
  FileDown,
  FileCode2,
  FileType,
  File,
  FileScan,
  FileDigit,
  FileSpreadsheet,
  FileText as FileTextIcon,
  FileChartColumn,
  ImageDown,
  ImageUp,
  QrCode,
  X as CloseIcon,
  Twitter,
  Heart,
} from 'lucide-react';
import FileNovaIcon from '../assets/FILESNOVANEWICON.png';


// Inline chevron-down
const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props} xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/** Brand-accurate X (Twitter) mark */
const XLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 120 120" aria-hidden="true" role="img" {...props} xmlns="http://www.w3.org/2000/svg">
    <path
      fill="currentColor"
      d="M83.8 9h14.2L68.6 43.3 103 91H74.6L55.2 64.9 31.6 91H17.4l31-35.9L16 9h29l17.7 24.2L83.8 9z"
    />
  </svg>
);

// ===== Section cards data =====
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
      { name: 'RTF/ODT/DOC to DOCX', desc: 'Convert legacy docs to modern DOCX', route: '/tools/rtf-to-docx' },
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
      { name: 'Unlock/Lock PDF', desc: 'Add or remove PDF passwords', route: '/tools/unlock-pdf' },
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

// ===== Icons for the All Tools mega-menu =====
const ToolIconMap: Record<string, React.FC<any>> = {
  'Word to PDF': FileTextIcon,
  'PowerPoint to PDF': FileChartColumn,
  'JPG to PDF': FileImage,
  'PNG to PDF': ImageUp,
  'Images to PDF': Images,
  'Markdown to PDF': FileCode2,
  'Text to PDF': File,
  'HTML to PDF': FileCode2,
  'EPUB to PDF': FileType,
  'XLSX to CSV': FileSpreadsheet,
  'PPTX to PDF': FileChartColumn,

  'PDF to JPG': ImageDown,
  'SVG to PNG': ImageDown,
  'WEBP Converter': ImageDown,
  'GIF to MP4': FileDown,
  'RTF to DOCX': FileTextIcon,
  'RTF/ODT/DOC to DOCX': FileTextIcon,
  'Image to PDF': FileImage,

  'Merge PDF': FolderArchive,
  'Split PDF': Scissors,
  'Create ZIP': Archive,
  'Combine ZIPs': FolderArchive,
  'Extract ZIP': Archive,

  'Extract Images': ImageDown,
  'Extract Text': FileScan,

  'Compress Images': ImageDown,

  'Case Converter': Type,
  'Word Counter': FileDigit,
  'QR Generator': QrCode,
  'QR Scanner': QrCode,

  'Unlock/Lock PDF': Lock,
};

// ===== All Tools (mega-menu) groups =====
const allToolsGrouped = [
  {
    title: 'CONVERT TO PDF',
    items: [
      { label: 'Word to PDF', route: '/tools/docx-to-pdf' },
      { label: 'PowerPoint to PDF', route: '/tools/pptx-to-pdf' },
      { label: 'JPG to PDF', route: '/tools/jpg-to-pdf' },
      { label: 'PNG to PDF', route: '/tools/png-to-pdf' },
      { label: 'Images to PDF', route: '/tools/jpg-to-pdf' },
      { label: 'Markdown to PDF', route: '/tools/markdown-to-pdf' },
      { label: 'Text to PDF', route: '/tools/text-to-pdf' },
      { label: 'HTML to PDF', route: '/tools/html-to-pdf' },
      { label: 'EPUB to PDF', route: '/tools/epub-to-pdf' },
    ],
  },
  {
    title: 'CONVERT FROM / BETWEEN',
    items: [
      { label: 'PDF to JPG', route: '/tools/pdf-to-jpg' },
      { label: 'SVG to PNG', route: '/tools/svg-to-png' },
      { label: 'WEBP Converter', route: '/tools/webp-converter' },
      { label: 'GIF to MP4', route: '/tools/gif-to-mp4' },
      { label: 'XLSX to CSV', route: '/tools/xlsx-to-csv' },
      { label: 'RTF/ODT/DOC to DOCX', route: '/tools/rtf-to-docx' },
      { label: 'Image to PDF', route: '/tools/jpg-to-pdf' },
    ],
  },
  {
    title: 'MERGE & SPLIT',
    items: [
      { label: 'Merge PDF', route: '/tools/merge-pdfs' },
      { label: 'Split PDF', route: '/tools/split-pdf' },
      { label: 'Create ZIP', route: '/tools/create-zip' },
      { label: 'Combine ZIPs', route: '/tools/combine-zips' },
      { label: 'Extract ZIP', route: '/tools/extract-zip' },
    ],
  },
  {
    title: 'PDF TOOLS',
    items: [
      { label: 'Extract Images', route: '/tools/extract-images' },
      { label: 'Extract Text', route: '/tools/extract-text' },
      { label: 'Unlock/Lock PDF', route: '/tools/unlock-pdf' },
    ],
  },
  {
    title: 'IMAGES & QR',
    items: [
      { label: 'Compress Images', route: '/tools/compress-images' },
      { label: 'Image Resizer', route: '/tools/image-resizer' },
      { label: 'QR Generator', route: '/tools/qr-generator' },
      { label: 'QR Scanner', route: '/tools/qr-scanner' },
    ],
  },
  {
    title: 'TEXT UTILITIES',
    items: [
      { label: 'Case Converter', route: '/tools/case-converter' },
      { label: 'Word Counter', route: '/tools/word-counter' },
    ],
  },
];

// 🎨 category colors for the mega-menu icons
const menuGroupStyles: Record<string, { iconBg: string; ring: string; hover: string }> = {
  'CONVERT TO PDF': { iconBg: 'from-blue-500 via-indigo-500 to-purple-500', ring: 'ring-blue-200/70', hover: 'hover:bg-blue-50' },
  'CONVERT FROM / BETWEEN': { iconBg: 'from-emerald-500 via-teal-500 to-cyan-500', ring: 'ring-emerald-200/70', hover: 'hover:bg-emerald-50' },
  'MERGE & SPLIT': { iconBg: 'from-violet-500 via-fuchsia-500 to-indigo-500', ring: 'ring-violet-200/70', hover: 'hover:bg-violet-50' },
  'PDF TOOLS': { iconBg: 'from-rose-500 via-pink-500 to-red-500', ring: 'ring-rose-200/70', hover: 'hover:bg-rose-50' },
  'IMAGES & QR': { iconBg: 'from-green-500 via-lime-500 to-emerald-500', ring: 'ring-green-200/70', hover: 'hover:bg-green-50' },
  'TEXT UTILITIES': { iconBg: 'from-amber-500 via-orange-500 to-yellow-500', ring: 'ring-amber-200/70', hover: 'hover:bg-amber-50' },
};

const features = [
  { icon: Shield, title: '100% Private & Secure', desc: 'Files never leave your device. Zero uploads, maximum privacy.', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Zap, title: 'Lightning Fast Conversion', desc: 'Instant processing powered by your browser. No waiting.', gradient: 'from-yellow-500 to-orange-500' },
  { icon: Smartphone, title: 'Works Everywhere', desc: 'Perfect experience on desktop, tablet, and mobile devices.', gradient: 'from-green-500 to-emerald-500' },
];



const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const socialLinks = [
    { 
      name: 'X', 
      url: 'https://x.com/files_nova', 
      icon: XLogo,
      hoverColor: 'hover:text-gray-100'
    },
    { 
      name: 'Facebook', 
      url: 'https://www.facebook.com/filesnovaapp', 
      icon: Facebook,
      hoverColor: 'hover:text-blue-500'
    },
    { 
      name: 'Instagram', 
      url: 'https://www.instagram.com/filesnovaapp', 
      icon: Instagram,
      hoverColor: 'hover:text-pink-400'
    },
    { 
      name: 'LinkedIn', 
      url: 'https://www.linkedin.com/company/filesnovaapp', 
      icon: Linkedin,
      hoverColor: 'hover:text-blue-600'
    }
  ];

  const popularTools = [
    { name: 'PDF Converter', path: '/tools/docx-to-pdf', icon: FileText },
    { name: 'Image Resizer', path: '/tools/image-resizer', icon: ImageIcon },
    { name: 'ZIP Creator', path: '/tools/create-zip', icon: Archive },
    { name: 'QR Generator', path: '/tools/qr-generator', icon: QrCode }
  ];

  const supportLinks = [
    { name: 'Help Center', path: '/help' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'FAQ', path: '/help' },
    { name: 'Tutorials', path: '/tutorials' }
  ];

  const legalLinks = [
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Cookie Policy', path: '/cookie-policy' },
    { name: 'GDPR', path: '/gdpr' }
  ];

  return (
    <footer className="relative z-10 bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Decorative top border */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Section - Enhanced */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-start gap-2">
              <img src={FileNovaIcon} alt="Files Nova" className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain" loading="lazy" width="96" height="96" />
              <div className="min-w-0">
                <h3 className="font-extrabold text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-none">
                  Files Nova
                </h3>
                <p className="text-gray-400 text-sm font-medium mt-1">
                  File conversion reimagined
                </p>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
              The fastest and most secure way to convert files in your browser. 
              <span className="block mt-2 text-xs text-gray-400">
                Trusted by millions worldwide.
              </span>
            </p>

            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 bg-gray-800 hover:bg-gray-700 ${social.hoverColor} rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-lg`}
                    aria-label={social.name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Popular Tools - Enhanced */}
          <div className="space-y-6">
            <h4 className="text-white font-bold text-lg relative">
              Popular Tools
              <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </h4>
            <ul className="space-y-4">
              {popularTools.map((tool, index) => {
                const IconComponent = tool.icon;
                return (
                  <li key={index} className="group">
                    <Link 
                      to={tool.path} 
                      className="flex items-center gap-3 text-gray-300 hover:text-white transition-all duration-200 group-hover:translate-x-1"
                    >
                      <IconComponent className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                      <span className="text-sm font-medium">{tool.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Support Section - Enhanced */}
          <div className="space-y-6">
            <h4 className="text-white font-bold text-lg relative">
              Support
              <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-green-500 to-teal-500 rounded-full"></div>
            </h4>
            <ul className="space-y-4">
              {supportLinks.map((link, index) => (
                <li key={index} className="group">
                  <Link 
                    to={link.path} 
                    className="text-gray-300 hover:text-white text-sm font-medium transition-all duration-200 group-hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Section - Enhanced */}
          <div className="space-y-6">
            <h4 className="text-white font-bold text-lg relative">
              Legal
              <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            </h4>
            <ul className="space-y-4">
              {legalLinks.map((link, index) => (
                <li key={index} className="group">
                  <Link 
                    to={link.path} 
                    className="text-gray-300 hover:text-white text-sm font-medium transition-all duration-200 group-hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider with gradient */}
        <div className="mt-16 mb-8">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
        </div>

        {/* Bottom Section - Enhanced */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Copyright */}
          <div className="text-center lg:text-left">
            <p className="text-gray-400 text-sm font-medium">
              &copy; {currentYear} Files Nova. Made with{' '}
              <Heart className="inline w-4 h-4 text-red-500 mx-1 animate-pulse" />{' '}
              for the world.
            </p>
            <p className="text-gray-500 text-xs mt-1">
              All rights reserved. Empowering productivity globally.
            </p>
          </div>

          {/* Social Links Text Version (Mobile Fallback) */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm lg:hidden">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-gray-300 ${social.hoverColor} transition-colors duration-200 font-medium`}
              >
                {social.name}
              </a>
            ))}
          </div>

          {/* Additional Info for Desktop */}
          <div className="hidden lg:block text-right">
            <p className="text-gray-400 text-xs">
              Secure • Fast • Reliable
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Processing files since 2020
            </p>
          </div>
        </div>
      </div>

      {/* Bottom gradient border */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30"></div>
    </footer>
  );
}

const HomePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close on click outside + Esc
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) setToolsOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setToolsOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Lock background scroll when the mobile sheet is open
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    if (isMobile && toolsOpen) document.documentElement.style.overflow = 'hidden';
    else document.documentElement.style.overflow = '';
    return () => { document.documentElement.style.overflow = ''; };
  }, [toolsOpen]);

  const filteredCategories =
    selectedCategory === 'all' ? toolCategories : toolCategories.filter((cat) => cat.id === selectedCategory);

  // --- JSON-LD structured data ---
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://filesnova.com/#website',
        name: 'Files Nova',
        url: 'https://filesnova.com/',
        description: 'Fast, private, in-browser file conversion tools. No uploads, no limits.',
        inLanguage: 'en',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://filesnova.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://filesnova.com/#organization',
        name: 'Files Nova',
        url: 'https://filesnova.com/',
        logo: 'https://filesnova.com/favicon.png',
        sameAs: [
          'https://x.com/files_nova',
          'https://www.facebook.com/filesnovaapp',
          'https://www.instagram.com/filesnovaapp',
          'https://www.linkedin.com/company/filesnovaapp',
        ],
      },
      {
        '@type': 'AboutPage',
        '@id': 'https://filesnova.com/#about',
        url: 'https://filesnova.com/',
        name: 'About Files Nova — The Future of File Conversion',
        isPartOf: { '@id': 'https://filesnova.com/#website' },
        primaryImageOfPage: 'https://filesnova.com/og-image.jpg',
        description:
          'Files Nova is a privacy-first, in-browser file conversion suite built with jsPDF, pdf-lib, JSZip, TensorFlow.js and more. No registration, no uploads—fast, secure, and free.',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* ===== Files Nova – Aurora ULTRA (canvas only) ===== */}
      <style>{`
        @keyframes fnOrbitCW   { to { transform: rotate(360deg); } }
        @keyframes fnOrbitCCW  { to { transform: rotate(-360deg); } }
        @keyframes fnBreathe   {
          0%,100% { transform: translate3d(42vmax,0,0) scale(1); }
          50%     { transform: translate3d(42vmax,0,0) scale(1.5); }
        }
        .fn-aurora-stage {
          position: fixed;
          inset: -20%;
          z-index: 0;
          pointer-events: none;
        }
        .fn-aurora-sheet {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 140vmax;
          height: 140vmax;
          transform: translate(-50%, -50%);
          filter: blur(110px);
          opacity: 0.95;
          will-change: transform, opacity;
        }
        .fn-aurora-sheet > span {
          position: absolute;
          left: 0; top: 0;
          width: 60vmax; height: 60vmax;
          border-radius: 9999px;
          transform: translate3d(42vmax, 0, 0);
          animation: fnBreathe 11s ease-in-out infinite;
          will-change: transform;
        }
        .fn-a-blue   > span { background: radial-gradient(closest-side, rgba(59,130,246,0.95) 0%, rgba(59,130,246,0) 70%); }
        .fn-a-pink   > span { background: radial-gradient(closest-side, rgba(236,72,153,0.95) 0%, rgba(236,72,153,0) 70%); }
        .fn-a-purple > span { background: radial-gradient(closest-side, rgba(147,51,234,0.92) 0%, rgba(147,51,234,0) 70%); }
        .fn-a-cyan   > span { background: radial-gradient(closest-side, rgba(6,182,212,0.88) 0%, rgba(6,182,212,0) 70%); }
        .fn-a-amber  > span { background: radial-gradient(closest-side, rgba(245,158,11,0.72) 0%, rgba(245,158,11,0) 70%); }
        .fn-a-blue   { animation: fnOrbitCW  28s linear infinite; }
        .fn-a-pink   { animation: fnOrbitCCW 36s linear infinite; }
        .fn-a-purple { animation: fnOrbitCW  48s linear infinite; }
        .fn-a-cyan   { animation: fnOrbitCCW 60s linear infinite; }
        .fn-a-amber  { animation: fnOrbitCW  72s linear infinite; }

        @keyframes fnSweep {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .fn-base-sweep {
          position: absolute; inset: -25%;
          background: linear-gradient(270deg,
            rgba(236,72,153,0.36),
            rgba(147,51,234,0.36),
            rgba(59,130,246,0.36),
            rgba(6,182,212,0.28),
            rgba(236,72,153,0.36)
          );
          background-size: 700% 700%;
          animation: fnSweep 22s ease-in-out infinite;
          filter: blur(100px);
          opacity: .65;
        }

        /* === NEW: Animated gradient for "All Tools" button (blue → pink → purple) === */
        @keyframes fnBtnGradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .fn-anim-btn {
          background-image: linear-gradient(90deg, #2563eb, #ec4899, #7c3aed);
          background-size: 200% 200%;
          animation: fnBtnGradientShift 6s ease-in-out infinite;
          color: #fff;
        }
      `}</style>

      {/* Background layers (canvas only) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="fn-base-sweep" />
        <div className="fn-aurora-stage">
          <div className="fn-aurora-sheet fn-a-blue"><span /></div>
          <div className="fn-aurora-sheet fn-a-pink"><span /></div>
          <div className="fn-aurora-sheet fn-a-purple"><span /></div>
          <div className="fn-aurora-sheet fn-a-cyan"><span /></div>
          <div className="fn-aurora-sheet fn-a-amber"><span /></div>
        </div>
      </div>

      {/* Header (made more translucent) */}
      {/* Header (Files Nova branding with PNG logo) */}
<header className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-xl shadow-lg border-b border-white/20">
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex items-center h-20 gap-3">
      {/* Brand logo + name */}
      <div className="flex items-center gap- flex-1 min-w-0">
        <div className="relative shrink-0">
          
          <img
  src={FileNovaIcon}
  alt="Files Nova"
  className="w-20 h-20 object-contain"
  draggable={false}
  loading="lazy"
  width="96"
  height="96"
/>

        </div>
        <div>
          <h1
  className="font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent
             leading-none whitespace-nowrap text-3xl"
>
  Files Nova
</h1>
<p className="text-gray-500 font-medium leading-tight whitespace-nowrap text-xs">
  File conversion reimagined
</p>

        </div>
      </div>

            {/* Right: nav + All Tools */}
            <div className="flex items-center flex-nowrap">
              <nav className="flex items-center space-x-8">
                
                <Link to="/help" className="relative text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium group hidden md:block">
                  Help
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/contact" className="relative text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium group hidden md:block">
                  Contact
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/privacy-policy" className="relative text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium group hidden md:block">
                  Privacy
                  <span className="absolute -bottom-1 left-0 w-0.5 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </nav>

              <div className="relative ml-2" ref={toolsMenuRef}>
                <button
                  onClick={() => setToolsOpen((v) => !v)}
                  className={`fn-anim-btn flex items-center gap-2 rounded-2xl
px-3 py-2 text-sm
shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0
whitespace-nowrap flex-shrink-0`}

                  aria-haspopup="menu" aria-expanded={toolsOpen} aria-label="Open all tools menu"
                >
                  Tools
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Desktop mega-menu */}
                <div
                  className={`hidden sm:block absolute right-0 mt-2 w-[860px] max-w-[90vw] max-h-[70vh] overflow-auto
                              rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 origin-top-right transform transition duration-150
                              ${toolsOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                  role="menu"
                >
                  <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-">
                    {allToolsGrouped.map((group) => {
                      const style = menuGroupStyles[group.title] ?? menuGroupStyles['CONVERT TO PDF'];
                      return (
                        <div key={group.title}>
                          <div className="text-xs font-bold tracking-wide text-gray-500 mb-3">{group.title}</div>
                          <ul className="space-y-2">
                            {group.items.map((it) => {
                              const Icon = ToolIconMap[it.label] || FileTextIcon;
                              return (
                                <li key={it.label}>
                                  <Link
                                    to={it.route}
                                    onClick={() => setToolsOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-800 border border-transparent transition-all ${style.hover}`}
                                    role="menuitem"
                                  >
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl shadow-sm ring-1 ${style.ring} bg-gradient-to-r ${style.iconBg}`}>
                                      <Icon className="w-4 h-4 text-white" />
                                    </span>
                                    <span className="flex-1">{it.label}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* /All Tools */}
            </div>
          </div>
        </div>
      </header>

      {/* ========= PORTAL: Mobile bottom sheet ========= */}
      {toolsOpen &&
        createPortal(
          <div className="sm:hidden fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setToolsOpen(false)} aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 max-h[85vh] max-h-[85vh] rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 flex flex-col">
              <div className="sticky top-0 bg-white rounded-t-3xl">
                <div className="mx-auto mt-2 mb-1 h-1.5 w-12 rounded-full bg-gray-300" />
                <div className="relative px-4 py-3">
                  <h3 className="text-lg font-bold text-gray-900 text-center pointer-events-none">All Tools</h3>
                  <button
                    onClick={() => setToolsOpen(false)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-gray-100 active:scale-95 transition"
                    aria-label="Close tools"
                    autoFocus
                  >
                    <CloseIcon className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
                <hr className="border-gray-100" />
              </div>
              <div className="overflow-y-auto px-3 pb-6">
                {allToolsGrouped.map((group) => {
                  const style = menuGroupStyles[group.title] ?? menuGroupStyles['CONVERT TO PDF'];
                  return (
                    <div key={group.title} className="mb-4">
                      <div className="text-[11px] font-bold tracking-wide text-gray-500 px-1 mb-2">{group.title}</div>
                      <ul className="space-y-1">
                        {group.items.map((it) => {
                          const Icon = ToolIconMap[it.label] || FileTextIcon;
                          return (
                            <li key={it.label}>
                              <Link
                                to={it.route}
                                onClick={() => setToolsOpen(false)}
                                className="flex items-center gap-3 px-3 py-3 rounded-2xl text-sm text-gray-900 active:bg-gray-100"
                                role="menuitem"
                              >
                                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl shadow-sm ring-1 ${style.ring} bg-gradient-to-r ${style.iconBg}`}>
                                  <Icon className="w-4.5 h-4.5 text-white" />
                                </span>
                                <span className="flex-1">{it.label}</span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* ===== Hero ===== */}
      <section className="relative z-10 py-32 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 font-semibold mb-8 shadow-lg">
            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            <span>30+ Premium Tools • 100% Free Forever</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">
            Convert Files
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Like Magic ✨
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            The most powerful file converter on the web. <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">No uploads, no limits, no compromises.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <a href="#tools" className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
              <span className="relative flex items-center">
                Start Converting Now
                <ChevronRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
            <a href="#features" className="group border-3 border-gray-300 text-gray-700 px-10 py-5 rounded-2xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 hover:shadow-xl transition-all duration-300 hover:bg-blue-50">
              Watch Demo
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-gray-700">
            <div className="flex items-center gap-2 bg-white/80 px-5 py-3 rounded-xl shadow-sm">
              <UserX className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-base sm:text-lg">No Registration Required</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-5 py-3 rounded-xl shadow-sm">
              <Lock className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-base sm:text-lg">100% Private</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-5 py-3 rounded-xl shadow-sm">
              <WifiOff className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-base sm:text-lg">Works Offline</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Tools ===== */}
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
                className={`group px-5 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-100 flex items-center gap-3 ${selectedCategory === category.id ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl' : 'bg-white text-gray-700 hover:bg-gray-50 shadow-lg border border-gray-200'}`}
              >
                <category.icon className="w-5 h-5" />
                {category.name}
              </button>
            ))}
          </div>

          <div className="space-y-12">
            {(selectedCategory === 'all' ? toolCategories : toolCategories.filter(c=>c.id===selectedCategory)).map((category, idx) => (
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

      {/* ===== Why Choose ===== */}
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

      {/* ===== ABOUT ===== */}
      <section id="about" className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">About Files Nova — The Future of File Conversion</h2>

          <p className="text-gray-700 leading-relaxed mb-6">
            Files Nova isn’t just another file converter. It’s your all-in-one digital toolbox, designed to make file handling effortless, private, and lightning fast.
            Unlike traditional converters that upload your data to third-party servers, Files Nova performs every operation
            <strong> directly inside your browser</strong> using modern JavaScript technologies like <strong>jsPDF, pdf-lib, browser-image-compression, JSZip, TensorFlow.js</strong>, and more.
            Your files never leave your device—privacy is baked in by design.
          </p>

          <hr className="my-6 border-gray-200" />

          <h3 className="text-2xl font-bold text-gray-900 mt-4 mb-4">Why Files Nova Stands Out</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
            <li><strong>100% Private & Secure</strong> — All processing happens on your device. No hidden uploads, no server storage.</li>
            <li><strong>No Registration or Limits</strong> — Use every tool instantly. No sign-ups, no paywalls, no restrictions on file size.</li>
            <li><strong>Lightning Fast Performance</strong> — Optimized algorithms deliver results in seconds, even for large documents or images.</li>
            <li><strong>Works Anywhere</strong> — Whether on desktop, tablet, or smartphone, Files Nova adapts seamlessly.</li>
            <li><strong>Completely Free</strong> — Every tool is available at zero cost, forever.</li>
          </ul>

          <hr className="my-6 border-gray-200" />

          <h3 className="text-2xl font-bold text-gray-900 mt-4 mb-4">Explore Our Full Suite of Tools</h3>
          <p className="text-gray-700 mb-4">
            Files Nova brings together a <strong>comprehensive ecosystem of converters and utilities</strong> so you don’t have to jump between different websites. Popular categories include:
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div>
              <h4 className="font-semibold text-lg mb-2">🔹 PDF Tools</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Convert <strong>JPG/PNG/WebP → PDF</strong></li>
                <li>Convert <strong>DOCX → PDF</strong></li>
                <li>Convert <strong>PDF → JPG/PNG/TXT</strong></li>
                <li>Merge PDFs, Split PDFs, Unlock PDFs, Rotate PDFs</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">🔹 Image Tools</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Compress images (JPG, PNG, WebP) without losing quality</li>
                <li>Resize images with pixel-perfect accuracy</li>
                <li>Convert between formats: JPG ↔ PNG ↔ WebP ↔ TIFF</li>
                <li>Remove backgrounds from photos (AI-powered)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">🔹 Document Tools</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Word & character counter for essays, reports, and SEO content</li>
                <li>Case converter (upper, lower, title, sentence)</li>
                <li>Extract text from PDFs and images (OCR powered)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">🔹 Archive & Utility Tools</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Create <strong>ZIP archives</strong> instantly in the browser</li>
                <li>Extract images or text from documents</li>
                <li>QR Code generator & scanner</li>
                <li>Count pages, extract metadata, and more</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            And the library keeps growing—Files Nova evolves with the needs of its users.
          </p>

          <hr className="my-6 border-gray-200" />

          <h3 className="text-2xl font-bold text-gray-900 mt-4 mb-4">Built With Cutting-Edge Tech</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
            <li><strong>React + TypeScript</strong> for a smooth and responsive UI</li>
            <li><strong>Vite bundler</strong> for fast builds and optimized loading</li>
            <li><strong>Client-side libraries</strong> like pdf-lib, jsPDF, and JSZip to power conversions</li>
            <li><strong>AI models</strong> like TensorFlow.js for advanced features (e.g., background remover, OCR)</li>
          </ul>

          <h3 className="text-2xl font-bold text-gray-900 mt-4 mb-4">Our Mission</h3>
          <p className="text-gray-700 mb-6">
            We believe file conversion should be <strong>Accessible</strong>, <strong>Reliable</strong>, <strong>Private</strong>, and <strong>Free</strong>.
            Files Nova is built for <strong>students, freelancers, creators, businesses, and everyday users</strong> who simply want the fastest, safest way to get their work done.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 mt-4 mb-4">The Road Ahead</h3>
          <p className="text-gray-700">
            Our vision is to make Files Nova the <strong>#1 free alternative</strong> to expensive or complicated software like Adobe Acrobat or Microsoft Office utilities.
            With continuous updates, more tools, and constant optimization, Files Nova is growing into a <strong>one-stop solution for the digital age</strong>. ⚡
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
