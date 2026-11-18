import React from 'react'
import { cn } from '@/utils/cn'

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-800/80', className)}
      aria-hidden="true"
    />
  )
}

export const TableSkeleton: React.FC<{
  rows?: number
  cols?: number
  className?: string
}> = ({ rows = 5, cols = 6, className }) => {
  return (
    <div className={cn('w-full space-y-3', className)}>
      <div className="flex gap-4 p-4 bg-slate-900/60 rounded-lg border border-slate-800">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`head-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={`row-${r}`}
            className="flex gap-4 p-4 bg-slate-900/30 rounded-lg border border-slate-800/50"
          >
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={`cell-${r}-${c}`} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3',
        className
      )}
    >
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-48" />
    </div>
  )
}

export const DetailSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  )
}
