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
    {
      id: "jpg-to-pdf",
      title: "JPG to PDF Converter",
      description: "Convert JPG images to PDF documents",
      icon: <FileImage className="text-red-600" />,
      bgColor: "bg-red-100",
      type: "jpg-to-pdf"
    },
    {
      id: "png-to-pdf",
      title: "PNG to PDF Converter", 
      description: "Convert PNG images to PDF with transparency support",
      icon: <FileImage className="text-purple-600" />,
      bgColor: "bg-purple-100",
      type: "png-to-pdf"
    },
    {
      id: "pdf-to-jpg",
      title: "PDF to JPG Converter",
      description: "Extract pages from PDF as JPG images",
      icon: <FileText className="text-orange-600" />,
      bgColor: "bg-orange-100", 
      type: "pdf-to-jpg"
    },
    {
      id: "merge-pdf",
      title: "Merge PDF Files",
      description: "Combine multiple PDF files into one document",
      icon: <Layers className="text-blue-600" />,
      bgColor: "bg-blue-100",
      type: "merge-pdf"
    },
    {
      id: "compress-images",
      title: "Combine Images",
      description: "Reduce image file size while maintaining quality",
      icon: <Combine className="text-green-600" />,
      bgColor: "bg-green-100",
      type: "compress-images"
    },
    {
      id: "text-to-pdf",
      title: "Text to PDF Converter",
      description: "Create PDF documents from plain text",
      icon: <FileText className="text-indigo-600" />,
      bgColor: "bg-indigo-100",
      type: "text-to-pdf"
    },
    {
      id: "files-to-zip",
      title: "Create ZIP Archive",
      description: "Combine multiple files into a ZIP archive",
      icon: <FileArchive className="text-yellow-600" />,
      bgColor: "bg-yellow-100",
      type: "files-to-zip"
    },
    {
      id: "pdf-splitter",
      title: "PDF Splitter",
      description: "Extract specific pages from PDF documents",
      icon: <Scissors className="text-pink-600" />,
      bgColor: "bg-pink-100",
      type: "pdf-splitter"
    },
    {
      id: "image-resizer",
      title: "Image Resizer",
      description: "Resize images with custom dimensions",
      icon: <Expand className="text-teal-600" />,
      bgColor: "bg-teal-100",
      type: "image-resizer"
    },
    {
      id: "text-counter",
      title: "Text & Word Counter",
      description: "Count words, characters, and analyze text",
      icon: <Calculator className="text-emerald-600" />,
      bgColor: "bg-emerald-100",
      type: "text-counter"
    },
    {
      id: "pdf-unlock",
      title: "PDF Unlock",
      description: "Remove password protection from PDF files",
      icon: <Unlock className="text-red-600" />,
      bgColor: "bg-red-100",
      type: "pdf-unlock"
    },
    {
      id: "docx-to-pdf",
      title: "DOCX to PDF Converter",
      description: "Convert Word documents to PDF format",
      icon: <FileIcon className="text-blue-600" />,
      bgColor: "bg-blue-100",
      type: "docx-to-pdf"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Analytics />

      {/* Header Ad Placement */}
      <div className="bg-gray-100 border-b border-gray-200 py-2">
        <div className="container mx-auto px-4 flex justify-center">
          <AdSpace slot="header-banner" size="banner" className="mx-auto" />
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Bolt className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Files Nova</h1>
                <p className="text-sm text-slate-500">Free Online File Converter</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#tools" className="text-slate-600 hover:text-primary transition-colors">Tools</a>
              <a href="#features" className="text-slate-600 hover:text-primary transition-colors">Features</a>
              <a href="#faq" className="text-slate-600 hover:text-primary transition-colors">FAQ</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-blue-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Convert Files Instantly</h2>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">No uploads, no registration. All processing happens in your browser.</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base">
            <span className="bg-white/20 px-4 py-2 rounded-full">100% Free</span>
            <span className="bg-white/20 px-4 py-2 rounded-full">Privacy First</span>
            <span className="bg-white/20 px-4 py-2 rounded-full">No File Size Limits</span>
            <span className="bg-white/20 px-4 py-2 rounded-full">Instant Processing</span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 order-2 lg:order-1">
            <div className="sticky top-8">
              <div className="mb-6 flex justify-center">
                <AdSpace slot="sidebar-rectangle" size="rectangle" />
              </div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-800 mb-4">Quick Tools</h3>
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left"
                      onClick={() => scrollToTool('jpg-to-pdf')}
                    >
                      <FileImage className="mr-2 h-4 w-4" />
                      JPG to PDF
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left"
                      onClick={() => scrollToTool('merge-pdf')}
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Merge PDFs
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left"
                      onClick={() => scrollToTool('compress-images')}
                    >
                      <Combine className="mr-2 h-4 w-4" />
                      Combine Images
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left"
                      onClick={() => scrollToTool('text-counter')}
                    >
                      <Calculator className="mr-2 h-4 w-4" />
                      Text Counter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 order-1 lg:order-2" id="tools">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">File Conversion Tools</h2>
              <p className="text-slate-600">Choose from our comprehensive suite of file conversion tools. All processing happens locally in your browser for maximum privacy and speed.</p>
            </div>

            {/* Tools Grid */}
            <div className="space-y-6">
              {tools.map((tool) => (
                <ToolSection
                  key={tool.id}
                  tool={tool}
                  isOpen={openTool === tool.id}
                  onToggle={() => toggleTool(tool.id)}
                />
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Features Section */}
      <section className="bg-white py-16" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Why Choose Files Nova?</h2>
            <p className="text-xl text-slate-600">Powerful file conversion tools with privacy and speed in mind</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">100% Private</h3>
              <p className="text-slate-600">All conversions happen in your browser. Files never leave your device.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bolt className="text-accent" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Lightning Fast</h3>
              <p className="text-slate-600">No upload delays or server processing. Instant results every time.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Infinity className="text-orange-500" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Limits</h3>
              <p className="text-slate-600">Convert unlimited files with no size restrictions or usage caps.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="text-purple-500" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Mobile Ready</h3>
              <p className="text-slate-600">Works perfectly on all devices - desktop, tablet, and mobile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Ad Placement */}
      <div className="bg-gray-100 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 flex justify-center">
          <AdSpace slot="footer-leaderboard" size="leaderboard" />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12" id="faq">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Bolt className="text-white" size={16} />
                </div>
                <h3 className="text-xl font-bold">Files Nova</h3>
              </div>
              <p className="text-slate-400 mb-4">The fastest and most secure way to convert files online. All processing happens in your browser for maximum privacy.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Twitter size={20} />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Conversion Tools</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => scrollToTool('jpg-to-pdf')} className="hover:text-white transition-colors">JPG to PDF</button></li>
                <li><button onClick={() => scrollToTool('png-to-pdf')} className="hover:text-white transition-colors">PNG to PDF</button></li>
                <li><button onClick={() => scrollToTool('pdf-to-jpg')} className="hover:text-white transition-colors">PDF to JPG</button></li>
                <li><button onClick={() => scrollToTool('merge-pdf')} className="hover:text-white transition-colors">Merge PDFs</button></li>
                <li><button onClick={() => scrollToTool('compress-images')} className="hover:text-white transition-colors">Combine Images</button></li>
                <li><button onClick={() => scrollToTool('docx-to-pdf')} className="hover:text-white transition-colors">DOCX to PDF</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Utility Tools</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => scrollToTool('text-to-pdf')} className="hover:text-white transition-colors">Text to PDF</button></li>
                <li><button onClick={() => scrollToTool('files-to-zip')} className="hover:text-white transition-colors">Create ZIP</button></li>
                <li><button onClick={() => scrollToTool('pdf-splitter')} className="hover:text-white transition-colors">Split PDF</button></li>
                <li><button onClick={() => scrollToTool('image-resizer')} className="hover:text-white transition-colors">Resize Images</button></li>
                <li><button onClick={() => scrollToTool('text-counter')} className="hover:text-white transition-colors">Text Counter</button></li>
                <li><button onClick={() => scrollToTool('pdf-unlock')} className="hover:text-white transition-colors">Unlock PDF</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="border-t border-slate-700 pt-8">
            <h3 className="text-2xl font-bold mb-6">Frequently Asked Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Is Files Nova completely free to use?</h4>
                <p className="text-slate-400 text-sm">Yes, all file conversion tools on Files Nova are completely free with no hidden charges. We're supported by ads to keep the service free for everyone.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Are my files safe and private?</h4>
                <p className="text-slate-400 text-sm">Absolutely. All file processing happens directly in your browser using JavaScript. Your files never leave your device or get uploaded to our servers.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">What file formats do you support?</h4>
                <p className="text-slate-400 text-sm">We support all major file formats including PDF, JPG, PNG, DOCX, TXT, and ZIP. Our tools can handle most common conversion needs.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Is there a file size limit?</h4>
                <p className="text-slate-400 text-sm">Since processing happens in your browser, the only limit is your device's available memory. Most modern devices can handle files up to several hundred MB.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Do I need to install any software?</h4>
                <p className="text-slate-400 text-sm">No installation required! Files Nova works entirely in your web browser. Just visit our website and start converting files immediately.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Can I use Files Nova on mobile devices?</h4>
                <p className="text-slate-400 text-sm">Yes, Files Nova is fully responsive and works great on smartphones and tablets. All features are optimized for mobile use.</p>
              </div>
            </div>
          </div>

          {/* SEO Content */}
          <div className="border-t border-slate-700 pt-8 mt-8">
            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl font-bold mb-4">About Files Nova - Your Ultimate File Conversion Solution</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Files Nova is the most comprehensive online file conversion platform that prioritizes your privacy and delivers lightning-fast results. Unlike traditional online converters that require uploading your files to remote servers, Files Nova processes everything locally in your browser using advanced JavaScript libraries including jsPDF, pdf-lib, browser-image-compression, and more.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Our extensive suite of tools covers every major file conversion need: convert images to PDF, merge and split PDF documents, compress images without quality loss, create ZIP archives, resize images with precision, count words and characters, unlock password-protected PDFs, and convert DOCX documents to PDF format. Whether you're a student, professional, or casual user, Files Nova provides the tools you need without compromising your data security.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Built with modern web technologies and optimized for all devices, Files Nova works seamlessly on desktop computers, tablets, and smartphones. No registration required, no software downloads, and no file size limitations - just fast, secure, and reliable file conversions whenever you need them. Join millions of users who trust Files Nova for their daily file conversion needs.
              </p>
            </div>
          </div>

          <Separator className="my-8 bg-slate-700" />
          <div className="text-center text-slate-400">
            <p>© 2024 Files Nova. All rights reserved. Built with privacy and performance in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
