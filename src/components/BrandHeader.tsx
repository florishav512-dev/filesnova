import React from 'react';
import { Link } from 'react-router-dom';
import ToolsMenu from '../components/ToolsMenu'; // keep if you use it on these pages
import FileNovaIcon from '../assets/FILESNOVANEWICON.png';

type Props = {
  /** show the gradient “All Tools” menu on the right */
  showToolsMenu?: boolean;
  /** small subtitle under brand (optional, ex: "Help Center") */
  subtitle?: string;
  /** tweak logo size: "sm" | "md" | "lg" */
  logoSize?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: 'w-12 h-12 md:w-14 md:h-14',
  md: 'w-16 h-16 md:w-20 md:h-20',   // 🔥 good default (slightly bigger)
  lg: 'w-20 h-20 md:w-24 md:h-24',
};

const BrandHeader: React.FC<Props> = ({ showToolsMenu = true, subtitle, logoSize = 'md' }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20 gap- sm:gap-">
          {/* Brand */}
          <div className="relative shrink-0">
            <picture>
              <source srcSet={FileNovaIcon} type="image/webp" />
              <source srcSet={FileNovaIcon} type="image/png" />
              <img
                src={FileNovaIcon}
                alt="Files Nova"
                className={`${sizeMap[logoSize]} object-contain`}
                draggable={false}
                loading="lazy"
                width="96"
                height="96"
              />
            </picture>
          </div>
          <div className="leading-tight">
            <Link to="/" className="no-underline">
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Files Nova
              </h1>
            </Link>
            {subtitle && (
              <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
            )}
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/help" className="text-gray-700 hover:text-blue-600 font-medium">Help</Link>
              <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</Link>
              <Link to="/privacy-policy" className="text-gray-700 hover:text-blue-600 font-medium">Privacy</Link>
            </nav>
            {showToolsMenu && <ToolsMenu />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default BrandHeader;