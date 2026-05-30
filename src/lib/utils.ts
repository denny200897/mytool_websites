/**
 * Make a filename safe for download: strip directory components, control
 * characters, and filesystem-illegal characters so a crafted name (e.g. from
 * a ZIP entry) can't path-traverse or inject control sequences.
 */
export function sanitizeFilename(name: string, fallback = 'download'): string {
  const base = name.split(/[/\\]/).pop() ?? ''
  const ILLEGAL = '<>:"|?*'
  let out = ''
  for (const ch of base) {
    const code = ch.charCodeAt(0)
    out += code < 0x20 || code === 0x7f || ILLEGAL.includes(ch) ? '_' : ch
  }
  out = out.replace(/^\.+/, '').trim().slice(0, 200)
  return out || fallback
}

/** Trigger a browser download for a Blob or Uint8Array. */
export function downloadBlob(data: Blob | Uint8Array | ArrayBuffer, filename: string, mime?: string) {
  const blob =
    data instanceof Blob ? data : new Blob([data as BlobPart], { type: mime ?? 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = sanitizeFilename(filename)
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke after a tick so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/** Human readable file size. */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1))} ${sizes[i]}`
}

/** Swap or append a file extension. */
export function replaceExt(name: string, ext: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot === -1 ? name : name.slice(0, dot)
  return `${base}.${ext}`
}

export function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer()
}

export function readAsText(file: File): Promise<string> {
  return file.text()
}
