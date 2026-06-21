import Icon from '../components/Icon'
import { clearHistory } from '../lib/history'
import { useSeo } from '../lib/seo'

export default function Settings() {
  useSeo({ title: '設定', description: '管理檔案工具箱的隱私與本機資料設定。' })
  return (
    <main className="flex-grow container mx-auto px-margin py-margin max-w-2xl w-full flex flex-col gap-margin">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">設定</h1>

      <section className="border border-outline-variant rounded bg-surface-container-lowest overflow-hidden">
        <div className="border-b border-outline-variant px-md py-sm bg-surface-container-low">
          <h2 className="font-label-xs text-label-xs text-secondary uppercase tracking-wider">隱私</h2>
        </div>
        <div className="p-md flex flex-col gap-md">
          <div className="flex items-start gap-sm text-on-surface-variant">
            <Icon name="shield" size={18} className="text-secondary mt-0.5" />
            <p className="font-body-sm text-body-sm">
              所有檔案都在你的瀏覽器本地處理，<strong>不會上傳到任何伺服器</strong>。
              歷史紀錄僅儲存檔名與時間，存放在這台裝置的 localStorage。
            </p>
          </div>
          <button
            onClick={() => {
              clearHistory()
              alert('已清除歷史紀錄。')
            }}
            className="self-start font-label-md text-label-md border border-outline-variant rounded px-md py-[6px] hover:bg-surface-variant transition-colors flex items-center gap-xs"
          >
            <Icon name="delete" size={16} />
            清除歷史紀錄
          </button>
        </div>
      </section>

      <section className="border border-outline-variant rounded bg-surface-container-lowest overflow-hidden">
        <div className="border-b border-outline-variant px-md py-sm bg-surface-container-low">
          <h2 className="font-label-xs text-label-xs text-secondary uppercase tracking-wider">關於</h2>
        </div>
        <div className="p-md flex flex-col gap-xs text-on-surface-variant font-body-sm text-body-sm">
          <p>檔案工具箱 · FileUtil v0.1.0</p>
          <p className="text-secondary">
            以 React + TypeScript + Tailwind 打造，純前端（WebAssembly / Canvas）處理 PDF、圖片、影片、壓縮檔與資料格式。
          </p>
        </div>
      </section>
    </main>
  )
}
