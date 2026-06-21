import { useState } from 'react'
import { PDFDocument } from '@cantoo/pdf-lib'
import Dropzone from '../components/Dropzone'
import { Banner, Button, Field, TextInput, ToolFrame } from '../components/ui'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function PdfEncrypt() {
  const [files, setFiles] = useState<File[]>([])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const mismatch = confirm.length > 0 && password !== confirm
  const weakPassword = password.length > 0 && password.length < 8

  const run = async () => {
    setError('')
    if (password.length < 8) {
      setError('密碼至少需要 8 個字元。')
      return
    }
    if (password !== confirm) {
      setError('兩次輸入的密碼不一致。')
      return
    }
    setBusy(true)
    try {
      const doc = await PDFDocument.load(await files[0].arrayBuffer())
      // userPassword: required to open. ownerPassword: full control.
      doc.encrypt({
        userPassword: password,
        ownerPassword: password,
        permissions: { printing: 'highResolution', copying: true, modifying: false },
      })
      const bytes = await doc.save()
      downloadBlob(bytes, replaceExt(files[0].name, 'encrypted.pdf'), 'application/pdf')
      addHistory({ toolSlug: 'pdf-encrypt', toolName: '加密 PDF', fileName: files[0].name, result: '已加密', ok: true })
    } catch (e) {
      setError((e as Error).message || '加密失敗。')
      addHistory({ toolSlug: 'pdf-encrypt', toolName: '加密 PDF', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="加密 PDF" subtitle="設定開啟密碼，將 PDF 以 AES-256 加密。">
      <Dropzone accept="application/pdf" kind="pdf" files={files} onFiles={setFiles} hint="選擇一個 PDF" />
      {files[0] && (
        <div className="border border-outline-variant rounded bg-surface-container-lowest p-md flex flex-col gap-md">
          <Field label="設定密碼">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="開啟文件所需的密碼" />
          </Field>
          <Field label="確認密碼">
            <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="再次輸入" />
          </Field>
          {mismatch && <span className="font-label-xs text-label-xs text-error">兩次密碼不一致</span>}
          {weakPassword && <span className="font-label-xs text-label-xs text-error">密碼至少需要 8 個字元</span>}
        </div>
      )}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || !password || mismatch || weakPassword || busy} icon="lock">
          {busy ? '加密中…' : '加密 PDF'}
        </Button>
      </div>
    </ToolFrame>
  )
}
