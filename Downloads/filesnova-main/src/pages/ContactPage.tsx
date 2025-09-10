import React from 'react';
import { Mail } from 'lucide-react';
import PageLayout from '../components/PageLayout';

/**
 * ContactPage presents contact details and a privacy note rather than a
 * submission form. Users can click the email address to compose a new
 * message in their default mail client. The design matches the updated
 * specifications provided by the user.
 */
const ContactPage: React.FC = () => {
  return (
    <PageLayout
      title="Contact Us"
      subtitle="We'd love to hear from you! Whether you have a question about features, a bug report, or feedback for us, please feel free to reach out."
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-800">General Inquiries &amp; Support</h4>
          <a
            href="mailto:filesnova@zohomail.in"
            className="text-blue-600 hover:underline break-all"
          >
            filesnova@zohomail.in
          </a>
        </div>
      </div>
      <div className="mt-6 p-4 bg-gray-200/70 border border-gray-300 rounded-xl">
        <p className="text-gray-700 text-sm">
          <span className="font-bold">Please Note:</span> As a privacy-focused service, we do not have
          access to your files or conversion history. All operations are performed on your device.
          We cannot assist with recovering lost files.
        </p>
      </div>
    </PageLayout>
  );
};

export default ContactPage;
