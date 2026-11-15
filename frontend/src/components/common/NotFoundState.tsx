import React from 'react'
import { Link } from 'react-router-dom'
import { FileQuestion, ArrowLeft, Home } from 'lucide-react'
import { cn } from '@/utils/cn'

interface NotFoundStateProps {
  title?: string
  message?: string
  backTo?: string
  backLabel?: string
  className?: string
}

export const NotFoundState: React.FC<NotFoundStateProps> = ({
  title = 'Resource not found',
  message = 'The requested item or page does not exist or may have been removed.',
  backTo = '/',
  backLabel = 'Back to Overview',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-xl border border-slate-800 bg-slate-900/60',
        className
      )}
    >
      <div className="p-4 rounded-2xl bg-slate-800/80 text-amber-400 mb-4 border border-slate-700">
        <FileQuestion className="w-10 h-10" />
      </div>
      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-500">
        404 Not Found
      </span>
      <h2 className="mt-1 text-xl font-bold text-slate-100">{title}</h2>
      <p className="mt-2 text-sm text-slate-400 max-w-md">{message}</p>

      <div className="mt-6 flex items-center gap-3">
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
      </div>
    </div>
  )
}
