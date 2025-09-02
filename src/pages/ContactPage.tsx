// src/pages/ContactPage.tsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Mail,
  Shield,
  Clock,
  HelpCircle,
  MessageSquare,
  Copy,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

import BrandHeader from '../components/BrandHeader';

const ContactPage: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const supportEmail = 'filesnova24@zohomail.in';
  const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent('Support request from Files Nova')}`;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | Files Nova</title>
        <meta
          name="description"
          content="Contact Files Nova support. Get help fast via email. Privacy-first: your files never leave your device."
        />
        {/* Basic structured data for a professional contact page */}
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          mainEntity: {
            '@type': 'Organization',
            name: 'Files Nova',
            email: supportEmail,
            url: 'https://filesnova.com/contact',
            contactPoint: [{
              '@type': 'ContactPoint',
              contactType: 'customer support',
              email: supportEmail,
              availableLanguage: ['en'],
            }]
          }
        })}</script>
      </Helmet>

      {/* Brand header with your PNG logo */}
      <BrandHeader showToolsMenu={true} subtitle="Contact & Support" logoSize="md" />

      <main className="pt-24">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              We’re here to help
            </h1>
            <p className="mt-3 text-gray-600 text-lg">
              Questions, bug reports, or feature ideas—drop us a line. We usually respond quickly.
            </p>
          </div>
        </section>

        {/* Contact cards */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Email */}
            <div className="md:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Mail className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">Email support</h2>
                  <p className="text-gray-600 mt-1">
                    The fastest way to reach us. Include screenshots or steps to reproduce if you’re reporting an issue.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <a
                      href={mailto}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Email {supportEmail}
                    </a>

                    <button
                      onClick={copyEmail}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-50 transition"
                      aria-live="polite"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copy email
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Tip: add as much context as possible (what you tried, file types, browser & OS).
                  </div>
                </div>
              </div>
            </div>

            {/* Service facts */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Expected response</h3>
                  <p className="text-gray-600 text-sm">Usually within a business day.</p>
                </div>
              </div>
              <hr className="my-4 border-gray-200/70" />
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Privacy-first</h3>
                  <p className="text-gray-600 text-sm">
                    All conversions happen in your browser. We can’t access your files or history.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Helpful links / triage */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <a
              href="/help"
              className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 flex items-start gap-3"
            >
              <HelpCircle className="w-6 h-6 text-indigo-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Help Center</h3>
                <p className="text-gray-600 text-sm">
                  FAQs and step-by-step guides for common tasks.
                </p>
                <span className="inline-flex items-center gap-1 text-indigo-600 text-sm mt-2 group-hover:underline">
                  Browse articles <ExternalLink className="w-4 h-4" />
                </span>
              </div>
            </a>

            <a
              href="/tutorials"
              className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 flex items-start gap-3"
            >
              <MessageSquare className="w-6 h-6 text-fuchsia-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Tutorials</h3>
                <p className="text-gray-600 text-sm">
                  Quick walkthroughs for power users and beginners.
                </p>
                <span className="inline-flex items-center gap-1 text-fuchsia-600 text-sm mt-2 group-hover:underline">
                  View tutorials <ExternalLink className="w-4 h-4" />
                </span>
              </div>
            </a>

            <a
              href="/privacy-policy"
              className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 flex items-start gap-3"
            >
              <Shield className="w-6 h-6 text-emerald-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Privacy Policy</h3>
                <p className="text-gray-600 text-sm">
                  Learn how we keep your data safe—by not collecting it.
                </p>
                <span className="inline-flex items-center gap-1 text-emerald-600 text-sm mt-2 group-hover:underline">
                  Read policy <ExternalLink className="w-4 h-4" />
                </span>
              </div>
            </a>
          </div>

          {/* Privacy notice */}
          <div className="mt-8 p-5 bg-gray-100/80 border border-gray-200 rounded-2xl">
            <p className="text-gray-700 text-sm">
              <span className="font-semibold">Note:</span> Files Nova runs in your browser; files never leave your device.
              Because we don’t store uploads, we can’t recover lost files or view your conversions.
            </p>
          </div>
        </section>
      </main>
    </>
  );
};

export default ContactPage;
