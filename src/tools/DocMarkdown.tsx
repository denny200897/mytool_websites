import { useMemo, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Button, ToolFrame } from '../components/ui'
import { downloadBlob } from '../lib/utils'
import { addHistory } from '../lib/history'

const SAMPLE = `# 標題

這是一段 **Markdown** 文字，支援 *斜體*、\`程式碼\` 與清單：

- 項目一
- 項目二

> 引用區塊

\`\`\`js
console.log('hello')
\`\`\`
`

export default function DocMarkdown() {
  const [md, setMd] = useState(SAMPLE)

  // marked does not sanitize; strip any embedded scripts/handlers so a
  // malicious snippet can't run in our origin (preview, copy, or download).
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(md, { async: false }) as string), [md])

  const fullDoc = `<!DOCTYPE html>
<html lang="zh-Hant"><head><meta charset="utf-8"><title>Document</title></head>
<body>
${html}
</body></html>`

  return (
    <ToolFrame title="Markdown 轉 HTML" subtitle="即時預覽，並可下載完整 HTML 檔。" wide>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        <div className="flex flex-col gap-xs">
          <span className="font-label-xs text-label-xs text-secondary uppercase tracking-wider">Markdown</span>
          <textarea
            value={md}
            onChange={(e) => setMd(e.target.value)}
            className="w-full h-80 p-md border border-outline-variant rounded bg-surface-container-lowest font-mono text-body-sm text-on-surface outline-none focus:ring-1 focus:ring-tertiary-container resize-y"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-label-xs text-label-xs text-secondary uppercase tracking-wider">預覽</span>
          <div
            className="w-full h-80 p-md border border-outline-variant rounded bg-surface-container-lowest overflow-auto prose-sm"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
      <div className="flex justify-center gap-sm">
        <Button variant="ghost" icon="content_copy" onClick={() => navigator.clipboard.writeText(html)}>
          複製 HTML
        </Button>
        <Button
          icon="download"
          onClick={() => {
            downloadBlob(new Blob([fullDoc], { type: 'text/html' }), 'document.html')
            addHistory({ toolSlug: 'doc-md', toolName: 'Markdown 轉 HTML', fileName: 'document.html', result: 'HTML', ok: true })
          }}
        >
          下載 HTML
        </Button>
      </div>
    </ToolFrame>
  )
}
