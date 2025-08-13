// src/components/seo/toolSeoData.ts

// ---------- Tiny safety utils ----------
export function s(value: unknown, fallback = ''): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}
export function sReplace(
  value: unknown,
  pattern: RegExp | string,
  replacement: string
): string {
  return s(value, '').replace(pattern as any, replacement);
}

// ---------- Types ----------
type BreadcrumbItem = { name: string; url: string };
export type ToolSeoEntry = {
  title: string;
  name: string;
  description: string;
  canonical: string;
  breadcrumb: BreadcrumbItem[];
};

// ---------- Defaults ----------
const SITE_URL = 'https://filesnova.com';
const DEFAULT_TITLE = 'FilesNova — File conversion reimagined';
const DEFAULT_DESC =
  'Fast, private, in-browser file conversion. No uploads, no signups — just secure tools.';
const DEFAULT_BREADCRUMB_HOME = `${SITE_URL}/`;
const DEFAULT_BREADCRUMB_TOOLS = `${SITE_URL}/tools`;

// ---------- Helpers ----------
const HOME_BREADCRUMB: BreadcrumbItem[] = [
  { name: 'Home', url: DEFAULT_BREADCRUMB_HOME },
  { name: 'Tools', url: DEFAULT_BREADCRUMB_TOOLS },
];

// Build full breadcrumb: Home → Tools → Tool
const bc = (toolName: string, canonical: string): BreadcrumbItem[] => [
  ...HOME_BREADCRUMB,
  { name: s(toolName, 'Tool'), url: s(canonical, DEFAULT_BREADCRUMB_TOOLS) },
];

const canonFromPath = (path: string) =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

