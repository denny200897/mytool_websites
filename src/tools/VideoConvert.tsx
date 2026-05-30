import { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { Banner, Button, Field, Select, ToolFrame } from '../components/ui'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function VideoConvert() {
  const [files, setFiles] = useState<File[]>([])
  const [format, setFormat] = useState<'mp4' | 'webm' | 'gif'>('mp4')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  const run = async () => {
    setError('')
    setBusy(true)
    setProgress('載入轉檔引擎（首次約需下載 ~30MB）…')
    try {
      const { getFFmpeg, fetchFile } = await import('../lib/ffmpeg')
      const ff = await getFFmpeg()
      ff.on('progress', ({ progress: p }) => setProgress(`轉換中… ${Math.min(100, Math.round(p * 100))}%`))
      const input = 'input'
      const output = `output.${format}`
      await ff.writeFile(input, await fetchFile(files[0]))
      const args =
        format === 'gif'
          ? ['-i', input, '-vf', 'fps=10,scale=480:-1:flags=lanczos', output]
          : ['-i', input, output]
      await ff.exec(args)
      const data = (await ff.readFile(output)) as Uint8Array
      const mime = { mp4: 'video/mp4', webm: 'video/webm', gif: 'image/gif' }[format]
      downloadBlob(new Blob([new Uint8Array(data)], { type: mime }), replaceExt(files[0].name, format), mime)
      addHistory({ toolSlug: 'video-convert', toolName: '轉換影片格式', fileName: files[0].name, result: format.toUpperCase(), ok: true })
    } catch (e) {
      setError((e as Error).message || '轉換失敗。')
      addHistory({ toolSlug: 'video-convert', toolName: '轉換影片格式', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  return (
    <ToolFrame title="轉換影片格式" subtitle="在瀏覽器內以 ffmpeg.wasm 轉換影片（MP4 / WebM / GIF）。">
      <Dropzone accept="video/*" kind="video" files={files} onFiles={setFiles} hint="選擇一個影片檔" />
      {files[0] && (
        <div className="border border-outline-variant rounded bg-surface-container-lowest p-md">
          <Field label="輸出格式">
            <Select value={format} onChange={(e) => setFormat(e.target.value as 'mp4' | 'webm' | 'gif')}>
              <option value="mp4">MP4 (H.264)</option>
              <option value="webm">WebM</option>
              <option value="gif">GIF 動圖</option>
            </Select>
          </Field>
        </div>
      )}
      {progress && <Banner kind="info">{progress}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="sync_alt">
          {busy ? '處理中…' : `轉換為 ${format.toUpperCase()}`}
        </Button>
      </div>
    </ToolFrame>
  )
}
