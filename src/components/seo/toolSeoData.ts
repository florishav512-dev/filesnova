type ToolSeoEntry = {
  title: string;
  description: string;
  canonical: string;
  breadcrumb: { label: string; url: string }[];
  name?: string; // optional display name used elsewhere if needed
};

const base = 'https://filesnova.com';

export const TOOL_SEO_DATA: Record<string, ToolSeoEntry> = {
  '/tools/epub-to-pdf': {
    title: 'Convert EPUB to PDF – Fast & Free Online Converter | Files Nova',
    name: 'EPUB to PDF',
    description:
      'Instantly convert EPUB eBooks to PDF while preserving text. 100% free, secure, and no watermarks — Files Nova.',
    canonical: `${base}/tools/epub-to-pdf`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'EPUB to PDF', url: `${base}/tools/epub-to-pdf` },
    ],
  },

  '/tools/extract-images': {
    title: 'Extract Images from PDF – Free & Fast Online Tool | Files Nova',
    name: 'Extract Images',
    description:
      'Extract all images from your files with one click. Free, fast, secure — no signup, no watermarks.',
    canonical: `${base}/tools/extract-images`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'Extract Images', url: `${base}/tools/extract-images` },
    ],
  },

  '/tools/extract-text': {
    title: 'Extract Text from PDFs & Images – Free OCR Converter | Files Nova',
    name: 'Extract Text',
    description:
      'Extract text from PDFs and images using OCR. Free, accurate, and secure — no signup or watermarks.',
    canonical: `${base}/tools/extract-text`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'Extract Text', url: `${base}/tools/extract-text` },
    ],
  },

  '/tools/extract-zip': {
    title: 'Extract ZIP Files Online – Fast & Secure | Files Nova',
    name: 'Extract ZIP',
    description:
      'Unpack ZIP archives in your browser and download files individually or as a new ZIP. Free and private.',
    canonical: `${base}/tools/extract-zip`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'Extract ZIP', url: `${base}/tools/extract-zip` },
    ],
  },

  '/tools/gif-to-mp4': {
    title: 'GIF to MP4 – Free Online Converter | Files Nova',
    name: 'GIF to MP4',
    description:
      'Convert GIF animations to MP4 in your browser. Free, simple, and secure.',
    canonical: `${base}/tools/gif-to-mp4`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'GIF to MP4', url: `${base}/tools/gif-to-mp4` },
    ],
  },

  '/tools/html-to-pdf': {
    title: 'HTML to PDF – Free Online Converter | Files Nova',
    name: 'HTML to PDF',
    description:
      'Convert HTML documents to clean PDF by extracting text. Free, private, and fast.',
    canonical: `${base}/tools/html-to-pdf`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'HTML to PDF', url: `${base}/tools/html-to-pdf` },
    ],
  },

  '/tools/image-resizer': {
    title: 'Image Resizer – Resize Images Online | Files Nova',
    name: 'Image Resizer',
    description:
      'Resize images to custom dimensions, preview, and download. Free and browser-based.',
    canonical: `${base}/tools/image-resizer`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'Image Resizer', url: `${base}/tools/image-resizer` },
    ],
  },

  '/tools/images-to-pdf': {
    title: 'Images to PDF – Combine JPG/PNG into One PDF | Files Nova',
    name: 'Images to PDF',
    description:
      'Merge multiple images into a single PDF — fast, secure, and free in your browser.',
    canonical: `${base}/tools/images-to-pdf`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'Images to PDF', url: `${base}/tools/images-to-pdf` },
    ],
  },

  '/tools/markdown-to-pdf': {
    title: 'Markdown to PDF – Free Online Converter | Files Nova',
    name: 'Markdown to PDF',
    description:
      'Convert Markdown files to PDF instantly. Free, private, and no watermarks.',
    canonical: `${base}/tools/markdown-to-pdf`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'Markdown to PDF', url: `${base}/tools/markdown-to-pdf` },
    ],
  },

  '/tools/merge-pdf': {
    title: 'Merge PDF Files – Combine Multiple PDFs | Files Nova',
    name: 'Merge PDF',
    description:
      'Join multiple PDF files into one. Drag and drop, free and secure, no watermarks.',
    canonical: `${base}/tools/merge-pdf`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'Merge PDF', url: `${base}/tools/merge-pdf` },
    ],
  },

  '/tools/pdf-to-jpg': {
    title: 'PDF to JPG – Convert PDF Pages to Images | Files Nova',
    name: 'PDF to JPG',
    description:
      'Convert PDF pages to simple images you can download as a ZIP. Free and private.',
    canonical: `${base}/tools/pdf-to-jpg`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'PDF to JPG', url: `${base}/tools/pdf-to-jpg` },
    ],
  },

  '/tools/png-to-pdf': {
    title: 'PNG to PDF – Create a PDF from PNG Images | Files Nova',
    name: 'PNG to PDF',
    description:
      'Upload PNG images and instantly create a PDF document. Free, fast, secure.',
    canonical: `${base}/tools/png-to-pdf`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'PNG to PDF', url: `${base}/tools/png-to-pdf` },
    ],
  },

  '/tools/pptx-to-pdf': {
    title: 'PPTX to PDF – Convert PowerPoint to PDF | Files Nova',
    name: 'PPTX to PDF',
    description:
      'Extract text from PPTX slides and export to PDF — free and browser-based.',
    canonical: `${base}/tools/pptx-to-pdf`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'PPTX to PDF', url: `${base}/tools/pptx-to-pdf` },
    ],
  },

  '/tools/qr-generator': {
    title: 'QR Code Generator – Create QR Codes Online | Files Nova',
    name: 'QR Code Generator',
    description:
      'Generate QR codes from text or URLs instantly. Free, fast, and secure.',
    canonical: `${base}/tools/qr-generator`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'QR Code Generator', url: `${base}/tools/qr-generator` },
    ],
  },

  '/tools/qr-scanner': {
    title: 'QR Scanner – Scan QR Codes from Image or Camera | Files Nova',
    name: 'QR Scanner',
    description:
      'Scan QR codes from uploaded images or your camera — all in the browser. Free and private.',
    canonical: `${base}/tools/qr-scanner`,
    breadcrumb: [
      { label: 'Home', url: base },
      { label: 'Tools', url: `${base}/tools` },
      { label: 'QR Scanner', url: `${base}/tools/qr-scanner` },
    ],
  },
};
