import { useState } from 'react'
import { PDFDocument } from '@cantoo/pdf-lib'
import Dropzone from '../components/Dropzone'
import { Banner, Button, Field, TextInput, ToolFrame } from '../components/ui'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function PdfDecrypt() {
  const [files, setFiles] = useState<File[]>([])
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setError('')
    setBusy(true)
    try {
      // Loading with the correct password decrypts the document. Copying the
      // pages into a fresh document drops the encryption dictionary entirely,
      // so the output is cleanly password-free (no dangling /Encrypt entry).
      const src = await PDFDocument.load(await files[0].arrayBuffer(), { password })
      const out = await PDFDocument.create()
      const pages = await out.copyPages(src, src.getPageIndices())
      pages.forEach((p) => out.addPage(p))
      const bytes = await out.save()
      downloadBlob(bytes, replaceExt(files[0].name, 'unlocked.pdf'), 'application/pdf')
      addHistory({ toolSlug: 'pdf-decrypt', toolName: '解鎖 PDF', fileName: files[0].name, result: '已解鎖', ok: true })
    } catch (e) {
      const msg = (e as Error).message || ''
      setError(
        /password|encrypt|decrypt/i.test(msg)
          ? '密碼錯誤，或此 PDF 無法解鎖。'
          : msg || '解鎖失敗。',
      )
      addHistory({ toolSlug: 'pdf-decrypt', toolName: '解鎖 PDF', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="解鎖 PDF" subtitle="輸入密碼以移除 PDF 的開啟限制。">
      <Dropzone accept="application/pdf" kind="pdf" files={files} onFiles={setFiles} hint="選擇一個受密碼保護的 PDF" />
      {files[0] && (
        <div className="border border-outline-variant rounded bg-surface-container-lowest p-md">
          <Field label="PDF 密碼">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="目前的開啟密碼" />
          </Field>
        </div>
      )}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="lock_open">
          {busy ? '解鎖中…' : '解鎖 PDF'}
        </Button>
      </div>
    </ToolFrame>
  )
}
