import { Link } from 'react-router-dom'
import Icon from '../components/Icon'

export default function NotFound() {
  return (
    <main className="flex-grow flex flex-col items-center justify-center gap-md p-xl text-center">
      <Icon name="search_off" size={40} className="text-secondary" />
      <h1 className="font-headline-lg text-headline-lg text-on-surface">找不到這個工具</h1>
      <p className="font-body-sm text-body-sm text-secondary">這個工具可能尚未推出，或網址有誤。</p>
      <Link
        to="/"
        className="font-label-md text-label-md bg-primary text-on-primary px-xl py-[8px] rounded hover:bg-on-surface-variant transition-colors"
      >
        回到所有工具
      </Link>
    </main>
  )
}
