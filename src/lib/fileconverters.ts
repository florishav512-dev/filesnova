// File conversion utilities using client-side libraries
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import * as mammoth from 'mammoth';
import Pica from 'pica';

// Remove problematic module declaration and use any type for Pica
import html2canvas from 'html2canvas';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export interface ConversionResult {
  url: string;
  filename: string;
}

export const convertImagesToPdf = async (
  files: File[], 
  options: any = {}, 
  onProgress?: (progress: number) => void
): Promise<ConversionResult> => {
  const pdf = new jsPDF();
  
  let isFirstPage = true;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const imgDataUrl = await fileToDataUrl(file);
    
    if (!isFirstPage) {
      pdf.addPage();
    }
    
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = imgDataUrl;
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgAspectRatio = img.width / img.height;
    const pdfAspectRatio = pdfWidth / pdfHeight;
    
    let renderWidth = pdfWidth;
    let renderHeight = pdfHeight;
    
    if (imgAspectRatio > pdfAspectRatio) {
      renderHeight = pdfWidth / imgAspectRatio;
    } else {
      renderWidth = pdfHeight * imgAspectRatio;
    }
    
    const x = (pdfWidth - renderWidth) / 2;
    const y = (pdfHeight - renderHeight) / 2;
    
    pdf.addImage(imgDataUrl, 'JPEG', x, y, renderWidth, renderHeight);
    isFirstPage = false;
    
    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100));
    }
  }
  
  const pdfBlob = pdf.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  
  return {
    url,
    filename: `converted-images-${Date.now()}.pdf`
  };
};

export const convertPdfToImages = async (
  file: File,
  options: any = {},
  onProgress?: (progress: number) => void
): Promise<ConversionResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const zip = new JSZip();
  const pageCount = pdf.numPages;
  
  const scale = options.quality === 'high' ? 2 : options.quality === 'medium' ? 1.5 : 1;
  
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    if (context) {
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
    }
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(resolve as BlobCallback, 'image/jpeg', 0.8);
    });
    
    zip.file(`page-${pageNum}.jpg`, blob);
    
    if (onProgress) {
      onProgress(Math.round((pageNum / pageCount) * 100));
    }
  }
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  
  return {
    url,
    filename: `pdf-pages-${Date.now()}.zip`
  };
};

export const mergePdfs = async (
  files: File[],
  onProgress?: (progress: number) => void
): Promise<ConversionResult> => {
  const mergedPdf = await PDFDocument.create();
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    
    pages.forEach((page: any) => mergedPdf.addPage(page));
    
    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100));
    }
  }
  
  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  return {
    url,
    filename: `merged-pdf-${Date.now()}.pdf`
  };
};

export const compressImages = async (
  files: File[],
  options: any = {},
  onProgress?: (progress: number) => void
): Promise<ConversionResult> => {
  const zip = new JSZip();
  
  const compressionOptions = {
    maxSizeMB: options.maxSizeKB ? options.maxSizeKB / 1024 : 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    quality: (options.quality || 80) / 100
  };
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const compressedFile = await imageCompression(file, compressionOptions);
    zip.file(file.name, compressedFile);
    
    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100));
    }
  }
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  
  return {
    url,
    filename: `compressed-images-${Date.now()}.zip`
  };
};

export const convertTextToPdf = async (
  text: string,
  options: any = {},
  onProgress?: (progress: number) => void
): Promise<ConversionResult> => {
  
  if (onProgress) onProgress(25);
  
  const pdf = new jsPDF();
  const fontSize = parseInt(options.fontSize || '12');
  const lineSpacing = options.lineSpacing === '1.5' ? 1.5 : options.lineSpacing === 'double' ? 2 : 1;
  const margins = options.margins === 'narrow' ? 10 : options.margins === 'wide' ? 30 : 20;
  
  pdf.setFontSize(fontSize);
  
  if (onProgress) onProgress(50);
  
  const lines = pdf.splitTextToSize(text, pdf.internal.pageSize.getWidth() - 2 * margins);
  const lineHeight = fontSize * lineSpacing * 0.3528; // Convert to mm
  
  let y = margins;
  for (const line of lines) {
    if (y + lineHeight > pdf.internal.pageSize.getHeight() - margins) {
      pdf.addPage();
      y = margins;
    }
    pdf.text(line, margins, y);
    y += lineHeight;
  }
  
  if (onProgress) onProgress(100);
  
  const pdfBlob = pdf.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  
  return {
    url,
    filename: `text-document-${Date.now()}.pdf`
  };
};

export const createZipArchive = async (
  files: File[],
  archiveName: string,
  onProgress?: (progress: number) => void
): Promise<ConversionResult> => {
  const zip = new JSZip();
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    zip.file(file.name, file);
    
    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100));
    }
  }
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  
  return {
    url,
    filename: archiveName.endsWith('.zip') ? archiveName : `${archiveName}.zip`
  };
};

