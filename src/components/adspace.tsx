// Ad placement component for monetization
import { useEffect, useRef } from 'react';

interface AdSpaceProps {
  slot: string;
  size: 'banner' | 'rectangle' | 'leaderboard' | 'sidebar';
  className?: string;
}

const adSizes = {
  banner: { width: 728, height: 90 },
  rectangle: { width: 300, height: 250 },
  leaderboard: { width: 970, height: 250 },
  sidebar: { width: 300, height: 600 }
};

export default function AdSpace({ slot, size, className = '' }: AdSpaceProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const { width, height } = adSizes[size];

  useEffect(() => {
    // Only load ads in production
    if (import.meta.env.PROD && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.log('Ad loading error:', error);
      }
    }
  }, []);

  // In development, show placeholder
  if (!import.meta.env.PROD) {
    return (
      <div 
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 ${className}`}
        style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100%' }}
      >
        <div className="text-center">
          <div className="text-sm font-medium">Advertisement</div>
          <div className="text-xs">{width}x{height}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: `${width}px`, height: `${height}px` }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Google AdSense script loader
export const loadAdSense = (publisherId: string) => {
  if (typeof window !== 'undefined' && !window.adsbygoogle) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }
};
