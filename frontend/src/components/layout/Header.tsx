import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Menu, RefreshCw, Clock } from 'lucide-react'
import { ConnectionStatus } from '@/components/common/ConnectionStatus'
import { formatLocalDateTime } from '@/utils/formatters'

interface HeaderProps {
  onToggleSidebar?: () => void
  title?: string
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  title = 'Security Operations Center',
}) => {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<string>(
    new Date().toISOString()
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries()
      setLastRefreshed(new Date().toISOString())
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 md:px-8 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 md:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-2xs text-slate-400 hidden sm:block">
            NetGuard Automated Network Anomaly Monitoring
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Last refreshed */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Refreshed:</span>
          <span className="text-slate-200">
            {formatLocalDateTime(lastRefreshed)}
          </span>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-800 transition-colors cursor-pointer"
          title="Refresh dashboard data"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Health status */}
        <ConnectionStatus />
      </div>
    </header>
  )
}
