import { useCallback, useEffect, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import Icon from '../components/Icon'
import { Banner, Button, Select, ToolFrame } from '../components/ui'
import { canvasToBlob, loadImage } from '../lib/canvas'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 8
const MAX_UNDO = 30

export default function ImgEraser() {
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [brush, setBrush] = useState(40)
  const [fillMode, setFillMode] = useState<'transparent' | 'color'>('color')
  const [fillColor, setFillColor] = useState('#ffffff')
  const [zoom, setZoom] = useState(1)
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [canUndo, setCanUndo] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const drawing = useRef(false)
  const lastPt = useRef<{ x: number; y: number } | null>(null)
  const undoStack = useRef<ImageData[]>([])

  // Load the selected image onto the canvas at its natural resolution.
  useEffect(() => {
    setError('')
    undoStack.current = []
    setCanUndo(false)
    if (!files[0]) return
    loadImage(files[0])
      .then((img) => {
        const canvas = canvasRef.current!
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        // Fit the image into the viewport on first load.
        const wrapW = wrapRef.current?.clientWidth ?? canvas.width
        setZoom(Math.min(1, wrapW / canvas.width))
      })
      .catch((e) => setError(e.message))
  }, [files])

  // Convert a pointer event to canvas pixel coordinates.
  const toCanvasPt = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current!
    const r = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    }
  }, [])

  const pushUndo = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift()
    setCanUndo(true)
  }

  const erase = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.save()
    if (fillMode === 'transparent') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = fillColor
    }
    ctx.lineWidth = brush
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    ctx.restore()
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!files[0]) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pushUndo()
    drawing.current = true
    const p = toCanvasPt(e)
    lastPt.current = p
    erase(p, p)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const p = toCanvasPt(e)
    setCursor({ x: e.clientX, y: e.clientY })
    if (!drawing.current || !lastPt.current) return
    erase(lastPt.current, p)
    lastPt.current = p
  }

  const onPointerUp = () => {
    drawing.current = false
    lastPt.current = null
  }

  const undo = () => {
    const snap = undoStack.current.pop()
    if (!snap) return
    canvasRef.current!.getContext('2d')!.putImageData(snap, 0, 0)
    setCanUndo(undoStack.current.length > 0)
  }

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

  const download = async () => {
    if (!files[0]) return
    setError('')
    try {
      // Transparent mode must be PNG to keep the holes; colour fill can keep
      // the original format (JPEG stays JPEG, everything else becomes PNG).
      const isJpeg = /\.jpe?g$/i.test(files[0].name)
      const keepJpeg = fillMode === 'color' && isJpeg
      const mime = keepJpeg ? 'image/jpeg' : 'image/png'
      const blob = await canvasToBlob(canvasRef.current!, mime)
      downloadBlob(blob, replaceExt(files[0].name, keepJpeg ? 'erased.jpg' : 'erased.png'), mime)
      addHistory({
        toolSlug: 'img-eraser',
        toolName: '圖片橡皮擦',
        fileName: files[0].name,
        result: `${canvasRef.current!.width}×${canvasRef.current!.height}`,
        ok: true,
      })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const displayW = canvasRef.current ? canvasRef.current.width * zoom : 0
  const brushPx = brush * zoom // on-screen brush size for the cursor circle

  return (
    <ToolFrame title="圖片橡皮擦" subtitle="塗抹要擦掉的多餘部分，可選擇填上顏色或變透明（手動去背），並調整筆刷大小與放大圖片。" wide>
      <Dropzone accept="image/*" kind="image" files={files} onFiles={setFiles} hint="選擇一張圖片" />

      {files[0] && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-md justify-center">
            <label className="flex items-center gap-sm">
              <Icon name="brush" size={18} />
              <span className="font-label-xs text-label-xs text-secondary whitespace-nowrap">筆刷 {brush}px</span>
              <input
                type="range"
                min={2}
                max={200}
                value={brush}
                onChange={(e) => setBrush(Number(e.target.value))}
                className="w-32 accent-primary"
              />
            </label>

            <label className="flex items-center gap-sm">
              <Icon name="format_color_fill" size={18} />
              <Select value={fillMode} onChange={(e) => setFillMode(e.target.value as 'transparent' | 'color')}>
                <option value="color">填顏色</option>
                <option value="transparent">透明（去背）</option>
              </Select>
              {fillMode === 'color' && (
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="h-[32px] w-[40px] cursor-pointer rounded border border-outline-variant bg-transparent p-0"
                  title="擦除填色"
                />
              )}
            </label>

            <div className="flex items-center gap-xs">
              <Button variant="ghost" icon="zoom_out" onClick={() => setZoom((z) => clampZoom(z - 0.25))}>
                {''}
              </Button>
              <span className="font-label-xs text-label-xs text-secondary w-14 text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" icon="zoom_in" onClick={() => setZoom((z) => clampZoom(z + 0.25))}>
                {''}
              </Button>
            </div>

            <Button variant="ghost" icon="undo" onClick={undo} disabled={!canUndo}>
              復原
            </Button>
          </div>

          {/* Canvas viewport with a checkerboard to reveal transparency */}
          <div
            ref={wrapRef}
            className="relative max-h-[60vh] overflow-auto rounded border border-outline-variant"
            style={{
              backgroundColor: '#fff',
              backgroundImage:
                'linear-gradient(45deg,#e0e0e0 25%,transparent 25%),linear-gradient(-45deg,#e0e0e0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e0e0e0 75%),linear-gradient(-45deg,transparent 75%,#e0e0e0 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0,0 10px,10px -10px,-10px 0',
            }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={() => setCursor(null)}
              style={{ width: displayW, height: 'auto', display: 'block', cursor: 'none', touchAction: 'none' }}
            />
            {/* Brush outline cursor */}
            {cursor && (
              <div
                className="pointer-events-none fixed rounded-full border-2 border-[#3980f4] z-10"
                style={{
                  left: cursor.x,
                  top: cursor.y,
                  width: brushPx,
                  height: brushPx,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: fillMode === 'color' ? fillColor : 'rgba(57,128,244,0.1)',
                  opacity: fillMode === 'color' ? 0.6 : 1,
                }}
              />
            )}
          </div>
          <p className="font-label-xs text-label-xs text-secondary text-center">
            在圖片上拖曳即可擦除；「填顏色」會塗上選定的顏色，「透明」會把該處擦成透明（去背）後下載 PNG。
          </p>
        </>
      )}

      {error && <Banner kind="error">{error}</Banner>}

      <div className="flex justify-center">
        <Button onClick={download} disabled={!files[0]} icon="download">
          下載 PNG
        </Button>
      </div>
    </ToolFrame>
  )
}
