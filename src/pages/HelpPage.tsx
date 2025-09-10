// src/pages/HelpPage.tsx
import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import BrandHeader from '../components/BrandHeader';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  LifeBuoy,
  MessageSquare,
  Shield,
  Zap,
  Image as ImageIcon,
  FileText,
  FileArchive,
  FileType2,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

type Article = {
  title: string;
  slug: string;
  category: 'PDF' | 'Images' | 'Archive' | 'Docs' | 'Account' | 'Privacy';
  summary: string;
  icon: React.ComponentType<any>;
};

const ARTICLES: Article[] = [
  { title: 'Convert JPG to PDF', slug: '/tools/jpg-to-pdf', category: 'PDF', summary: 'Turn images into a single PDF with custom size & margins.', icon: FileText },
  { title: 'Merge PDFs', slug: '/tools/merge-pdf', category: 'PDF', summary: 'Combine multiple PDFs in your browser.', icon: FileText },
  { title: 'Compress PDF', slug: '/tools/compress-pdf', category: 'PDF', summary: 'Shrink PDF size while keeping quality crisp.', icon: FileText },
  { title: 'PNG to JPG', slug: '/tools/png-to-jpg', category: 'Images', summary: 'Fast, offline conversion with quality control.', icon: ImageIcon },
  { title: 'Resize Images', slug: '/tools/image-resizer', category: 'Images', summary: 'Batch resize with smart constraints.', icon: ImageIcon },
  { title: 'Create ZIP', slug: '/tools/create-zip', category: 'Archive', summary: 'Zip files locally—no uploads needed.', icon: FileArchive },
  { title: 'Extract ZIP', slug: '/tools/unzip', category: 'Archive', summary: 'Unpack archives directly in your browser.', icon: FileArchive },
  { title: 'DOCX to PDF', slug: '/tools/docx-to-pdf', category: 'Docs', summary: 'High-fidelity doc conversion to PDF.', icon: FileType2 },
  { title: 'Privacy & Local Processing', slug: '/privacy-policy', category: 'Privacy', summary: 'What we collect (very little) and why.', icon: Shield },
];

const FAQ = [
  {
    q: 'Do you upload or store my files?',
    a: 'No. Files Nova runs conversions in your browser using local processing. Your files never leave your device.'
  },
  {
    q: 'Why is conversion so fast?',
    a: 'Everything happens locally, so there’s no network round-trip. We also optimize image decoding and PDF writing.'
  },
  {
    q: 'Can I reorder images before making a PDF?',
    a: 'Yes—on JPG→PDF you can manually reorder, sort by name or size, and choose fit/fill/stretch.'
  },
  {
    q: 'Are there limits on file size or count?',
    a: 'Limits depend on your browser memory. If you hit issues, try converting in smaller batches or reduce quality.'
  },
  {
    q: 'Is this free to use?',
    a: 'Yes. If we add premium features later, we’ll keep core tools free and update our policies clearly.'
  },
  {
    q: 'How do I get help?',
    a: 'Email filesnova@zohomail.in with steps, screenshots, and sample files if possible. We usually reply quickly.'
  }
];

const HelpPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ARTICLES.slice(0, 9);
    return ARTICLES.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <>
      <Helmet>
        <title>Help Center | Files Nova</title>
        <meta
          name="description"
          content="Find guides, FAQs, and troubleshooting for Files Nova. Learn how to convert files locally in your browser—fast and private."
        />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Files Nova Help Center',
          url: 'https://filesnova.com/help'
        })}</script>
      </Helmet>

      <BrandHeader showToolsMenu={true} subtitle="Help Center" logoSize="md" />

      <main className="pt-24">
        {/* Hero / Search */}
        <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">How can we help?</h1>
            <p className="mt-2 text-gray-600 text-lg">
              Search guides, pick a tool, or skim the FAQs. Everything runs locally—your files don’t leave your device.
            </p>

            <div className="mt-6 relative">
              <label htmlFor="help-search" className="sr-only">Search help</label>
              <input
                id="help-search"
                type="search"
                placeholder="Search: jpg to pdf, merge, compress, resize…"
                className="w-full rounded-2xl bg-white/90 backdrop-blur-xl border border-white/30 shadow-xl pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </section>

        {/* Suggested articles / tools */}
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.slug}
                  to={a.slug}
                  className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-sm">
                      <Icon className="w-5 h-5 text-white" />
                    </span>
                    <div>
                      <div className="text-sm text-gray-500">{a.category}</div>
                      <h3 className="font-bold text-gray-900 group-hover:underline">{a.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-700">{a.summary}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Quick links row */}
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              to="/contact"
              className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 flex items-start gap-3"
            >
              <LifeBuoy className="w-6 h-6 text-indigo-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Contact Support</h3>
                <p className="text-gray-600 text-sm">Email us with steps & screenshots for faster help.</p>
                <span className="inline-flex items-center gap-1 text-indigo-600 text-sm mt-2 group-hover:underline">
                  Open contact page <ExternalLink className="w-4 h-4" />
                </span>
              </div>
            </Link>

            <Link
              to="/privacy-policy"
              className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 flex items-start gap-3"
            >
              <Shield className="w-6 h-6 text-emerald-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Privacy & Security</h3>
                <p className="text-gray-600 text-sm">Why local processing keeps your files private.</p>
                <span className="inline-flex items-center gap-1 text-emerald-600 text-sm mt-2 group-hover:underline">
                  Read policy <ExternalLink className="w-4 h-4" />
                </span>
              </div>
            </Link>

            <Link
              to="/tutorials"
              className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 flex items-start gap-3"
            >
              <BookOpen className="w-6 h-6 text-fuchsia-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Tutorials</h3>
                <p className="text-gray-600 text-sm">Short walkthroughs for common tasks.</p>
                <span className="inline-flex items-center gap-1 text-fuchsia-600 text-sm mt-2 group-hover:underline">
                  Explore tutorials <ExternalLink className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* Why Files Nova (trust strip) */}
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6">
              <Zap className="w-6 h-6 text-yellow-600" />
              <h3 className="mt-3 font-semibold text-gray-900">Fast by default</h3>
              <p className="text-gray-600 text-sm mt-1">Local conversions = no uploading, no waiting on servers.</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6">
              <Shield className="w-6 h-6 text-green-600" />
              <h3 className="mt-3 font-semibold text-gray-900">Private by design</h3>
              <p className="text-gray-600 text-sm mt-1">Your files stay on your device. We don’t see them.</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h3 className="mt-3 font-semibold text-gray-900">Human support</h3>
              <p className="text-gray-600 text-sm mt-1">Email us anytime. We actually read and reply.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900">Frequently asked questions</h2>
            <div className="mt-4 divide-y divide-gray-200/60">
              {FAQ.map((item, idx) => (
                <details key={idx} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-left">
                    <span className="font-medium text-gray-900">{item.q}</span>
                    <ChevronDown className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-gray-700">{item.a}</p>
                </details>
              ))}
            </div>

            <div className="mt-6 text-sm text-gray-600">
              Didn’t find what you need?{' '}
              <Link to="/contact" className="text-blue-600 hover:underline">Contact support</Link>.
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default HelpPage;
