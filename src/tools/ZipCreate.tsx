import { useState } from 'react'
import JSZip from 'jszip'
import Dropzone from '../components/Dropzone'
import { Banner, Button, TextInput, Field, ToolFrame } from '../components/ui'
import { downloadBlob } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function ZipCreate() {
  const [files, setFiles] = useState<File[]>([])
  const [name, setName] = useState('archive')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setError('')
    setBusy(true)
    try {
      const zip = new JSZip()
      files.forEach((f) => zip.file(f.name, f))
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
      downloadBlob(blob, `${name || 'archive'}.zip`)
      addHistory({ toolSlug: 'zip-create', toolName: '建立 ZIP', fileName: `${name}.zip（${files.length} 檔案）`, result: 'ZIP', ok: true })
    } catch (e) {
      setError((e as Error).message)
      addHistory({ toolSlug: 'zip-create', toolName: '建立 ZIP', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="建立 ZIP" subtitle="把多個檔案壓縮成一個 ZIP。">
      <Dropzone multiple files={files} onFiles={setFiles} hint="可一次選擇多個檔案" />
      {files.length > 0 && (
        <div className="border border-outline-variant rounded bg-surface-container-lowest p-md">
          <Field label="壓縮檔名稱">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="archive" />
          </Field>
        </div>
      )}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={files.length === 0 || busy} icon="archive">
          {busy ? '壓縮中…' : `建立 ZIP（${files.length} 檔案）`}
        </Button>
      </div>
    </ToolFrame>
  )
}