// ---------- Master table (can be sparse; safe resolver fills gaps) ----------
export const TOOL_SEO_DATA: Record<string, ToolSeoEntry> = {
  // ===== Existing tools (from your file) =====
  '/tools/docx-to-pdf': {
    title: 'Convert DOCX to PDF – Fast & Free Online Converter | FilesNova',
    name: 'DOCX to PDF',
    description:
      'Instantly convert DOCX documents to PDF while preserving formatting. 100% free, no signup, no watermarks—fast, secure, and reliable on FilesNova.',
    canonical: 'https://filesnova.com/tools/docx-to-pdf',
    breadcrumb: bc('DOCX to PDF', 'https://filesnova.com/tools/docx-to-pdf'),
  },

  '/tools/epub-to-pdf': {
    title: 'Convert EPUB to PDF – Fast & Free Online Converter | FilesNova',
    name: 'EPUB to PDF',
    description:
      'Instantly convert EPUB eBooks to PDF while preserving formatting. 100% free, no signup, no watermarks—fast, secure, and reliable on FilesNova.',
    canonical: 'https://filesnova.com/tools/epub-to-pdf',
    breadcrumb: bc('EPUB to PDF', 'https://filesnova.com/tools/epub-to-pdf'),
  },

  '/tools/extract-images': {
    title: 'Extract Images from PDF – Free & Fast Online Tool | FilesNova',
    name: 'Extract Images',
    description:
      'Extract all images from your files in one click. Free, fast, and secure online extractor—no signup, no watermarks. Try FilesNova now!',
    canonical: 'https://filesnova.com/tools/extract-images',
    breadcrumb: bc('Extract Images', 'https://filesnova.com/tools/extract-images'),
  },

  '/tools/extract-text': {
    title: 'Extract Text from PDFs & Images – Free OCR Converter | FilesNova',
    name: 'Extract Text',
    description:
      'Instantly extract text from PDF documents and images with advanced OCR. Free, accurate, and secure online tool by FilesNova.',
    canonical: 'https://filesnova.com/tools/extract-text',
    breadcrumb: bc('Extract Text', 'https://filesnova.com/tools/extract-text'),
  },

  '/tools/extract-zip': {
    title: 'Extract ZIP Files – Free Online Unzip Tool | FilesNova',
    name: 'Extract ZIP',
    description:
      'Unpack ZIP archives right in your browser. Free, fast, secure—download files individually or as a new ZIP.',
    canonical: 'https://filesnova.com/tools/extract-zip',
    breadcrumb: bc('Extract ZIP', 'https://filesnova.com/tools/extract-zip'),
  },

  '/tools/gif-to-mp4': {
    title: 'GIF to MP4 – Convert GIF Files to MP4 Online | FilesNova',
    name: 'GIF to MP4',
    description:
      'Turn GIF animations into MP4 files quickly in your browser. Free and secure with no watermarks.',
    canonical: 'https://filesnova.com/tools/gif-to-mp4',
    breadcrumb: bc('GIF to MP4', 'https://filesnova.com/tools/gif-to-mp4'),
  },

  '/tools/html-to-pdf': {
    title: 'HTML to PDF – Free Text-Only Converter | FilesNova',
    name: 'HTML to PDF',
    description:
      'Convert HTML to a clean, text-only PDF in seconds. Free, private, and done entirely in your browser.',
    canonical: 'https://filesnova.com/tools/html-to-pdf',
    breadcrumb: bc('HTML to PDF', 'https://filesnova.com/tools/html-to-pdf'),
  },

  '/tools/image-resizer': {
    title: 'Image Resizer – Resize Images Online (Free) | FilesNova',
    name: 'Image Resizer',
    description:
      'Resize images to custom dimensions right in your browser. Fast previews and one-click download.',
    canonical: 'https://filesnova.com/tools/image-resizer',
    breadcrumb: bc('Image Resizer', 'https://filesnova.com/tools/image-resizer'),
  },

  '/tools/image-to-pdf': {
    title: 'Images to PDF – Combine JPG & PNG Into a PDF | FilesNova',
    name: 'Images to PDF',
    description:
      'Combine multiple images (JPG, PNG, etc.) into a single PDF. Free, fast, and secure.',
    canonical: 'https://filesnova.com/tools/image-to-pdf',
    breadcrumb: bc('Images to PDF', 'https://filesnova.com/tools/image-to-pdf'),
  },

  '/tools/images-to-pdf': {
    title: 'Images to PDF – Combine JPG & PNG Into a PDF | FilesNova',
    name: 'Images to PDF',
    description:
      'Combine multiple images (JPG, PNG, etc.) into a single PDF. Free, fast, and secure.',
    canonical: 'https://filesnova.com/tools/images-to-pdf',
    breadcrumb: bc('Images to PDF', 'https://filesnova.com/tools/images-to-pdf'),
  },

  '/tools/markdown-to-pdf': {
    title: 'Markdown to PDF – Free Online Converter | FilesNova',
    name: 'Markdown to PDF',
    description:
      'Convert Markdown text or .md files into a simple PDF in your browser. Free and private.',
    canonical: 'https://filesnova.com/tools/markdown-to-pdf',
    breadcrumb: bc('Markdown to PDF', 'https://filesnova.com/tools/markdown-to-pdf'),
  },

  '/tools/merge-pdf': {
    title: 'Merge PDF Files – Combine Multiple PDFs | FilesNova',
    name: 'Merge PDF',
    description:
      'Join multiple PDF files into one. Drag and drop to merge PDFs instantly. Free and secure.',
    canonical: 'https://filesnova.com/tools/merge-pdf',
    breadcrumb: bc('Merge PDF', 'https://filesnova.com/tools/merge-pdf'),
  },

  '/tools/pdf-to-jpg': {
    title: 'PDF to JPG – Convert PDF Pages to Images | FilesNova',
    name: 'PDF to JPG',
    description:
      'Create simple images from each page of your PDF and download them as a ZIP. Free, fast, and secure.',
    canonical: 'https://filesnova.com/tools/pdf-to-jpg',
    breadcrumb: bc('PDF to JPG', 'https://filesnova.com/tools/pdf-to-jpg'),
  },

  '/tools/png-to-pdf': {
    title: 'PNG to PDF – Convert PNG Images to PDF | FilesNova',
    name: 'PNG to PDF',
    description:
      'Upload PNG images and convert them into a single PDF. 100% browser-based and secure.',
    canonical: 'https://filesnova.com/tools/png-to-pdf',
    breadcrumb: bc('PNG to PDF', 'https://filesnova.com/tools/png-to-pdf'),
  },

  '/tools/pptx-to-pdf': {
    title: 'PPTX to PDF – Convert PowerPoint to PDF (Text-Only) | FilesNova',
    name: 'PPTX to PDF',
    description:
      'Extract slide text from your PowerPoint (.pptx) and export to a PDF. Lightweight, private, and fast.',
    canonical: 'https://filesnova.com/tools/pptx-to-pdf',
    breadcrumb: bc('PPTX to PDF', 'https://filesnova.com/tools/pptx-to-pdf'),
  },

  '/tools/qr-generator': {
    title: 'QR Code Generator – Create QR Codes Online | FilesNova',
    name: 'QR Code Generator',
    description:
      'Generate QR codes from text or URLs instantly. Download as PNG. Free and private.',
    canonical: 'https://filesnova.com/tools/qr-generator',
    breadcrumb: bc('QR Code Generator', 'https://filesnova.com/tools/qr-generator'),
  },

  '/tools/qr-scanner': {
    title: 'QR Scanner – Read QR Codes from Image or Camera | FilesNova',
    name: 'QR Scanner',
    description:
      'Scan a QR code by uploading an image or using your camera. Works in your browser, free and secure.',
    canonical: 'https://filesnova.com/tools/qr-scanner',
    breadcrumb: bc('QR Scanner', 'https://filesnova.com/tools/qr-scanner'),
  },

  '/tools/rtf-to-docx': {
    title: 'RTF to DOCX – Convert RTF Documents to Word | FilesNova',
    name: 'RTF to DOCX',
    description:
      'Convert RTF files to modern DOCX format in your browser. Free, fast, and secure.',
    canonical: 'https://filesnova.com/tools/rtf-to-docx',
    breadcrumb: bc('RTF to DOCX', 'https://filesnova.com/tools/rtf-to-docx'),
  },

  '/tools/split-pdf': {
    title: 'Split PDF – Extract Pages from a PDF | FilesNova',
    name: 'Split PDF',
    description:
      'Split a PDF into separate documents by page ranges. Quick, private, and free.',
    canonical: 'https://filesnova.com/tools/split-pdf',
    breadcrumb: bc('Split PDF', 'https://filesnova.com/tools/split-pdf'),
  },

  '/tools/svg-to-png': {
    title: 'SVG to PNG – Convert SVG Images to PNG | FilesNova',
    name: 'SVG to PNG',
    description:
      'Convert vector SVG graphics into raster PNG files online. Fast and secure.',
    canonical: 'https://filesnova.com/tools/svg-to-png',
    breadcrumb: bc('SVG to PNG', 'https://filesnova.com/tools/svg-to-png'),
  },

  '/tools/tar-to-zip': {
    title: 'TAR to ZIP – Convert .tar Archives to .zip | FilesNova',
    name: 'TAR to ZIP',
    description:
      'Repackage TAR archives into ZIP for easier sharing and compatibility, all in your browser.',
    canonical: 'https://filesnova.com/tools/tar-to-zip',
    breadcrumb: bc('TAR to ZIP', 'https://filesnova.com/tools/tar-to-zip'),
  },

  '/tools/text-to-pdf': {
    title: 'Text to PDF – Create a PDF from Plain Text | FilesNova',
    name: 'Text to PDF',
    description:
      'Paste or upload text files and convert them to PDF instantly. Free and private.',
    canonical: 'https://filesnova.com/tools/text-to-pdf',
    breadcrumb: bc('Text to PDF', 'https://filesnova.com/tools/text-to-pdf'),
  },

  '/tools/unlock-pdf': {
    title:
      'Unlock PDF – Remove PDF Password (You Must Have Rights) | FilesNova',
    name: 'Unlock PDF',
    description:
      'Remove a PDF password when you have the legal right to do so. Fast, private, in-browser processing.',
    canonical: 'https://filesnova.com/tools/unlock-pdf',
    breadcrumb: bc('Unlock PDF', 'https://filesnova.com/tools/unlock-pdf'),
  },

  '/tools/webp-converter': {
    title: 'WEBP Converter – Convert WEBP to JPG/PNG (and Back) | FilesNova',
    name: 'WEBP Converter',
    description:
      'Convert images between WEBP, JPG, and PNG formats quickly in your browser. Free and secure.',
    canonical: 'https://filesnova.com/tools/webp-converter',
    breadcrumb: bc('WEBP Converter', 'https://filesnova.com/tools/webp-converter'),
  },

  '/tools/word-counter': {
    title: 'Word Counter – Count Words & Characters Online | FilesNova',
    name: 'Word Counter',
    description:
      'Count words, characters, and paragraphs instantly. Paste your text and get detailed stats.',
    canonical: 'https://filesnova.com/tools/word-counter',
    breadcrumb: bc('Word Counter', 'https://filesnova.com/tools/word-counter'),
  },

  '/tools/xlsx-to-csv': {
    title: 'XLSX to CSV – Convert Excel Files to CSV | FilesNova',
    name: 'XLSX to CSV',
    description:
      'Convert Excel spreadsheets (.xlsx) into CSV files in your browser. Free and secure.',
    canonical: 'https://filesnova.com/tools/xlsx-to-csv',
    breadcrumb: bc('XLSX to CSV', 'https://filesnova.com/tools/xlsx-to-csv'),
  },

  // ===== New entries for your erroring pages =====
  '/tools/jpg-to-pdf': {
    title: 'JPG to PDF – Convert Images to PDF | FilesNova',
    name: 'JPG to PDF',
    description:
      'Convert one or many JPG images into a single PDF. Free, fast, and fully private in your browser.',
    canonical: 'https://filesnova.com/tools/jpg-to-pdf',
    breadcrumb: bc('JPG to PDF', 'https://filesnova.com/tools/jpg-to-pdf'),
  },

  '/tools/compress-images': {
    title: 'Compress Images – Reduce Image Size Online | FilesNova',
    name: 'Compress Images',
    description:
      'Shrink JPG/PNG/WebP image size without noticeable quality loss. Free and secure.',
    canonical: 'https://filesnova.com/tools/compress-images',
    breadcrumb: bc('Compress Images', 'https://filesnova.com/tools/compress-images'),
  },

  '/tools/background-remover': {
    title: 'Background Remover – Remove Image Background Online | FilesNova',
    name: 'Background Remover',
    description:
      'Remove background from photos instantly in your browser. Download clean cutouts—no signup.',
    canonical: 'https://filesnova.com/tools/background-remover',
    breadcrumb: bc(
      'Background Remover',
      'https://filesnova.com/tools/background-remover'
    ),
  },

  '/tools/create-zip': {
    title: 'Create ZIP – Zip Multiple Files Online | FilesNova',
    name: 'Create ZIP',
    description:
      'Select files and pack them into a single ZIP archive in your browser. Free and private.',
    canonical: 'https://filesnova.com/tools/create-zip',
    breadcrumb: bc('Create ZIP', 'https://filesnova.com/tools/create-zip'),
  },

  '/tools/combine-zip': {
    title: 'Combine ZIP – Merge Multiple ZIPs into One | FilesNova',
    name: 'Combine ZIP',
    description:
      'Merge multiple ZIP archives into a single ZIP right in your browser. Fast and secure.',
    canonical: 'https://filesnova.com/tools/combine-zip',
    breadcrumb: bc('Combine ZIP', 'https://filesnova.com/tools/combine-zip'),
  },

  '/tools/case-converter': {
    title: 'Case Converter – Uppercase, Lowercase, Title Case | FilesNova',
    name: 'Case Converter',
    description:
      'Convert text to UPPERCASE, lowercase, Title Case, or Sentence case instantly.',
    canonical: 'https://filesnova.com/tools/case-converter',
    breadcrumb: bc('Case Converter', 'https://filesnova.com/tools/case-converter'),
  },
};

