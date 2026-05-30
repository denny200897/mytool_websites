import { useState } from 'react'
import JSZip from 'jszip'
import Dropzone from '../components/Dropzone'
import { Banner, Button, Field, Select, ToolFrame } from '../components/ui'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'
import { pdfjsLib } from '../lib/pdfjs'

export default function PdfToImages() {
  const [files, setFiles] = useState<File[]>([])
  const [format, setFormat] = useState<'png' | 'jpeg'>('png')
  const [scale, setScale] = useState('2')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  const run = async () => {
    setError('')
    setBusy(true)
    try {
      const data = new Uint8Array(await files[0].arrayBuffer())
      const pdf = await pdfjsLib.getDocument({ data }).promise
      const zip = new JSZip()
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(`轉換第 ${i} / ${pdf.numPages} 頁…`)
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: parseFloat(scale) })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport }).promise
        const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), mime, 0.92))
        zip.file(replaceExt(files[0].name, `p${i}.${format}`), blob)
      }
      setProgress('打包 ZIP…')
      downloadBlob(await zip.generateAsync({ type: 'blob' }), replaceExt(files[0].name, 'images.zip'))
      addHistory({ toolSlug: 'pdf-images', toolName: 'PDF 轉圖片', fileName: files[0].name, result: format.toUpperCase(), ok: true })
    } catch (e) {
      setError((e as Error).message || '轉換失敗。')
      addHistory({ toolSlug: 'pdf-images', toolName: 'PDF 轉圖片', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  return (
    <ToolFrame title="PDF 轉圖片" subtitle="將 PDF 每一頁輸出為 PNG 或 JPEG 圖片，打包成 ZIP。">
      <Dropzone accept="application/pdf" kind="pdf" files={files} onFiles={setFiles} hint="選擇一個 PDF" />
      {files[0] && (
        <div className="grid grid-cols-2 gap-md border border-outline-variant rounded bg-surface-container-lowest p-md">
          <Field label="圖片格式">
            <Select value={format} onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}>
              <option value="png">PNG（無損）</option>
              <option value="jpeg">JPEG（較小）</option>
            </Select>
          </Field>
          <Field label="解析度倍率">
            <Select value={scale} onChange={(e) => setScale(e.target.value)}>
              <option value="1">1x</option>
              <option value="2">2x（建議）</option>
              <option value="3">3x（高畫質）</option>
            </Select>
          </Field>
        </div>
      )}
      {progress && <Banner kind="info">{progress}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="imagesmode">
          {busy ? '轉換中…' : '轉換為圖片'}
        </Button>
      </div>
    </ToolFrame>
  )
}
