import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FolderOpen, 
  Download, 
  X, 
  GripVertical,
  AlertCircle,
  Info
} from "lucide-react";
import * as fileConverters from "@/lib/fileConverters";
import { trackConversion } from "@/components/Analytics";

interface FileConverterProps {
  type: string;
}

export default function FileConverter({ type }: FileConverterProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>("");
  const [textContent, setTextContent] = useState("");
  const [options, setOptions] = useState<Record<string, any>>({});
  const [textStats, setTextStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    paragraphs: 0,
    readingTime: 0,
    speakingTime: 0
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const updateTextStats = useCallback((text: string) => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).length : 0;
    const readingTime = Math.ceil(words / 200); // 200 words per minute
    const speakingTime = Math.ceil(words / 150); // 150 words per minute

    setTextStats({
      characters,
      charactersNoSpaces,
      words,
      paragraphs,
      readingTime,
      speakingTime
    });
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
    setDownloadUrl(null);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(droppedFiles);
    setDownloadUrl(null);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const processFiles = async () => {
    if (files.length === 0 && type !== 'text-to-pdf' && type !== 'text-counter') {
      toast({
        title: "No files selected",
        description: "Please select files to convert.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      let result;
      
      switch (type) {
        case 'jpg-to-pdf':
          result = await fileConverters.convertImagesToPdf(files, options, setProgress);
          break;
        case 'png-to-pdf':
          result = await fileConverters.convertImagesToPdf(files, options, setProgress);
          break;
        case 'pdf-to-jpg':
          result = await fileConverters.convertPdfToImages(files[0], options, setProgress);
          break;
        case 'merge-pdf':
          result = await fileConverters.mergePdfs(files, setProgress);
          break;
        case 'compress-images':
          result = await fileConverters.compressImages(files, options, setProgress);
          break;
        case 'text-to-pdf':
          result = await fileConverters.convertTextToPdf(textContent, options, setProgress);
          break;
        case 'files-to-zip':
          result = await fileConverters.createZipArchive(files, options.archiveName || 'archive.zip', setProgress);
          break;
        case 'pdf-splitter':
          result = await fileConverters.splitPdf(files[0], options, setProgress);
          break;
        case 'image-resizer':
          result = await fileConverters.resizeImages(files, options, setProgress);
          break;
        case 'pdf-unlock':
          result = await fileConverters.unlockPdf(files[0], options.password, setProgress);
          break;
        case 'docx-to-pdf':
          result = await fileConverters.convertDocxToPdf(files[0], options, setProgress);
          break;
        default:
          throw new Error('Unsupported conversion type');
      }

      if (result) {
        setDownloadUrl(result.url);
        setDownloadFilename(result.filename);
        
        // Track successful conversion
        trackConversion(type, files.length);
        
        toast({
          title: "Conversion completed",
          description: "Your file is ready for download."
        });
      }
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "An error occurred during conversion.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadFile = () => {
    if (downloadUrl && downloadFilename) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderFileUpload = (acceptTypes: string, multiple: boolean = true) => (
    <div 
      className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-primary transition-colors"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Upload className="mx-auto text-4xl text-slate-400 mb-4" size={48} />
      <p className="text-lg font-medium text-slate-600 mb-2">
        {multiple ? 'Drop files here or click to browse' : 'Drop file here or click to browse'}
      </p>
      <p className="text-sm text-slate-500 mb-4">
        {getAcceptDescription(type)}
      </p>
      <Button onClick={() => fileInputRef.current?.click()}>
        <FolderOpen className="mr-2 h-4 w-4" />
        Choose {multiple ? 'Files' : 'File'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );

  const getAcceptDescription = (type: string): string => {
    switch (type) {
      case 'jpg-to-pdf':
        return 'Supports multiple JPG files for batch conversion';
      case 'png-to-pdf':
        return 'Preserves transparency and high quality';
      case 'pdf-to-jpg':
        return 'All pages will be converted to JPG images';
      case 'merge-pdf':
        return 'Drag and drop to reorder files';
      case 'compress-images':
        return 'Supports JPG, PNG, WebP formats';
      case 'files-to-zip':
        return 'Support all file types';
      case 'pdf-splitter':
        return 'Select page ranges to extract';
      case 'image-resizer':
        return 'Supports JPG, PNG, WebP formats';
      case 'pdf-unlock':
        return 'We\'ll attempt to remove the password';
      case 'docx-to-pdf':
        return 'Preserves formatting and layout';
      default:
        return 'Select your files';
    }
  };

  const renderFileList = () => {
    if (files.length === 0) return null;

    return (
      <div className="space-y-2 mb-6">
        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
            <div className="flex items-center space-x-3">
              <GripVertical className="text-slate-400 h-4 w-4" />
              <span className="font-medium">{file.name}</span>
              <span className="text-sm text-slate-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFile(index)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  const renderTypeSpecificOptions = () => {
    switch (type) {
      case 'jpg-to-pdf':
      case 'png-to-pdf':
        return (
          <div className="flex flex-wrap gap-4 mb-6">
            <label className="flex items-center space-x-2">
              <Checkbox 
                checked={options.optimizeForPrint || false}
                onCheckedChange={(checked) => setOptions({...options, optimizeForPrint: checked})}
              />
              <span className="text-sm text-slate-600">Optimize for print quality</span>
            </label>
            <label className="flex items-center space-x-2">
              <Checkbox 
                checked={options.compressOutput || false}
                onCheckedChange={(checked) => setOptions({...options, compressOutput: checked})}
              />
              <span className="text-sm text-slate-600">Compress output PDF</span>
            </label>
          </div>
        );

      case 'pdf-to-jpg':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2">Image Quality</Label>
              <select 
                value={options.quality || 'high'} 
                onChange={(e) => setOptions({...options, quality: e.target.value})}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation"
              >
                <option value="high">High (1200px)</option>
                <option value="medium">Medium (800px)</option>
                <option value="low">Low (400px)</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2">Page Range</Label>
              <Input 
                placeholder="1-5 or 1,3,5" 
                value={options.pageRange || ''}
                onChange={(e) => setOptions({...options, pageRange: e.target.value})}
              />
            </div>
          </div>
        );

      case 'compress-images':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2">Compression Level</Label>
              <Input 
                type="range" 
                min="10" 
                max="100" 
                value={options.quality || 80}
                onChange={(e) => setOptions({...options, quality: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>High Compression</span>
                <span>{options.quality || 80}%</span>
                <span>High Quality</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2">Max File Size (KB)</Label>
              <Input 
                type="number" 
                placeholder="500" 
                value={options.maxSizeKB || ''}
                onChange={(e) => setOptions({...options, maxSizeKB: e.target.value})}
              />
            </div>
          </div>
        );

      case 'text-to-pdf':
        return (
          <>
            <div className="mb-6">
              <Label className="text-sm font-medium text-slate-700 mb-2">Enter your text content</Label>
              <Textarea 
                rows={10}
                placeholder="Type or paste your text here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2">Font Size</Label>
                <select 
                  value={options.fontSize || '12'} 
                  onChange={(e) => setOptions({...options, fontSize: e.target.value})}
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation"
                >
                  <option value="12">12pt</option>
                  <option value="14">14pt</option>
                  <option value="16">16pt</option>
                  <option value="18">18pt</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2">Line Spacing</Label>
                <select 
                  value={options.lineSpacing || 'single'} 
                  onChange={(e) => setOptions({...options, lineSpacing: e.target.value})}
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation"
                >
                  <option value="single">Single</option>
                  <option value="1.5">1.5</option>
                  <option value="double">Double</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2">Margins</Label>
                <select 
                  value={options.margins || 'normal'} 
                  onChange={(e) => setOptions({...options, margins: e.target.value})}
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation"
                >
                  <option value="normal">Normal</option>
                  <option value="narrow">Narrow</option>
                  <option value="wide">Wide</option>
                </select>
              </div>
            </div>
          </>
        );

      case 'files-to-zip':
        return (
          <div className="mb-4">
            <Label className="text-sm font-medium text-slate-700 mb-2">Archive Name</Label>
            <Input 
              placeholder="my-archive.zip" 
              value={options.archiveName || ''}
              onChange={(e) => setOptions({...options, archiveName: e.target.value})}
            />
          </div>
        );

      case 'pdf-splitter':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2">Page Range</Label>
              <Input 
                placeholder="1-5, 10, 15-20" 
                value={options.pageRange || ''}
                onChange={(e) => setOptions({...options, pageRange: e.target.value})}
              />
              <p className="text-xs text-slate-500 mt-1">Examples: 1-5, 10, 15-20 or all</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2">Split Mode</Label>
              <select 
                value={options.splitMode || 'custom'} 
                onChange={(e) => setOptions({...options, splitMode: e.target.value})}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation"
              >
                <option value="custom">Custom Range</option>
                <option value="individual">Individual Pages</option>
                <option value="every">Every N Pages</option>
              </select>
            </div>
          </div>
        );

      case 'image-resizer':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2">Width (px)</Label>
                <Input 
                  type="number" 
                  placeholder="800" 
                  value={options.width || ''}
                  onChange={(e) => setOptions({...options, width: e.target.value})}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2">Height (px)</Label>
                <Input 
                  type="number" 
                  placeholder="600" 
                  value={options.height || ''}
                  onChange={(e) => setOptions({...options, height: e.target.value})}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4 mb-6">
              <label className="flex items-center space-x-2">
                <Checkbox 
                  checked={options.maintainAspectRatio !== false}
                  onCheckedChange={(checked) => setOptions({...options, maintainAspectRatio: checked})}
                />
                <span className="text-sm text-slate-600">Maintain aspect ratio</span>
              </label>
              <label className="flex items-center space-x-2">
                <Checkbox 
                  checked={options.highQuality || false}
                  onCheckedChange={(checked) => setOptions({...options, highQuality: checked})}
                />
                <span className="text-sm text-slate-600">High quality resize</span>
              </label>
            </div>
          </>
        );

      case 'text-counter':
        return (
          <>
            <div className="mb-6">
              <Label className="text-sm font-medium text-slate-700 mb-2">Enter text to analyze</Label>
              <Textarea 
                rows={8}
                placeholder="Type or paste your text here..."
                value={textContent}
                onChange={(e) => {
                  setTextContent(e.target.value);
                  updateTextStats(e.target.value);
                }}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{textStats.characters}</div>
                <div className="text-sm text-slate-500">Characters</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{textStats.charactersNoSpaces}</div>
                <div className="text-sm text-slate-500">Characters (no spaces)</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{textStats.words}</div>
                <div className="text-sm text-slate-500">Words</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{textStats.paragraphs}</div>
                <div className="text-sm text-slate-500">Paragraphs</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-700 mb-2">Reading Time</h4>
                <p className="text-lg font-semibold text-slate-800">{textStats.readingTime} minute{textStats.readingTime !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-700 mb-2">Speaking Time</h4>
                <p className="text-lg font-semibold text-slate-800">{textStats.speakingTime} minute{textStats.speakingTime !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </>
        );

      case 'pdf-unlock':
        return (
          <>
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> This tool can only remove user passwords (open passwords). Owner passwords for editing restrictions require the correct password.
              </AlertDescription>
            </Alert>
            <div className="mb-6">
              <Label className="text-sm font-medium text-slate-700 mb-2">Password (if known)</Label>
              <Input 
                type="password" 
                placeholder="Enter PDF password" 
                value={options.password || ''}
                onChange={(e) => setOptions({...options, password: e.target.value})}
              />
              <p className="text-xs text-slate-500 mt-1">Leave blank to attempt automatic unlock</p>
            </div>
          </>
        );

      case 'docx-to-pdf':
        return (
          <div className="flex flex-wrap gap-4 mb-6">
            <label className="flex items-center space-x-2">
              <Checkbox 
                checked={options.preserveImages !== false}
                onCheckedChange={(checked) => setOptions({...options, preserveImages: checked})}
              />
              <span className="text-sm text-slate-600">Preserve images</span>
            </label>
            <label className="flex items-center space-x-2">
              <Checkbox 
                checked={options.maintainFormatting !== false}
                onCheckedChange={(checked) => setOptions({...options, maintainFormatting: checked})}
              />
              <span className="text-sm text-slate-600">Maintain formatting</span>
            </label>
            <label className="flex items-center space-x-2">
              <Checkbox 
                checked={options.optimizeForWeb || false}
                onCheckedChange={(checked) => setOptions({...options, optimizeForWeb: checked})}
              />
              <span className="text-sm text-slate-600">Optimize for web</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  const getAcceptTypes = () => {
    switch (type) {
      case 'jpg-to-pdf':
        return 'image/jpeg';
      case 'png-to-pdf':
        return 'image/png';
      case 'pdf-to-jpg':
      case 'merge-pdf':
      case 'pdf-splitter':
      case 'pdf-unlock':
        return 'application/pdf';
      case 'compress-images':
      case 'image-resizer':
        return 'image/*';
      case 'files-to-zip':
        return '*/*';
      case 'docx-to-pdf':
        return '.docx';
      default:
        return '*/*';
    }
  };

  const shouldShowFileUpload = () => {
    return type !== 'text-to-pdf' && type !== 'text-counter';
  };

  const getMultipleFiles = () => {
    return ['jpg-to-pdf', 'png-to-pdf', 'merge-pdf', 'compress-images', 'files-to-zip', 'image-resizer'].includes(type);
  };

  const getButtonText = () => {
    switch (type) {
      case 'jpg-to-pdf':
      case 'png-to-pdf':
        return 'Convert to PDF';
      case 'pdf-to-jpg':
        return 'Convert to JPG';
      case 'merge-pdf':
        return 'Merge PDFs';
      case 'compress-images':
        return 'Compress Images';
      case 'text-to-pdf':
        return 'Generate PDF';
      case 'files-to-zip':
        return 'Create ZIP';
      case 'pdf-splitter':
        return 'Split PDF';
      case 'image-resizer':
        return 'Resize Image';
      case 'text-counter':
        return 'Analyze Text';
      case 'pdf-unlock':
        return 'Unlock PDF';
      case 'docx-to-pdf':
        return 'Convert to PDF';
      default:
        return 'Process Files';
    }
  };

  const canProcess = () => {
    if (type === 'text-to-pdf') return textContent.trim().length > 0;
    if (type === 'text-counter') return true; // Always enabled for text counter
    return files.length > 0;
  };

  return (
    <div className="space-y-6">
      {shouldShowFileUpload() && (
        <>
          {renderFileUpload(getAcceptTypes(), getMultipleFiles())}
          {renderFileList()}
        </>
      )}
      
      {renderTypeSpecificOptions()}

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {downloadUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">File ready for download!</p>
              <p className="text-sm text-green-600">{downloadFilename}</p>
            </div>
            <Button onClick={downloadFile} className="bg-green-600 hover:bg-green-700">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      )}

      <Button 
        onClick={processFiles}
        disabled={!canProcess() || isProcessing}
        className="w-full"
      >
        {getButtonText()}
      </Button>
    </div>
  );
}
