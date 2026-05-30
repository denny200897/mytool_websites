import { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { Banner, Button, Field, Select, ToolFrame } from '../components/ui'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function DocOcr() {
  const [files, setFiles] = useState<File[]>([])
  const [lang, setLang] = useState('eng')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  // Render a PDF's first pages to canvases (so OCR can read PDFs too).
  const pdfToCanvases = async (file: File): Promise<HTMLCanvasElement[]> => {
    const { pdfjsLib } = await import('../lib/pdfjs')
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
    const out: HTMLCanvasElement[] = []
    const limit = Math.min(pdf.numPages, 10)
    for (let i = 1; i <= limit; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 2 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
      out.push(canvas)
    }
    return out
  }

  const run = async () => {
    setError('')
    setText('')
    setBusy(true)
    try {
      const { createWorker } = await import('tesseract.js')
      setProgress('載入語言模型…')
      // All assets self-hosted under /tesseract (worker, wasm core, fast models).
      const base = `${import.meta.env.BASE_URL}tesseract`
      const worker = await createWorker(lang, 1, {
        workerPath: `${base}/worker.min.js`,
        corePath: `${base}/`,
        langPath: `${base}/lang`,
        gzip: false, // fast models are stored uncompressed (.traineddata)
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') setProgress(`辨識中… ${Math.round(m.progress * 100)}%`)
        },
      })
      const sources: (File | HTMLCanvasElement)[] = /\.pdf$/i.test(files[0].name)
        ? await pdfToCanvases(files[0])
        : [files[0]]
      let combined = ''
      for (let i = 0; i < sources.length; i++) {
        if (sources.length > 1) setProgress(`辨識第 ${i + 1} / ${sources.length} 頁…`)
        const { data } = await worker.recognize(sources[i])
        combined += (combined ? '\n\n' : '') + data.text
      }
      await worker.terminate()
      setText(combined.trim())
      addHistory({ toolSlug: 'doc-ocr', toolName: '擷取文字 (OCR)', fileName: files[0].name, result: 'TXT', ok: true })
    } catch (e) {
      setError((e as Error).message || 'OCR 失敗。')
      addHistory({ toolSlug: 'doc-ocr', toolName: '擷取文字 (OCR)', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  return (
    <ToolFrame title="擷取文字 (OCR)" subtitle="從圖片或 PDF 辨識並擷取文字。" wide>
      <Dropzone accept="image/*,application/pdf" kind={['image', 'pdf']} files={files} onFiles={setFiles} hint="支援圖片或 PDF（PDF 最多辨識前 10 頁）" />
      {files[0] && (
        <div className="border border-outline-variant rounded bg-surface-container-lowest p-md">
          <Field label="辨識語言">
            <Select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="eng">英文</option>
              <option value="chi_tra">繁體中文</option>
              <option value="chi_sim">簡體中文</option>
              <option value="chi_tra+eng">繁體中文 + 英文</option>
              <option value="jpn">日文</option>
            </Select>
          </Field>
        </div>
      )}
      {progress && <Banner kind="info">{progress}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="text_snippet">
          {busy ? '辨識中…' : '擷取文字'}
        </Button>
      </div>
      {text && (
        <div className="flex flex-col gap-sm">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 p-md border border-outline-variant rounded bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none focus:ring-1 focus:ring-tertiary-container resize-y"
          />
          <div className="flex justify-end gap-sm">
            <Button variant="ghost" icon="content_copy" onClick={() => navigator.clipboard.writeText(text)}>
              複製
            </Button>
            <Button icon="download" onClick={() => downloadBlob(new Blob([text], { type: 'text/plain' }), replaceExt(files[0].name, 'txt'))}>
              下載 .txt
            </Button>
          </div>
        </div>
      )}
    </ToolFrame>
  )
}
