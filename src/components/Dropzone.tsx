import { useRef, useState } from 'react'
import Icon from './Icon'
import { formatBytes } from '../lib/utils'
import { validateFile, type FileKind } from '../lib/validate'

interface DropzoneProps {
  accept?: string
  multiple?: boolean
  files: File[]
  onFiles: (files: File[]) => void
  hint?: string
  /** Allowed file kind(s) — validated by magic bytes, not just extension. */
  kind?: FileKind | FileKind[]
  /** Override the size cap (MB). */
  maxSizeMB?: number
}

export default function Dropzone({
  accept,
  multiple = false,
  files,
  onFiles,
  hint,
  kind = 'any',
  maxSizeMB,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [rejected, setRejected] = useState<string[]>([])

  const addFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return
    const incoming = Array.from(list)
    const accepted: File[] = []
    const errors: string[] = []
    for (const file of incoming) {
      const res = await validateFile(file, kind, maxSizeMB)
      if (res.ok) accepted.push(file)
      else errors.push(`${file.name}：${res.reason}`)
    }
    setRejected(errors)
    if (accepted.length === 0) return
    onFiles(multiple ? [...files, ...accepted] : [accepted[0]])
  }

  const removeAt = (i: number) => onFiles(files.filter((_, idx) => idx !== i))

  return (
    <div className="w-full flex flex-col gap-md">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          void addFiles(e.dataTransfer.files)
        }}
        className={`w-full border border-dashed rounded-lg p-xl flex flex-col items-center justify-center min-h-[200px] cursor-pointer transition-all ${
          drag
            ? 'border-tertiary-container bg-secondary-container/40'
            : 'border-outline-variant bg-surface-container-lowest hover:border-secondary hover:bg-surface'
        }`}
      >
        <Icon name="upload_file" size={36} className="text-secondary mb-sm" />
        <p className="font-label-md text-label-md text-on-surface">
          拖曳檔案到這裡，或 <span className="underline underline-offset-2">點擊瀏覽</span>
        </p>
        {hint && <p className="font-label-xs text-label-xs text-secondary mt-xs">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            void addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {rejected.length > 0 && (
        <div className="flex flex-col gap-xs bg-error-container text-on-error-container rounded px-md py-sm">
          {rejected.map((r, i) => (
            <div key={i} className="flex items-center gap-sm font-body-sm text-body-sm">
              <Icon name="block" size={16} />
              <span className="break-all">{r}</span>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-sm">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="border border-outline-variant rounded bg-surface p-md flex items-center justify-between"
            >
              <div className="flex items-center gap-md min-w-0">
                <div className="w-9 h-9 bg-secondary-fixed-dim rounded flex items-center justify-center text-on-secondary-fixed shrink-0">
                  <Icon name="draft" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface truncate max-w-[360px]" title={f.name}>
                    {f.name}
                  </p>
                  <p className="font-label-xs text-label-xs text-secondary">{formatBytes(f.size)}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeAt(i)
                }}
                className="p-xs text-secondary hover:text-error hover:bg-error-container rounded transition-colors shrink-0"
                title="移除檔案"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
