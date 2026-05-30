import { useEffect, useState } from 'react'
import { PDFDocument } from '@cantoo/pdf-lib'
import JSZip from 'jszip'
import Dropzone from '../components/Dropzone'
import { Banner, Button, Field, TextInput, ToolFrame } from '../components/ui'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

/** Parse "1-3,5,8-10" into a sorted, de-duped list of 0-based page indices. */
function parseRanges(input: string, total: number): number[] {
  const set = new Set<number>()
  for (const part of input.split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:-(\d+))?$/)
    if (!m) throw new Error(`無法解析範圍：「${part}」`)
    const start = parseInt(m[1], 10)
    const end = m[2] ? parseInt(m[2], 10) : start
    for (let p = start; p <= end; p++) {
      if (p < 1 || p > total) throw new Error(`頁碼 ${p} 超出範圍（共 ${total} 頁）`)
      set.add(p - 1)
    }
  }
  return [...set].sort((a, b) => a - b)
}

export default function PdfSplit() {
  const [files, setFiles] = useState<File[]>([])
  const [pageCount, setPageCount] = useState(0)
  const [mode, setMode] = useState<'each' | 'range'>('each')
  const [ranges, setRanges] = useState('1')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    setPageCount(0)
    if (!files[0]) return
    files[0]
      .arrayBuffer()
      .then((b) => PDFDocument.load(b))
      .then((doc) => setPageCount(doc.getPageCount()))
      .catch(() => setError('無法讀取此 PDF。'))
  }, [files])

  const run = async () => {
    setError('')
    setBusy(true)
    try {
      const src = await PDFDocument.load(await files[0].arrayBuffer())
      if (mode === 'each') {
        const zip = new JSZip()
        for (let i = 0; i < src.getPageCount(); i++) {
          const out = await PDFDocument.create()
          const [pg] = await out.copyPages(src, [i])
          out.addPage(pg)
          zip.file(replaceExt(files[0].name, `p${i + 1}.pdf`), await out.save())
        }
        downloadBlob(await zip.generateAsync({ type: 'blob' }), replaceExt(files[0].name, 'pages.zip'))
      } else {
        const indices = parseRanges(ranges, src.getPageCount())
        const out = await PDFDocument.create()
        const pages = await out.copyPages(src, indices)
        pages.forEach((p) => out.addPage(p))
        downloadBlob(await out.save(), replaceExt(files[0].name, 'split.pdf'), 'application/pdf')
      }
      addHistory({ toolSlug: 'pdf-split', toolName: '分割 PDF', fileName: files[0].name, result: 'PDF', ok: true })
    } catch (e) {
      setError((e as Error).message || '分割失敗。')
      addHistory({ toolSlug: 'pdf-split', toolName: '分割 PDF', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="分割 PDF" subtitle="把每一頁拆成獨立檔案，或只擷取指定頁面範圍。">
      <Dropzone accept="application/pdf" kind="pdf" files={files} onFiles={setFiles} hint={pageCount ? `共 ${pageCount} 頁` : '選擇一個 PDF'} />
      {files[0] && (
        <div className="flex flex-col gap-md border border-outline-variant rounded bg-surface-container-lowest p-md">
          <div className="flex gap-md">
            <label className="flex items-center gap-xs font-body-sm text-body-sm cursor-pointer">
              <input type="radio" checked={mode === 'each'} onChange={() => setMode('each')} /> 每頁一個檔案 (ZIP)
            </label>
            <label className="flex items-center gap-xs font-body-sm text-body-sm cursor-pointer">
              <input type="radio" checked={mode === 'range'} onChange={() => setMode('range')} /> 擷取指定範圍
            </label>
          </div>
          {mode === 'range' && (
            <Field label="頁面範圍（例如 1-3,5,8-10）">
              <TextInput value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="1-3,5" />
            </Field>
          )}
        </div>
      )}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="call_split">
          {busy ? '處理中…' : '分割 PDF'}
        </Button>
      </div>
    </ToolFrame>
  )
}
