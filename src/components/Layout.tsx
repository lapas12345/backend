import type { ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children?: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen bg-primary-dark">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden bg-[#f0f4f8] rounded-tl-[2.5rem]">
        <div className="w-full max-w-7xl mx-auto flex flex-col h-full px-6 md:px-8">
          <Header />
          <main className="flex-1 overflow-y-auto py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
