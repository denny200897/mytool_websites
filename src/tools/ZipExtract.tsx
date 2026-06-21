import { useState } from 'react'
import JSZip from 'jszip'
import Dropzone from '../components/Dropzone'
import { Banner, Button, ToolFrame } from '../components/ui'
import { downloadBlob, formatBytes, sanitizeFilename } from '../lib/utils'
import Icon from '../components/Icon'
import { addHistory } from '../lib/history'

interface Entry {
  name: string
  size: number
  blob: Blob
}

export default function ZipExtract() {
  const [files, setFiles] = useState<File[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setError('')
    setEntries([])
    setBusy(true)
    try {
      const zip = await JSZip.loadAsync(await files[0].arrayBuffer())
      const fileEntries = Object.values(zip.files).filter((e) => !e.dir)

      // Guard against zip bombs: too many entries or excessive total output.
      const MAX_ENTRIES = 2000
      const MAX_TOTAL_MB = 1024
      if (fileEntries.length > MAX_ENTRIES) {
        throw new Error(`壓縮檔項目過多（${fileEntries.length} 個，上限 ${MAX_ENTRIES}），已中止以避免風險。`)
      }

      const out: Entry[] = []
      let total = 0
      for (const entry of fileEntries) {
        const blob = await entry.async('blob')
        total += blob.size
        if (total > MAX_TOTAL_MB * 1024 * 1024) {
          throw new Error(`解壓後內容超過 ${MAX_TOTAL_MB} MB，已中止（疑似壓縮炸彈）。`)
        }
        out.push({ name: entry.name, size: blob.size, blob })
      }
      setEntries(out)
      addHistory({ toolSlug: 'zip-extract', toolName: '解壓縮 ZIP', fileName: files[0].name, result: `${out.length} 檔案`, ok: true })
    } catch (e) {
      setError((e as Error).message || '無法讀取此 ZIP。')
      addHistory({ toolSlug: 'zip-extract', toolName: '解壓縮 ZIP', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="解壓縮 ZIP" subtitle="檢視壓縮檔內容，並下載個別檔案。" wide>
      <Dropzone accept=".zip,application/zip" kind="zip" files={files} onFiles={setFiles} hint="選擇一個 ZIP 檔" />
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="unarchive">
          {busy ? '解壓縮中…' : '解壓縮'}
        </Button>
      </div>
      {entries.length > 0 && (
        <div className="border border-outline-variant rounded bg-surface-container-lowest divide-y divide-outline-variant overflow-hidden">
          {entries.map((e) => (
            <div key={e.name} className="flex items-center gap-md px-md h-[40px] hover:bg-surface-variant transition-colors">
              <Icon name="draft" size={16} className="text-outline" />
              <span className="font-body-sm text-body-sm text-on-surface flex-grow truncate" title={sanitizeFilename(e.name)}>
                {sanitizeFilename(e.name)}
              </span>
              <span className="font-label-xs text-label-xs text-secondary">{formatBytes(e.size)}</span>
              <button
                onClick={() => downloadBlob(e.blob, e.name.split('/').pop() || e.name)}
                className="p-xs text-secondary hover:text-primary rounded transition-colors"
                title="下載"
              >
                <Icon name="download" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToolFrame>
  )
}
