import { useEffect, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { Banner, Button, Field, TextInput, ToolFrame } from '../components/ui'
import { canvasToBlob, loadImage } from '../lib/canvas'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function ImgResize() {
  const [files, setFiles] = useState<File[]>([])
  const [orig, setOrig] = useState<{ w: number; h: number } | null>(null)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lock, setLock] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setOrig(null)
    if (!files[0]) return
    loadImage(files[0]).then((img) => {
      setOrig({ w: img.naturalWidth, h: img.naturalHeight })
      setWidth(String(img.naturalWidth))
      setHeight(String(img.naturalHeight))
    })
  }, [files])

  const onWidth = (v: string) => {
    setWidth(v)
    if (lock && orig && v) setHeight(String(Math.round((parseInt(v, 10) / orig.w) * orig.h)))
  }
  const onHeight = (v: string) => {
    setHeight(v)
    if (lock && orig && v) setWidth(String(Math.round((parseInt(v, 10) / orig.h) * orig.w)))
  }

  const run = async () => {
    setError('')
    setBusy(true)
    try {
      const img = await loadImage(files[0])
      const w = Math.max(1, parseInt(width, 10) || img.naturalWidth)
      const h = Math.max(1, parseInt(height, 10) || img.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)
      const isJpeg = /\.jpe?g$/i.test(files[0].name)
      const mime = isJpeg ? 'image/jpeg' : 'image/png'
      const blob = await canvasToBlob(canvas, mime)
      downloadBlob(blob, replaceExt(files[0].name, isJpeg ? 'resized.jpg' : 'resized.png'), mime)
      addHistory({ toolSlug: 'img-resize', toolName: '調整圖片大小', fileName: files[0].name, result: `${w}×${h}`, ok: true })
    } catch (e) {
      setError((e as Error).message)
      addHistory({ toolSlug: 'img-resize', toolName: '調整圖片大小', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="調整圖片大小" subtitle="設定新的寬高，可選擇鎖定長寬比。">
      <Dropzone accept="image/*" kind="image" files={files} onFiles={setFiles} hint={orig ? `原始尺寸 ${orig.w}×${orig.h}` : '選擇一張圖片'} />
      {orig && (
        <div className="border border-outline-variant rounded bg-surface-container-lowest p-md flex flex-col gap-md">
          <div className="grid grid-cols-2 gap-md">
            <Field label="寬度 (px)">
              <TextInput type="number" value={width} onChange={(e) => onWidth(e.target.value)} />
            </Field>
            <Field label="高度 (px)">
              <TextInput type="number" value={height} onChange={(e) => onHeight(e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center gap-xs font-body-sm text-body-sm cursor-pointer">
            <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} /> 鎖定長寬比
          </label>
        </div>
      )}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="aspect_ratio">
          {busy ? '處理中…' : '調整大小'}
        </Button>
      </div>
    </ToolFrame>
  )
}
