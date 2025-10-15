import React from 'react';
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Heart,
  FileText,
  Image,
  Archive,
  QrCode
} from 'lucide-react';

import FileNovaIcon from '../assets/FILESNOVANEWICON.png';

import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const socialLinks = [
    { 
      name: 'X', 
      url: 'https://x.com/files_nova', 
      icon: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      hoverColor: 'hover:text-gray-100'
    },
    { 
      name: 'Facebook', 
      url: 'https://www.facebook.com/people/Files-Nova/61580779587054/', 
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
    },
    { 
      name: 'Reddit', 
      url: 'https://www.reddit.com/user/FilesNovaofficial/', 
      icon: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
      ),
      hoverColor: 'hover:text-orange-500'
    }
  ];

  const popularTools = [
    { name: 'PDF Converter', path: '/tools/docx-to-pdf', icon: FileText },
    { name: 'Image Resizer', path: '/tools/image-resizer', icon: Image },
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
            <div className="flex items-start gap-4">
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

      {/* Enhanced bottom gradient border with animation */}
      <div className="relative w-full h-1">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-40"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-400 via-purple-500 via-pink-500 to-cyan-400 opacity-60 animate-pulse"></div>
        <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
      </div>
    </footer>
  );
};

export default Footer;