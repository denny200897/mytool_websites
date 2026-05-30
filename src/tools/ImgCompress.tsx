import { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { Banner, Button, Field, ToolFrame } from '../components/ui'
import { canvasToBlob, loadImage } from '../lib/canvas'
import { downloadBlob, formatBytes, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function ImgCompress() {
  const [files, setFiles] = useState<File[]>([])
  const [quality, setQuality] = useState(0.7)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [stat, setStat] = useState<{ before: number; after: number } | null>(null)

  const run = async () => {
    setError('')
    setStat(null)
    setBusy(true)
    try {
      const img = await loadImage(files[0])
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
      setStat({ before: files[0].size, after: blob.size })
      downloadBlob(blob, replaceExt(files[0].name, 'compressed.jpg'), 'image/jpeg')
      addHistory({ toolSlug: 'img-compress', toolName: '壓縮圖片', fileName: files[0].name, result: 'JPEG', ok: true })
    } catch (e) {
      setError((e as Error).message)
      addHistory({ toolSlug: 'img-compress', toolName: '壓縮圖片', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="壓縮圖片" subtitle="以 JPEG 重新編碼縮小檔案，可調整品質。">
      <Dropzone accept="image/*" kind="image" files={files} onFiles={setFiles} hint="選擇一張圖片" />
      {files[0] && (
        <div className="border border-outline-variant rounded bg-surface-container-lowest p-md">
          <Field label={`品質：${Math.round(quality * 100)}%`}>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full accent-[#3980f4]"
            />
          </Field>
        </div>
      )}
      {stat && (
        <Banner kind="success">
          {formatBytes(stat.before)} → {formatBytes(stat.after)}（減少 {(100 - (stat.after / stat.before) * 100).toFixed(1)}%）
        </Banner>
      )}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="compress">
          {busy ? '壓縮中…' : '壓縮圖片'}
        </Button>
      </div>
    </ToolFrame>
  )
}
