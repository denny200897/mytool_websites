import { Link } from 'react-router-dom'
import Icon from '../components/Icon'

export default function ComingSoon({ name }: { name: string }) {
  return (
    <main className="flex-grow flex flex-col items-center justify-center gap-md p-xl text-center">
      <Icon name="hourglass_top" size={40} className="text-secondary" />
      <h1 className="font-headline-lg text-headline-lg text-on-surface">{name}</h1>
      <p className="font-body-sm text-body-sm text-secondary max-w-[420px]">
        即將推出。瀏覽器端的 PDF 密碼加密／解鎖需要額外的 WASM 模組（pdf-lib 無法寫入加密 PDF），
        會在後續版本加入。
      </p>
      <Link
        to="/"
        className="font-label-md text-label-md bg-primary text-on-primary px-xl py-[8px] rounded hover:bg-on-surface-variant transition-colors"
      >
        回到所有工具
      </Link>
    </main>
  )
}
