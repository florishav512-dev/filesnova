import React from 'react';
import PageLayout from '../components/PageLayout';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <PageLayout title="Privacy Policy" subtitle="We respect your privacy and never store your files">
      <p>
        Your privacy is important to us. This policy outlines how we collect, use, and
        protect your data when you use FilesNova. Since all file operations occur locally
        in your browser, we do not store or transmit your files to any server.
      </p>
      <p>
        We may collect anonymous usage data to improve the application, such as
        aggregate analytics about feature usage. These statistics contain no personal
        information and help us understand how the app is being used.
      </p>
      <p>
        If you have any questions about our privacy practices, please reach out via our
        contact form and we will gladly provide more information.
      </p>
    </PageLayout>
  );
};

export default PrivacyPolicyPage;
