import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { CATEGORIES, findTool } from '../lib/tools'
import { useHistory } from '../lib/history'
import { useSeo } from '../lib/seo'

export default function Home() {
  const history = useHistory()
  useSeo({
    title: '',
    description:
      '免費線上檔案工具箱，提供 PDF、圖片、影片、文件、壓縮檔與資料格式轉換等工具。所有檔案都在你的瀏覽器本機處理，不上傳伺服器，安全、快速、免註冊。',
  })

  // Derive a unique "recently used" list of tools from history.
  const recent = Array.from(new Set(history.map((h) => h.toolSlug)))
    .map((slug) => findTool(slug)?.tool)
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .slice(0, 5)

  return (
    <main className="flex-grow container mx-auto px-margin py-margin max-w-5xl flex flex-col gap-margin w-full">
      {recent.length > 0 && (
        <section className="border border-outline-variant rounded bg-surface-container-lowest overflow-hidden">
          <div className="border-b border-outline-variant px-md py-sm bg-surface-container-low">
            <h2 className="font-label-xs text-label-xs text-secondary uppercase tracking-wider">最近使用</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            {recent.map((t, i) => (
              <Link
                key={t.id}
                to={`/tool/${t.slug}`}
                className={`flex flex-col items-center justify-center p-md gap-sm hover:bg-surface-variant transition-colors h-[80px] group border-outline-variant ${
                  i > 0 ? 'border-l' : ''
                }`}
              >
                <Icon name={t.icon} size={24} className="text-secondary group-hover:text-primary transition-colors" />
                <span className="font-label-md text-label-md text-on-surface group-hover:text-primary text-center">
                  {t.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className="border border-outline-variant rounded bg-surface-container-lowest flex flex-col"
          >
            <div className="border-b border-outline-variant px-md py-sm bg-surface-container-low flex items-center gap-2">
              <Icon name={cat.icon} size={16} className="text-secondary" />
              <h2 className="font-label-xs text-label-xs text-secondary uppercase tracking-wider">{cat.name}</h2>
            </div>
            <div className="flex flex-col divide-y divide-outline-variant">
              {cat.tools.map((t) => (
                <Link
                  key={t.id}
                  to={`/tool/${t.slug}`}
                  className="flex items-center px-md h-[36px] hover:bg-surface-variant transition-colors group"
                >
                  <Icon name={t.icon} size={16} className="text-outline mr-sm group-hover:text-primary" />
                  <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary flex-grow">
                    {t.name}
                  </span>
                  {t.status === 'soon' && (
                    <span className="font-label-xs text-label-xs bg-surface-container text-secondary px-2 py-0.5 rounded">
                      即將推出
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
