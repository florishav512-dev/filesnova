import React from 'react';
import PageLayout from '../components/PageLayout';

/**
 * GDPRPage provides information about the General Data Protection Regulation
 * and how FilesNova respects your data privacy. It uses the same PageLayout
 * component to maintain visual consistency across legal/support pages.
 */
const GDPRPage: React.FC = () => {
  return (
    <PageLayout title="GDPR" subtitle="Your data rights and how we protect them">
      <p>
        The General Data Protection Regulation (GDPR) provides individuals in the
        European Union with specific rights regarding their personal data. At
        FilesNova, we believe privacy is a fundamental right and take these
        obligations seriously.
      </p>
      <p>
        Because all file conversions happen directly in your browser, your files
        never leave your device. We do not store, transmit or process your
        documents on any server. This means you have complete control over
        your data at all times.
      </p>
      <p>
        If you have any questions about how we handle data or wish to exercise
        any of your GDPR rights (such as the right to access, rectify or erase
        data), please contact us via the contact form and we will be happy to
        assist you.
      </p>
    </PageLayout>
  );
};

export default GDPRPage;