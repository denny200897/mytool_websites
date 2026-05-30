import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md text-body-md">
      <TopNav />
      <Outlet />
      <Footer />
    </div>
  )
}
