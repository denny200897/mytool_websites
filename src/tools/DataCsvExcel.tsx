import { useState } from 'react'
import * as XLSX from 'xlsx'
import Dropzone from '../components/Dropzone'
import { Banner, Button, ToolFrame } from '../components/ui'
import { downloadBlob, replaceExt } from '../lib/utils'
import { addHistory } from '../lib/history'

export default function DataCsvExcel() {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setError('')
    setBusy(true)
    try {
      const text = await files[0].text()
      const wb = XLSX.read(text, { type: 'string' })
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      downloadBlob(
        new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        replaceExt(files[0].name, 'xlsx'),
      )
      addHistory({ toolSlug: 'data-csv-excel', toolName: 'CSV 轉 Excel', fileName: files[0].name, result: 'XLSX', ok: true })
    } catch (e) {
      setError((e as Error).message || '轉換失敗，請確認為有效的 CSV。')
      addHistory({ toolSlug: 'data-csv-excel', toolName: 'CSV 轉 Excel', fileName: files[0]?.name ?? '', result: '失敗', ok: false })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolFrame title="CSV 轉 Excel" subtitle="將 CSV 轉換為 .xlsx 試算表。">
      <Dropzone accept=".csv,text/csv" kind="csv" files={files} onFiles={setFiles} hint="選擇一個 CSV 檔" />
      {error && <Banner kind="error">{error}</Banner>}
      <div className="flex justify-center">
        <Button onClick={run} disabled={!files[0] || busy} icon="table_view">
          {busy ? '轉換中…' : '轉換為 Excel'}
        </Button>
      </div>
    </ToolFrame>
  )
}
