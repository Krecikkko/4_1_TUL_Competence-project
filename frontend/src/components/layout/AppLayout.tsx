import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const pageTitles: Record<string, string> = {
  '/': 'Overview Dashboard',
  '/detections': 'Detections Analysis',
  '/flows': 'Traffic Explorer',
  '/windows': 'Time Windows',
  '/history': 'Detection History',
}

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Determine page title based on path prefix
  let currentTitle = 'Security Operations Center'
  for (const [path, title] of Object.entries(pageTitles)) {
    if (path === '/' && location.pathname === '/') {
      currentTitle = title
      break
    } else if (path !== '/' && location.pathname.startsWith(path)) {
      currentTitle = title
      break
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#0b0f19] text-slate-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0">
        <Header
          title={currentTitle}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
