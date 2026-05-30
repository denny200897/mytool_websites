import { useState } from 'react'
import { XMLParser } from 'fast-xml-parser'
import { Banner, Button, ToolFrame } from '../components/ui'
import { downloadBlob } from '../lib/utils'
import { addHistory } from '../lib/history'

const SAMPLE = `<note>
  <to>讀者</to>
  <from>檔案工具箱</from>
  <items>
    <item id="1">PDF</item>
    <item id="2">圖片</item>
  </items>
</note>`

export default function DataXmlJson() {
  const [input, setInput] = useState(SAMPLE)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const run = () => {
    setError('')
    try {
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
      const obj = parser.parse(input)
      setOutput(JSON.stringify(obj, null, 2))
      addHistory({ toolSlug: 'data-xml-json', toolName: 'XML 轉 JSON', fileName: 'data.json', result: 'JSON', ok: true })
    } catch (e) {
      setOutput('')
      setError(`解析失敗：${(e as Error).message}`)
    }
  }

  return (
    <ToolFrame title="XML 轉 JSON" subtitle="把 XML 轉換為 JSON（保留屬性，前綴 @_）。" wide>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        <div className="flex flex-col gap-xs">
          <span className="font-label-xs text-label-xs text-secondary uppercase tracking-wider">XML</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-72 p-md border border-outline-variant rounded bg-surface-container-lowest font-mono text-body-sm text-on-surface outline-none focus:ring-1 focus:ring-tertiary-container resize-y"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-label-xs text-label-xs text-secondary uppercase tracking-wider">JSON</span>
          <textarea
            readOnly
            value={output}
            className="w-full h-72 p-md border border-outline-variant rounded bg-surface-container-low font-mono text-body-sm text-on-surface outline-none resize-y"
          />
        </div>
      </div>
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center gap-sm">
        <Button onClick={run} icon="data_object">
          轉換為 JSON
        </Button>
        <Button variant="ghost" icon="download" onClick={() => output && downloadBlob(new Blob([output], { type: 'application/json' }), 'data.json')}>
          下載
        </Button>
      </div>
    </ToolFrame>
  )
}
