import { useEffect, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { Banner, Button, Field, ToolFrame } from '../components/ui'
import { canvasToBlob, loadImage } from '../lib/canvas'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

/** Read the average colour of the four corners as a best-guess background colour. */
function autoPickColor(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pts = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ]
  let r = 0,
    g = 0,
    b = 0
  for (const [x, y] of pts) {
    const d = ctx.getImageData(x, y, 1, 1).data
    r += d[0]
    g += d[1]
    b += d[2]
  }
  return { r: Math.round(r / 4), g: Math.round(g / 4), b: Math.round(b / 4) }
}

function toHex({ r, g, b }: { r: number; g: number; b: number }) {
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

function fromHex(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

export default function ImgRemoveBg() {
  const [files, setFiles] = useState<File[]>([])
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [color, setColor] = useState('#ffffff')
  const [tolerance, setTolerance] = useState(40)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const previewRef = useRef<HTMLCanvasElement>(null)

  // Load image + auto-detect background colour from the corners.
  useEffect(() => {
    setImg(null)
    setError('')
    if (!files[0]) return
    loadImage(files[0])
      .then((image) => {
        setImg(image)
        const c = document.createElement('canvas')
        c.width = image.naturalWidth
        c.height = image.naturalHeight
        const ctx = c.getContext('2d')!
        ctx.drawImage(image, 0, 0)
        setColor(toHex(autoPickColor(ctx, c.width, c.height)))
      })
      .catch((e) => setError((e as Error).message))
  }, [files])

  /** Render image onto a canvas, knocking out pixels close to `color`. */
  const render = (canvas: HTMLCanvasElement) => {
    if (!img) return
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    const target = fromHex(color)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const px = data.data
    // Squared-distance threshold (tolerance is 0–100 → 0–~441 colour distance).
    const maxDist = (tolerance / 100) * 441.67
    const maxDistSq = maxDist * maxDist
    for (let i = 0; i < px.length; i += 4) {
      const dr = px[i] - target.r
      const dg = px[i + 1] - target.g
      const db = px[i + 2] - target.b
      if (dr * dr + dg * dg + db * db <= maxDistSq) px[i + 3] = 0
    }
    ctx.putImageData(data, 0, 0)
  }

  // Live preview whenever the inputs change.
  useEffect(() => {
    if (img && previewRef.current) render(previewRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, color, tolerance])

  const run = async () => {
    if (!img) return
    setError('')
    setBusy(true)
    try {
      const canvas = document.createElement('canvas')
      render(canvas)
      const blob = await canvasToBlob(canvas, 'image/png')
      downloadBlob(blob, replaceExt(files[0].name, 'nobg.png'), 'image/png')
      addHistory({ toolSlug: 'img-remove-bg', toolName: '去除背景', fileName: files[0].name, result: 'PNG', ok: true })
    } catch (e) {
      setError((e as Error).message)
      addHistory({ toolSlug: 'img-remove-bg', toolName: '去除背景', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="去除背景" subtitle="移除單色 / 純色背景，輸出透明 PNG。適合純色或棚拍背景。" wide>
      <Dropzone accept="image/*" kind="image" files={files} onFiles={setFiles} hint="選擇一張純色背景的圖片" />
      {img && (
        <>
          <div className="border border-outline-variant rounded bg-surface-container-lowest p-md flex flex-col gap-md sm:flex-row sm:items-end">
            <Field label="背景顏色">
              <div className="flex items-center gap-sm">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-[32px] w-[48px] cursor-pointer rounded border border-outline-variant bg-surface-container-lowest p-[2px]"
                />
                <span className="font-label-xs text-label-xs text-secondary uppercase tracking-wider">{color}</span>
              </div>
            </Field>
            <Field label={`容差 ${tolerance}%`}>
              <input
                type="range"
                min={0}
                max={100}
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </Field>
          </div>
          <div className="flex flex-col items-center gap-sm">
            <div
              className="inline-block max-w-full rounded border border-outline-variant overflow-hidden"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
            >
              <canvas ref={previewRef} className="block max-w-full h-auto" />
            </div>
            <p className="font-label-xs text-label-xs text-secondary">
              拖曳容差調整移除範圍；棋盤格代表透明區域。
            </p>
          </div>
        </>
      )}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!img || busy} icon="auto_fix_high">
          {busy ? '處理中…' : '去背並下載 PNG'}
        </Button>
      </div>
    </ToolFrame>
  )
}
