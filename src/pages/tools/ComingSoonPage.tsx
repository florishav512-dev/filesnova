import React from 'react';
import { Helmet } from 'react-helmet-async';

const ComingSoonPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Coming Soon – New Tools Launching | FilesNova</title>
        <meta
          name="description"
          content="Stay tuned for upcoming tools launching soon on FilesNova. We're constantly building new features for your file conversion and editing needs."
        />
        <link rel="canonical" href="https://filesnova.com/tools/coming-soon" />
      </Helmet>
      <div className="max-w-xl mx-auto text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
        <p className="text-gray-600">
          This tool is under construction and will be available in a future release.
        </p>
      </div>
    </>
  );
};

export default ComingSoonPage;
