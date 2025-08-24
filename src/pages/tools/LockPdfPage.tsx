
import React, { useState, useEffect, useRef } from 'react';
import PageLayout from '../../components/PageLayout';
import UploadZone from '../../components/UploadZone';
import { ToolSeo } from '../../components/seo/ToolSeo';

// Define the QPDF module interface
declare global {
  interface Window {
    createModule: () => Promise<any>;
  }
}

const LockPdfPage: React.FC = () => {
  const [qpdfModule, setQpdfModule] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLocking, setIsLocking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const userPasswordRef = useRef<HTMLInputElement>(null);
  const ownerPasswordRef = useRef<HTMLInputElement>(null);
  const keyLengthRef = useRef<HTMLSelectElement>(null);

  // Permissions refs
  const allowPrintRef = useRef<HTMLInputElement>(null);
  const allowModifyRef = useRef<HTMLInputElement>(null);
  const allowCopyRef = useRef<HTMLInputElement>(null);
  const allowAnnotationsRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/qpdf/qpdf.js';
    script.onload = () => {
      window.createModule().then((module: any) => {
        setQpdfModule(module);
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleFileSelect = (file: File) => {
    setPdfFile(file);
    setError(null);
  };

  const handleLockPdf = async () => {
    if (!pdfFile || !qpdfModule) {
      setError('Please select a PDF file and wait for the module to load.');
      return;
    }

    setIsLocking(true);
    setError(null);

    try {
      const pdfData = new Uint8Array(await pdfFile.arrayBuffer());
      const userPassword = userPasswordRef.current?.value || '';
      const ownerPassword = ownerPasswordRef.current?.value || '';
      const keyLength = keyLengthRef.current?.value === '256' ? 256 : 128;

      if (!userPassword && !ownerPassword) {
        setError('You must provide at least a user or an owner password.');
        setIsLocking(false);
        return;
      }
      
      const permissions = {
        print: allowPrintRef.current?.checked ? 'y' : 'n',
        modify: allowModifyRef.current?.checked ? 'y' : 'n',
        copy: allowCopyRef.current?.checked ? 'y' : 'n',
        annot: allowAnnotationsRef.current?.checked ? 'y' : 'n',
      };

      const outputPdfData = qpdfModule.encrypt(pdfData, {
        userPassword,
        ownerPassword,
        keyLength,
        permissions,
      });

      const blob = new Blob([outputPdfData], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `locked_${pdfFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (e) {
      console.error(e);
      setError('An error occurred while locking the PDF.');
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <PageLayout>
      <ToolSeo
        title="Lock PDF"
        description="Encrypt and protect your PDF files with a password."
      />
      <div className="text-center">
        <h1 className="text-4xl font-bold">Lock PDF</h1>
        <p className="text-lg mt-2">Encrypt and protect your PDF files with a password.</p>
      </div>

      {!qpdfModule ? (
        <div className="text-center my-8">
          <p>Loading PDF processing module...</p>
        </div>
      ) : (
        <>
          <UploadZone onFileSelect={handleFileSelect} accept={{ 'application/pdf': ['.pdf'] }} />

          {pdfFile && (
            <div className="mt-8 p-6 border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Encryption Options</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="userPassword">User Password (for opening)</label>
                  <input type="password" id="userPassword" ref={userPasswordRef} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label htmlFor="ownerPassword">Owner Password (for permissions)</label>
                  <input type="password" id="ownerPassword" ref={ownerPasswordRef} className="w-full p-2 border rounded" />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="keyLength">Key Length</label>
                <select id="keyLength" ref={keyLengthRef} className="w-full p-2 border rounded">
                  <option value="128">128-bit</option>
                  <option value="256">256-bit</option>
                </select>
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-semibold">Permissions</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div><input type="checkbox" id="allowPrint" ref={allowPrintRef} defaultChecked/> <label htmlFor="allowPrint">Allow Printing</label></div>
                    <div><input type="checkbox" id="allowModify" ref={allowModifyRef} /> <label htmlFor="allowModify">Allow Modify</label></div>
                    <div><input type="checkbox" id="allowCopy" ref={allowCopyRef} /> <label htmlFor="allowCopy">Allow Copying</label></div>
                    <div><input type="checkbox" id="allowAnnotations" ref={allowAnnotationsRef} /> <label htmlFor="allowAnnotations">Allow Annotations</label></div>
                </div>
              </div>

              <button
                onClick={handleLockPdf}
                disabled={isLocking}
                className="mt-6 w-full bg-blue-600 text-white p-3 rounded-lg disabled:bg-gray-400"
              >
                {isLocking ? 'Locking...' : 'Lock PDF'}
              </button>

              {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default LockPdfPage;
