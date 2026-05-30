import { useState } from 'react'
import { PDFDocument } from '@cantoo/pdf-lib'
import Dropzone from '../components/Dropzone'
import { Banner, Button, ToolFrame } from '../components/ui'
import { downloadBlob, formatBytes, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function PdfCompress() {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [stat, setStat] = useState<{ before: number; after: number } | null>(null)

  const run = async () => {
    setError('')
    setStat(null)
    setBusy(true)
    try {
      const before = files[0].size
      const doc = await PDFDocument.load(await files[0].arrayBuffer())
      // pdf-lib re-serializes using object streams, which removes unused
      // objects and packs the file more tightly. (Image re-encoding would
      // need a heavier engine; this is a safe, lossless optimisation.)
      const bytes = await doc.save({ useObjectStreams: true })
      const after = bytes.byteLength
      setStat({ before, after })
      downloadBlob(bytes, replaceExt(files[0].name, 'compressed.pdf'), 'application/pdf')
      addHistory({ toolSlug: 'pdf-compress', toolName: '壓縮 PDF', fileName: files[0].name, result: 'PDF', ok: true })
    } catch (e) {
      setError((e as Error).message || '壓縮失敗。')
      addHistory({ toolSlug: 'pdf-compress', toolName: '壓縮 PDF', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="壓縮 PDF" subtitle="重新封裝並移除冗餘物件以縮小檔案（無損最佳化）。">
      <Dropzone accept="application/pdf" kind="pdf" files={files} onFiles={setFiles} hint="選擇一個 PDF" />
      {stat && (
        <Banner kind="success">
          {formatBytes(stat.before)} → {formatBytes(stat.after)}（
          {stat.after < stat.before
            ? `減少 ${(100 - (stat.after / stat.before) * 100).toFixed(1)}%`
            : '此檔案已最佳化，無法再縮小'}
          ）
        </Banner>
      )}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="compress">
          {busy ? '壓縮中…' : '壓縮 PDF'}
        </Button>
      </div>
    </ToolFrame>
  )
}
