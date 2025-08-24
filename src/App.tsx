import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
// Remove Sparkles import since global header removed
const HomePage = React.lazy(() => import('./pages/HomePage'));
const TextToPdfPage = React.lazy(() => import('./pages/tools/TextToPdfPage'));
const ImageResizerPage = React.lazy(() => import('./pages/tools/ImageResizerPage'));
const QrGeneratorPage = React.lazy(() => import('./pages/tools/QrGeneratorPage'));
const ComingSoonPage = React.lazy(() => import('./pages/tools/ComingSoonPage'));
const ImageToPdfPage = React.lazy(() => import('./pages/tools/ImageToPdfPage'));
const JpgToPdfPage = React.lazy(() => import('./pages/tools/JpgToPdfPage'));
const PngToPdfPage = React.lazy(() => import('./pages/tools/PngToPdfPage'));
const DocxToPdfPage = React.lazy(() => import('./pages/tools/DocxToPdfPage'));
// Newly added tool pages
const MarkdownToPdfPage = React.lazy(() => import('./pages/tools/MarkdownToPdfPage'));
const RtfToDocxPage = React.lazy(() => import('./pages/tools/RtfToDocxPage'));
const HtmlToPdfPage = React.lazy(() => import('./pages/tools/HtmlToPdfPage'));
const EpubToPdfPage = React.lazy(() => import('./pages/tools/EpubToPdfPage'));
const XlsxToCsvPage = React.lazy(() => import('./pages/tools/XlsxToCsvPage'));
const PptxToPdfPage = React.lazy(() => import('./pages/tools/PptxToPdfPage'));
const MergePdfPage = React.lazy(() => import('./pages/tools/MergePdfPage'));
const SplitPdfPage = React.lazy(() => import('./pages/tools/SplitPdfPage'));
const UnlockPdfPage = React.lazy(() => import('./pages/tools/UnlockPdfPage'));
const ExtractTextPage = React.lazy(() => import('./pages/tools/ExtractTextPage'));
const PdfToJpgPage = React.lazy(() => import('./pages/tools/PdfToJpgPage'));
const CompressImagesPage = React.lazy(() => import('./pages/tools/CompressImagesPage'));
const WebpConverterPage = React.lazy(() => import('./pages/tools/WebpConverterPage'));
const SvgToPngPage = React.lazy(() => import('./pages/tools/SvgToPngPage'));
const GifToMp4Page = React.lazy(() => import('./pages/tools/GifToMp4Page'));
const BackgroundRemoverPage = React.lazy(() => import('./pages/tools/BackgroundRemoverPage'));
const CreateZipPage = React.lazy(() => import('./pages/tools/CreateZipPage'));
const ExtractZipPage = React.lazy(() => import('./pages/tools/ExtractZipPage'));
const CombineZipsPage = React.lazy(() => import('./pages/tools/CombineZipsPage'));
const TarToZipPage = React.lazy(() => import('./pages/tools/TarToZipPage'));
const WordCounterPage = React.lazy(() => import('./pages/tools/WordCounterPage'));
const CaseConverterPage = React.lazy(() => import('./pages/tools/CaseConverterPage'));
const QrScannerPage = React.lazy(() => import('./pages/tools/QrScannerPage'));
const LockPdfPage = React.lazy(() => import('./pages/tools/LockPdfPage'));
// alias for extract images same as pdf to jpg
const ExtractImagesPage = React.lazy(() => import('./pages/tools/ExtractImagesPage'));
// Support pages
const SupportPage = React.lazy(() => import('./pages/SupportPage'));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const HelpPage = React.lazy(() => import('./pages/HelpPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const CookiePolicyPage = React.lazy(() => import('./pages/CookiePolicyPage'));
const GDPRPage = React.lazy(() => import('./pages/GDPRPage'));
const TutorialsPage = React.lazy(() => import('./pages/TutorialsPage'));

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Render route contents */}
      <main className="flex-1">
        <Suspense fallback={<div />}>\n<Routes>
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
        <Route path="/tools/lock-pdf" element={<LockPdfPage />} />
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
        </Routes>\n</Suspense>
      </main>
    </div>
  );
};

export default App;
