import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDetections } from '@/api/detections'
import type { DetectionFilterParams, Severity } from '@/api/types'
import { DetectionFilters } from '@/components/detections/DetectionFilters'
import { DetectionTable } from '@/components/detections/DetectionTable'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { History, Clock, BarChart3 } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

export const HistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activePreset, setActivePreset] = useState<string>('custom')

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
  const detections = useMemo(() => data?.results || [], [data])

  const handlePresetSelect = (preset: '15m' | '1h' | '24h' | '7d' | 'all') => {
    setActivePreset(preset)
    const now = new Date()
    let start: Date | null = null

    if (preset === '15m') start = new Date(now.getTime() - 15 * 60 * 1000)
    else if (preset === '1h') start = new Date(now.getTime() - 60 * 60 * 1000)
    else if (preset === '24h') start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    else if (preset === '7d') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const params = new URLSearchParams(searchParams)
    if (start) {
      params.set('start_timestamp_us', start.toISOString())
      params.set('end_timestamp_us', now.toISOString())
    } else {
      params.delete('start_timestamp_us')
      params.delete('end_timestamp_us')
    }
    setSearchParams(params)
  }

  const handleApplyFilters = (newFilters: DetectionFilterParams) => {
    setActivePreset('custom')
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(newFilters)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      }
    }
    setSearchParams(params)
  }

  const handleResetFilters = () => {
    setActivePreset('all')
    setSearchParams(new URLSearchParams())
  }

  // Aggregate timeline: group detections by hour/minute
  const timelineData = useMemo(() => {
    if (detections.length === 0) return []
    const bucketMap = new Map<string, { timestamp: string; count: number; critical: number }>()

    for (const d of detections) {
      const date = new Date(d.detected_at_us)
      // Format as YYYY-MM-DD HH:mm or HH:mm
      const key = date.toISOString().slice(11, 16) // HH:mm
      const current = bucketMap.get(key) || { timestamp: key, count: 0, critical: 0 }
      current.count += 1
      if (d.severity === 'CRITICAL' || d.severity === 'HIGH') {
        current.critical += 1
      }
      bucketMap.set(key, current)
    }

    return Array.from(bucketMap.values())
  }, [detections])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Detection History & Investigation
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Forensic analysis across historical detection records and anomaly timelines
          </p>
        </div>

        {/* Quick Time Range Presets */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <span className="px-2 text-2xs font-semibold uppercase text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Range:
          </span>
          <button
            type="button"
            onClick={() => handlePresetSelect('15m')}
            className={`px-2.5 py-1 rounded-md font-mono text-2xs transition-colors cursor-pointer ${
              activePreset === '15m'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            15m
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('1h')}
            className={`px-2.5 py-1 rounded-md font-mono text-2xs transition-colors cursor-pointer ${
              activePreset === '1h'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1h
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('24h')}
            className={`px-2.5 py-1 rounded-md font-mono text-2xs transition-colors cursor-pointer ${
              activePreset === '24h'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            24h
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('7d')}
            className={`px-2.5 py-1 rounded-md font-mono text-2xs transition-colors cursor-pointer ${
              activePreset === '7d'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            7d
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('all')}
            className={`px-2.5 py-1 rounded-md font-mono text-2xs transition-colors cursor-pointer ${
              activePreset === 'all'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Timeline Chart */}
      {timelineData.length > 0 && (
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Detections Timeline (Time Buckets)
            </h3>
            <span className="text-2xs font-mono text-slate-500">
              Aggregated from current query results
            </span>
          </div>

          <div className="h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
                />
                <Bar dataKey="count" name="Total Anomalies" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="critical" name="High / Critical" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter Component */}
      <DetectionFilters
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {error && (
        <ErrorState
          title="Failed to fetch historical detections"
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {isLoading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <TableSkeleton rows={8} cols={7} />
        </div>
      ) : (
        <DetectionTable
          detections={detections}
          onClearFilters={handleResetFilters}
        />
      )}
    </div>
  )
}
