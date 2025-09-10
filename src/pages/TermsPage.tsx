// src/pages/TermsPage.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import BrandHeader from '../components/BrandHeader';
import { Link } from 'react-router-dom';

const LAST_UPDATED = '2 September 2025';

const TermsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service | Files Nova</title>
        <meta
          name="description"
          content="Review the Terms of Service for using Files Nova. Learn about permitted use, disclaimers, and responsibilities."
        />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Terms of Service',
          description:
            'Terms of Service for using Files Nova. Review permitted use, disclaimers, and responsibilities.',
          dateModified: LAST_UPDATED,
          url: 'https://filesnova.com/terms',
          isPartOf: { '@type': 'WebSite', name: 'Files Nova', url: 'https://filesnova.com' },
        })}</script>
      </Helmet>

      <BrandHeader showToolsMenu={true} subtitle="Terms of Service" logoSize="md" />

      <main className="pt-24">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-4xl mx-auto px-4 py-10">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Terms of Service</h1>
            <p className="mt-2 text-gray-600">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 sm:p-8 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">1. Acceptance of Terms</h2>
              <p className="mt-2 text-gray-700">
                By accessing or using <strong>Files Nova</strong>, you agree to be bound by these Terms of Service.
                If you do not agree, you must discontinue use immediately.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">2. Service Description</h2>
              <p className="mt-2 text-gray-700">
                Files Nova provides free, browser-based tools for file conversion and related utilities.
                All processing happens <strong>locally on your device</strong>; your files are not uploaded to or stored on our servers.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">3. User Responsibilities</h2>
              <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1">
                <li>You are responsible for the content and legality of the files you process with Files Nova.</li>
                <li>You must have the rights or necessary permissions to convert, modify, or share any file.</li>
                <li>You agree not to use the service for unlawful, infringing, or harmful purposes.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">4. Disclaimer of Warranties</h2>
              <p className="mt-2 text-gray-700">
                Files Nova is provided “as is” and “as available.” We make no warranties, express or implied,
                regarding accuracy, reliability, or fitness for a particular purpose. We cannot guarantee uninterrupted
                or error-free operation of the service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">5. Limitation of Liability</h2>
              <p className="mt-2 text-gray-700">
                To the maximum extent permitted by law, Files Nova and its contributors shall not be liable for any
                direct, indirect, incidental, or consequential damages resulting from your use of the service —
                including but not limited to data loss, file corruption, or device issues.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">6. Intellectual Property</h2>
              <p className="mt-2 text-gray-700">
                The Files Nova brand, logo, and website design are protected by copyright and trademark law.
                You may not reproduce, distribute, or modify our branding without prior written consent.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">7. Modifications to the Service</h2>
              <p className="mt-2 text-gray-700">
                We may update, suspend, or discontinue any part of the service at any time without notice.
                Updates to these Terms will be reflected on this page with an updated “Last updated” date.
                Continued use after changes indicates acceptance of the new terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">8. Governing Law</h2>
              <p className="mt-2 text-gray-700">
                These Terms are governed by and construed in accordance with the laws of your country of residence,
                without regard to conflict-of-law principles.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">9. Contact</h2>
              <p className="mt-2 text-gray-700">
                For questions about these Terms, please contact us at{' '}
                <a href="mailto:filesnova@zohomail.in" className="text-blue-600 hover:underline">
                  filesnova@zohomail.in
                </a>. You may also review our{' '}
                <Link to="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link> and{' '}
                <Link to="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</Link>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default TermsPage;
