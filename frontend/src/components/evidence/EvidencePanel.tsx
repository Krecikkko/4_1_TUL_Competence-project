import React from 'react'
import type { Detection } from '@/api/types'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { ConfidenceIndicator } from '@/components/common/ConfidenceIndicator'
import { JsonEvidenceViewer } from './JsonEvidenceViewer'
import { formatDateTime } from '@/utils/formatters'
import { ShieldAlert, Cpu, Calendar, Hash, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface EvidencePanelProps {
  detection: Detection
  showWindowLink?: boolean
  className?: string
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  detection,
  showWindowLink = true,
  className,
}) => {
  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Top Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>Severity & Confidence</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <SeverityBadge severity={detection.severity} />
            <ConfidenceIndicator confidence={detection.confidence} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Method & Rule ID</span>
          </div>
          <div className="mt-2 text-sm font-mono text-slate-200">
            <span className="text-indigo-400 font-semibold">{detection.method}</span> / {detection.rule_id}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Detected At (UTC)</span>
          </div>
          <div className="mt-2 text-xs font-mono text-slate-300">
            {formatDateTime(detection.detected_at_us)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Hash className="w-4 h-4 text-emerald-400" />
            <span>Time Window</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-mono text-white font-semibold">
              Window #{detection.window}
            </span>
            {showWindowLink && (
              <Link
                to={`/windows/${detection.window}`}
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Inspect <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Explanation Text */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Detection Explanation
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 font-mono">
          {detection.explanation || 'No explanation text provided.'}
        </p>
      </div>

      {/* Key Feature Values */}
      <JsonEvidenceViewer
        data={detection.key_feature_values}
        title="Key Feature Values (Anomaly Evidence)"
      />
    </div>
  )
}
