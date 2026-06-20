export type ToolStatus = 'ready' | 'soon'

export interface ToolDef {
  id: string
  /** Display name (Traditional Chinese) */
  name: string
  /** Short English subtitle used in search + tooltips */
  subtitle: string
  /** Material Symbols icon name */
  icon: string
  /** route slug under /tool/ */
  slug: string
  status: ToolStatus
}

export interface CategoryDef {
  id: string
  name: string
  icon: string
  tools: ToolDef[]
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: 'pdf',
    name: 'PDF 工具',
    icon: 'picture_as_pdf',
    tools: [
      { id: 'pdf-merge', name: '合併 PDF', subtitle: 'Merge PDF', icon: 'call_merge', slug: 'pdf-merge', status: 'ready' },
      { id: 'pdf-split', name: '分割 PDF', subtitle: 'Split PDF', icon: 'call_split', slug: 'pdf-split', status: 'ready' },
      { id: 'pdf-compress', name: '壓縮 PDF', subtitle: 'Compress PDF', icon: 'compress', slug: 'pdf-compress', status: 'ready' },
      { id: 'pdf-encrypt', name: '加密 PDF', subtitle: 'Encrypt PDF', icon: 'lock', slug: 'pdf-encrypt', status: 'ready' },
      { id: 'pdf-decrypt', name: '解鎖 PDF', subtitle: 'Unlock PDF', icon: 'lock_open', slug: 'pdf-decrypt', status: 'ready' },
      { id: 'pdf-images', name: 'PDF 轉圖片', subtitle: 'PDF to images', icon: 'imagesmode', slug: 'pdf-images', status: 'ready' },
    ],
  },
  {
    id: 'image',
    name: '圖片工具',
    icon: 'image',
    tools: [
      { id: 'img-convert', name: '轉換圖片格式', subtitle: 'Convert image', icon: 'transform', slug: 'img-convert', status: 'ready' },
      { id: 'img-resize', name: '調整圖片大小', subtitle: 'Resize image', icon: 'aspect_ratio', slug: 'img-resize', status: 'ready' },
      { id: 'img-crop', name: '裁剪圖片', subtitle: 'Crop image', icon: 'crop', slug: 'img-crop', status: 'ready' },
      { id: 'img-eraser', name: '圖片橡皮擦', subtitle: 'Erase image', icon: 'ink_eraser', slug: 'img-eraser', status: 'ready' },
      { id: 'img-compress', name: '壓縮圖片', subtitle: 'Compress image', icon: 'compress', slug: 'img-compress', status: 'ready' },
      { id: 'img-remove-bg', name: '去除背景', subtitle: 'Remove background', icon: 'auto_fix_high', slug: 'img-remove-bg', status: 'ready' },
      { id: 'img-remove-bg-ai', name: 'AI 自動去背', subtitle: 'AI remove background', icon: 'auto_awesome', slug: 'img-remove-bg-ai', status: 'ready' },
      { id: 'img-watermark', name: '添加浮水印', subtitle: 'Add watermark', icon: 'water_drop', slug: 'img-watermark', status: 'ready' },
      { id: 'img-to-pdf', name: '圖片轉 PDF', subtitle: 'Images to PDF', icon: 'picture_as_pdf', slug: 'img-to-pdf', status: 'ready' },
    ],
  },
  {
    id: 'document',
    name: '文件工具',
    icon: 'article',
    tools: [
      { id: 'doc-ocr', name: '擷取文字 (OCR)', subtitle: 'Extract text (OCR)', icon: 'text_snippet', slug: 'doc-ocr', status: 'ready' },
      { id: 'doc-md', name: 'Markdown 轉 HTML', subtitle: 'Markdown to HTML', icon: 'markdown', slug: 'doc-md', status: 'ready' },
      { id: 'doc-md-pdf', name: 'Markdown 轉 PDF', subtitle: 'Markdown to PDF', icon: 'picture_as_pdf', slug: 'doc-md-pdf', status: 'ready' },
    ],
  },
  {
    id: 'archive',
    name: '壓縮檔工具',
    icon: 'folder_zip',
    tools: [
      { id: 'zip-extract', name: '解壓縮 ZIP', subtitle: 'Extract ZIP', icon: 'unarchive', slug: 'zip-extract', status: 'ready' },
      { id: 'zip-create', name: '建立 ZIP', subtitle: 'Create ZIP', icon: 'archive', slug: 'zip-create', status: 'ready' },
    ],
  },
  {
    id: 'data',
    name: '數據工具',
    icon: 'database',
    tools: [
      { id: 'data-csv-excel', name: 'CSV 轉 Excel', subtitle: 'CSV to Excel', icon: 'table_view', slug: 'data-csv-excel', status: 'ready' },
      { id: 'data-json', name: 'JSON 格式化', subtitle: 'Format JSON', icon: 'code', slug: 'data-json', status: 'ready' },
      { id: 'data-xml-json', name: 'XML 轉 JSON', subtitle: 'XML to JSON', icon: 'data_object', slug: 'data-xml-json', status: 'ready' },
    ],
  },
  {
    id: 'video',
    name: '影片工具',
    icon: 'movie',
    tools: [
      { id: 'video-convert', name: '轉換影片格式', subtitle: 'Convert video', icon: 'sync_alt', slug: 'video-convert', status: 'ready' },
      { id: 'video-trim', name: '剪輯影片', subtitle: 'Trim video', icon: 'content_cut', slug: 'video-trim', status: 'ready' },
      { id: 'video-mute', name: '靜音影片', subtitle: 'Mute video', icon: 'volume_off', slug: 'video-mute', status: 'ready' },
    ],
  },
]

export const ALL_TOOLS: ToolDef[] = CATEGORIES.flatMap((c) => c.tools)

export function findTool(slug: string): { tool: ToolDef; category: CategoryDef } | undefined {
  for (const category of CATEGORIES) {
    const tool = category.tools.find((t) => t.slug === slug)
    if (tool) return { tool, category }
  }
  return undefined
}
