import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useFlow, useFlowWindows } from '@/api/flows'
import { TcpFlagBadges } from '@/components/flows/TcpFlagBadges'
import { TimeWindowTable } from '@/components/windows/TimeWindowTable'
import { DetailSkeleton } from '@/components/common/LoadingSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { NotFoundState } from '@/components/common/NotFoundState'
import { ApiError } from '@/api/client'
import {
  formatDateTime,
  parseDjangoDuration,
  formatBytes,
  formatPackets,
} from '@/utils/formatters'
import {
  ArrowLeft,
  Network,
  Clock,
  ArrowRight,
  Shield,
  Flag,
} from 'lucide-react'

export const FlowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const flowId = id ? parseInt(id, 10) : NaN

  const {
    data: flow,
    isLoading: flowLoading,
    error: flowError,
    refetch: refetchFlow,
  } = useFlow(flowId)

  const {
    data: windowsData,
    isLoading: windowsLoading,
  } = useFlowWindows(flowId)

  if (Number.isNaN(flowId)) {
    return (
      <NotFoundState
        title="Invalid Flow ID"
        message="The provided network flow ID is not a valid number."
        backTo="/flows"
        backLabel="Back to Traffic Explorer"
      />
    )
  }

  if (flowError) {
    if (flowError instanceof ApiError && flowError.isNotFound) {
      return (
        <NotFoundState
          title={`Network Flow #${flowId} Not Found`}
          message="No network flow record exists with this ID."
          backTo="/flows"
          backLabel="Back to Traffic Explorer"
        />
      )
    }

    return (
      <ErrorState
        title="Error loading network flow"
        message={flowError.message}
        onRetry={() => refetchFlow()}
      />
    )
  }

  if (flowLoading) {
    return <DetailSkeleton />
  }

  if (!flow) {
    return (
      <NotFoundState
        title="Flow not found"
        backTo="/flows"
        backLabel="Back to Traffic Explorer"
      />
    )
  }

  const durationParsed = parseDjangoDuration(flow.duration_us)

  return (
    <div className="space-y-8">
      {/* Top Navigation & Title */}
      <div className="pb-4 border-b border-slate-800">
        <Link
          to="/flows"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Traffic Explorer
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800 text-indigo-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Network Flow #{flow.id}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                {flow.protocol}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Start time: {formatDateTime(flow.start_timestamp_us)}
            </p>
          </div>
        </div>
      </div>

      {/* 5-Tuple Visual Endpoint Card */}
      <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Conversation Endpoints (5-Tuple)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Source */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-900/40">
            <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
              Source Host
            </span>
            <div className="text-lg font-mono font-bold text-emerald-300">
              {flow.source_ip}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              Port: <strong className="text-slate-200">{flow.source_port ?? 'n/a'}</strong>
            </div>
          </div>

          {/* Protocol & Direction */}
          <div className="flex flex-col items-center justify-center text-center p-2">
            <div className="flex items-center gap-2 text-slate-500">
              <div className="h-px w-12 bg-slate-700" />
              <ArrowRight className="w-5 h-5 text-indigo-400" />
              <div className="h-px w-12 bg-slate-700" />
            </div>
            <span className="mt-2 text-xs font-mono font-bold text-indigo-300 uppercase px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800">
              {flow.protocol}
            </span>
            <span className="mt-1 text-2xs font-mono text-slate-400">
              Duration: {durationParsed.formatted}
            </span>
          </div>

          {/* Destination */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-900/40">
            <span className="text-2xs font-semibold uppercase tracking-wider text-indigo-400 block mb-1">
              Destination Host
            </span>
            <div className="text-lg font-mono font-bold text-indigo-300">
              {flow.destination_ip}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              Port: <strong className="text-slate-200">{flow.destination_port ?? 'n/a'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Volumetric Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Packet Count
          </span>
          <div className="text-xl font-mono font-bold text-white mt-2">
            {formatPackets(flow.packet_count)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Byte Count
          </span>
          <div className="text-xl font-mono font-bold text-white mt-2">
            {formatBytes(flow.byte_count)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Flow Duration
          </span>
          <div className="text-xl font-mono font-bold text-amber-300 mt-2">
            {durationParsed.formatted}
          </div>
          <span className="text-2xs font-mono text-slate-500">
            Raw: {flow.duration_us}
          </span>
        </div>
      </div>

      {/* TCP Flags Section */}
      <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Flag className="w-4 h-4 text-purple-400" />
            TCP Flags Analysis
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Raw flag bitmap decoded by backend
          </span>
        </div>

        <TcpFlagBadges flags={flow.tcp_flags} />
      </div>

      {/* Associated Time Windows */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Associated Time Windows
            </h3>
            <p className="text-2xs text-slate-400">
              Time windows that contain or overlap this network flow
            </p>
          </div>
        </div>

        {windowsLoading ? (
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40">
            <DetailSkeleton />
          </div>
        ) : (
          <TimeWindowTable windows={windowsData?.results || []} />
        )}
      </div>
    </div>
  )
}
