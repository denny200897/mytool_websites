import { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { Banner, Button, Field, Select, ToolFrame } from '../components/ui'
import { canvasToBlob, IMAGE_MIME, loadImage } from '../lib/canvas'
import { downloadResults, replaceExt, type NamedBlob } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function ImgConvert() {
  const [files, setFiles] = useState<File[]>([])
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setError('')
    setBusy(true)
    try {
      const results: NamedBlob[] = []
      for (const file of files) {
        const img = await loadImage(file)
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!
        if (format !== 'png') {
          ctx.fillStyle = '#ffffff' // flatten transparency for non-PNG
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        ctx.drawImage(img, 0, 0)
        const blob = await canvasToBlob(canvas, IMAGE_MIME[format])
        results.push({ name: replaceExt(file.name, format), blob })
      }
      await downloadResults(results, `converted-${format}.zip`, IMAGE_MIME[format])
      addHistory({ toolSlug: 'img-convert', toolName: '轉換圖片格式', fileName: files.length > 1 ? `${files.length} 張圖片` : files[0].name, result: format.toUpperCase(), ok: true })
    } catch (e) {
      setError((e as Error).message)
      addHistory({ toolSlug: 'img-convert', toolName: '轉換圖片格式', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="轉換圖片格式" subtitle="在 PNG、JPEG、WebP 之間互相轉換。可一次上傳多張批次處理。">
      <Dropzone accept="image/*" kind="image" multiple files={files} onFiles={setFiles} hint="支援 PNG / JPEG / WebP / GIF / BMP，可多選" />
      {files[0] && (
        <div className="border border-outline-variant rounded bg-surface-container-lowest p-md">
          <Field label="輸出格式">
            <Select value={format} onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg' | 'webp')}>
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </Select>
          </Field>
        </div>
      )}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="transform">
          {busy ? '轉換中…' : files.length > 1 ? `轉換 ${files.length} 張為 ${format.toUpperCase()}（ZIP）` : `轉換為 ${format.toUpperCase()}`}
        </Button>
      </div>
    </ToolFrame>
  )
}
