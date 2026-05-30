import { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { Banner, Button, ToolFrame } from '../components/ui'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function VideoMute() {
  const [files, setFiles] = useState<File[]>([])
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
      ff.on('progress', ({ progress: p }) => setProgress(`處理中… ${Math.min(100, Math.round(p * 100))}%`))
      const ext = files[0].name.split('.').pop() || 'mp4'
      const input = `input.${ext}`
      const output = `muted.${ext}`
      await ff.writeFile(input, await fetchFile(files[0]))
      // Copy the video stream, drop all audio (-an).
      await ff.exec(['-i', input, '-c', 'copy', '-an', output])
      const data = (await ff.readFile(output)) as Uint8Array
      downloadBlob(new Blob([new Uint8Array(data)], { type: files[0].type || 'video/mp4' }), replaceExt(files[0].name, `muted.${ext}`))
      addHistory({ toolSlug: 'video-mute', toolName: '靜音影片', fileName: files[0].name, result: 'OK', ok: true })
    } catch (e) {
      setError((e as Error).message || '處理失敗。')
      addHistory({ toolSlug: 'video-mute', toolName: '靜音影片', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  return (
    <ToolFrame title="靜音影片" subtitle="移除影片的音軌（保留畫面，無損快速處理）。">
      <Dropzone accept="video/*" kind="video" files={files} onFiles={setFiles} hint="選擇一個影片檔" />
      {progress && <Banner kind="info">{progress}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="volume_off">
          {busy ? '處理中…' : '移除音軌'}
        </Button>
      </div>
    </ToolFrame>
  )
}
