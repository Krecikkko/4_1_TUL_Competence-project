import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDetection, useDetectionWindow } from '@/api/detections'
import { useWindowFlows } from '@/api/windows'
import { EvidencePanel } from '@/components/evidence/EvidencePanel'
import { NetworkFlowTable } from '@/components/flows/NetworkFlowTable'
import { DetailSkeleton } from '@/components/common/LoadingSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { NotFoundState } from '@/components/common/NotFoundState'
import { ApiError } from '@/api/client'
import {
  ArrowLeft,
  ShieldAlert,
  Clock,
  ArrowRight,
  Info,
  Layers,
} from 'lucide-react'

export const DetectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const detectionId = id ? parseInt(id, 10) : NaN

  const {
    data: detection,
    isLoading: detectionLoading,
    error: detectionError,
    refetch: refetchDetection,
  } = useDetection(detectionId)

  const {
    data: windowData,
  } = useDetectionWindow(detectionId)

  // Associated flows through the window's flows endpoint
  const windowId = detection?.window ?? windowData?.id
  const {
    data: flowsData,
    isLoading: flowsLoading,
    error: flowsError,
  } = useWindowFlows(windowId)

  if (Number.isNaN(detectionId)) {
    return (
      <NotFoundState
        title="Invalid Detection ID"
        message="The provided detection ID is not a valid number."
        backTo="/detections"
        backLabel="Back to Detections"
      />
    )
  }

  if (detectionError) {
    if (detectionError instanceof ApiError && detectionError.isNotFound) {
      return (
        <NotFoundState
          title={`Detection #${detectionId} Not Found`}
          message="No anomaly detection with this ID exists in the database."
          backTo="/detections"
          backLabel="Back to Detections"
        />
      )
    }

    return (
      <ErrorState
        title="Error loading detection details"
        message={detectionError.message}
        onRetry={() => refetchDetection()}
      />
    )
  }

  if (detectionLoading) {
    return (
      <div className="space-y-6">
        <DetailSkeleton />
      </div>
    )
  }

  if (!detection) {
    return (
      <NotFoundState
        title="Detection not found"
        backTo="/detections"
        backLabel="Back to Detections"
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Top Navigation & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <Link
            to="/detections"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Detections
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Detection #{detection.id}: {detection.type}
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Source: {detection.source_ip || 'Any'} &rarr; Destination: {detection.destination_ip || 'Any'}
              </p>
            </div>
          </div>
        </div>

        {/* Window Quick Link */}
        <div className="flex items-center gap-3">
          <Link
            to={`/windows/${detection.window}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Time Window #{detection.window}</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Main Evidence Panel */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Anomaly Evidence & Rule Evaluation
        </h3>
        <EvidencePanel detection={detection} />
      </section>

      {/* Associated Time Window Context */}
      <section className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Associated Time Window (TW#{detection.window})
            </h3>
            <p className="text-2xs text-slate-400">
              Flows aggregated during this anomaly window
            </p>
          </div>

          <Link
            to={`/windows/${detection.window}`}
            className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
          >
            Full window inspection & statistics <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* SOC Advisory Notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-950/30 border border-blue-900/60 text-slate-300 text-xs">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-300">SOC Analyst Advisory:</span>{' '}
            The flows below represent all traffic captured within Time Window #{detection.window}.
            In aggregate-based or window-based detection rules, these flows provide temporal and volumetric context;
            an individual flow is not necessarily malicious on its own.
          </div>
        </div>

        {/* Related Flows Table */}
        {flowsLoading ? (
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40">
            <DetailSkeleton />
          </div>
        ) : flowsError ? (
          <p className="text-xs text-slate-500 italic p-4 bg-slate-900/40 rounded-xl border border-slate-800">
            Could not retrieve window flows ({flowsError.message}).
          </p>
        ) : (
          <NetworkFlowTable flows={flowsData?.results || []} />
        )}
      </section>
    </div>
  )
}
