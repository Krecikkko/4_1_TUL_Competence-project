import React from 'react'
import { useWindows } from '@/api/windows'
import { TimeWindowTable } from '@/components/windows/TimeWindowTable'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { Clock, Info } from 'lucide-react'

export const WindowsPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useWindows()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Time Windows
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Temporal aggregation partitions evaluated for volumetric network anomalies
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-slate-800">
          Window count: <strong className="text-white">{data?.count ?? '—'}</strong>
        </div>
      </div>

      {/* Information Alert on Window Types vs Window Duration */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-amber-300">
          <Info className="w-4 h-4 text-amber-400" />
          <span>Understanding NetGuard Window Architecture</span>
        </div>
        <p className="text-slate-400 text-2xs leading-relaxed">
          The <code className="text-amber-300">type</code> field describes how flows are grouped in the window
          (<strong>GLOBAL</strong> for entire traffic, <strong>SOURCE</strong> for per-source IP partition,{' '}
          <strong>DESTIN</strong> for per-destination IP, or <strong>SO1DE1</strong> for pair-specific conversations).
          The temporal length is represented separately by <code className="text-amber-300">duration_us</code>.
        </p>
      </div>

      {error && (
        <ErrorState
          title="Failed to fetch time windows"
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {isLoading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <TableSkeleton rows={8} cols={6} />
        </div>
      ) : (
        <TimeWindowTable windows={data?.results || []} />
      )}
    </div>
  )
}
