import { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { Banner, Button, Field, Select, TextInput, ToolFrame } from '../components/ui'
import { canvasToBlob, loadImage } from '../lib/canvas'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

type Pos = 'center' | 'tile' | 'bottom-right'

export default function ImgWatermark() {
  const [files, setFiles] = useState<File[]>([])
  const [text, setText] = useState('CONFIDENTIAL')
  const [pos, setPos] = useState<Pos>('center')
  const [opacity, setOpacity] = useState(0.3)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setError('')
    setBusy(true)
    try {
      const img = await loadImage(files[0])
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const fontSize = Math.max(16, Math.round(canvas.width / 18))
      ctx.font = `600 ${fontSize}px Geist, sans-serif`
      ctx.fillStyle = `rgba(0,0,0,${opacity})`
      ctx.textBaseline = 'middle'

      if (pos === 'tile') {
        ctx.textAlign = 'center'
        const step = fontSize * 8
        ctx.save()
        ctx.rotate(-Math.PI / 6)
        for (let y = -canvas.height; y < canvas.height * 2; y += step) {
          for (let x = -canvas.width; x < canvas.width * 2; x += step * 2) {
            ctx.fillText(text, x, y)
          }
        }
        ctx.restore()
      } else if (pos === 'bottom-right') {
        ctx.textAlign = 'right'
        ctx.fillText(text, canvas.width - fontSize, canvas.height - fontSize)
      } else {
        ctx.textAlign = 'center'
        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(-Math.PI / 6)
        ctx.fillText(text, 0, 0)
        ctx.restore()
      }

      const isJpeg = /\.jpe?g$/i.test(files[0].name)
      const mime = isJpeg ? 'image/jpeg' : 'image/png'
      const blob = await canvasToBlob(canvas, mime)
      downloadBlob(blob, replaceExt(files[0].name, isJpeg ? 'watermarked.jpg' : 'watermarked.png'), mime)
      addHistory({ toolSlug: 'img-watermark', toolName: '添加浮水印', fileName: files[0].name, result: 'OK', ok: true })
    } catch (e) {
      setError((e as Error).message)
      addHistory({ toolSlug: 'img-watermark', toolName: '添加浮水印', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="添加浮水印" subtitle="在圖片上加上文字浮水印。">
      <Dropzone accept="image/*" kind="image" files={files} onFiles={setFiles} hint="選擇一張圖片" />
      {files[0] && (
        <div className="border border-outline-variant rounded bg-surface-container-lowest p-md flex flex-col gap-md">
          <Field label="浮水印文字">
            <TextInput value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-md">
            <Field label="位置">
              <Select value={pos} onChange={(e) => setPos(e.target.value as Pos)}>
                <option value="center">置中（斜向）</option>
                <option value="tile">平鋪</option>
                <option value="bottom-right">右下角</option>
              </Select>
            </Field>
            <Field label={`透明度：${Math.round(opacity * 100)}%`}>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-[#3980f4] mt-2"
              />
            </Field>
          </div>
        </div>
      )}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || !text || busy} icon="water_drop">
          {busy ? '處理中…' : '加上浮水印'}
        </Button>
      </div>
    </ToolFrame>
  )
}
