import { useEffect, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { Banner, Button, ToolFrame } from '../components/ui'
import { canvasToBlob, loadImage } from '../lib/canvas'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export default function ImgCrop() {
  const [files, setFiles] = useState<File[]>([])
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [sel, setSel] = useState<Rect | null>(null)
  const [error, setError] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    setSel(null)
    setImg(null)
    if (files[0]) loadImage(files[0]).then(setImg).catch((e) => setError(e.message))
  }, [files])

  const relPoint = (e: React.MouseEvent) => {
    const r = wrapRef.current!.getBoundingClientRect()
    return {
      x: Math.min(Math.max(e.clientX - r.left, 0), r.width),
      y: Math.min(Math.max(e.clientY - r.top, 0), r.height),
    }
  }

  const onDown = (e: React.MouseEvent) => {
    dragStart.current = relPoint(e)
    setSel(null)
  }
  const onMove = (e: React.MouseEvent) => {
    if (!dragStart.current) return
    const p = relPoint(e)
    const s = dragStart.current
    setSel({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) })
  }
  const onUp = () => {
    dragStart.current = null
  }

  const run = async () => {
    if (!img || !sel || sel.w < 4 || sel.h < 4) return
    setError('')
    try {
      const dispW = wrapRef.current!.clientWidth
      const ratio = img.naturalWidth / dispW
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(sel.w * ratio)
      canvas.height = Math.round(sel.h * ratio)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(
        img,
        sel.x * ratio,
        sel.y * ratio,
        sel.w * ratio,
        sel.h * ratio,
        0,
        0,
        canvas.width,
        canvas.height,
      )
      const isJpeg = /\.jpe?g$/i.test(files[0].name)
      const mime = isJpeg ? 'image/jpeg' : 'image/png'
      const blob = await canvasToBlob(canvas, mime)
      downloadBlob(blob, replaceExt(files[0].name, isJpeg ? 'cropped.jpg' : 'cropped.png'), mime)
      addHistory({ toolSlug: 'img-crop', toolName: '裁剪圖片', fileName: files[0].name, result: `${canvas.width}×${canvas.height}`, ok: true })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <ToolFrame title="裁剪圖片" subtitle="在預覽圖上拖曳框選要保留的區域。" wide>
      <Dropzone accept="image/*" kind="image" files={files} onFiles={setFiles} hint="選擇一張圖片" />
      {img && (
        <div className="flex flex-col gap-sm items-center">
          <div
            ref={wrapRef}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            className="relative inline-block max-w-full cursor-crosshair select-none border border-outline-variant rounded overflow-hidden"
          >
            <img src={img.src} className="block max-w-full pointer-events-none" draggable={false} alt="" />
            {sel && (
              <div
                className="absolute border-2 border-[#3980f4] bg-[#3980f4]/10 pointer-events-none"
                style={{ left: sel.x, top: sel.y, width: sel.w, height: sel.h }}
              />
            )}
          </div>
          <p className="font-label-xs text-label-xs text-secondary">
            {sel ? `選取區域 ${Math.round(sel.w)}×${Math.round(sel.h)} px（顯示比例）` : '在圖片上拖曳以選取裁剪範圍'}
          </p>
        </div>
      )}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!sel || sel.w < 4} icon="crop">
          裁剪並下載
        </Button>
      </div>
    </ToolFrame>
  )
}
