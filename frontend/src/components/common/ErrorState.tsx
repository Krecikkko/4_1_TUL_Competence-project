import React, { useState } from 'react'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ErrorStateProps {
  title?: string
  message: string
  details?: unknown
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message,
  details,
  onRetry,
  className,
}) => {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div
      className={cn(
        'rounded-xl border border-rose-900/60 bg-rose-950/20 p-6 text-slate-200',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-rose-900/40 text-rose-400 border border-rose-800/60 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-rose-300">{title}</h3>
          <p className="mt-1 text-sm text-slate-300">{message}</p>

          {details !== undefined && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Hide diagnostic details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> View diagnostic details
                  </>
                )}
              </button>

              {showDetails && (
                <pre className="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-48">
                  {typeof details === 'string'
                    ? details
                    : JSON.stringify(details, null, 2)}
                </pre>
              )}
            </div>
          )}

          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-900/50 hover:bg-rose-800/60 text-xs font-medium text-rose-200 border border-rose-700/50 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
