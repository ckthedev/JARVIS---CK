import path from "path";
import crypto from "crypto";
export { formatBytes } from "@/lib/utils";

export type FileCategory =
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "DOCUMENT"
  | "SPREADSHEET"
  | "PRESENTATION"
  | "ARCHIVE"
  | "CODE"
  | "OTHER";

// Extension to Category Mapping
const EXTENSION_CATEGORIES: Record<string, FileCategory> = {
  // Images
  jpg: "IMAGE",
  jpeg: "IMAGE",
  png: "IMAGE",
  webp: "IMAGE",
  gif: "IMAGE",
  svg: "IMAGE",
  tiff: "IMAGE",
  tif: "IMAGE",
  bmp: "IMAGE",
  heic: "IMAGE",
  heif: "IMAGE",
  ico: "IMAGE",

  // Videos
  mp4: "VIDEO",
  mov: "VIDEO",
  avi: "VIDEO",
  mkv: "VIDEO",
  webm: "VIDEO",
  m4v: "VIDEO",
  flv: "VIDEO",
  wmv: "VIDEO",

  // Audio
  mp3: "AUDIO",
  wav: "AUDIO",
  aac: "AUDIO",
  m4a: "AUDIO",
  ogg: "AUDIO",
  flac: "AUDIO",
  wma: "AUDIO",

  // Documents
  pdf: "DOCUMENT",
  doc: "DOCUMENT",
  docx: "DOCUMENT",
  txt: "DOCUMENT",
  rtf: "DOCUMENT",
  odt: "DOCUMENT",

  // Spreadsheets
  xls: "SPREADSHEET",
  xlsx: "SPREADSHEET",
  csv: "SPREADSHEET",
  ods: "SPREADSHEET",

  // Presentations
  ppt: "PRESENTATION",
  pptx: "PRESENTATION",
  odp: "PRESENTATION",

  // Archives
  zip: "ARCHIVE",
  rar: "ARCHIVE",
  "7z": "ARCHIVE",
  tar: "ARCHIVE",
  gz: "ARCHIVE",
  bz2: "ARCHIVE",

  // Code
  html: "CODE",
  htm: "CODE",
  css: "CODE",
  js: "CODE",
  mjs: "CODE",
  cjs: "CODE",
  ts: "CODE",
  jsx: "CODE",
  tsx: "CODE",
  py: "CODE",
  json: "CODE",
  xml: "CODE",
  sql: "CODE",
  md: "CODE",
  yaml: "CODE",
  yml: "CODE",
  sh: "CODE",
  env: "CODE",
  prisma: "CODE",
};

// Extension to MIME mapping
const EXTENSION_MIME_TYPES: Record<string, string> = {
  // Images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  tiff: "image/tiff",
  tif: "image/tiff",
  heic: "image/heic",

  // Videos
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",

  // Audio
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  aac: "audio/aac",
  m4a: "audio/mp4",
  flac: "audio/flac",

  // Documents
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  rtf: "application/rtf",
  odt: "application/vnd.oasis.opendocument.text",

  // Spreadsheets
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  ods: "application/vnd.oasis.opendocument.spreadsheet",

  // Presentations
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odp: "application/vnd.oasis.opendocument.presentation",

  // Archives
  zip: "application/zip",
  rar: "application/x-rar-compressed",
  "7z": "application/x-7z-compressed",
  tar: "application/x-tar",
  gz: "application/gzip",

  // Code
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  js: "text/javascript",
  ts: "text/typescript",
  jsx: "text/javascript",
  tsx: "text/typescript",
  py: "text/x-python",
  json: "application/json",
  xml: "application/xml",
  sql: "text/x-sql",
  md: "text/markdown",
};

// Dangerous executable extensions that must never be executed or served directly
const BLOCKED_EXECUTABLE_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "com",
  "msi",
  "vbs",
  "vbe",
  "wsf",
  "wsh",
  "ps1",
  "scr",
  "pif",
  "reg",
  "dll",
]);

/**
 * Extract clean extension from filename (without leading dot).
 */
export function getFileExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(/^\./, "");
  return ext;
}

/**
 * Detect file category based on extension and optional mimeType.
 */
export function detectFileCategory(filename: string, mimeType?: string): FileCategory {
  const ext = getFileExtension(filename);
  if (EXTENSION_CATEGORIES[ext]) {
    return EXTENSION_CATEGORIES[ext];
  }

  if (mimeType) {
    if (mimeType.startsWith("image/")) return "IMAGE";
    if (mimeType.startsWith("video/")) return "VIDEO";
    if (mimeType.startsWith("audio/")) return "AUDIO";
    if (mimeType.startsWith("text/")) return "CODE";
    if (mimeType.includes("pdf")) return "DOCUMENT";
    if (mimeType.includes("zip") || mimeType.includes("compressed")) return "ARCHIVE";
  }

  return "OTHER";
}

/**
 * Resolve standard MIME type from extension or fallback.
 */
export function resolveMimeType(filename: string, browserMimeType?: string): string {
  const ext = getFileExtension(filename);
  if (EXTENSION_MIME_TYPES[ext]) {
    return EXTENSION_MIME_TYPES[ext];
  }
  if (browserMimeType && browserMimeType !== "application/octet-stream") {
    return browserMimeType;
  }
  return "application/octet-stream";
}

/**
 * Check if the extension is a known executable that should be blocked or disarmed.
 */
export function isExecutableExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return BLOCKED_EXECUTABLE_EXTENSIONS.has(ext);
}

/**
 * Check if the file format supports inline preview in modern browsers.
 */
export function isPreviewable(category: FileCategory, filename: string): boolean {
  const ext = getFileExtension(filename);

  switch (category) {
    case "IMAGE":
      return ["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(ext);
    case "VIDEO":
      return ["mp4", "webm", "mov"].includes(ext);
    case "AUDIO":
      return ["mp3", "wav", "ogg", "aac", "m4a", "flac"].includes(ext);
    case "DOCUMENT":
      return ext === "pdf" || ext === "txt";
    case "CODE":
      return ["txt", "md", "json", "html", "css", "js", "ts", "jsx", "tsx", "py", "xml", "sql", "yaml", "yml"].includes(ext);
    default:
      return false;
  }
}

/**
 * Calculate SHA-256 checksum of a buffer.
 */
export function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Maximum configured upload size (default 100MB).
 */
export function getMaxUploadSizeBytes(): number {
  const envMb = Number(process.env.MAX_FILE_UPLOAD_SIZE_MB || "100");
  const mb = isNaN(envMb) || envMb <= 0 ? 100 : envMb;
  return mb * 1024 * 1024;
}

