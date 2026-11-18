import React from 'react'
import type { TcpFlags } from '@/api/types'
import { cn } from '@/utils/cn'

interface TcpFlagBadgesProps {
  flags: TcpFlags | null
  compact?: boolean
  className?: string
}

const flagOrder: (keyof TcpFlags)[] = [
  'SYN',
  'ACK',
  'FIN',
  'RST',
  'PSH',
  'URG',
  'ECE',
  'CWR',
]

const flagActiveColors: Record<keyof TcpFlags, string> = {
  SYN: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/80 font-bold',
  ACK: 'bg-blue-950/80 text-blue-400 border-blue-700/80 font-bold',
  FIN: 'bg-amber-950/80 text-amber-400 border-amber-700/80 font-bold',
  RST: 'bg-rose-950/80 text-rose-400 border-rose-700/80 font-bold',
  PSH: 'bg-purple-950/80 text-purple-400 border-purple-700/80 font-bold',
  URG: 'bg-indigo-950/80 text-indigo-400 border-indigo-700/80 font-bold',
  ECE: 'bg-teal-950/80 text-teal-400 border-teal-700/80 font-bold',
  CWR: 'bg-cyan-950/80 text-cyan-400 border-cyan-700/80 font-bold',
}

export const TcpFlagBadges: React.FC<TcpFlagBadgesProps> = ({
  flags,
  compact = false,
  className,
}) => {
  if (!flags) {
    return <span className="text-xs font-mono text-slate-500">—</span>
  }

  const activeFlags = flagOrder.filter((f) => flags[f])

  if (compact) {
    if (activeFlags.length === 0) {
      return <span className="text-xs font-mono text-slate-500">None</span>
    }

    return (
      <div className={cn('flex flex-wrap items-center gap-1', className)}>
        {activeFlags.map((flag) => (
          <span
            key={flag}
            className={cn(
              'px-1.5 py-0.2 rounded-md text-3xs font-mono border',
              flagActiveColors[flag]
            )}
            title={`TCP Flag ${flag}: Active`}
          >
            {flag}
          </span>
        ))}
      </div>
    )
  }

  // Full view (showing all 8 flags with active/inactive indicators)
  return (
    <div className={cn('grid grid-cols-4 sm:grid-cols-8 gap-2', className)}>
      {flagOrder.map((flag) => {
        const isActive = Boolean(flags[flag])
        return (
          <div
            key={flag}
            className={cn(
              'flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all',
              isActive
                ? flagActiveColors[flag]
                : 'bg-slate-900/40 text-slate-600 border-slate-800'
            )}
          >
            <span className="text-xs font-mono font-bold tracking-wider">
              {flag}
            </span>
            <span className="text-3xs font-mono mt-0.5 opacity-80">
              {isActive ? 'SET (1)' : 'OFF (0)'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
