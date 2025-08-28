// Use our custom qpdf loader instead of bundling @jspawn/qpdf-wasm directly.
import type { QpdfModule } from '../../lib/qpdf';
import { getQpdf } from '../../lib/qpdf';
import React, { useState, useRef } from 'react';
import PageLayout from '../../components/PageLayout';
import { ToolSeo } from '../../components/seo/ToolSeo';
import UploadZone from '../../components/UploadZone';

// qpdf is now loaded via the dynamic loader in `src/lib/qpdf.ts`.

const LockPdfPage: React.FC = () => {
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


  const handleFileSelect = (file: File) => {
    setPdfFile(file);
    setError(null);
  };

  const handleLockPdf = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file.');
      return;
    }

    setIsLocking(true);
    setError(null);

    try {
      const qpdf = await getQpdf();
      const pdfData = new Uint8Array(await pdfFile.arrayBuffer());
      const userPassword = userPasswordRef.current?.value || '';
      const ownerPassword = ownerPasswordRef.current?.value || '';
      const keyLength = keyLengthRef.current?.value === '256' ? '256' : '128';

      if (!userPassword && !ownerPassword) {
        setError('You must provide at least a user or an owner password.');
        setIsLocking(false);
        return;
      }
      
      // Build qpdf command-line arguments.  Modern versions of qpdf
      // use granular permission flags instead of a single --allow list.
      // We translate the UI toggles into qpdf flags as follows:
      //  - Print allowed => --print=full, otherwise --print=none
      //  - Modify allowed => --modify=all, otherwise --modify=none
      //  - Copy allowed => --extract=y, otherwise --extract=n
      //  - Annotate allowed => --annotate=y, otherwise --annotate=n
      const inName = 'input.pdf';
      const outName = 'locked.pdf';

      const args: string[] = [
        '--encrypt',
        userPassword,
        ownerPassword,
        keyLength,
        // print permission
        `--print=${allowPrintRef.current?.checked ? 'full' : 'none'}`,
        // modify permission
        allowModifyRef.current?.checked ? '--modify=all' : '--modify=none',
        // copy/extract permission
        `--extract=${allowCopyRef.current?.checked ? 'y' : 'n'}`,
        // annotation permission
        `--annotate=${allowAnnotationsRef.current?.checked ? 'y' : 'n'}`,
      ];

      // For 256-bit encryption an empty owner password normally requires
      // --allow-insecure; include it only when ownerPassword is blank.
      if (keyLength === '256' && !ownerPassword) {
        args.push('--allow-insecure');
      }
      // The -- separator tells qpdf that argument parsing is finished and the
      // next two arguments are the input and output filenames.
      args.push('--', inName, outName);

      const result = await qpdf.run(args, { [inName]: pdfData });

      // Guard: ensure result is defined and has exitCode
      if (!result || typeof result.exitCode !== 'number') {
        setError('QPDF engine failed to return a result. Make sure the wasm file at /qpdf/qpdf.wasm loads correctly.');
        setIsLocking(false);
        return;
      }

      if (result.exitCode !== 0) {
        // When qpdf returns non-zero, surface last few stderr lines for debugging
        const msgLines = result.stderr?.split('\n') || [];
        const hint = msgLines.slice(-8).join('\n');
        console.error('qpdf stderr:', result.stderr);
        setError(hint || 'qpdf failed to process the file.');
        setIsLocking(false);
        return;
      }

      const outputPdfData = result.files[outName];
      if (!outputPdfData) {
        const msgLines = result.stderr?.split('\n') || [];
        const hint = msgLines.slice(-8).join('\n');
        setError(hint || 'qpdf did not produce an output file.');
        setIsLocking(false);
        return;
      }

      const blob = new Blob([outputPdfData], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `locked_${pdfFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An error occurred while locking the PDF.');
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
              disabled={isLocking || !pdfFile}
              className="mt-6 w-full bg-blue-600 text-white p-3 rounded-lg disabled:bg-gray-400"
            >
              {isLocking ? 'Locking...' : 'Lock PDF'}
            </button>

            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        )}
      </>
    </PageLayout>
  );
};

export default LockPdfPage;