export const splitPdf = async (
  file: File,
  options: any = {},
  onProgress?: (progress: number) => void
): Promise<ConversionResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  
  if (onProgress) onProgress(25);
  
  const pageRanges = parsePageRange(options.pageRange || 'all', totalPages);
  const zip = new JSZip();
  
  for (let i = 0; i < pageRanges.length; i++) {
    const range = pageRanges[i];
    const newPdf = await PDFDocument.create();
    
    for (const pageIndex of range) {
      const [page] = await newPdf.copyPages(pdf, [pageIndex]);
      newPdf.addPage(page);
    }
    
    const pdfBytes = await newPdf.save();
    zip.file(`pages-${range[0] + 1}-${range[range.length - 1] + 1}.pdf`, pdfBytes);
    
    if (onProgress) {
      onProgress(Math.round(25 + ((i + 1) / pageRanges.length) * 75));
    }
  }
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  
  return {
    url,
    filename: `split-pdf-${Date.now()}.zip`
  };
};

export const resizeImages = async (
  files: File[],
  options: any = {},
  onProgress?: (progress: number) => void
): Promise<ConversionResult> => {
  const picaInstance = new Pica();
  const zip = new JSZip();
  
  const targetWidth = parseInt(options.width || '800');
  const targetHeight = parseInt(options.height || '600');
  const maintainAspectRatio = options.maintainAspectRatio !== false;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const img = await createImageElement(file);
    
    let newWidth = targetWidth;
    let newHeight = targetHeight;
    
    if (maintainAspectRatio) {
      const aspectRatio = img.width / img.height;
      if (targetWidth / targetHeight > aspectRatio) {
        newWidth = targetHeight * aspectRatio;
      } else {
        newHeight = targetWidth / aspectRatio;
      }
    }
    
    const sourceCanvas = document.createElement('canvas');
    const targetCanvas = document.createElement('canvas');
    
    sourceCanvas.width = img.width;
    sourceCanvas.height = img.height;
    targetCanvas.width = newWidth;
    targetCanvas.height = newHeight;
    
    const sourceCtx = sourceCanvas.getContext('2d');
    sourceCtx?.drawImage(img, 0, 0);
    
    await picaInstance.resize(sourceCanvas, targetCanvas);
    
    const blob = await new Promise<Blob>((resolve) => {
      targetCanvas.toBlob(resolve as BlobCallback, file.type, 0.9);
    });
    
    const fileName = file.name.replace(/\.[^/.]+$/, '') + `-resized.${file.type.split('/')[1]}`;
    zip.file(fileName, blob);
    
    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100));
    }
  }
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  
  return {
    url,
    filename: `resized-images-${Date.now()}.zip`
  };
};

export const unlockPdf = async (
  file: File,
  password?: string,
  onProgress?: (progress: number) => void
): Promise<ConversionResult> => {
  if (onProgress) onProgress(25);
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    if (onProgress) onProgress(50);
    
    const pdf = await PDFDocument.load(arrayBuffer, password ? { password } as any : undefined);
    
    if (onProgress) onProgress(75);
    
    const unlockedPdfBytes = await pdf.save();
    const blob = new Blob([unlockedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    if (onProgress) onProgress(100);
    
    return {
      url,
      filename: `unlocked-${file.name}`
    };
  } catch (error) {
    throw new Error('Failed to unlock PDF. The password may be incorrect or the PDF may have restrictions.');
  }
};

export const convertDocxToPdf = async (
  file: File,
  options: any = {},
  onProgress?: (progress: number) => void
): Promise<ConversionResult> => {
  
  if (onProgress) onProgress(25);
  
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  
  if (onProgress) onProgress(50);
  
  const html = result.value;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  tempDiv.style.padding = '20px';
  tempDiv.style.fontFamily = 'Arial, sans-serif';
  tempDiv.style.fontSize = '12px';
  tempDiv.style.lineHeight = '1.4';
  tempDiv.style.color = '#000';
  tempDiv.style.background = '#fff';
  
  document.body.appendChild(tempDiv);
  
  if (onProgress) onProgress(75);
  
  const canvas = await html2canvas(tempDiv, {
    scale: 2,
    useCORS: true,
    allowTaint: true
  });
  
  document.body.removeChild(tempDiv);
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/jpeg', 0.8);
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgAspectRatio = canvas.width / canvas.height;
  const pdfAspectRatio = pdfWidth / pdfHeight;
  
  let renderWidth = pdfWidth;
  let renderHeight = pdfHeight;
  
  if (imgAspectRatio > pdfAspectRatio) {
    renderHeight = pdfWidth / imgAspectRatio;
  } else {
    renderWidth = pdfHeight * imgAspectRatio;
  }
  
  pdf.addImage(imgData, 'JPEG', 0, 0, renderWidth, renderHeight);
  
  if (onProgress) onProgress(100);
  
  const pdfBlob = pdf.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  
  return {
    url,
    filename: file.name.replace(/\.docx$/i, '.pdf')
  };
};

// Helper functions
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
};

const createImageElement = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(file);
  });
};

const parsePageRange = (range: string, totalPages: number): number[][] => {
  if (range.toLowerCase() === 'all') {
    return [Array.from({ length: totalPages }, (_, i) => i)];
  }
  
  const ranges: number[][] = [];
  const parts = range.split(',').map(s => s.trim());
  
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(s => parseInt(s.trim()) - 1);
      const pageRange = [];
      for (let i = Math.max(0, start); i <= Math.min(totalPages - 1, end); i++) {
        pageRange.push(i);
      }
      if (pageRange.length > 0) ranges.push(pageRange);
    } else {
      const pageNum = parseInt(part) - 1;
      if (pageNum >= 0 && pageNum < totalPages) {
        ranges.push([pageNum]);
      }
    }
  }
  
  return ranges;
};
