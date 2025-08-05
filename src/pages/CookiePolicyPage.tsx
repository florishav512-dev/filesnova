import React from 'react';
import PageLayout from '../components/PageLayout';

const CookiePolicyPage: React.FC = () => {
  return (
    <PageLayout title="Cookie Policy" subtitle="Understanding how we use cookies on FilesNova">
      <p>
        This website uses cookies to enhance your browsing experience. Cookies are small
        text files stored on your device that help us remember your preferences and
        maintain session information as you navigate the site.
      </p>
      <p>
        FilesNova does not use cookies for tracking personal data or advertising purposes.
        By using this site, you consent to the use of cookies as described in this
        policy. You can disable cookies in your browser settings if you prefer not to
        accept them.
      </p>
    </PageLayout>
  );
};

export default CookiePolicyPage;
