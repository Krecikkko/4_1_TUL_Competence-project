import React from 'react'
import { useHealth } from '@/api/health'
import { cn } from '@/utils/cn'
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface ConnectionStatusProps {
  className?: string
  compact?: boolean
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className,
  compact = false,
}) => {
  const { data, isLoading, isError, error, isSuccess } = useHealth()

  if (isLoading) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700',
          className
        )}
        title="Checking backend API health..."
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        {!compact && <span>Connecting...</span>}
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-950/80 text-rose-300 border border-rose-800/80',
          className
        )}
        title={`Backend unreachable: ${error?.message || 'Connection refused'}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        <span>{!compact ? 'Backend Offline' : 'Offline'}</span>
      </div>
    )
  }

  if (isSuccess && data?.status === 'ok') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60',
          className
        )}
        title={`Connected to ${data.service} (HTTP 200)`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {!compact && <span>{data.service}</span>}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700',
        className
      )}
    >
      <Activity className="w-3.5 h-3.5" />
      <span>Unknown</span>
    </div>
  )
}
