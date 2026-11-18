import React from 'react'
import { useFlows } from '@/api/flows'
import { NetworkFlowTable } from '@/components/flows/NetworkFlowTable'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { Network } from 'lucide-react'

export const FlowsPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useFlows()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Traffic Explorer (Network Flows)
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Normalized 5-tuple network conversations and volumetric traffic metrics
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-slate-800">
          Flow count: <strong className="text-white">{data?.count ?? '—'}</strong>
        </div>
      </div>

      {error && (
        <ErrorState
          title="Failed to fetch network flows"
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {isLoading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <TableSkeleton rows={8} cols={8} />
        </div>
      ) : (
        <NetworkFlowTable flows={data?.results || []} />
      )}
    </div>
  )
}
