import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Upload,
  File,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Settings,
  User,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Coffee,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import { cn } from './lib/utils';
import { analyzeFile, stripMetadata, type ProcessedFile } from './lib/metadataProcessor';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';

// ── AdSense unit ─────────────────────────────────────────────────────────────

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

function AdUnit({ slot, className }: { slot: string; className?: string }) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !ref.current) return;
    pushed.current = true;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {/* ignore */}
  }, []);

  return (
    <div className={cn('overflow-hidden text-center', className)}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-8643026289824701"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [view, setView] = useState<'main' | 'privacy' | 'terms'>('main');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view !== 'main') {
      window.scrollTo(0, 0);
    }
  }, [view]);

  const handleFiles = useCallback(async (incoming: FileList | File[]) => {
    const list = Array.from(incoming);

    const initial: ProcessedFile[] = list.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'analyzing',
    }));

    setFiles(prev => [...prev, ...initial]);

    for (const pf of initial) {
      try {
        const summary = await analyzeFile(pf.file);
        setFiles(prev =>
          prev.map(f => f.id === pf.id ? { ...f, status: 'ready', summary } : f),
        );
      } catch {
        setFiles(prev =>
          prev.map(f => f.id === pf.id ? { ...f, status: 'error', error: 'Analysis failed' } : f),
        );
      }
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) =>
    setFiles(prev => prev.filter(f => f.id !== id));

  const processFile = async (pf: ProcessedFile) => {
    setFiles(prev => prev.map(f => f.id === pf.id ? { ...f, status: 'processing' } : f));
    try {
      const cleanedBlob = await stripMetadata(pf.file);
      setFiles(prev =>
        prev.map(f => f.id === pf.id ? { ...f, status: 'done', cleanedBlob } : f),
      );
    } catch {
      setFiles(prev =>
        prev.map(f => f.id === pf.id ? { ...f, status: 'error', error: 'Cleaning failed' } : f),
      );
    }
  };

  const downloadFile = (pf: ProcessedFile) => {
    if (!pf.cleanedBlob) return;
    const url = URL.createObjectURL(pf.cleanedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clean_${pf.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasDoneFiles = files.some(f => f.status === 'done');

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">

      {/* Trust banner */}
      <div className="bg-indigo-600 text-white py-2 text-center text-sm font-medium">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          100% Secure: Files are processed entirely in your browser. Nothing is sent to our servers.
        </span>
      </div>

      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 py-6 flex justify-between items-center">
        <button onClick={() => setView('main')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">PrivacyStrip</span>
        </button>
        <div className="flex gap-5 text-sm font-medium text-slate-500">
          {view === 'main' ? (
            <>
              <a href="#how" className="hover:text-indigo-600 transition-colors">How it works</a>
              <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
            </>
          ) : (
            <button onClick={() => setView('main')} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Tool
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pb-16">
        {view === 'main' && (
          <>
            {/* Hero */}
            <div className="text-center mb-12 pt-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-bold tracking-tight mb-4 text-slate-900 leading-[1.1]"
              >
                Clean your metadata.<br />
                <span className="text-indigo-600 italic font-serif">Stay invisible.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
              >
                Remove hidden GPS data, camera settings, and author info from your photos and
                documents — entirely in your browser. Nothing is ever uploaded.
              </motion.p>
            </div>

            {/* Ad — leaderboard above the tool */}
            <AdUnit slot="AUTO" className="mb-8 min-h-[90px] bg-slate-50 rounded-xl" />

            {/* Drop zone */}
            <div
              className={cn(
                'relative group rounded-3xl border-2 border-dashed transition-all duration-300 p-12 text-center cursor-pointer',
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                  : 'border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50/50',
              )}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={e => e.target.files && handleFiles(e.target.files)}
                multiple
                accept="image/*,application/pdf,audio/mpeg,audio/mp3"
              />
              <div className="space-y-4">
                <div className={cn(
                  'mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110',
                  isDragging ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600',
                )}>
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">Drop files here or click to upload</h3>
                  <p className="text-slate-400 mt-1 text-sm">Supports JPEG, PNG, WebP, PDF, MP3</p>
                </div>
              </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-8 space-y-4">
                <AnimatePresence>
                  {files.map(pf => (
                    <FileCard
                      key={pf.id}
                      processedFile={pf}
                      onRemove={() => removeFile(pf.id)}
                      onClean={() => processFile(pf)}
                      onDownload={() => downloadFile(pf)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Ad — shown after files are processed (high-intent moment) */}
            {hasDoneFiles && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <AdUnit slot="AUTO" className="min-h-[250px] bg-slate-50 rounded-xl" />
              </motion.div>
            )}

            {/* How it works */}
            <section id="how" className="mt-24 border-t border-slate-100 pt-16">
              <h2 className="text-3xl font-bold text-slate-800 mb-4 text-center">How PrivacyStrip Works</h2>
              <p className="text-slate-500 text-center max-w-2xl mx-auto mb-12">
                We believe privacy tools should be transparent. Here's exactly how we handle your files
                without ever touching a server.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                <InfoCard
                  icon={<MapPin className="w-5 h-5 text-indigo-600" />}
                  title="Wipe GPS Data"
                  description="Remove precise coordinates from your photos. We use the 'piexifjs' library to surgically remove the EXIF GPS IFD segment from JPEGs without re-encoding the image data."
                />
                <InfoCard
                  icon={<User className="w-5 h-5 text-indigo-600" />}
                  title="Clean PDF Authors"
                  description="Strip author, creator, and producer tags from PDFs. Our tool uses 'pdf-lib' to rebuild the document structure with all metadata fields zeroed out."
                />
                <InfoCard
                  icon={<Settings className="w-5 h-5 text-indigo-600" />}
                  title="Erase Device Info"
                  description="Hide camera model, lens settings, and software tags. For non-JPEG images, we redraw the file onto a canvas to ensure every trace of metadata is discarded."
                />
              </div>

              <div className="mt-12 bg-indigo-50 rounded-3xl p-8 md:p-12">
                <div className="max-w-3xl mx-auto space-y-6">
                  <h3 className="text-2xl font-bold text-slate-900">Why Metadata Matters</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Every time you snap a photo or export a document, hidden data is attached.
                    This <strong>EXIF</strong> (Exchangeable Image File Format) data can include your
                    exact GPS coordinates, the serial number of your camera, and even a thumbnail of
                    the original unedited image.
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    When you share these files on social media or via email, you're often unknowingly
                    sharing your home address or workplace location. PrivacyStrip gives you back
                    control by letting you <strong>clean your files locally</strong> before you hit send.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="bg-white px-4 py-2 rounded-full border border-indigo-100 text-sm font-semibold text-indigo-600 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> 100% Client-Side
                    </div>
                    <div className="bg-white px-4 py-2 rounded-full border border-indigo-100 text-sm font-semibold text-indigo-600 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> No File Storage
                    </div>
                    <div className="bg-white px-4 py-2 rounded-full border border-indigo-100 text-sm font-semibold text-indigo-600 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Open Source Tech
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ / SEO content */}
            <section id="faq" className="mt-20 border-t border-slate-100 pt-16 space-y-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-800 text-center">Frequently Asked Questions</h2>
              <Faq
                q="Does PrivacyStrip upload my files to a server?"
                a="No. Every operation runs entirely inside your web browser using JavaScript. Your files never leave your device and are never sent to any server. This makes it safer than 99% of other online converters."
              />
              <Faq
                q="How do I remove GPS location from an iPhone photo online free?"
                a="Simply drag your JPEG photo into the box above, click Clean File, and download the result. PrivacyStrip surgically removes the GPS EXIF segment without re-compressing the image, preserving original quality."
              />
              <Faq
                q="How do I strip the author name from a PDF without uploading it?"
                a="Drop the PDF file into the tool. PrivacyStrip reads the XMP/DocInfo metadata block using the pdf-lib library and rewrites the document with all author, creator, and producer fields cleared."
              />
              <Faq
                q="Will cleaning metadata reduce image quality?"
                a="For JPEG files, we remove the EXIF header directly without touching pixel data, so quality is preserved at 100%. PNG and WebP files are redrawn via canvas at high quality (92%)."
              />
              <Faq
                q="Is PrivacyStrip free to use?"
                a="Yes, PrivacyStrip is 100% free. We sustain the project through non-intrusive advertisements and optional donations."
              />
            </section>

            {/* Bottom ad */}
            <AdUnit slot="AUTO" className="mt-16 min-h-[90px] bg-slate-50 rounded-xl" />
          </>
        )}

        {view === 'privacy' && <PrivacyPolicy />}
        {view === 'terms' && <TermsOfService />}

      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-800">PrivacyStrip</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              The world's simplest, most private metadata scrubber.
              Local processing means your data stays where it belongs: with you.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://buymeacoffee.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors text-sm font-bold border border-amber-100"
              >
                <Coffee className="w-4 h-4" /> Support the Project
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 md:gap-24">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#how" onClick={() => setView('main')} className="hover:text-indigo-600">How it works</a></li>
                <li><a href="#faq" onClick={() => setView('main')} className="hover:text-indigo-600">FAQ</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><button onClick={() => setView('privacy')} className="hover:text-indigo-600">Privacy Policy</button></li>
                <li><button onClick={() => setView('terms')} className="hover:text-indigo-600">Terms of Service</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-50">
          <div className="flex gap-2 items-center opacity-40">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-semibold">PrivacyStrip {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No Uploads</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Open Source</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Zero Servers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── File Card ─────────────────────────────────────────────────────────────────

function FileCard({
  processedFile: pf,
  onRemove,
  onClean,
  onDownload,
}: {
  processedFile: ProcessedFile;
  onRemove: () => void;
  onClean: () => void;
  onDownload: () => void;
}) {
  const isDone = pf.status === 'done';
  const isProcessing = pf.status === 'processing';
  const isAnalyzing = pf.status === 'analyzing';
  const isError = pf.status === 'error';
  const unsupported =
    isError && pf.error === 'Cleaning failed' &&
    !pf.type.startsWith('image/') &&
    pf.type !== 'application/pdf' &&
    pf.type !== 'audio/mpeg';

  const fileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (type === 'application/pdf') return <FileText className="w-5 h-5" />;
    if (type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex flex-col md:flex-row gap-4 md:items-center">

        {/* File info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
            {fileIcon(pf.type)}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-800 truncate mb-0.5">{pf.name}</h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{(pf.size / 1024).toFixed(1)} KB</span>
              <span>•</span>
              <span className="uppercase tracking-wider">{pf.type.split('/')[1] ?? 'FILE'}</span>
            </div>
          </div>
        </div>

        {/* Metadata insights */}
        <div className="flex-1">
          {isAnalyzing && (
            <span className="flex items-center gap-2 text-slate-400 text-sm italic">
              <span className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin shrink-0" />
              Analyzing risk...
            </span>
          )}
          {!isAnalyzing && pf.summary && (
            <div className="space-y-1.5">
              {pf.summary.risks.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {pf.summary.risks.map((risk, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[11px] font-bold border border-amber-100"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {risk}
                    </span>
                  ))}
                  {pf.summary.rawCount > pf.summary.risks.length + 2 && (
                    <span className="text-[11px] text-slate-400 self-center">
                      +{pf.summary.rawCount - pf.summary.risks.length} more fields
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> No common risks found
                </span>
              )}
              {pf.summary.software && (
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Created with: {pf.summary.software}
                </p>
              )}
            </div>
          )}
          {isError && (
            <span className="text-xs text-rose-500 font-medium">
              {unsupported ? 'File type not yet supported for cleaning' : pf.error}
            </span>
          )}
          {isDone && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> All metadata removed
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRemove}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
            title="Remove file"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          {isDone ? (
            <button
              onClick={onDownload}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Clean File
            </button>
          ) : (
            <button
              disabled={isProcessing || isAnalyzing || isError}
              onClick={onClean}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 border',
                isProcessing
                  ? 'bg-indigo-50 text-indigo-400 border-indigo-100 cursor-not-allowed'
                  : isError
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600',
              )}
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Clean File
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Info Card ─────────────────────────────────────────────────────────────────

function InfoCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

// ── FAQ Item ──────────────────────────────────────────────────────────────────

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-slate-100 pb-6">
      <h3 className="font-semibold text-slate-800 mb-2">{q}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
    </div>
  );
}
