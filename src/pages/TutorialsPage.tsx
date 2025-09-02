// src/pages/TutorialsPage.tsx
import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import BrandHeader from '../components/BrandHeader';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Timer,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Layers,
  Minimize,
  Scissors,
  FileArchive,
  QrCode,
  FileType2,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  ExternalLink,
  Shield
} from 'lucide-react';

type Tutorial = {
  id: string;
  title: string;
  est: string;  // estimated time
  category: 'PDF' | 'Images' | 'Archive' | 'Docs' | 'Utilities';
  summary: string;
  steps: { title: string; text: string }[];
  proTips?: string[];
  pitfalls?: string[];
  toolLink: string;
  icon: React.ComponentType<any>;
};

const TUTORIALS: Tutorial[] = [
  {
    id: 'jpg-to-pdf',
    title: 'Convert JPG/PNG Images to a Single PDF',
    est: '3–5 min',
    category: 'PDF',
    summary:
      'Batch-convert photos to a high-quality PDF with custom page size, margins, and layout — entirely in your browser.',
    steps: [
      { title: 'Open the tool', text: 'Go to JPG → PDF and click **Choose Files** or drag images into the dropzone.' },
      { title: 'Reorder & fit', text: 'Use manual up/down controls or sort by file name/size. Set Fit (no crop) or Fill (full page look).' },
      { title: 'Page & margins', text: 'Pick A4/Letter or keep **Auto** (uses image DPI). Choose compact/normal/wide margins.' },
      { title: 'Quality & background', text: 'Adjust JPEG quality if needed. Set page background color for visible margins.' },
      { title: 'Convert & download', text: 'Click **Start Conversion**. When done, hit **Download PDF**. Files never leave your device.' },
    ],
    proTips: [
      'Use **Auto** page size for camera images to preserve real-world dimensions.',
      'For print, stick to **Fit** to avoid cropping faces or edges.',
      'Big batches? Convert in smaller sets if your browser runs low on memory.',
    ],
    pitfalls: [
      'EXIF rotation elsewhere? We auto-correct orientation in the PDF.',
      'Transparent PNGs get flattened—keep **compress PNG** off to preserve crisp edges.',
    ],
    toolLink: '/tools/jpg-to-pdf',
    icon: FileText,
  },
  {
    id: 'merge-pdf',
    title: 'Merge Multiple PDFs',
    est: '2–4 min',
    category: 'PDF',
    summary:
      'Combine PDFs in any order with zero uploads. Great for receipts, notes, and coursework.',
    steps: [
      { title: 'Open Merge PDF', text: 'Drop your PDFs. Use the handles or arrows to reorder.' },
      { title: 'Optional compression', text: 'If needed, enable gentle compression to reduce size.' },
      { title: 'Merge', text: 'Click **Merge** and download your combined file.' },
    ],
    proTips: ['Keep the original PDFs handy — merging is non-destructive.'],
    toolLink: '/tools/merge-pdf',
    icon: Layers,
  },
  {
    id: 'compress-pdf',
    title: 'Compress a PDF Without Wrecking Quality',
    est: '2–3 min',
    category: 'PDF',
    summary:
      'Shrink PDFs using in-browser optimization. Perfect for email or uploads with strict size limits.',
    steps: [
      { title: 'Open Compress PDF', text: 'Upload your PDF — it stays local in your browser.' },
      { title: 'Pick a target size/level', text: 'Choose balanced compression for best readability.' },
      { title: 'Download', text: 'Export your optimized PDF and check legibility on mobile.' },
    ],
    proTips: ['If text looks fuzzy, dial compression down one notch.'],
    toolLink: '/tools/compress-pdf',
    icon: Minimize,
  },
  {
    id: 'png-to-jpg',
    title: 'Convert PNG to JPG (with Quality Control)',
    est: '2–3 min',
    category: 'Images',
    summary:
      'Turn transparent PNGs into compact JPGs. Great for photos; keep PNG for logos & UI.',
    steps: [
      { title: 'Open PNG → JPG', text: 'Drop your PNGs or browse.' },
      { title: 'Adjust quality', text: '80–90 is a sweet spot for most photos.' },
      { title: 'Export', text: 'Download the converted JPGs. Originals stay untouched.' },
    ],
    pitfalls: ['JPG has **no transparency** — icons/logos may get halos. Keep PNG if edges matter.'],
    toolLink: '/tools/png-to-jpg',
    icon: ImageIcon,
  },
  {
    id: 'image-resizer',
    title: 'Resize & Optimize Images for Web or Social',
    est: '3–6 min',
    category: 'Images',
    summary:
      'Batch resize with smart constraints, EXIF rotation fixes, and optional compression.',
    steps: [
      { title: 'Open Image Resizer', text: 'Drop photos and set width/height or long-edge only.' },
      { title: 'Keep aspect ratio', text: 'Enable **lock aspect** to avoid stretching faces.' },
      { title: 'Choose format', text: 'Use JPG for photos, PNG for graphics, WebP for smallest size (when available).' },
      { title: 'Export set', text: 'Download all or only selected outputs.' },
    ],
    proTips: ['Post to social? Check platform-preferred sizes (e.g., 1080×1350 for IG portrait).'],
    toolLink: '/tools/image-resizer',
    icon: ImageIcon,
  },
  {
    id: 'zip-create',
    title: 'Create a ZIP Archive Locally',
    est: '1–2 min',
    category: 'Archive',
    summary:
      'Bundle multiple files into a single ZIP for simple sharing — fully offline.',
    steps: [
      { title: 'Open ZIP Creator', text: 'Add files/folders and review list.' },
      { title: 'Make ZIP', text: 'Click **Create ZIP**. Save the archive to your device.' },
    ],
    proTips: ['Use clear folder names before zipping — easier for recipients.'],
    toolLink: '/tools/create-zip',
    icon: FileArchive,
  },
  {
    id: 'zip-extract',
    title: 'Extract a ZIP File in Your Browser',
    est: '1–2 min',
    category: 'Archive',
    summary:
      'Unpack and preview contents safely — no installs needed.',
    steps: [
      { title: 'Open Unzip', text: 'Drop the .zip file. Preview file list.' },
      { title: 'Extract', text: 'Choose all or specific files to download.' },
    ],
    toolLink: '/tools/unzip',
    icon: Scissors,
  },
  {
    id: 'qr-codes',
    title: 'Generate a QR Code That Scans Everywhere',
    est: '1–2 min',
    category: 'Utilities',
    summary:
      'Create QR codes for links, text, contact info. Export PNG/SVG for print.',
    steps: [
      { title: 'Open QR Generator', text: 'Paste your URL or text. Watch the preview update live.' },
      { title: 'Customize', text: 'Select size and error-correction for reliable scanning.' },
      { title: 'Download', text: 'Export PNG or SVG. Test with multiple phones.' },
    ],
    proTips: ['High-contrast (dark on light) works best for scans.'],
    toolLink: '/tools/qr-generator',
    icon: QrCode,
  },
  {
    id: 'docx-to-pdf',
    title: 'Convert DOCX to a Polished PDF',
    est: '2–4 min',
    category: 'Docs',
    summary:
      'Turn documents into clean PDFs that look right on every device.',
    steps: [
      { title: 'Open DOCX → PDF', text: 'Upload your .docx. Formatting stays local in your browser.' },
      { title: 'Review output', text: 'Check fonts, spacing, and page breaks.' },
      { title: 'Export', text: 'Download the PDF and share.' },
    ],
    pitfalls: ['If a special font is missing locally, export from the source app as PDF for perfect fidelity.'],
    toolLink: '/tools/docx-to-pdf',
    icon: FileType2,
  },
];

const TutorialsPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TUTORIALS;
    return TUTORIALS.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <>
      <Helmet>
        <title>Tutorials | Files Nova</title>
        <meta
          name="description"
          content="Step-by-step tutorials for Files Nova: convert images to PDF, merge/compress PDFs, resize images, create ZIPs, generate QR codes — all locally in your browser."
        />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Files Nova Tutorials',
          url: 'https://filesnova.com/tutorials',
          about: 'Guides and how-tos for local, private file conversions.'
        })}</script>
      </Helmet>

      <BrandHeader showToolsMenu={true} subtitle="Tutorials & Guides" logoSize="md" />

      <main className="pt-24">
        {/* Hero + search */}
        <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Master your files, the private way
            </h1>
            <p className="mt-2 text-gray-600 text-lg">
              Deep dives, quick wins, and pro tips — everything runs locally in your browser. No uploads. No drama.
            </p>

            <div className="mt-6 relative">
              <label htmlFor="tutorials-search" className="sr-only">Search tutorials</label>
              <input
                id="tutorials-search"
                type="search"
                placeholder="Search tutorials: jpg to pdf, merge, compress, resize, zip…"
                className="w-full rounded-2xl bg-white/90 backdrop-blur-xl border border-white/30 shadow-xl pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            {/* Table of contents (anchors) */}
            <div className="mt-6 flex flex-wrap gap-2">
              {TUTORIALS.map(t => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/30 shadow hover:-translate-y-0.5 transition"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                  {t.title}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Tutorials list */}
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-2 gap-8">
            {filtered.map(t => {
              const Icon = t.icon;
              return (
                <article
                  key={t.id}
                  id={t.id}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 sm:p-8"
                >
                  <div className="flex items-start gap-4">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow">
                      <Icon className="w-6 h-6 text-white" />
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg border border-gray-200">
                          <Timer className="w-3.5 h-3.5" /> {t.est}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100">
                          {t.category}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-700">{t.summary}</p>
                    </div>
                  </div>

                  {/* Steps */}
                  <ol className="mt-5 space-y-3">
                    {t.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-gray-900">{i + 1}. {s.title}</div>
                          <p className="text-gray-700">{s.text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>

                  {/* Pro tips */}
                  {t.proTips && t.proTips.length > 0 && (
                    <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-amber-900">Pro tips</div>
                          <ul className="mt-1 list-disc list-inside text-amber-900/90 space-y-1">
                            {t.proTips.map((tip, i) => <li key={i}>{tip}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pitfalls */}
                  {t.pitfalls && t.pitfalls.length > 0 && (
                    <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-rose-900">Watch out</div>
                          <ul className="mt-1 list-disc list-inside text-rose-900/90 space-y-1">
                            {t.pitfalls.map((pf, i) => <li key={i}>{pf}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      to={t.toolLink}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg transition"
                    >
                      Open tool <ExternalLink className="w-4 h-4" />
                    </Link>
                    <a
                      href={`#top`}
                      className="text-sm text-gray-600 hover:underline"
                    >
                      Back to top
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Footer CTA strip */}
        <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid md:grid-cols-3 gap-6">
              <Link to="/help" className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 flex items-start gap-3">
                <BookOpen className="w-6 h-6 text-indigo-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Help Center</h3>
                  <p className="text-gray-600 text-sm">FAQs and troubleshooting guides.</p>
                  <span className="inline-flex items-center gap-1 text-indigo-600 text-sm mt-2 group-hover:underline">
                    Browse help <ExternalLink className="w-4 h-4" />
                  </span>
                </div>
              </Link>
              <Link to="/contact" className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 flex items-start gap-3">
                <ImageIcon className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Still stuck?</h3>
                  <p className="text-gray-600 text-sm">Email support with steps & screenshots.</p>
                  <span className="inline-flex items-center gap-1 text-blue-600 text-sm mt-2 group-hover:underline">
                    Contact us <ExternalLink className="w-4 h-4" />
                  </span>
                </div>
              </Link>
              <Link to="/privacy-policy" className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 flex items-start gap-3">
                <Shield className="w-6 h-6 text-emerald-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Privacy-first</h3>
                  <p className="text-gray-600 text-sm">Why local processing keeps files private.</p>
                  <span className="inline-flex items-center gap-1 text-emerald-600 text-sm mt-2 group-hover:underline">
                    Read policy <ExternalLink className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default TutorialsPage;
