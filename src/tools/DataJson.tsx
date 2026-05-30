import { useState } from 'react'
import { Banner, Button, ToolFrame } from '../components/ui'
import { downloadBlob } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function DataJson() {
  const [input, setInput] = useState('{"name":"檔案工具箱","tools":["pdf","image"],"ok":true}')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const process = (mode: 'pretty' | 'minify') => {
    setError('')
    setOk('')
    try {
      const obj = JSON.parse(input)
      const result = mode === 'pretty' ? JSON.stringify(obj, null, 2) : JSON.stringify(obj)
      setOutput(result)
      setOk(mode === 'pretty' ? '已格式化，JSON 有效 ✓' : '已壓縮，JSON 有效 ✓')
      addHistory({ toolSlug: 'data-json', toolName: 'JSON 格式化', fileName: `json.${mode}`, result: 'JSON', ok: true })
    } catch (e) {
      setOutput('')
      setError(`無效的 JSON：${(e as Error).message}`)
    }
  }

  return (
    <ToolFrame title="JSON 格式化" subtitle="美化、壓縮並驗證 JSON。" wide>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        <div className="flex flex-col gap-xs">
          <span className="font-label-xs text-label-xs text-secondary uppercase tracking-wider">輸入</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-72 p-md border border-outline-variant rounded bg-surface-container-lowest font-mono text-body-sm text-on-surface outline-none focus:ring-1 focus:ring-tertiary-container resize-y"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-label-xs text-label-xs text-secondary uppercase tracking-wider">輸出</span>
          <textarea
            readOnly
            value={output}
            className="w-full h-72 p-md border border-outline-variant rounded bg-surface-container-low font-mono text-body-sm text-on-surface outline-none resize-y"
          />
        </div>
      </div>
      {ok && <Banner kind="success">{ok}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center gap-sm flex-wrap">
        <Button onClick={() => process('pretty')} icon="format_align_left">
          格式化
        </Button>
        <Button variant="ghost" onClick={() => process('minify')} icon="compress">
          壓縮
        </Button>
        <Button variant="ghost" icon="download" onClick={() => output && downloadBlob(new Blob([output], { type: 'application/json' }), 'formatted.json')}>
          下載
        </Button>
      </div>
    </ToolFrame>
  )
}
