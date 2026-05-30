import { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { Banner, Button, Field, TextInput, ToolFrame } from '../components/ui'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function VideoTrim() {
  const [files, setFiles] = useState<File[]>([])
  const [start, setStart] = useState('00:00:00')
  const [end, setEnd] = useState('00:00:10')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  const run = async () => {
    setError('')
    setBusy(true)
    setProgress('載入轉檔引擎…')
    try {
      const { getFFmpeg, fetchFile } = await import('../lib/ffmpeg')
      const ff = await getFFmpeg()
      ff.on('progress', ({ progress: p }) => setProgress(`剪輯中… ${Math.min(100, Math.round(p * 100))}%`))
      const ext = files[0].name.split('.').pop() || 'mp4'
      const input = `input.${ext}`
      const output = `trimmed.${ext}`
      await ff.writeFile(input, await fetchFile(files[0]))
      // -ss/-to with stream copy: fast, lossless trim.
      await ff.exec(['-i', input, '-ss', start, '-to', end, '-c', 'copy', output])
      const data = (await ff.readFile(output)) as Uint8Array
      downloadBlob(new Blob([new Uint8Array(data)], { type: files[0].type || 'video/mp4' }), replaceExt(files[0].name, `trimmed.${ext}`))
      addHistory({ toolSlug: 'video-trim', toolName: '剪輯影片', fileName: files[0].name, result: 'OK', ok: true })
    } catch (e) {
      setError((e as Error).message || '剪輯失敗。')
      addHistory({ toolSlug: 'video-trim', toolName: '剪輯影片', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  return (
    <ToolFrame title="剪輯影片" subtitle="擷取指定時間區間（格式 時:分:秒）。">
      <Dropzone accept="video/*" kind="video" files={files} onFiles={setFiles} hint="選擇一個影片檔" />
      {files[0] && (
        <div className="grid grid-cols-2 gap-md border border-outline-variant rounded bg-surface-container-lowest p-md">
          <Field label="開始時間">
            <TextInput value={start} onChange={(e) => setStart(e.target.value)} placeholder="00:00:00" />
          </Field>
          <Field label="結束時間">
            <TextInput value={end} onChange={(e) => setEnd(e.target.value)} placeholder="00:00:10" />
          </Field>
        </div>
      )}
      {progress && <Banner kind="info">{progress}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="content_cut">
          {busy ? '處理中…' : '剪輯影片'}
        </Button>
      </div>
    </ToolFrame>
  )
}
