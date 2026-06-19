import { useEffect, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { Banner, Button, ToolFrame } from '../components/ui'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function ImgRemoveBgAi() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  // Reset output whenever a new file is picked.
  useEffect(() => {
    setResult((url) => {
      if (url) URL.revokeObjectURL(url)
      return ''
    })
    setError('')
    setProgress('')
  }, [files])

  const run = async () => {
    if (!files[0]) return
    setError('')
    setBusy(true)
    setProgress('載入 AI 模型中…')
    try {
      // Dynamically imported so the ~40MB model + wasm only load on demand.
      const { removeBackground } = await import('@imgly/background-removal')
      const blob = await removeBackground(files[0], {
        progress: (key, current, total) => {
          const pct = total ? Math.round((current / total) * 100) : 0
          setProgress(key.startsWith('fetch') ? `下載模型中… ${pct}%` : `去背運算中… ${pct}%`)
        },
        output: { format: 'image/png' },
      })
      setResult((old) => {
        if (old) URL.revokeObjectURL(old)
        return URL.createObjectURL(blob)
      })
      downloadBlob(blob, replaceExt(files[0].name, 'nobg.png'), 'image/png')
      addHistory({ toolSlug: 'img-remove-bg-ai', toolName: 'AI 自動去背', fileName: files[0].name, result: 'PNG', ok: true })
    } catch (e) {
      setError((e as Error).message)
      addHistory({ toolSlug: 'img-remove-bg-ai', toolName: 'AI 自動去背', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  return (
    <ToolFrame title="AI 自動去背" subtitle="使用瀏覽器端 AI 模型自動辨識主體並移除背景，輸出透明 PNG。" wide>
      <Dropzone accept="image/*" kind="image" files={files} onFiles={setFiles} hint="選擇一張圖片（人物、商品、物件皆可）" />
      <Banner kind="info">首次使用需下載約 40MB 的 AI 模型，之後會由瀏覽器快取。整個過程在本機運算，不會上傳。</Banner>
      {result && (
        <div className="flex flex-col items-center gap-sm">
          <div
            className="inline-block max-w-full rounded border border-outline-variant overflow-hidden"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
            }}
          >
            <img src={result} className="block max-w-full h-auto" alt="去背結果" />
          </div>
          <p className="font-label-xs text-label-xs text-secondary">棋盤格代表透明區域，已自動下載 PNG。</p>
        </div>
      )}
      {busy && progress && <Banner kind="info">{progress}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="auto_awesome">
          {busy ? '處理中…' : 'AI 去背並下載 PNG'}
        </Button>
      </div>
    </ToolFrame>
  )
}
