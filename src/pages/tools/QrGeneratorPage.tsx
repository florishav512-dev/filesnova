// src/pages/tools/QrGeneratorPage.tsx
import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import ToolSeo from "../../components/seo/ToolSeo";
import { TOOL_SEO_DATA } from "../../components/seo/toolSeoData";
import AdSpace from "../../components/AdSpace";
import {
  Sparkles,
  QrCode,
  Shield,
  Zap,
  Star,
  Download as DownloadIcon,
  Settings,
  Image as ImageIcon,
} from "lucide-react";
import ToolsMenu from "../../components/ToolsMenu";
import FileNovaIcon from '../../assets/FILESNOVANEWICON.png';
import FileNovaIconWebp from '../../assets/FILESNOVANEWICON.webp';

type ECL = "L" | "M" | "Q" | "H";
type Format = "png" | "svg";

const SEO_KEY = "/tools/qr-generator";

const QrGeneratorPage: React.FC = () => {
  const [input, setInput] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔧 Defaulted for top scan reliability out of the box
  const [size, setSize] = useState<number>(768);          // was 512
  const [margin, setMargin] = useState<number>(4);        // was 2 (quiet zone)
  const [level, setLevel] = useState<ECL>("H");           // was "M"
  const [dark, setDark] = useState<string>("#000000");    // pure black
  const [light, setLight] = useState<string>("#ffffff");
  const [fmt, setFmt] = useState<Format>("png");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Optional logo overlay (PNG/JPG)
  const [logo, setLogo] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const seo =
    TOOL_SEO_DATA?.[SEO_KEY] ?? {
      title: "QR Code Generator – Create QR Codes Online | FilesNova",
      description:
        "Generate QR codes from text or URLs instantly. Free, fast, and secure QR code generator by FilesNova.",
      canonical: "https://filesnova.com/tools/qr-generator",
      breadcrumbs: [
        { name: "Home", item: "https://filesnova.com/" },
        { name: "Tools", item: "https://filesnova.com/tools" },
        { name: "QR Code Generator", item: "https://filesnova.com/tools/qr-generator" },
      ],
      additionalJsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "QR Code Generator – Files Nova",
          url: "https://filesnova.com/tools/qr-generator",
          applicationCategory: "Utility",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      ],
    };

  // Load & save preferences
  useEffect(() => {
    try {
      const raw = localStorage.getItem("fn_qr_settings");
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.size === "number") setSize(s.size);
      if (typeof s.margin === "number") setMargin(s.margin);
      if (s.level) setLevel(s.level);
      if (s.dark) setDark(s.dark);
      if (s.light) setLight(s.light);
      if (s.fmt) setFmt(s.fmt);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        "fn_qr_settings",
        JSON.stringify({ size, margin, level, dark, light, fmt })
      );
    } catch {}
  }, [size, margin, level, dark, light, fmt]);

  // Normalize common inputs (e.g., "example.com" → "https://example.com")
  const normalizeInput = (raw: string) => {
    const s = raw.trim();
    if (!s) return s;
    const looksLikeDomain = /^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(s);
    const hasScheme = /^[a-z][a-z0-9+.-]*:/.test(s);
    if (looksLikeDomain && !hasScheme) return `https://${s}`;
    return s;
  };

  const generateQr = async () => {
    const payload = normalizeInput(input);
    if (!payload) return;

    setIsGenerating(true);
    setError(null);
    setSvgMarkup(null);
    setQrUrl(null);

    try {
      if (fmt === "png") {
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        await QRCode.toCanvas(canvas, payload, {
          errorCorrectionLevel: level,
          margin,
          width: size,
          color: { dark, light },
        });

        // Optional center logo overlay (≈18% of QR size)
        if (logo) {
          const url = URL.createObjectURL(logo);
          const img = new Image();
          (img as any).decoding = "async";
          img.src = url;
          await img.decode();
          const logoSize = Math.round(size * 0.18);
          const x = Math.round((size - logoSize) / 2);
          const y = Math.round((size - logoSize) / 2);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas rendering not supported.");
          const r = Math.max(6, Math.floor(logoSize * 0.12));
          ctx.fillStyle = "#ffffff";
          roundRect(ctx, x - 8, y - 8, logoSize + 16, logoSize + 16, r);
          ctx.fill();
          ctx.drawImage(img, x, y, logoSize, logoSize);
          URL.revokeObjectURL(url);
        }

        const dataUrl = canvas.toDataURL("image/png");
        setQrUrl(dataUrl);
      } else {
        const svg = await QRCode.toString(payload, {
          type: "svg",
          errorCorrectionLevel: level,
          margin,
          color: { dark, light },
          width: size,
        });
        setSvgMarkup(svg);
        const blob = new Blob([svg], { type: "image/svg+xml" });
        setQrUrl(URL.createObjectURL(blob));
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate QR code. Please check your input and try again.");
      setQrUrl(null);
      setSvgMarkup(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyPreset = (type: "url" | "wifi" | "vcard" | "sms") => {
    if (type === "url") setInput("https://example.com");
    if (type === "wifi") setInput("WIFI:T:WPA;S:YourSSID;P:YourPassword;H:false;;");
    if (type === "vcard")
      setInput(
        [
          "BEGIN:VCARD",
          "VERSION:3.0",
          "N:Doe;John;;;",
          "FN:John Doe",
          "ORG:Example Inc.",
          "TEL;TYPE=CELL:+15551234567",
          "EMAIL:john.doe@example.com",
          "URL:https://example.com",
          "END:VCARD",
        ].join("\n")
      );
    if (type === "sms") setInput("SMSTO:+15551234567:Hello from FilesNova QR!");
  };

  return (
    <>
      <ToolSeo {...seo} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden pt-24">
        {/* Background Pulses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header (no back arrow; TOOLS on the right) */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-20 gap-">
              <div className="relative shrink-0">
                <picture>
                  <source srcSet={FileNovaIcon} type="image/webp" />
                  <source srcSet={FileNovaIcon} type="image/png" />
                  <img
                    src={FileNovaIcon}
                    alt="Files Nova"
                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                    draggable={false}
                    loading="lazy"
                    width="96"
                    height="96"
                  />
                </picture>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Files Nova
                </h1>
                <p className="text-xs text-gray-500 font-medium">QR Generator</p>
              </div>
              <div className="ml-auto">
                <ToolsMenu />
              </div>
            </div>
          </div>
        </header>
        {/* Main content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          {/* Tool Header */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">QR Code Generator</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Create QR codes from text or URLs instantly.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                  <Shield className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium">100% Secure</span>
                </div>
                <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                  <Zap className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-sm font-medium">Lightning Fast</span>
                </div>
                <div className="flex items-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                  <Star className="w-4 h-4 mr-2 text-purple-600" />
                  <span className="text-sm font-medium">Premium Quality</span>
                </div>
              </div>
            </div>
          </div>

            {/* Input & Generate */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">1. Enter Text or URL</h3>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => applyPreset("url")} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">URL</button>
                <button onClick={() => applyPreset("wifi")} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">Wi-Fi</button>
                <button onClick={() => applyPreset("vcard")} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">vCard</button>
                <button onClick={() => applyPreset("sms")} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">SMS</button>
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text or URL"
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl focus:border-blue-500 outline-none bg-white/60 backdrop-blur-sm mb-4"
              />

              {/* Advanced */}
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-white/70 hover:bg-white transition mb-4"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? "Hide" : "Show"} Advanced Options
              </button>

              {showAdvanced && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Size (px)</label>
                    <input
                      type="number"
                      min={128}
                      max={2048}
                      step={32}
                      value={size}
                      onChange={(e) => setSize(Math.min(2048, Math.max(128, parseInt(e.target.value) || 768)))}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Margin</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={margin}
                      onChange={(e) => setMargin(Math.min(10, Math.max(0, parseInt(e.target.value) || 4)))}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Error Correction</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value as ECL)}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    >
                      <option value="L">L (Low)</option>
                      <option value="M">M (Medium)</option>
                      <option value="Q">Q (Quartile)</option>
                      <option value="H">H (High)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Dark Color</label>
                    <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} className="h-10 w-14 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Light Color</label>
                    <input type="color" value={light} onChange={(e) => setLight(e.target.value)} className="h-10 w-14 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Output Format</label>
                    <select value={fmt} onChange={(e) => setFmt(e.target.value as Format)} className="w-full p-2 rounded-lg border border-gray-300 bg-white">
                      <option value="png">PNG (with logo)</option>
                      <option value="svg">SVG (vector)</option>
                    </select>
                  </div>

                  {/* Logo uploader (PNG only) */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm text-gray-700 mb-1">Center Logo (optional, PNG/JPG)</label>
                    <label className="flex items-center gap-3 px-3 py-2 rounded-xl border border-dashed border-gray-300 hover:border-blue-400 cursor-pointer bg-white/60">
                      <ImageIcon className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-700">{logo ? logo.name : "Choose an image…"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => setLogo(e.target.files?.[0] || null)}
                        disabled={fmt === "svg"}
                      />
                    </label>
                    {fmt === "svg" && <p className="text-xs text-gray-500 mt-1">Logo overlay is available for PNG output.</p>}
                  </div>
                </div>
              )}

              {error && <p className="text-red-600 mb-4">{error}</p>}

              <div className="mt-4">
                {isGenerating ? (
                  <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: "100%" }}></div>
                  </div>
                ) : (
                  <button
                    onClick={generateQr}
                    disabled={!input.trim()}
                    className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate QR Code
                  </button>
                )}
              </div>
            </div>

          {/* Result & Download */}
          {(qrUrl || svgMarkup) && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Download</h3>

              <div className="mb-4">
                {fmt === "png" ? (
                  <canvas ref={canvasRef} width={size} height={size} className="mx-auto rounded-xl shadow" />
                ) : (
                  svgMarkup && (
                    <div className="inline-block mx-auto" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
                  )
                )}
              </div>

              {qrUrl && (
                <a
                  href={qrUrl}
                  download={`qrcode.${fmt === "svg" ? "svg" : "png"}`}
                  className="inline-flex items-center justify-center w-full px-4 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" /> Download QR Code
                </a>
              )}
            </div>
          )}

          {/* Hidden canvas (ensures a node exists for PNG render) */}
          {!canvasRef.current && <canvas ref={canvasRef} className="hidden" />}

          <AdSpace />
        </div>
      </div>
    </>
  );
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export default QrGeneratorPage;
