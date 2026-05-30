import { useState } from 'react'
import { PDFDocument } from '@cantoo/pdf-lib'
import Dropzone from '../components/Dropzone'
import { Banner, Button, ToolFrame } from '../components/ui'
import { downloadBlob } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function PdfMerge() {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setError('')
    setBusy(true)
    try {
      const merged = await PDFDocument.create()
      for (const file of files) {
        const src = await PDFDocument.load(await file.arrayBuffer())
        const pages = await merged.copyPages(src, src.getPageIndices())
        pages.forEach((p) => merged.addPage(p))
      }
      const bytes = await merged.save()
      downloadBlob(bytes, 'merged.pdf', 'application/pdf')
      addHistory({ toolSlug: 'pdf-merge', toolName: '合併 PDF', fileName: `merged.pdf（${files.length} 個檔案）`, result: 'PDF', ok: true })
    } catch (e) {
      setError((e as Error).message || '合併失敗，請確認檔案皆為有效的 PDF。')
      addHistory({ toolSlug: 'pdf-merge', toolName: '合併 PDF', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="合併 PDF" subtitle="將多個 PDF 依順序合併為一個檔案。">
      <Dropzone accept="application/pdf" kind="pdf" multiple files={files} onFiles={setFiles} hint="可一次選擇多個 PDF；合併順序依加入順序。" />
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={files.length < 2 || busy} icon="call_merge">
          {busy ? '合併中…' : `合併 ${files.length || ''} 個 PDF`}
        </Button>
      </div>
    </ToolFrame>
  )
}
