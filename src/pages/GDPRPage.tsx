// src/pages/GDPRPage.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import BrandHeader from '../components/BrandHeader';
import { Link } from 'react-router-dom';

const LAST_UPDATED = '25 August 2025';

const GDPRPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>GDPR Compliance | Files Nova</title>
        <meta
          name="description"
          content="Learn how Files Nova complies with the GDPR. We never upload or store your files — all processing happens in your browser."
        />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GDPR',
          description:
            'Learn how Files Nova complies with the GDPR. Your data remains under your control as all file conversions happen in your browser.',
          dateModified: LAST_UPDATED,
          isPartOf: { '@type': 'WebSite', name: 'Files Nova', url: 'https://filesnova.com' },
        })}</script>
      </Helmet>

      <BrandHeader showToolsMenu={true} subtitle="GDPR Compliance" logoSize="md" />

      <main className="pt-24">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-4xl mx-auto px-4 py-10">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">GDPR Compliance</h1>
            <p className="mt-2 text-gray-600">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 sm:p-8 space-y-8">
            
            <div>
              <h2 className="text-xl font-bold text-gray-900">1. Our Privacy-first Approach</h2>
              <p className="mt-2 text-gray-700">
                The General Data Protection Regulation (GDPR) grants individuals in the European Union strong rights over
                their personal data. At <strong>Files Nova</strong>, privacy is built into the core of our service. Because
                all file conversions occur <strong>directly in your browser</strong>, your documents never leave your device.
                We do not upload, process, or store files on any server.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">2. Key GDPR Principles We Uphold</h2>
              <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Data Minimization:</strong> We do not collect personal files or conversion data.</li>
                <li><strong>Security by Design:</strong> All operations happen locally in your browser, reducing exposure risks.</li>
                <li><strong>Transparency:</strong> This policy explains clearly what we do (and don’t do) with your data.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">3. Your Rights under GDPR</h2>
              <p className="mt-2 text-gray-700">
                While we don’t hold personal data from your conversions, you are still entitled to exercise your GDPR rights,
                including:
              </p>
              <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1">
                <li>The right to access personal data we may hold (e.g., your contact details if you email us).</li>
                <li>The right to rectification or erasure of such data.</li>
                <li>The right to restrict or object to processing where applicable.</li>
                <li>The right to data portability.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">4. How to Contact Us</h2>
              <p className="mt-2 text-gray-700">
                If you have any GDPR-related inquiries, or wish to exercise your rights, please contact us at{' '}
                <a className="text-blue-600 hover:underline" href="mailto:filesnova24@zohomail.in">
                  filesnova24@zohomail.in
                </a>. We will respond promptly in accordance with GDPR requirements.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">5. Related Policies</h2>
              <p className="mt-2 text-gray-700">
                For more information on how we handle privacy, see our{' '}
                <Link to="/privacy-policy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link to="/cookie-policy" className="text-blue-600 hover:underline">
                  Cookie Policy
                </Link>
                .
              </p>
            </div>

          </div>
        </section>
      </main>
    </>
  );
};

export default GDPRPage;
