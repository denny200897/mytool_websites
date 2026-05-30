import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { ALL_TOOLS } from '../lib/tools'

export default function TopNav() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const results = query.trim()
    ? ALL_TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.subtitle.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 8)
    : []

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const go = (slug: string) => {
    setQuery('')
    setOpen(false)
    navigate(`/tool/${slug}`)
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'font-label-md text-label-md pb-1 border-b-2 transition-colors px-2',
      isActive
        ? 'text-primary font-bold border-primary'
        : 'text-secondary border-transparent hover:text-primary',
    ].join(' ')

  return (
    <nav className="bg-surface border-b border-outline-variant flex justify-between items-center px-lg py-sm w-full sticky top-0 z-50">
      <div className="flex items-center gap-xl">
        <Link to="/" className="flex items-center gap-sm">
          <Icon name="grid_view" size={20} className="text-primary" />
          <span className="font-headline-md text-headline-md text-primary tracking-tight">Denny的檔案工具箱</span>
        </Link>
        <div className="hidden md:flex items-center gap-margin">
          <NavLink to="/" end className={linkClass}>
            所有工具
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            歷史紀錄
          </NavLink>
          <NavLink to="/settings" className={linkClass}>
            設定
          </NavLink>
        </div>
      </div>

      <div className="flex items-center gap-md">
        <div className="relative hidden sm:block" ref={boxRef}>
          <Icon
            name="search"
            size={16}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) go(results[0].slug)
              if (e.key === 'Escape') setOpen(false)
            }}
            className="h-[32px] pl-8 pr-3 py-1 border border-outline-variant rounded bg-surface-container-lowest focus:ring-1 focus:ring-tertiary-container focus:border-tertiary-container outline-none text-body-sm w-64 placeholder:text-outline text-on-surface"
            placeholder="搜尋工具（例如：壓縮 PDF）"
            type="text"
          />
          {open && results.length > 0 && (
            <div className="absolute top-[38px] left-0 w-72 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden">
              {results.map((t) => (
                <button
                  key={t.id}
                  onMouseDown={() => go(t.slug)}
                  className="w-full flex items-center gap-sm px-md h-[36px] hover:bg-surface-variant transition-colors text-left"
                >
                  <Icon name={t.icon} size={16} className="text-outline" />
                  <span className="font-body-sm text-body-sm text-on-surface flex-grow">{t.name}</span>
                  <span className="font-label-xs text-label-xs text-secondary">{t.subtitle}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="p-1 hover:bg-surface-variant rounded-full flex items-center justify-center text-secondary active:opacity-80 transition">
          <Icon name="account_circle" size={20} />
        </button>
      </div>
    </nav>
  )
}
