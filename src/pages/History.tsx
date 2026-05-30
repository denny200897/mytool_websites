import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { clearHistory, timeAgo, useHistory } from '../lib/history'

export default function History() {
  const history = useHistory()

  return (
    <main className="flex-grow container mx-auto px-margin py-margin max-w-3xl w-full flex flex-col gap-margin">
      <div className="flex items-center justify-between">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">歷史紀錄</h1>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="font-label-md text-label-md text-secondary hover:text-error flex items-center gap-xs transition-colors"
          >
            <Icon name="delete" size={16} />
            清除全部
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="border border-dashed border-outline-variant rounded-lg p-xl flex flex-col items-center justify-center min-h-[200px] text-secondary gap-sm">
          <Icon name="history" size={32} />
          <p className="font-body-sm text-body-sm">尚無紀錄。使用任何工具後，這裡會顯示處理過的檔案。</p>
          <Link to="/" className="font-label-md text-label-md text-on-surface underline underline-offset-2">
            瀏覽所有工具
          </Link>
        </div>
      ) : (
        <div className="border border-outline-variant rounded bg-surface-container-lowest divide-y divide-outline-variant overflow-hidden">
          {history.map((h) => (
            <Link
              key={h.id}
              to={`/tool/${h.toolSlug}`}
              className={`px-margin py-sm hover:bg-surface-variant transition-colors flex items-center gap-md group ${
                h.ok ? '' : 'opacity-70'
              }`}
            >
              <Icon
                name={h.ok ? 'description' : 'broken_image'}
                size={20}
                className={h.ok ? 'text-secondary group-hover:text-primary' : 'text-outline'}
              />
              <div className="flex-1 min-w-0">
                <p className="font-body-sm text-body-sm text-on-surface truncate">{h.fileName}</p>
                <p className="font-label-xs text-label-xs text-secondary mt-xs">
                  {h.toolName} · {timeAgo(h.at)}
                </p>
              </div>
              <span
                className={`font-label-xs text-label-xs px-2 py-1 rounded ${
                  h.ok ? 'bg-surface-container-highest text-secondary' : 'bg-surface-container text-outline'
                }`}
              >
                {h.result}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
