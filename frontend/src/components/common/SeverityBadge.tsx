import React from 'react'
import type { Severity } from '@/api/types'
import { cn } from '@/utils/cn'

interface SeverityBadgeProps {
  severity: Severity | string
  className?: string
  showDot?: boolean
}

const severityConfig: Record<
  Severity,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  LOW: {
    label: 'LOW',
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-700/60',
    dot: 'bg-emerald-400',
  },
  MEDIUM: {
    label: 'MEDIUM',
    bg: 'bg-amber-950/60',
    text: 'text-amber-400',
    border: 'border-amber-700/60',
    dot: 'bg-amber-400',
  },
  HIGH: {
    label: 'HIGH',
    bg: 'bg-orange-950/60',
    text: 'text-orange-400',
    border: 'border-orange-700/60',
    dot: 'bg-orange-400',
  },
  CRITICAL: {
    label: 'CRITICAL',
    bg: 'bg-rose-950/60',
    text: 'text-rose-400',
    border: 'border-rose-700/60',
    dot: 'bg-rose-400',
  },
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  className,
  showDot = true,
}) => {
  const upperSev = (severity || '').toUpperCase() as Severity
  const config = severityConfig[upperSev] || {
    label: severity || 'UNKNOWN',
    bg: 'bg-slate-800/60',
    text: 'text-slate-300',
    border: 'border-slate-700',
    dot: 'bg-slate-400',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border shadow-xs',
        config.bg,
        config.text,
        config.border,
        className
      )}
      data-testid={`severity-badge-${upperSev.toLowerCase()}`}
    >
      {showDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full animate-pulse', config.dot)}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  )
}
