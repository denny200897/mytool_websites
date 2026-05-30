import { useEffect, useState } from 'react'

export interface HistoryEntry {
  id: string
  toolSlug: string
  toolName: string
  fileName: string
  result: string // e.g. "PDF", "PNG" or "失敗"
  ok: boolean
  at: number // epoch ms
}

const KEY = 'fileutil.history'
const MAX = 50

function read(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function write(entries: HistoryEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)))
  window.dispatchEvent(new Event('fileutil.history.changed'))
}

export function addHistory(entry: Omit<HistoryEntry, 'id' | 'at'>) {
  const entries = read()
  entries.unshift({ ...entry, id: crypto.randomUUID(), at: Date.now() })
  write(entries)
}

export function clearHistory() {
  write([])
}

/** Reactive hook backed by localStorage + a custom event. */
export function useHistory(): HistoryEntry[] {
  const [entries, setEntries] = useState<HistoryEntry[]>(read)
  useEffect(() => {
    const update = () => setEntries(read())
    window.addEventListener('fileutil.history.changed', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('fileutil.history.changed', update)
      window.removeEventListener('storage', update)
    }
  }, [])
  return entries
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '剛剛'
  if (min < 60) return `${min} 分鐘前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小時前`
  const day = Math.floor(hr / 24)
  if (day === 1) return '昨天'
  if (day < 7) return `${day} 天前`
  if (day < 14) return '上週'
  return new Date(ts).toLocaleDateString('zh-Hant')
}
