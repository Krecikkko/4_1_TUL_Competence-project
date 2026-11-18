import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDetections } from '@/api/detections'
import { useFlows } from '@/api/flows'
import { useWindows } from '@/api/windows'
import { useHealth } from '@/api/health'
import { StatCard } from '@/components/common/StatCard'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { ConfidenceIndicator } from '@/components/common/ConfidenceIndicator'
import { CardSkeleton, TableSkeleton } from '@/components/common/LoadingSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { formatDateTime } from '@/utils/formatters'
import type { Severity } from '@/api/types'
import {
  ShieldAlert,
  Network,
  Clock,
  Activity,
  ArrowRight,
  Server,
  Layers,
  AlertOctagon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

const SEVERITY_COLORS: Record<Severity, string> = {
  LOW: '#10b981',      // Emerald
  MEDIUM: '#f59e0b',   // Amber
  HIGH: '#f97316',     // Orange
  CRITICAL: '#f43f5e', // Rose/Red
}

export const OverviewPage: React.FC = () => {
  const {
    data: detectionsData,
    isLoading: detectionsLoading,
    error: detectionsError,
    refetch: refetchDetections,
  } = useDetections()

  const {
    data: flowsData,
    isLoading: flowsLoading,
    error: flowsError,
    refetch: refetchFlows,
  } = useFlows()

  const {
    data: windowsData,
    isLoading: windowsLoading,
    error: windowsError,
    refetch: refetchWindows,
  } = useWindows()

  const { data: healthData, isLoading: healthLoading } = useHealth()

  const detections = useMemo(() => detectionsData?.results || [], [detectionsData])
  const flows = useMemo(() => flowsData?.results || [], [flowsData])
  const windows = useMemo(() => windowsData?.results || [], [windowsData])

  // Compute severity distribution
  const severityDistribution = useMemo(() => {
    const counts: Record<Severity, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    }
    for (const d of detections) {
      if (counts[d.severity] !== undefined) {
        counts[d.severity] += 1
      }
    }
    return (Object.keys(counts) as Severity[]).map((sev) => ({
      name: sev,
      value: counts[sev],
      color: SEVERITY_COLORS[sev],
    }))
  }, [detections])

  // Compute anomaly type distribution
  const typeDistribution = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of detections) {
      map.set(d.type, (map.get(d.type) || 0) + 1)
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [detections])

  // Recent detections (sorted newest first)
  const recentDetections = useMemo(() => {
    return [...detections]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5)
  }, [detections])

  // Critical detections count
  const criticalCount = useMemo(() => {
    return detections.filter(
      (d) => d.severity === 'CRITICAL' || d.severity === 'HIGH'
    ).length
  }, [detections])

  const hasErrors = Boolean(detectionsError || flowsError || windowsError)

  return (
    <div className="space-y-6">
      {/* Top Banner / Backend connection information */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-950/80 border border-blue-800/80 text-blue-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">
              NetGuard SOC Monitoring Platform
            </h2>
            <p className="text-xs text-slate-400">
              Active node: {healthData?.service || 'netguard-backend'} (REST API connected)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            Backend REST: {healthLoading ? 'Checking...' : healthData?.status === 'ok' ? 'Online' : 'Degraded'}
          </span>
        </div>
      </div>

      {hasErrors && (
        <ErrorState
          title="Notice: Backend communication problem"
          message="Could not load one or more resources from the backend REST API. Check if the backend container is running and healthy."
          details={{
            detectionsError: detectionsError?.message,
            flowsError: flowsError?.message,
            windowsError: windowsError?.message,
          }}
          onRetry={() => {
            refetchDetections()
            refetchFlows()
            refetchWindows()
          }}
        />
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Detections"
          value={detectionsLoading ? '—' : detections.length}
          subtitle="Anomalies identified by rules"
          icon={<ShieldAlert className="w-4 h-4 text-cyan-400" />}
          loading={detectionsLoading}
        />

        <StatCard
          title="High & Critical"
          value={detectionsLoading ? '—' : criticalCount}
          subtitle="Requiring immediate analyst review"
          icon={<AlertOctagon className="w-4 h-4 text-rose-400" />}
          valueClassName={criticalCount > 0 ? 'text-rose-400' : 'text-slate-100'}
          loading={detectionsLoading}
        />

        <StatCard
          title="Recorded Network Flows"
          value={flowsLoading ? '—' : flows.length}
          subtitle="Normalized flow sessions"
          icon={<Network className="w-4 h-4 text-indigo-400" />}
          loading={flowsLoading}
        />

        <StatCard
          title="Recorded Time Windows"
          value={windowsLoading ? '—' : windows.length}
          subtitle="Aggregation windows in DB"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          loading={windowsLoading}
        />
      </div>

      {/* Charts Row: Severity Distribution & Anomaly Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Detections by Severity
              </h3>
              <p className="text-2xs text-slate-500">
                Distribution across recorded anomaly events
              </p>
            </div>
            <Link
              to="/detections"
              className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-64 mt-4 flex items-center justify-center">
            {detectionsLoading ? (
              <CardSkeleton className="w-full h-full border-none bg-transparent" />
            ) : detections.length === 0 ? (
              <p className="text-xs text-slate-500">No detections available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={4}
                  >
                    {severityDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Severity Legend */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-800 text-center font-mono">
            {severityDistribution.map((item) => (
              <div key={item.name} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-2xs text-slate-400 block">{item.name}</span>
                <span className="text-sm font-bold text-white" style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Anomaly Types Bar Chart */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Top Anomaly Categories
              </h3>
              <p className="text-2xs text-slate-500">
                Frequency by detected anomaly classification
              </p>
            </div>
            <Link
              to="/history"
              className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
            >
              History <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-64 mt-4">
            {detectionsLoading ? (
              <CardSkeleton className="w-full h-full border-none bg-transparent" />
            ) : typeDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No anomaly types to display
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="p-3 mt-4 rounded-lg bg-slate-950/60 border border-slate-800/80 text-2xs text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Classifications originate directly from backend detection rules.</span>
          </div>
        </div>
      </div>

      {/* Recent Detections Preview */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Recent Anomaly Detections
            </h3>
            <p className="text-2xs text-slate-500">
              Latest security alerts detected by NetGuard
            </p>
          </div>
          <Link
            to="/detections"
            className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
          >
            Explore all {detections.length} detections <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          {detectionsLoading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : recentDetections.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No recent detections found in database.
            </p>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-2xs">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Detected At (UTC)</th>
                  <th className="py-2.5 px-3">Source &rarr; Destination</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentDetections.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-cyan-400 font-semibold">#{d.id}</td>
                    <td className="py-3 px-3 text-white font-sans font-medium">{d.type}</td>
                    <td className="py-3 px-3">
                      <SeverityBadge severity={d.severity} />
                    </td>
                    <td className="py-3 px-3">
                      <ConfidenceIndicator confidence={d.confidence} />
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {formatDateTime(d.detected_at_us)}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {d.source_ip || '—'} &rarr; {d.destination_ip || '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <Link
                        to={`/detections/${d.id}`}
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
