import React, { useRef } from 'react';
import { Upload as UploadIcon } from 'lucide-react';

/**
 * UploadZone is a reusable drop-zone component used throughout the Files Nova
 * application. It replicates the modern drag‑and‑drop design seen on the JPG
 * and PNG to PDF converters. By passing a few props you can tailor the
 * accepted file types, whether multiple files are allowed, and the text
 * displayed to the user. On file selection (via click or drop) the
 * `onFilesSelected` callback is invoked with an array of selected files.
 */
export interface UploadZoneProps {
  /**
   * Callback invoked when one or more files have been selected. The callback
   * receives an array of File objects.
   */
  onFilesSelected: (files: File[]) => void;
  /**
   * Comma separated list of accepted MIME types/extensions, e.g. "image/png,image/jpeg".
   * This value is applied to the hidden <input> element.
   */
  accept?: string;
  /**
   * Allow multiple file selection. Defaults to true so the user can select
   * multiple files unless explicitly disabled.
   */
  multiple?: boolean;
  /**
   * Main heading displayed inside the drop zone. Defaults to "Drop your files here".
   */
  title?: string;
  /**
   * Subtitle displayed beneath the main heading. Defaults to
   * "or click to browse from your device".
   */
  subtitle?: string;
  /**
   * Label used on the button at the bottom of the drop zone. Defaults to
   * "Choose Files".
   */
  buttonLabel?: string;
  /**
   * Text describing the supported formats that appears below the button.
   * Defaults to an empty string.
   */
  supportedFormats?: string;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  accept,
  multiple = true,
  title = 'Drop your files here',
  subtitle = 'or click to browse from your device',
  buttonLabel = 'Choose Files',
  supportedFormats = '',
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Helper to handle file selection from the hidden input. Calls the
   * onFilesSelected callback with an array of files.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = e.target.files ? Array.from(e.target.files) : [];
    if (fs.length > 0) {
      onFilesSelected(fs);
    }
    // Reset the input so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  /**
   * Handle files dropped into the drop zone. Prevent default to avoid the
   * browser opening the file. Invoke the callback with the dropped files.
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (dropped.length > 0) {
      onFilesSelected(dropped);
    }
  };

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="mb-6">
        <UploadIcon className="w-16 h-16 mx-auto text-gray-400 group-hover:text-blue-500 group-hover:animate-bounce transition-all" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      {subtitle && <p className="text-gray-600 mb-4">{subtitle}</p>}
      <button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:-translate-y-1">
        {buttonLabel}
      </button>
      {supportedFormats && (
        <p className="text-xs text-gray-500 mt-4">Supported formats: {supportedFormats}</p>
      )}
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
      />
    </div>
  );
};

export default UploadZone;