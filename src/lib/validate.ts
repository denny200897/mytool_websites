// Client-side file validation: never trust the filename or the browser-provided
// MIME type. We sniff the actual bytes (magic numbers) so a renamed executable
// or a mislabelled file is rejected before any parser touches it.

export type FileKind = 'pdf' | 'image' | 'zip' | 'video' | 'csv' | 'text' | 'any'

/** Default per-kind size ceilings (MB) to avoid freezing/OOM-ing the tab. */
export const DEFAULT_MAX_MB: Record<FileKind, number> = {
  pdf: 200,
  image: 64,
  zip: 256,
  video: 1024,
  csv: 64,
  text: 16,
  any: 512,
}

const KIND_LABEL: Record<FileKind, string> = {
  pdf: 'PDF',
  image: '圖片 (PNG/JPEG/WebP/GIF/BMP)',
  zip: 'ZIP 壓縮檔',
  video: '影片 (MP4/WebM/MOV/AVI/MKV)',
  csv: 'CSV / 文字',
  text: '文字 / Markdown',
  any: '檔案',
}

function bytesMatch(b: Uint8Array, sig: number[], offset = 0): boolean {
  for (let i = 0; i < sig.length; i++) if (b[offset + i] !== sig[i]) return false
  return true
}

function asciiAt(b: Uint8Array, s: string, offset = 0): boolean {
  for (let i = 0; i < s.length; i++) if (b[offset + i] !== s.charCodeAt(i)) return false
  return true
}

function indexOfAscii(b: Uint8Array, s: string, limit: number): number {
  outer: for (let i = 0; i <= Math.min(b.length, limit) - s.length; i++) {
    for (let j = 0; j < s.length; j++) if (b[i + j] !== s.charCodeAt(j)) continue outer
    return i
  }
  return -1
}

const isPdf = (b: Uint8Array) => indexOfAscii(b, '%PDF-', 1024) !== -1

const isImage = (b: Uint8Array) =>
  bytesMatch(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) || // PNG
  bytesMatch(b, [0xff, 0xd8, 0xff]) || // JPEG
  asciiAt(b, 'GIF87a') ||
  asciiAt(b, 'GIF89a') || // GIF
  (asciiAt(b, 'RIFF') && asciiAt(b, 'WEBP', 8)) || // WebP
  bytesMatch(b, [0x42, 0x4d]) // BMP

const isZip = (b: Uint8Array) =>
  bytesMatch(b, [0x50, 0x4b, 0x03, 0x04]) ||
  bytesMatch(b, [0x50, 0x4b, 0x05, 0x06]) ||
  bytesMatch(b, [0x50, 0x4b, 0x07, 0x08])

const isVideo = (b: Uint8Array) =>
  asciiAt(b, 'ftyp', 4) || // MP4 / MOV / M4V
  bytesMatch(b, [0x1a, 0x45, 0xdf, 0xa3]) || // WebM / MKV (EBML)
  (asciiAt(b, 'RIFF') && asciiAt(b, 'AVI ', 8)) // AVI

/** A text file should decode and contain no NUL bytes in its leading chunk. */
const looksTextual = (b: Uint8Array) => {
  const n = Math.min(b.length, 512)
  for (let i = 0; i < n; i++) if (b[i] === 0x00) return false
  return true
}

const DETECTORS: Record<Exclude<FileKind, 'any'>, (b: Uint8Array) => boolean> = {
  pdf: isPdf,
  image: isImage,
  zip: isZip,
  video: isVideo,
  csv: looksTextual,
  text: looksTextual,
}

export interface ValidationResult {
  ok: boolean
  reason?: string
}

/**
 * Validate a single file against one or more allowed kinds and a size cap.
 * Reads only the first 64 bytes — cheap and runs entirely locally.
 */
export async function validateFile(
  file: File,
  kinds: FileKind | FileKind[],
  maxMB?: number,
): Promise<ValidationResult> {
  const allowed = Array.isArray(kinds) ? kinds : [kinds]

  if (file.size === 0) return { ok: false, reason: '檔案是空的。' }

  const cap = maxMB ?? Math.max(...allowed.map((k) => DEFAULT_MAX_MB[k]))
  if (file.size > cap * 1024 * 1024) {
    return { ok: false, reason: `檔案過大（上限 ${cap} MB）。` }
  }

  if (allowed.includes('any')) return { ok: true }

  const header = new Uint8Array(await file.slice(0, 64).arrayBuffer())
  const matched = allowed.some((k) => k !== 'any' && DETECTORS[k](header))
  if (!matched) {
    const label = allowed.map((k) => KIND_LABEL[k]).join(' 或 ')
    return { ok: false, reason: `檔案內容不是有效的 ${label}（檔頭驗證失敗）。` }
  }
  return { ok: true }
}
