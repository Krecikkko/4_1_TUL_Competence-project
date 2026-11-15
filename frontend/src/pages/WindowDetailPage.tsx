import React from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  useWindow,
  useWindowStatistics,
  useWindowFlows,
  useWindowDetection,
} from '@/api/windows'
import { WindowStatisticsCard } from '@/components/windows/WindowStatisticsCard'
import { NetworkFlowTable } from '@/components/flows/NetworkFlowTable'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { ConfidenceIndicator } from '@/components/common/ConfidenceIndicator'
import { DetailSkeleton } from '@/components/common/LoadingSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { NotFoundState } from '@/components/common/NotFoundState'
import { ApiError } from '@/api/client'
import {
  formatDateTime,
  parseDjangoDuration,
  calculateEndTime,
} from '@/utils/formatters'
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Layers,
  Network,
} from 'lucide-react'

export const WindowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const windowId = id ? parseInt(id, 10) : NaN

  const {
    data: window,
    isLoading: windowLoading,
    error: windowError,
    refetch: refetchWindow,
  } = useWindow(windowId)

  const {
    data: stats,
    isLoading: statsLoading,
  } = useWindowStatistics(windowId)

  const {
    data: flowsData,
    isLoading: flowsLoading,
  } = useWindowFlows(windowId)

  const {
    data: detection,
    isLoading: detectionLoading,
  } = useWindowDetection(windowId)

  if (Number.isNaN(windowId)) {
    return (
      <NotFoundState
        title="Invalid Window ID"
        message="The provided time window ID is not a valid number."
        backTo="/windows"
        backLabel="Back to Time Windows"
      />
    )
  }

  if (windowError) {
    if (windowError instanceof ApiError && windowError.isNotFound) {
      return (
        <NotFoundState
          title={`Time Window #${windowId} Not Found`}
          message="No time window record exists with this ID."
          backTo="/windows"
          backLabel="Back to Time Windows"
        />
      )
    }

    return (
      <ErrorState
        title="Error loading time window"
        message={windowError.message}
        onRetry={() => refetchWindow()}
      />
    )
  }

  if (windowLoading) {
    return <DetailSkeleton />
  }

  if (!window) {
    return (
      <NotFoundState
        title="Time Window not found"
        backTo="/windows"
        backLabel="Back to Time Windows"
      />
    )
  }

  const durationParsed = parseDjangoDuration(window.duration_us)
  const computedEnd = calculateEndTime(window.start_timestamp_us, window.duration_us)

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-800">
        <Link
          to="/windows"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Time Windows
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Time Window #{window.id}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800">
                {window.type}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Duration: {durationParsed.formatted} ({durationParsed.totalMicroseconds} µs)
            </p>
          </div>
        </div>
      </div>

      {/* Window Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Window Start Timestamp
          </span>
          <div className="text-sm font-mono font-semibold text-white">
            {formatDateTime(window.start_timestamp_us)}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Computed Window End
          </span>
          <div className="text-sm font-mono font-semibold text-slate-300">
            {computedEnd.isValid ? computedEnd.formatted : '—'}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Grouping Strategy
          </span>
          <div className="text-sm font-mono font-semibold text-blue-400">
            {window.type} Window
          </div>
        </div>
      </div>

      {/* Associated Detection State (Handles 404 cleanly) */}
      <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Window Anomaly Detection Result
          </h3>
          <span className="text-2xs font-mono text-slate-500">
            GET /windows/{window.id}/detection/
          </span>
        </div>

        {detectionLoading ? (
          <div className="h-16 bg-slate-800/40 animate-pulse rounded-lg" />
        ) : detection ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-950/30 border border-rose-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-900/50 text-rose-400 border border-rose-800">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    {detection.type}
                  </span>
                  <SeverityBadge severity={detection.severity} />
                  <ConfidenceIndicator confidence={detection.confidence} />
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                  {detection.explanation}
                </p>
              </div>
            </div>

            <Link
              to={`/detections/${detection.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-xs font-medium text-rose-200 border border-rose-700/60 transition-colors shrink-0"
            >
              Inspect Detection #{detection.id} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-xs block text-emerald-300">
                No Detection Associated (Clean Window)
              </span>
              <span className="text-2xs text-slate-400">
                The analysis worker did not trigger any anomaly detection rule for this time window.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Window Aggregated Statistics */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Aggregated Window Statistics
        </h3>
        <WindowStatisticsCard statistics={stats} loading={statsLoading} />
      </section>

      {/* Associated Network Flows */}
      <section className="space-y-4 pt-4 border-t border-slate-800">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-400" />
            Flows In Time Window
          </h3>
          <p className="text-2xs text-slate-400">
            Network conversations that overlap or are encompassed within this time window
          </p>
        </div>

        {flowsLoading ? (
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40">
            <DetailSkeleton />
          </div>
        ) : (
          <NetworkFlowTable flows={flowsData?.results || []} />
        )}
      </section>
    </div>
  )
}
