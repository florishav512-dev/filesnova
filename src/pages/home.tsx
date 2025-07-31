// [same imports as before]
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ToolSection from "@/components/ToolSection";
import Analytics, { trackPageView } from "@/components/Analytics";
import AdSpace from "@/components/AdSpace";
import { 
  FileImage, 
  FileText, 
  Files, 
  Layers, 
  Combine, 
  FileArchive, 
  Scissors, 
  Expand, 
  Calculator, 
  Unlock, 
  FileIcon,
  Bolt,
  Shield,
  Infinity,
  Smartphone,
  Twitter,
  Facebook,
  Linkedin
} from "lucide-react";

export default function Home() {
  const [openTool, setOpenTool] = useState<string | null>(null);

  useEffect(() => {
    trackPageView('Home - Files Nova Converter');
  }, []);

  const toggleTool = (toolId: string) => {
    setOpenTool(openTool === toolId ? null : toolId);
  };

  const scrollToTool = (toolId: string) => {
    const element = document.getElementById(toolId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => setOpenTool(toolId), 500);
    }
  };

  const tools = [
    { id: "jpg-to-pdf", title: "JPG to PDF Converter", description: "Convert JPG images to PDF documents", icon: <FileImage className="text-red-600" />, bgColor: "bg-red-100", type: "jpg-to-pdf" },
    { id: "png-to-pdf", title: "PNG to PDF Converter", description: "Convert PNG images to PDF with transparency support", icon: <FileImage className="text-purple-600" />, bgColor: "bg-purple-100", type: "png-to-pdf" },
    { id: "pdf-to-jpg", title: "PDF to JPG Converter", description: "Extract pages from PDF as JPG images", icon: <FileText className="text-orange-600" />, bgColor: "bg-orange-100", type: "pdf-to-jpg" },
    { id: "merge-pdf", title: "Merge PDF Files", description: "Combine multiple PDF files into one document", icon: <Layers className="text-blue-600" />, bgColor: "bg-blue-100", type: "merge-pdf" },
    { id: "compress-images", title: "Combine Images", description: "Reduce image file size while maintaining quality", icon: <Combine className="text-green-600" />, bgColor: "bg-green-100", type: "compress-images" },
    { id: "text-to-pdf", title: "Text to PDF Converter", description: "Create PDF documents from plain text", icon: <FileText className="text-indigo-600" />, bgColor: "bg-indigo-100", type: "text-to-pdf" },
    { id: "files-to-zip", title: "Create ZIP Archive", description: "Combine multiple files into a ZIP archive", icon: <FileArchive className="text-yellow-600" />, bgColor: "bg-yellow-100", type: "files-to-zip" },
    { id: "pdf-splitter", title: "PDF Splitter", description: "Extract specific pages from PDF documents", icon: <Scissors className="text-pink-600" />, bgColor: "bg-pink-100", type: "pdf-splitter" },
    { id: "image-resizer", title: "Image Resizer", description: "Resize images with custom dimensions", icon: <Expand className="text-teal-600" />, bgColor: "bg-teal-100", type: "image-resizer" },
    { id: "text-counter", title: "Text & Word Counter", description: "Count words, characters, and analyze text", icon: <Calculator className="text-emerald-600" />, bgColor: "bg-emerald-100", type: "text-counter" },
    { id: "pdf-unlock", title: "PDF Unlock", description: "Remove password protection from PDF files", icon: <Unlock className="text-red-600" />, bgColor: "bg-red-100", type: "pdf-unlock" },
    { id: "docx-to-pdf", title: "DOCX to PDF Converter", description: "Convert Word documents to PDF format", icon: <FileIcon className="text-blue-600" />, bgColor: "bg-blue-100", type: "docx-to-pdf" }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Analytics />
      {/* ... all other sections remain unchanged ... */}

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12" id="faq">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* ... other columns ... */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="/help.html" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/contact.html" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="/privacy.html" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms.html" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/cookies.html" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

           <p>© 2025 Files Nova. All rights reserved. Built with privacy and performance in mind.</p>
        </div>
      </footer>
    </div>
  );
}
