import { useState } from 'react'
import { PDFDocument } from '@cantoo/pdf-lib'
import Dropzone from '../components/Dropzone'
import { Banner, Button, Field, Select, ToolFrame } from '../components/ui'
import { downloadBlob } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function ImgToPdf() {
  const [files, setFiles] = useState<File[]>([])
  const [fit, setFit] = useState<'page' | 'image'>('page')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setError('')
    setBusy(true)
    try {
      const pdf = await PDFDocument.create()
      const A4 = { w: 595.28, h: 841.89 }
      for (const file of files) {
        const bytes = new Uint8Array(await file.arrayBuffer())
        const isPng = /\.png$/i.test(file.name) || file.type === 'image/png'
        const embedded = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes)
        if (fit === 'image') {
          const page = pdf.addPage([embedded.width, embedded.height])
          page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height })
        } else {
          const page = pdf.addPage([A4.w, A4.h])
          const scale = Math.min(A4.w / embedded.width, A4.h / embedded.height)
          const w = embedded.width * scale
          const h = embedded.height * scale
          page.drawImage(embedded, { x: (A4.w - w) / 2, y: (A4.h - h) / 2, width: w, height: h })
        }
      }
      downloadBlob(await pdf.save(), 'images.pdf', 'application/pdf')
      addHistory({ toolSlug: 'img-to-pdf', toolName: '圖片轉 PDF', fileName: `images.pdf（${files.length} 張）`, result: 'PDF', ok: true })
    } catch (e) {
      setError((e as Error).message || '轉換失敗，僅支援 JPEG / PNG。')
      addHistory({ toolSlug: 'img-to-pdf', toolName: '圖片轉 PDF', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="圖片轉 PDF" subtitle="把多張 JPEG / PNG 圖片合併成一個 PDF。">
      <Dropzone accept="image/png,image/jpeg" kind="image" multiple files={files} onFiles={setFiles} hint="支援 JPEG / PNG；依加入順序排列。" />
      {files.length > 0 && (
        <div className="border border-outline-variant rounded bg-surface-container-lowest p-md">
          <Field label="版面">
            <Select value={fit} onChange={(e) => setFit(e.target.value as 'page' | 'image')}>
              <option value="page">A4 置中</option>
              <option value="image">符合圖片尺寸</option>
            </Select>
          </Field>
        </div>
      )}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={files.length === 0 || busy} icon="picture_as_pdf">
          {busy ? '產生中…' : '轉換為 PDF'}
        </Button>
      </div>
    </ToolFrame>
  )
}
