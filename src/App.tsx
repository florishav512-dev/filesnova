import React from 'react';
import { Route, Routes } from 'react-router-dom';
// Remove Sparkles import since global header removed
import HomePage from './pages/HomePage';
import TextToPdfPage from './pages/tools/TextToPdfPage';
import ImageResizerPage from './pages/tools/ImageResizerPage';
import QrGeneratorPage from './pages/tools/QrGeneratorPage';
import ComingSoonPage from './pages/tools/ComingSoonPage';
import ImageToPdfPage from './pages/tools/ImageToPdfPage';
import JpgToPdfPage from './pages/tools/JpgToPdfPage';
import PngToPdfPage from './pages/tools/PngToPdfPage';
import DocxToPdfPage from './pages/tools/DocxToPdfPage';
// Newly added tool pages
import MarkdownToPdfPage from './pages/tools/MarkdownToPdfPage';
import RtfToDocxPage from './pages/tools/RtfToDocxPage';
import HtmlToPdfPage from './pages/tools/HtmlToPdfPage';
import EpubToPdfPage from './pages/tools/EpubToPdfPage';
import XlsxToCsvPage from './pages/tools/XlsxToCsvPage';
import PptxToPdfPage from './pages/tools/PptxToPdfPage';
import MergePdfPage from './pages/tools/MergePdfPage';
import SplitPdfPage from './pages/tools/SplitPdfPage';
import UnlockPdfPage from './pages/tools/UnlockPdfPage';
import ExtractTextPage from './pages/tools/ExtractTextPage';
import PdfToJpgPage from './pages/tools/PdfToJpgPage';
import CompressImagesPage from './pages/tools/CompressImagesPage';
import WebpConverterPage from './pages/tools/WebpConverterPage';
import SvgToPngPage from './pages/tools/SvgToPngPage';
import GifToMp4Page from './pages/tools/GifToMp4Page';
import BackgroundRemoverPage from './pages/tools/BackgroundRemoverPage';
import CreateZipPage from './pages/tools/CreateZipPage';
import ExtractZipPage from './pages/tools/ExtractZipPage';
import CombineZipsPage from './pages/tools/CombineZipsPage';
import TarToZipPage from './pages/tools/TarToZipPage';
import WordCounterPage from './pages/tools/WordCounterPage';
import CaseConverterPage from './pages/tools/CaseConverterPage';
import QrScannerPage from './pages/tools/QrScannerPage';
// alias for extract images same as pdf to jpg
import ExtractImagesPage from './pages/tools/ExtractImagesPage';
// Support pages
import SupportPage from './pages/SupportPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import HelpPage from './pages/HelpPage';
import ContactPage from './pages/ContactPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import GDPRPage from './pages/GDPRPage';
import TutorialsPage from './pages/TutorialsPage';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Render route contents */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Tools routes */}
          <Route path="/tools/text-to-pdf" element={<TextToPdfPage />} />
          <Route path="/tools/image-resizer" element={<ImageResizerPage />} />
          <Route path="/tools/qr-generator" element={<QrGeneratorPage />} />
          <Route path="/tools/images-to-pdf" element={<ImageToPdfPage />} />
          <Route path="/tools/jpg-to-pdf" element={<JpgToPdfPage />} />
          <Route path="/tools/png-to-pdf" element={<PngToPdfPage />} />
          <Route path="/tools/docx-to-pdf" element={<DocxToPdfPage />} />
        {/* Newly added tool routes */}
        <Route path="/tools/markdown-to-pdf" element={<MarkdownToPdfPage />} />
        <Route path="/tools/rtf-to-docx" element={<RtfToDocxPage />} />
        <Route path="/tools/html-to-pdf" element={<HtmlToPdfPage />} />
        <Route path="/tools/epub-to-pdf" element={<EpubToPdfPage />} />
        <Route path="/tools/xlsx-to-csv" element={<XlsxToCsvPage />} />
        <Route path="/tools/pptx-to-pdf" element={<PptxToPdfPage />} />
        <Route path="/tools/merge-pdfs" element={<MergePdfPage />} />
        <Route path="/tools/split-pdf" element={<SplitPdfPage />} />
        <Route path="/tools/unlock-pdf" element={<UnlockPdfPage />} />
        <Route path="/tools/extract-text" element={<ExtractTextPage />} />
        <Route path="/tools/pdf-to-jpg" element={<PdfToJpgPage />} />
        <Route path="/tools/extract-images" element={<ExtractImagesPage />} />
        <Route path="/tools/compress-images" element={<CompressImagesPage />} />
        <Route path="/tools/webp-converter" element={<WebpConverterPage />} />
        <Route path="/tools/svg-to-png" element={<SvgToPngPage />} />
        <Route path="/tools/gif-to-mp4" element={<GifToMp4Page />} />
        <Route path="/tools/background-remover" element={<BackgroundRemoverPage />} />
        <Route path="/tools/create-zip" element={<CreateZipPage />} />
        <Route path="/tools/extract-zip" element={<ExtractZipPage />} />
        <Route path="/tools/combine-zips" element={<CombineZipsPage />} />
        <Route path="/tools/tar-to-zip" element={<TarToZipPage />} />
        <Route path="/tools/word-counter" element={<WordCounterPage />} />
        <Route path="/tools/case-converter" element={<CaseConverterPage />} />
        <Route path="/tools/qr-scanner" element={<QrScannerPage />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
          {/* Support and legal pages */}
          <Route path="/support" element={<SupportPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/gdpr" element={<GDPRPage />} />
          <Route path="/tutorials" element={<TutorialsPage />} />
          {/* fallback */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
