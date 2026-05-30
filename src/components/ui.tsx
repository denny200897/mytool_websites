import { type ReactNode } from 'react'
import Icon from './Icon'

/** Primary dark action button matching the design system. */
export function Button({
  children,
  onClick,
  disabled,
  icon,
  variant = 'primary',
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  icon?: string
  variant?: 'primary' | 'ghost'
  type?: 'button' | 'submit'
}) {
  const base =
    'font-label-md text-label-md px-xl py-[8px] rounded transition-colors flex items-center justify-center gap-sm disabled:opacity-40 disabled:cursor-not-allowed'
  const styles =
    variant === 'primary'
      ? 'bg-primary text-on-primary hover:bg-on-surface-variant'
      : 'border border-outline-variant text-on-surface hover:bg-surface-variant'
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}

/** A labelled field row used inside option panels. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="font-label-xs text-label-xs text-secondary uppercase tracking-wider">{label}</span>
      {children}
    </label>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        'h-[32px] px-3 border border-outline-variant rounded bg-surface-container-lowest focus:ring-1 focus:ring-tertiary-container focus:border-tertiary-container outline-none text-body-sm text-on-surface placeholder:text-outline ' +
        (props.className ?? '')
      }
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        'h-[32px] px-2 border border-outline-variant rounded bg-surface-container-lowest focus:ring-1 focus:ring-tertiary-container focus:border-tertiary-container outline-none text-body-sm text-on-surface ' +
        (props.className ?? '')
      }
    />
  )
}

/** Standard tool page frame: centered title, subtitle, content and the privacy note. */
export function ToolFrame({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string
  subtitle: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <main className="flex-1 p-xl lg:p-[48px] flex flex-col items-center bg-background">
      <div className={`w-full ${wide ? 'max-w-[880px]' : 'max-w-[640px]'} flex flex-col gap-xl`}>
        <div className="text-center mb-md">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-sm">{title}</h1>
          <p className="font-body-sm text-body-sm text-secondary">{subtitle}</p>
        </div>
        {children}
        <div className="flex items-center justify-center gap-xs text-secondary">
          <Icon name="lock" size={14} />
          <span className="font-label-xs text-label-xs">檔案完全在你的瀏覽器中處理，不會上傳到任何伺服器。</span>
        </div>
      </div>
    </main>
  )
}

/** Inline status / error banner. */
export function Banner({ kind, children }: { kind: 'error' | 'info' | 'success'; children: ReactNode }) {
  const map = {
    error: 'bg-error-container text-on-error-container',
    info: 'bg-surface-container text-on-surface-variant',
    success: 'bg-secondary-container text-on-secondary-container',
  }
  const icon = { error: 'error', info: 'info', success: 'check_circle' }[kind]
  return (
    <div className={`flex items-center gap-sm px-md py-sm rounded ${map[kind]}`}>
      <Icon name={icon} size={16} />
      <span className="font-body-sm text-body-sm">{children}</span>
    </div>
  )
}
