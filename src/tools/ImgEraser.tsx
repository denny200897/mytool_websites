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
  const [tool, setTool] = useState<'brush' | 'bucket'>('brush')
  const [brush, setBrush] = useState(40)
  const [tolerance, setTolerance] = useState(32)
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

  // Flood fill the contiguous region around (x,y) whose colour is within
  // `tolerance` of the clicked pixel. Fills with the chosen colour or, in
  // transparent mode, clears the pixels (manual local background removal).
  const bucketFill = (x0: number, y0: number) => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    const sx = Math.floor(x0)
    const sy = Math.floor(y0)
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return

    const img = ctx.getImageData(0, 0, w, h)
    const d = img.data
    const start = (sy * w + sx) * 4
    const tr = d[start]
    const tg = d[start + 1]
    const tb = d[start + 2]
    const ta = d[start + 3]

    // Target fill colour (only used in colour mode).
    const hex = fillColor.replace('#', '')
    const fr = parseInt(hex.slice(0, 2), 16)
    const fg = parseInt(hex.slice(2, 4), 16)
    const fb = parseInt(hex.slice(4, 6), 16)

    // Squared-distance tolerance over the four channels.
    const tol = tolerance * tolerance * 4
    const match = (i: number) => {
      const dr = d[i] - tr
      const dg = d[i + 1] - tg
      const db = d[i + 2] - tb
      const da = d[i + 3] - ta
      return dr * dr + dg * dg + db * db + da * da <= tol
    }

    const visited = new Uint8Array(w * h)
    const stack = [sy * w + sx]
    while (stack.length) {
      const p = stack.pop()!
      if (visited[p]) continue
      visited[p] = 1
      const i = p * 4
      if (!match(i)) continue
      if (fillMode === 'transparent') {
        d[i + 3] = 0
      } else {
        d[i] = fr
        d[i + 1] = fg
        d[i + 2] = fb
        d[i + 3] = 255
      }
      const px = p % w
      const py = (p - px) / w
      if (px > 0) stack.push(p - 1)
      if (px < w - 1) stack.push(p + 1)
      if (py > 0) stack.push(p - w)
      if (py < h - 1) stack.push(p + w)
    }
    ctx.putImageData(img, 0, 0)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!files[0]) return
    pushUndo()
    const p = toCanvasPt(e)
    if (tool === 'bucket') {
      bucketFill(p.x, p.y)
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
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
    <ToolFrame title="圖片橡皮擦" subtitle="用筆刷塗抹或油漆桶填滿局部區域，可選擇填上顏色或變透明（手動去背），並調整筆刷大小與放大圖片。" wide>
      <Dropzone accept="image/*" kind="image" files={files} onFiles={setFiles} hint="選擇一張圖片" />

      {files[0] && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-md justify-center">
            <label className="flex items-center gap-sm">
              <Icon name={tool === 'bucket' ? 'format_color_fill' : 'brush'} size={18} />
              <Select value={tool} onChange={(e) => setTool(e.target.value as 'brush' | 'bucket')}>
                <option value="brush">筆刷塗抹</option>
                <option value="bucket">油漆桶填滿</option>
              </Select>
            </label>

            {tool === 'brush' ? (
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
            ) : (
              <label className="flex items-center gap-sm">
                <Icon name="tune" size={18} />
                <span className="font-label-xs text-label-xs text-secondary whitespace-nowrap">容差 {tolerance}</span>
                <input
                  type="range"
                  min={0}
                  max={120}
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-32 accent-primary"
                />
              </label>
            )}

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
              style={{
                width: displayW,
                height: 'auto',
                display: 'block',
                cursor: tool === 'bucket' ? 'crosshair' : 'none',
                touchAction: 'none',
              }}
            />
            {/* Brush outline cursor */}
            {cursor && tool === 'brush' && (
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
            {tool === 'brush'
              ? '筆刷：在圖片上拖曳即可擦除。'
              : '油漆桶：點一下即可填滿該處相連、顏色相近的局部區域；用「容差」控制相近範圍。'}
            「填顏色」會塗上選定的顏色，「透明」會把該處擦成透明（去背）後下載 PNG。
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
