import React from 'react';
import PageLayout from '../components/PageLayout';

const TermsPage: React.FC = () => {
  return (
    <PageLayout title="Terms of Service" subtitle="Please read these terms carefully before using FilesNova">
      <p>
        By using FilesNova, you agree to the following terms. FilesNova is provided free of
        charge and “as is”. We are not liable for any data loss or damage resulting from
        the use of this application. All file conversions happen on your device, and you
        remain fully responsible for your own files.
      </p>
      <p>
        You must ensure that you have the rights to convert or modify any file you upload
        or process with FilesNova. We do not condone the use of our service for any
        unlawful or infringing activities.
      </p>
      <p>
        We may update these terms from time to time. Continued use of FilesNova after
        changes are made signifies acceptance of the revised terms.
      </p>
    </PageLayout>
  );
};

export default TermsPage;
