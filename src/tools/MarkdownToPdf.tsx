import { useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Dropzone from '../components/Dropzone'
import { Banner, Button, ToolFrame } from '../components/ui'
import { addHistory } from '../lib/history'

const SAMPLE = `# 報告標題

這是一份用 **Markdown** 撰寫的文件，會輸出為 PDF。

## 章節

- 支援清單
- **粗體**、*斜體*、\`程式碼\`
- 表格與引用

> 引用區塊範例。

| 項目 | 數量 |
|------|------|
| PDF  | 12   |
| 圖片 | 34   |

\`\`\`js
console.log('hello pdf')
\`\`\`
`

// Print-oriented stylesheet: clean A4 typography with full CJK support
// (uses the system/installed fonts, so no large font download is needed).
const PRINT_CSS = `
/* margin:0 makes browsers omit their own header/footer (page title, URL,
   date/time); the real page margin lives on <body> instead. */
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang TC', 'Microsoft JhengHei', 'Noto Sans CJK TC', 'Segoe UI', sans-serif;
  color: #191c1e; line-height: 1.7; font-size: 12pt;
  padding: 18mm 16mm;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
h1 { font-size: 21pt; border-bottom: 1px solid #d0d4d8; padding-bottom: .3em; margin: 0 0 .6em; }
h2 { font-size: 16pt; margin: 1.5em 0 .5em; }
h3 { font-size: 13.5pt; margin: 1.2em 0 .4em; }
p, ul, ol, blockquote, table { margin: .6em 0; }
ul, ol { padding-left: 1.6em; }
li { margin: .2em 0; }
/* inline code */
code { background: #eef1f4; color: #0f2a4a; padding: .12em .4em; border-radius: 4px;
  font-size: .86em; font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }
/* code block — clean, GitHub-like; light bg prints reliably */
pre {
  background: #f6f8fa; border: 1px solid #e0e3e5; border-radius: 8px;
  padding: 14px 16px; margin: .9em 0; overflow: hidden;
  font-size: 10pt; line-height: 1.6; color: #24292f;
  font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere;
  page-break-inside: avoid;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
pre code { background: none; color: inherit; padding: 0; font-size: inherit; white-space: inherit; border-radius: 0; }
blockquote { border-left: 3px solid #c6c6cd; padding: .1em 14px; color: #45464d; margin: .8em 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #c6c6cd; padding: 6px 10px; text-align: left; }
th { background: #f2f4f6; }
img { max-width: 100%; }
a { color: #004395; }
`

export default function MarkdownToPdf() {
  const [files, setFiles] = useState<File[]>([])
  const [md, setMd] = useState(SAMPLE)
  const [error, setError] = useState('')

  // Load a dropped .md file into the editor.
  const onFiles = async (fs: File[]) => {
    setFiles(fs)
    if (fs[0]) {
      try {
        setMd(await fs[0].text())
      } catch {
        setError('無法讀取此檔案。')
      }
    }
  }

  const run = async () => {
    setError('')
    try {
      const html = DOMPurify.sanitize(marked.parse(md, { async: false }) as string)
      const doc = `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8">
<title>${files[0]?.name?.replace(/\.md$/i, '') ?? 'document'}</title>
<style>${PRINT_CSS}</style></head><body>${html}</body></html>`

      const win = window.open('', '_blank')
      if (!win) {
        setError('瀏覽器封鎖了彈出視窗，請允許後再試一次。')
        return
      }
      win.document.open()
      win.document.write(doc)
      win.document.close()

      // Print only once, and only after images have finished loading — otherwise
      // the print dialog snapshots the page while images are still blank.
      let printed = false
      const triggerPrint = () => {
        if (printed) return
        printed = true
        try {
          win.focus()
          win.print()
        } catch {
          /* ignore */
        }
      }
      const waitForImages = () => {
        const imgs = Array.from(win.document.images)
        const pending = imgs.filter((img) => !img.complete)
        if (pending.length === 0) {
          triggerPrint()
          return
        }
        let left = pending.length
        const done = () => {
          if (--left <= 0) triggerPrint()
        }
        pending.forEach((img) => {
          img.addEventListener('load', done)
          img.addEventListener('error', done)
        })
        // Safety net: don't let a single hanging image block printing forever.
        setTimeout(triggerPrint, 8000)
      }
      win.onload = waitForImages
      // Fallback in case onload already fired before the handler was attached.
      setTimeout(waitForImages, 300)
      addHistory({ toolSlug: 'doc-md-pdf', toolName: 'Markdown 轉 PDF', fileName: files[0]?.name ?? 'document.md', result: 'PDF', ok: true })
    } catch (e) {
      setError((e as Error).message || '產生失敗。')
    }
  }

  return (
    <ToolFrame title="Markdown 轉 PDF" subtitle="把 Markdown 排版為 A4 文件並輸出 PDF（含完整中文與表格支援）。" wide>
      <Dropzone accept=".md,.markdown,text/markdown,text/plain" kind="text" files={files} onFiles={onFiles} hint="可拖入 .md 檔，或直接在下方編輯" />
      <div className="flex flex-col gap-xs">
        <span className="font-label-xs text-label-xs text-secondary uppercase tracking-wider">Markdown 內容</span>
        <textarea
          value={md}
          onChange={(e) => setMd(e.target.value)}
          className="w-full h-72 p-md border border-outline-variant rounded bg-surface-container-lowest font-mono text-body-sm text-on-surface outline-none focus:ring-1 focus:ring-tertiary-container resize-y"
        />
      </div>
      <Banner kind="info">
        會開啟列印視窗，在「目的地」選擇<strong>「另存為 PDF」</strong>即可儲存。已自動移除頁首頁尾；若瀏覽器仍顯示網址或日期，請在對話框中關閉「頁首及頁尾」選項。
      </Banner>
      <Banner kind="info">
        圖片支援<strong>完整網址（https://…）</strong>或 <strong>data: 內嵌</strong>；本機相對路徑（如 <code>./img.png</code>）因瀏覽器無法存取本機檔案而無法顯示。系統會等圖片載入完成後才開啟列印。
      </Banner>
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!md.trim()} icon="picture_as_pdf">
          產生 PDF
        </Button>
      </div>
    </ToolFrame>
  )
}
