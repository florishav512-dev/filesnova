import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

const SupportPage: React.FC = () => {
  return (
    <PageLayout title="Support" subtitle="Need assistance? Explore our support resources below.">
      <ul className="list-disc pl-6 space-y-2 text-base">
        <li><Link to="/help" className="text-blue-600 hover:underline">Help Center</Link></li>
        <li><Link to="/contact" className="text-blue-600 hover:underline">Contact Us</Link></li>
        <li><Link to="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link></li>
        <li><Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link></li>
        <li><Link to="/gdpr" className="text-blue-600 hover:underline">GDPR</Link></li>
        <li><Link to="/tutorials" className="text-blue-600 hover:underline">Tutorials</Link></li>
      </ul>
    </PageLayout>
  );
};

export default SupportPage;
