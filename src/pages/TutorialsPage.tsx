import React from 'react';
import PageLayout from '../components/PageLayout';
import { Link } from 'react-router-dom';

/**
 * TutorialsPage offers guides and tips for using FilesNova. This page lays
 * out a list of common tasks with brief descriptions and links to the
 * appropriate tool pages. It leverages the PageLayout component for
 * consistent styling.
 */
const TutorialsPage: React.FC = () => {
  return (
    <PageLayout title="Tutorials" subtitle="Learn how to get the most out of FilesNova">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-2">Convert Images to PDF</h3>
          <p>
            Easily merge your photos into a single PDF. Follow our step-by-step guide to
            convert JPG or PNG images into one PDF document without leaving your browser.
          </p>
          <Link to="/tools/images-to-pdf" className="text-blue-600 hover:underline font-medium">
            Try Images to PDF
          </Link>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">Resize and Optimize Images</h3>
          <p>
            Need to resize a photo for social media or reduce file size for faster sharing?
            Our image resizer and compression tools are here to help.
          </p>
          <Link to="/tools/image-resizer" className="text-blue-600 hover:underline font-medium">
            Try Image Resizer
          </Link>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">Create QR Codes</h3>
          <p>
            Generate QR codes for URLs, text or contact information in seconds. Learn how
            to customise and download your QR code on the fly.
          </p>
          <Link to="/tools/qr-generator" className="text-blue-600 hover:underline font-medium">
            Try QR Generator
          </Link>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">Convert Text Documents</h3>
          <p>
            Turn your DOCX or plain text files into polished PDFs. We walk you through
            selecting your file and downloading the result in just a few clicks.
          </p>
          <Link to="/tools/docx-to-pdf" className="text-blue-600 hover:underline font-medium">
            Try DOCX to PDF
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default TutorialsPage;