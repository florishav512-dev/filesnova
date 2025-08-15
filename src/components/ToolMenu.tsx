// src/components/ToolsMenu.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Archive,
  QrCode,
  Layers,
  Scissors,
  Unlock,
  Wrench,
  Type as TypeIcon,
} from "lucide-react";

type ToolLink = { name: string; href: string; icon?: React.ComponentType<any> };
type ToolSection = { title: string; items: ToolLink[] };

/** ----- Catalog: edit here to add/remove tools ----- */
const TOOLS_CATALOG: ToolSection[] = [
  {
    title: "Convert to PDF",
    items: [
      { name: "Word to PDF", href: "/tools/docx-to-pdf", icon: FileText },
      { name: "PowerPoint to PDF", href: "/tools/pptx-to-pdf", icon: FileText },
      { name: "JPG to PDF", href: "/tools/jpg-to-pdf", icon: ImageIcon },
      { name: "PNG to PDF", href: "/tools/png-to-pdf", icon: ImageIcon },
      { name: "Images to PDF", href: "/tools/images-to-pdf", icon: ImageIcon },
      { name: "Markdown to PDF", href: "/tools/markdown-to-pdf", icon: FileText },
      { name: "Text to PDF", href: "/tools/text-to-pdf", icon: FileText },
      { name: "HTML to PDF", href: "/tools/html-to-pdf", icon: FileText },
      { name: "EPUB to PDF", href: "/tools/epub-to-pdf", icon: FileText },
    ],
  },
  {
    title: "Convert from / between",
    items: [
      { name: "PDF to JPG", href: "/tools/pdf-to-jpg", icon: ImageIcon },
      { name: "SVG to PNG", href: "/tools/svg-to-png", icon: ImageIcon },
      { name: "WEBP Converter", href: "/tools/webp-converter", icon: ImageIcon },
      { name: "GIF to MP4", href: "/tools/gif-to-mp4", icon: ImageIcon },
      { name: "XLSX to CSV", href: "/tools/xlsx-to-csv", icon: FileText },
      { name: "RTF to DOCX", href: "/tools/rtf-to-docx", icon: FileText },
      { name: "Image to PDF", href: "/tools/image-to-pdf", icon: ImageIcon },
    ],
  },
  {
    title: "Merge & Split",
    items: [
      { name: "Merge PDF", href: "/tools/merge-pdf", icon: Layers },
      { name: "Split PDF", href: "/tools/split-pdf", icon: Scissors },
      { name: "Create ZIP", href: "/tools/create-zip", icon: Archive },
      { name: "Combine ZIPs", href: "/tools/combine-zips", icon: Archive },
      { name: "Extract ZIP", href: "/tools/extract-zip", icon: Archive },
    ],
  },
  {
    title: "PDF Tools",
    items: [
      { name: "Extract Images", href: "/tools/extract-images", icon: ImageIcon },
      { name: "Extract Text (OCR)", href: "/tools/extract-text", icon: FileText },
      { name: "Unlock PDF", href: "/tools/unlock-pdf", icon: Unlock },
    ],
  },
  {
    title: "Images & QR",
    items: [
      { name: "Compress Images", href: "/tools/compress-image", icon: ImageIcon },
      { name: "Image Resizer", href: "/tools/image-resizer", icon: ImageIcon },
      { name: "Background Remover", href: "/tools/background-remover", icon: Wrench },
      { name: "QR Generator", href: "/tools/qr-generator", icon: QrCode },
      { name: "QR Scanner", href: "/tools/qr-scanner", icon: QrCode },
    ],
  },
  {
    title: "Text Utilities",
    items: [
      { name: "Case Converter", href: "/tools/case-converter", icon: TypeIcon },
      { name: "Word Counter", href: "/tools/word-counter", icon: FileText },
    ],
  },
];

type ToolsMenuProps = {
  className?: string; // optional: extra classes for the button wrapper
};

const ToolsMenu: React.FC<ToolsMenuProps> = ({ className = "" }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className={`ml-auto ${className}`}>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
      >
        Tools <ChevronDown className="w-4 h-4 ml-2" />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          className="fixed right-4 top-20 w-[1000px] max-w-[96vw] max-h-[75vh] overflow-auto z-[100] bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS_CATALOG.map((sec) => (
              <div key={sec.title}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {sec.title}
                </h4>
                <ul className="space-y-2">
                  {sec.items.map((item) => {
                    const Icon = item.icon ?? FileText;
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setOpen(false)}
                          className="group flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <span className="flex items-center gap-2 text-sm text-gray-800 group-hover:text-gray-900">
                            <Icon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                            {item.name}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsMenu;
