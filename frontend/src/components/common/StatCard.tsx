import React from 'react'
import { cn } from '@/utils/cn'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  className?: string
  valueClassName?: string
  loading?: boolean
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  className,
  valueClassName,
  loading = false,
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg backdrop-blur-xs transition-all duration-200 hover:border-slate-700',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/50">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        {loading ? (
          <div className="h-8 w-24 bg-slate-800 animate-pulse rounded-md" />
        ) : (
          <div
            className={cn(
              'text-2xl font-bold tracking-tight text-white font-mono',
              valueClassName
            )}
          >
            {value}
          </div>
        )}
        {badge}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 truncate">{subtitle}</p>
      )}
    </div>
  )
}
