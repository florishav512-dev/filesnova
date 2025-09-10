// src/pages/PrivacyPolicyPage.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import BrandHeader from '../components/BrandHeader';
import { Link } from 'react-router-dom';

const LAST_UPDATED = '2 September 2025';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Files Nova</title>
        <meta
          name="description"
          content="Files Nova is privacy-first: conversions happen in your browser and files never leave your device. Read our full Privacy Policy."
        />
        {/* Structured data for a proper legal page */}
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'PrivacyPolicy',
          name: 'Privacy Policy',
          dateModified: LAST_UPDATED,
          isPartOf: { '@type': 'WebSite', name: 'Files Nova', url: 'https://filesnova.com' },
          publisher: { '@type': 'Organization', name: 'Files Nova' },
          url: 'https://filesnova.com/privacy-policy',
          inLanguage: 'en'
        })}</script>
      </Helmet>

      {/* Header with your PNG logo + Tools button */}
      <BrandHeader showToolsMenu={true} subtitle="Privacy Policy" logoSize="md" />

      <main className="pt-24">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-4xl mx-auto px-4 py-10">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Privacy Policy</h1>
            <p className="mt-2 text-gray-600">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 sm:p-8 space-y-8">
            {/* 1. Summary */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">1. Quick Summary</h2>
              <p className="mt-2 text-gray-700">
                <strong>Files Nova is privacy-first.</strong> File conversions happen <strong>entirely in your browser</strong>.
                Your files are <strong>not uploaded</strong> to our servers and <strong>not stored</strong> by us.
                We collect only minimal information necessary to operate and support the service.
              </p>
            </div>

            {/* 2. What data we process (and what we don't) */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">2. What Data We Process</h2>
              <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1">
                <li>
                  <strong>Files & conversions:</strong> processed locally on your device. We do not receive or store your files or conversion results.
                </li>
                <li>
                  <strong>Support communications:</strong> if you email us at
                  {' '}<a className="text-blue-600 hover:underline" href="mailto:filesnova@zohomail.in">filesnova@zohomail.in</a>,
                  we’ll process the information you include (e.g., your email address and message) to respond.
                </li>
                <li>
                  <strong>Site preferences:</strong> we may use in-browser storage (localStorage/sessionStorage) to remember your tool settings (e.g., page size, quality).
                  This data stays in your browser and isn’t sent to us.
                </li>
              </ul>
              <p className="mt-2 text-gray-700">
                <strong>We do not sell personal data.</strong> We do not use advertising cookies or cross-site tracking.
              </p>
            </div>

            {/* 3. Cookies & local storage */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">3. Cookies & Local Storage</h2>
              <p className="mt-2 text-gray-700">
                We aim to minimize cookies. Most preferences use localStorage/sessionStorage. Any cookies we set are
                strictly necessary for security or basic functionality. Learn more in our{' '}
                <Link to="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</Link>.
              </p>
            </div>

            {/* 4. Analytics */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">4. Analytics</h2>
              <p className="mt-2 text-gray-700">
                We currently do <strong>not</strong> use third-party analytics that track you across sites. If we introduce
                privacy-respecting analytics in the future, we will update this Policy and (where required) present a consent banner first.
              </p>
            </div>

            {/* 5. Legal bases (GDPR) */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">5. Legal Bases (GDPR)</h2>
              <p className="mt-2 text-gray-700">
                For users in the EU/EEA/UK, our processing relies on:
              </p>
              <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Performance of a contract</strong> to provide the service you request.</li>
                <li><strong>Legitimate interests</strong> for essential security and site operation.</li>
                <li><strong>Consent</strong> for any non-essential cookies/technologies (if introduced).</li>
              </ul>
            </div>

            {/* 6. Your rights */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">6. Your Rights</h2>
              <p className="mt-2 text-gray-700">
                Depending on your location, you may have rights to access, rectify, delete, restrict, or object to processing of your personal data, and to data portability.
                Because we don’t collect your files, these rights typically apply to information you provide in support emails.
              </p>
              <p className="mt-2 text-gray-700">
                To exercise rights or ask questions, contact us at{' '}
                <a className="text-blue-600 hover:underline" href="mailto:filesnova@zohomail.in">
                  filesnova@zohomail.in
                </a>. We’ll respond in accordance with applicable law.
              </p>
            </div>

            {/* 7. Data retention */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">7. Data Retention</h2>
              <p className="mt-2 text-gray-700">
                Files are never uploaded to us, so we retain none. Support communications are kept only as long as needed to
                address your request and maintain records required by law or for service integrity.
              </p>
            </div>

            {/* 8. Security */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">8. Security</h2>
              <p className="mt-2 text-gray-700">
                We design for privacy: conversions run locally, reducing exposure. For any contact data you send us,
                we apply reasonable administrative and technical safeguards. No method of transmission or storage is 100% secure,
                but our minimal-data approach limits risk by default.
              </p>
            </div>

            {/* 9. International transfers */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">9. International Transfers</h2>
              <p className="mt-2 text-gray-700">
                Since we don’t handle file uploads, international data transfers are minimal. If you email us, your message may
                be processed where our email provider operates. When applicable, we use appropriate safeguards (e.g., standard
                contractual clauses) to protect your information.
              </p>
            </div>

            {/* 10. Children */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">10. Children’s Privacy</h2>
              <p className="mt-2 text-gray-700">
                Files Nova is not directed to children under the age of 13 (or the minimum age required in your jurisdiction).
                We do not knowingly collect personal information from children.
              </p>
            </div>

            {/* 11. Changes */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">11. Changes to this Policy</h2>
              <p className="mt-2 text-gray-700">
                We may update this Privacy Policy as our service or laws evolve. Material changes will be posted here with an
                updated “Last updated” date.
              </p>
            </div>

            {/* 12. Contact */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">12. Contact Us</h2>
              <p className="mt-2 text-gray-700">
                Questions or privacy requests? Email us at{' '}
                <a className="text-blue-600 hover:underline" href="mailto:filesnova@zohomail.in">
                  filesnova@zohomail.in
                </a>. Also see our{' '}
                <Link to="/gdpr" className="text-blue-600 hover:underline">GDPR</Link>{' '}
                and{' '}
                <Link to="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</Link>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default PrivacyPolicyPage;
