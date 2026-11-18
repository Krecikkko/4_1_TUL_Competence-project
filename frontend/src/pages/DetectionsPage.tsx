import React, { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDetections } from '@/api/detections'
import type { DetectionFilterParams, Severity } from '@/api/types'
import { DetectionFilters } from '@/components/detections/DetectionFilters'
import { DetectionTable } from '@/components/detections/DetectionTable'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { ShieldAlert } from 'lucide-react'

export const DetectionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Parse filters from search params
  const filters: DetectionFilterParams = useMemo(() => {
    return {
      severity: (searchParams.get('severity') as Severity) || undefined,
      type: searchParams.get('type') || undefined,
      source_ip: searchParams.get('source_ip') || undefined,
      destination_ip: searchParams.get('destination_ip') || undefined,
      start_timestamp_us: searchParams.get('start_timestamp_us') || undefined,
      end_timestamp_us: searchParams.get('end_timestamp_us') || undefined,
    }
  }, [searchParams])

  const { data, isLoading, error, refetch } = useDetections(filters)

  const handleApplyFilters = (newFilters: DetectionFilterParams) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(newFilters)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      }
    }
    setSearchParams(params)
  }

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Anomaly Detections
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time anomaly events detected across network time-windows
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-slate-800">
          Server count: <strong className="text-white">{data?.count ?? '—'}</strong>
        </div>
      </div>

      {/* Filter Component */}
      <DetectionFilters
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Error state */}
      {error && (
        <ErrorState
          title="Failed to fetch detections"
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {/* Table / Loading */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <TableSkeleton rows={8} cols={7} />
        </div>
      ) : (
        <DetectionTable
          detections={data?.results || []}
          onClearFilters={handleResetFilters}
        />
      )}
    </div>
  )
}
