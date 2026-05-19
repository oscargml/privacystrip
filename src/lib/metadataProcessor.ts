import { load as piexifLoad, remove as piexifRemove } from 'piexifjs';
import { PDFDocument } from 'pdf-lib';

export interface MetadataSummary {
  risks: string[];
  rawCount: number;
  software?: string;
}

export interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  status: 'analyzing' | 'ready' | 'processing' | 'done' | 'error';
  summary?: MetadataSummary;
  cleanedBlob?: Blob;
  error?: string;
}

// EXIF tag IDs
const TAG_MAKE = 271;
const TAG_MODEL = 272;
const TAG_SOFTWARE = 305;
const TAG_ARTIST = 315;
const TAG_DATETIME = 306;
const TAG_GPS = 34853;

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function analyzeJPEG(file: File): Promise<MetadataSummary> {
  const risks: string[] = [];
  let rawCount = 0;
  let software: string | undefined;

  try {
    const dataURL = await readAsDataURL(file);
    const exif = piexifLoad(dataURL);

    const zeroth = exif['0th'] ?? {};
    const gps = exif['GPS'] ?? {};
    const exifIfd = exif['Exif'] ?? {};

    rawCount =
      Object.keys(zeroth).length +
      Object.keys(gps).length +
      Object.keys(exifIfd).length;

    if (Object.keys(gps).length > 0) risks.push('GPS Location');
    if (zeroth[TAG_MAKE] || zeroth[TAG_MODEL]) risks.push('Camera Model');
    if (zeroth[TAG_ARTIST]) risks.push('Author/Artist');
    if (zeroth[TAG_DATETIME]) risks.push('Timestamp');

    const sw = zeroth[TAG_SOFTWARE];
    if (sw) {
      software = String(sw);
      risks.push('Software Tag');
    }

    // GPSInfo pointer present but GPS IFD was empty in some encoders
    if (!risks.includes('GPS Location') && zeroth[TAG_GPS]) {
      risks.push('GPS Location');
    }
  } catch {
    // No readable EXIF
  }

  return { risks, rawCount, software };
}

async function analyzePDF(file: File): Promise<MetadataSummary> {
  const risks: string[] = [];
  let rawCount = 0;
  let software: string | undefined;

  try {
    const buffer = await readAsArrayBuffer(file);
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

    const check = (val: string | undefined, label: string) => {
      if (val && val.trim()) { risks.push(label); rawCount++; }
    };

    check(pdf.getAuthor(), 'Author Name');
    check(pdf.getTitle(), 'Document Title');
    check(pdf.getSubject(), 'Subject');
    check(pdf.getKeywords(), 'Keywords');

    const creator = pdf.getCreator();
    if (creator?.trim()) { software = creator; risks.push('Creation Software'); rawCount++; }

    const producer = pdf.getProducer();
    if (producer?.trim()) rawCount++;
  } catch {
    // Encrypted or malformed PDF
  }

  return { risks, rawCount, software };
}

function analyzeGenericImage(): MetadataSummary {
  return { risks: ['Possible embedded tags'], rawCount: 1 };
}

async function analyzeAudio(file: File): Promise<MetadataSummary> {
  try {
    const buf = await readAsArrayBuffer(file);
    const bytes = new Uint8Array(buf.slice(0, 3));
    // ID3v2 magic bytes
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      return {
        risks: ['Artist/Title Tags', 'Recording Date', 'Encoding Software'],
        rawCount: 3,
      };
    }
  } catch {/* ignore */}
  return { risks: [], rawCount: 0 };
}

export async function analyzeFile(file: File): Promise<MetadataSummary> {
  const t = file.type;
  if (t === 'image/jpeg' || t === 'image/jpg') return analyzeJPEG(file);
  if (t === 'application/pdf') return analyzePDF(file);
  if (t.startsWith('image/')) return analyzeGenericImage();
  if (t.startsWith('audio/')) return analyzeAudio(file);
  return { risks: [], rawCount: 0 };
}

// ── Stripping ────────────────────────────────────────────────────────────────

function stripImageViaCanvas(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Canvas unavailable')); return; }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const mime = file.type === 'image/jpeg' || file.type === 'image/jpg'
        ? 'image/jpeg'
        : 'image/png';
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Canvas export failed')),
        mime,
        0.92,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

async function stripJPEGExif(file: File): Promise<Blob> {
  try {
    const dataURL = await readAsDataURL(file);
    const clean = piexifRemove(dataURL);
    const res = await fetch(clean);
    return res.blob();
  } catch {
    // Fallback: canvas redraw
    return stripImageViaCanvas(file);
  }
}

async function stripPDF(file: File): Promise<Blob> {
  const buffer = await readAsArrayBuffer(file);
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

  pdf.setTitle('');
  pdf.setAuthor('');
  pdf.setSubject('');
  pdf.setKeywords([]);
  pdf.setProducer('PrivacyStrip');
  pdf.setCreator('');

  const bytes = await pdf.save();
  // new Uint8Array(typedArray) allocates a fresh ArrayBuffer, satisfying BlobPart's type constraint
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

function stripMP3(buffer: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer);
  let start = 0;
  let end = bytes.length;

  // Skip ID3v2 header at file start
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const size =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f);
    start = 10 + size;
  }

  // Remove ID3v1 tag (last 128 bytes starting with "TAG")
  if (bytes.length >= 128) {
    const tagPos = bytes.length - 128;
    if (bytes[tagPos] === 0x54 && bytes[tagPos + 1] === 0x41 && bytes[tagPos + 2] === 0x47) {
      end = tagPos;
    }
  }

  return buffer.slice(start, end);
}

export async function stripMetadata(file: File): Promise<Blob> {
  const t = file.type;

  if (t === 'image/jpeg' || t === 'image/jpg') return stripJPEGExif(file);
  if (t.startsWith('image/')) return stripImageViaCanvas(file);
  if (t === 'application/pdf') return stripPDF(file);

  if (t === 'audio/mpeg' || t === 'audio/mp3') {
    const buf = await readAsArrayBuffer(file);
    const clean = stripMP3(buf);
    return new Blob([clean], { type: file.type });
  }

  throw new Error('Unsupported file type');
}