// ---------- Safe resolver (prevents crashes even if key missing) ----------
export function getToolSeoByPath(
  path: string,
  overrides?: Partial<Pick<ToolSeoEntry, 'title' | 'name' | 'description' | 'canonical'>>
): ToolSeoEntry {
  const key = path.startsWith('/') ? path : `/${path}`;
  const found = TOOL_SEO_DATA[key];

  const name =
    s(overrides?.name) ||
    s(found?.name) ||
    // derive from path: '/tools/jpg-to-pdf' → 'Jpg To Pdf'
    sReplace(key.split('/').pop(), /[-_]/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Tool';

  const canonical = s(overrides?.canonical) || s(found?.canonical) || canonFromPath(key);
  const title =
    s(overrides?.title) ||
    s(found?.title) ||
    `${name} | FilesNova`;
  const description =
    s(overrides?.description) ||
    s(found?.description) ||
    DEFAULT_DESC;

  return {
    title: title.trim(),
    name,
    description,
    canonical,
    breadcrumb: bc(name, canonical),
  };
}

// ---------- Site-wide schema (Organization + WebSite + SearchAction) ----------
export const SEARCH_ACTION = {
  '@type': 'SearchAction',
  target: 'https://filesnova.com/search?q={search_term_string}',
  'query-input': 'required name=search_term_string',
};

export const SITE_SCHEMA = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Files Nova',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      'https://x.com/filesnova',
      'https://www.facebook.com/filesnova',
      'https://www.linkedin.com/company/filesnova',
    ],
  },
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Files Nova',
    url: SITE_URL,
    potentialAction: SEARCH_ACTION,
  },
};
