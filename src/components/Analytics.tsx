// Google Analytics and tracking component
import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
  }
}

interface AnalyticsProps {
  measurementId?: string;
}

export default function Analytics({ measurementId = 'G-XXXXXXXXXX' }: AnalyticsProps) {
  useEffect(() => {
    // Validate Google Analytics ID format to prevent XSS
    const isValidGAId = /^G-[A-Z0-9]{10}$/.test(measurementId);
    
    // Only load in production or if measurement ID is provided and valid
    if (import.meta.env.PROD && measurementId !== 'G-XXXXXXXXXX' && isValidGAId) {
      // Load Google Analytics
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script1);

      // Use safe DOM methods instead of innerHTML
      const script2 = document.createElement('script');
      script2.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}');
      `;
      document.head.appendChild(script2);
    }
  }, [measurementId]);

  return null;
}

// Analytics tracking helper functions
export const trackConversion = (conversionType: string, fileCount: number = 1) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      event_category: 'file_conversion',
      event_label: conversionType,
      value: fileCount,
    });
  }
};

export const trackPageView = (pageName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: pageName,
    });
  }
};