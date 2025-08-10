import React, { useState } from 'react';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import UploadZone from '../../components/UploadZone';
import {
  ArrowLeft,
  Sparkles,
  Presentation,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
} from 'lucide-react';

// ✅ SEO imports
import { Helmet } from 'react-helmet-async';
import JsonLd from '../../components/JsonLd';
import ToolSeo from '../../components/seo/ToolSeo';
import { TOOL_SEO_DATA } from '../../components/seo/toolSeoData';

/**
 * PptxToPdfPage extracts text from each slide in a PPTX file and renders it
 * into a multi-page PDF. Only text content is preserved; images, shapes and
 * styling are not supported. This lightweight conversion keeps your data on
 * your device with no external dependencies.
 */
const PptxToPdfPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Per-page SEO config
  const seo = TOOL_SEO_DATA['/tools/pptx-to-pdf'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setDownloadUrl(null);
    setError(null);
  };

  const extractSlides = async (arrayBuffer: ArrayBuffer): Promise<string[]> => {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slidePaths = Object.keys(zip.files)
      .filter((p) => /ppt\/slides\/slide\d+\.xml$/.test(p))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
        const nb = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
        return na - nb;
      });
    const slides: string[] = [];
    for (let i = 0; i < slidePaths.length; i++) {
      const xml = await zip.files[slidePaths[i]].async('string');
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'application/xml');
      const tNodes = Array.from(doc.getElementsByTagName('a:t'));
      const texts = tNodes.map((n) => n.textContent || '');
      slides.push(texts.join('\n'));
      setProgress(Math.round(((i + 1) / slidePaths.length) * 30));
      await new Promise((res) => setTimeout(res, 0));
    }
    return slides;
  };

  const convert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const slides = await extractSlides(arrayBuffer);
      if (slides.length === 0) throw new Error('No slides with text found');

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const margin = 50;
      const lineHeight = 14;

      for (let i = 0; i < slides.length; i++) {
        const slideText = slides[i];
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        let y = height - margin;

        const lines: string[] = [];
        slideText.split(/\r?\n/).forEach((ln) => {
          if (ln.length <= 100) {
            lines.push(ln);
          } else {
            let s = ln;
            while (s.length > 100) {
              lines.push(s.slice(0, 100));
              s = s.slice(100);
            }
            if (s.length) lines.push(s);
          }
        });

        for (let j = 0; j < lines.length; j++) {
          const ln = lines[j];
          if (y < margin) {
            page.drawText('[Slide continues on next page]', { x: margin, y: margin, size: 10, font });
            break;
          }
          page.drawText(ln, { x: margin, y: y - lineHeight, size: 12, font });
          y -
