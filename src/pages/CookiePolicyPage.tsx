// src/pages/CookiePolicyPage.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import BrandHeader from '../components/BrandHeader';
import { Link } from 'react-router-dom';

const LAST_UPDATED = '25 August 2025';

const CookiePolicyPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Cookie Policy | Files Nova</title>
        <meta
          name="description"
          content="Learn how Files Nova uses cookies and similar technologies. We prioritize privacy and avoid advertising and cross-site tracking cookies."
        />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Cookie Policy',
          description:
            'How Files Nova uses cookies and similar technologies. Privacy-first: no advertising or cross-site tracking cookies.',
          dateModified: LAST_UPDATED,
          isPartOf: { '@type': 'WebSite', name: 'Files Nova', url: 'https://filesnova.com' },
        })}</script>
      </Helmet>

      {/* ✅ Tools button is ON now */}
      <BrandHeader showToolsMenu={true} subtitle="Cookie Policy" logoSize="md" />

      <main className="pt-24">
        <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-4xl mx-auto px-4 py-10">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Cookie Policy</h1>
            <p className="mt-2 text-gray-600">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 sm:p-8 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">1. Overview</h2>
              <p className="mt-2 text-gray-700">
                This Cookie Policy explains how <strong>Files Nova</strong> (“we”, “us”, “our”) uses cookies and similar
                technologies on our website. We operate with a <strong>privacy-first</strong> approach: conversions run in your
                browser, and we avoid tracking you across the web.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">2. What are cookies?</h2>
              <p className="mt-2 text-gray-700">
                Cookies are small text files placed on your device by a website. They can help a site remember your
                preferences, keep you signed in, or perform security functions. We also use <em>similar technologies</em> such as
                localStorage and sessionStorage, which store data in your browser.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">3. What we use</h2>
              <p className="mt-2 text-gray-700">
                Files Nova strives to minimize cookies. Most features rely on <strong>localStorage/sessionStorage</strong>
                (in-browser storage) rather than cookies. Where cookies are used, they are strictly limited to the purposes
                below:
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-gray-600">
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Purpose</th>
                      <th className="py-2 pr-4">Examples</th>
                      <th className="py-2">Retention</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-gray-50 rounded-xl">
                      <td className="py-3 pr-4 font-medium text-gray-900">Strictly Necessary</td>
                      <td className="py-3 pr-4 text-gray-700">
                        Security, basic site functionality, load balancing, or fraud prevention where applicable.
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        Anti-abuse tokens; routing cookies from our hosting provider (if present).
                      </td>
                      <td className="py-3 text-gray-700">Session or short-term</td>
                    </tr>
                    <tr className="bg-gray-50 rounded-xl">
                      <td className="py-3 pr-4 font-medium text-gray-900">Preferences (localStorage)</td>
                      <td className="py-3 pr-4 text-gray-700">
                        Remember tool settings you choose (e.g., page size, quality), theme, or UI state.
                      </td>
                      <td className="py-3 pr-4 text-gray-700">Stored in your browser; not sent to us.</td>
                      <td className="py-3 text-gray-700">Until you clear storage</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ul className="mt-4 list-disc list-inside text-gray-700 space-y-1">
                <li><strong>No advertising cookies</strong></li>
                <li><strong>No cross-site tracking cookies</strong></li>
                <li><strong>No third-party analytics cookies</strong> (if we add analytics in the future, this policy and consent banner will be updated first)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">4. Legal basis</h2>
              <p className="mt-2 text-gray-700">
                Where required by law (e.g., in the EU/UK under the ePrivacy rules and GDPR), we rely on your consent for
                non-essential cookies. Essential cookies (strictly necessary) are used based on our legitimate interest in
                delivering a secure, functional service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">5. Managing cookies & storage</h2>
              <p className="mt-2 text-gray-700">
                You can manage cookies and clear localStorage/sessionStorage any time in your browser settings. The steps differ by browser:
              </p>
              <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Chrome:</strong> Settings → Privacy & security → Cookies and other site data</li>
                <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies and site permissions</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Settings/Preferences → Privacy</li>
              </ul>
              <p className="mt-2 text-gray-700">
                Blocking essential cookies may impair site functionality. Clearing localStorage may reset your tool preferences.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">6. Third-party services</h2>
              <p className="mt-2 text-gray-700">
                We do not intentionally embed third-party advertising or analytics that set cookies. If we integrate a
                third-party service in the future (for example, optional diagnostics or analytics), we will update this
                policy, identify the provider, and request consent where required.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">7. Changes to this policy</h2>
              <p className="mt-2 text-gray-700">
                We may update this Cookie Policy to reflect changes to technology or applicable law. Material changes will
                be highlighted on this page with an updated “Last updated” date.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">8. Contact</h2>
              <p className="mt-2 text-gray-700">
                Questions about this Cookie Policy? Reach us at{' '}
                <a className="text-blue-600 hover:underline" href="mailto:filesnova@zohomail.in">
                  filesnova@zohomail.in
                </a>. You can also review our{' '}
                <Link to="/privacy-policy" className="text-blue-600 hover:underline">
                  Privacy Policy
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

export default CookiePolicyPage;
