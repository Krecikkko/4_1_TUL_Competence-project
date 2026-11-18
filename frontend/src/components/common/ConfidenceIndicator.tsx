import React from 'react'
import { formatConfidence } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface ConfidenceIndicatorProps {
  confidence: number
  showBar?: boolean
  className?: string
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  showBar = true,
  className,
}) => {
  const normalized = confidence <= 1.0 ? confidence * 100 : confidence
  const clamped = Math.max(0, Math.min(100, normalized))

  // Color gradient based on confidence
  let barColor = 'bg-slate-500'
  let textColor = 'text-slate-300'

  if (clamped >= 85) {
    barColor = 'bg-rose-500'
    textColor = 'text-rose-400 font-semibold'
  } else if (clamped >= 65) {
    barColor = 'bg-amber-500'
    textColor = 'text-amber-400 font-medium'
  } else if (clamped >= 40) {
    barColor = 'bg-blue-500'
    textColor = 'text-blue-400'
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {showBar && (
        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
          <div
            className={cn('h-full rounded-full transition-all duration-300', barColor)}
            style={{ width: `${clamped}%` }}
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}
      <span className={cn('text-xs font-mono', textColor)}>
        {formatConfidence(confidence)}
      </span>
    </div>
  )
}
