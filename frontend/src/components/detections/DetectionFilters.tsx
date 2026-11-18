import React, { useState } from 'react'
import type { DetectionFilterParams, Severity } from '@/api/types'
import { Filter, X, RotateCcw, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

interface DetectionFiltersProps {
  filters: DetectionFilterParams
  onApplyFilters: (newFilters: DetectionFilterParams) => void
  onResetFilters: () => void
  className?: string
}

export const DetectionFilters: React.FC<DetectionFiltersProps> = ({
  filters,
  onApplyFilters,
  onResetFilters,
  className,
}) => {
  // Local form state
  const [localFilters, setLocalFilters] = useState<DetectionFilterParams>(filters)
  const [dateError, setDateError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Synchronize if prop changes externally (adjusting state during render)
  const [prevFilters, setPrevFilters] = useState(filters)
  if (prevFilters !== filters) {
    setPrevFilters(filters)
    setLocalFilters(filters)
  }

  const validateDates = (start?: string, end?: string): boolean => {
    setDateError(null)
    if (start && end) {
      const startDate = new Date(start)
      const endDate = new Date(end)
      if (startDate > endDate) {
        setDateError('Start time cannot be after end time.')
        return false
      }
    }
    return true
  }

  const handleChange = (
    key: keyof DetectionFilterParams,
    value: string
  ) => {
    const updated = { ...localFilters, [key]: value || undefined }
    setLocalFilters(updated)

    if (key === 'start_timestamp_us' || key === 'end_timestamp_us') {
      validateDates(
        key === 'start_timestamp_us' ? value : localFilters.start_timestamp_us,
        key === 'end_timestamp_us' ? value : localFilters.end_timestamp_us
      )
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateDates(localFilters.start_timestamp_us, localFilters.end_timestamp_us)) {
      return
    }

    // Format dates to ISO strings if needed
    const finalFilters: DetectionFilterParams = { ...localFilters }
    if (finalFilters.start_timestamp_us) {
      const d = new Date(finalFilters.start_timestamp_us)
      if (!Number.isNaN(d.getTime())) {
        finalFilters.start_timestamp_us = d.toISOString()
      }
    }
    if (finalFilters.end_timestamp_us) {
      const d = new Date(finalFilters.end_timestamp_us)
      if (!Number.isNaN(d.getTime())) {
        finalFilters.end_timestamp_us = d.toISOString()
      }
    }

    onApplyFilters(finalFilters)
  }

  const handleReset = () => {
    setDateError(null)
    setLocalFilters({})
    onResetFilters()
  }

  const handleClearSingle = (key: keyof DetectionFilterParams) => {
    const updated = { ...filters }
    delete updated[key]
    setLocalFilters(updated)
    onApplyFilters(updated)
  }

  // Count active filters
  const activeCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ''
  ).length

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-800 bg-slate-900/90 shadow-md backdrop-blur-xs overflow-hidden',
        className
      )}
    >
      {/* Top Header / Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950/60 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Detection Filters
          </span>
          {activeCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-blue-950 text-blue-300 border border-blue-700/60">
              {activeCount} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden text-xs text-blue-400 font-medium"
          >
            {isExpanded ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

      {/* Filter Form */}
      <form
        onSubmit={handleSubmit}
        className={cn('p-5 space-y-4', !isExpanded && 'hidden md:block')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Severity */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-severity"
              className="text-2xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Severity
            </label>
            <select
              id="filter-severity"
              value={localFilters.severity || ''}
              onChange={(e) =>
                handleChange('severity', e.target.value as Severity)
              }
              className="w-full rounded-lg border border-slate-700/80 bg-slate-800/90 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-hidden"
            >
              <option value="">All Severities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Anomaly Type */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-type"
              className="text-2xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Anomaly Type
            </label>
            <input
              id="filter-type"
              type="text"
              placeholder="e.g. PORT_SCAN"
              value={localFilters.type || ''}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full rounded-lg border border-slate-700/80 bg-slate-800/90 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Source IP */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-src-ip"
              className="text-2xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Source IP
            </label>
            <input
              id="filter-src-ip"
              type="text"
              placeholder="e.g. 192.168.1.10"
              value={localFilters.source_ip || ''}
              onChange={(e) => handleChange('source_ip', e.target.value)}
              className="w-full rounded-lg border border-slate-700/80 bg-slate-800/90 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Destination IP */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-dst-ip"
              className="text-2xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Destination IP
            </label>
            <input
              id="filter-dst-ip"
              type="text"
              placeholder="e.g. 10.0.0.1"
              value={localFilters.destination_ip || ''}
              onChange={(e) => handleChange('destination_ip', e.target.value)}
              className="w-full rounded-lg border border-slate-700/80 bg-slate-800/90 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Start Date/Time */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-start-time"
              className="text-2xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Start Time (ISO)
            </label>
            <input
              id="filter-start-time"
              type="datetime-local"
              value={
                localFilters.start_timestamp_us
                  ? localFilters.start_timestamp_us.slice(0, 16)
                  : ''
              }
              onChange={(e) =>
                handleChange('start_timestamp_us', e.target.value)
              }
              className="w-full rounded-lg border border-slate-700/80 bg-slate-800/90 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* End Date/Time */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-end-time"
              className="text-2xs font-semibold uppercase tracking-wider text-slate-400"
            >
              End Time (ISO)
            </label>
            <input
              id="filter-end-time"
              type="datetime-local"
              value={
                localFilters.end_timestamp_us
                  ? localFilters.end_timestamp_us.slice(0, 16)
                  : ''
              }
              onChange={(e) => handleChange('end_timestamp_us', e.target.value)}
              className="w-full rounded-lg border border-slate-700/80 bg-slate-800/90 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {dateError && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{dateError}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Active filter pills */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 bg-slate-950/40 border-t border-slate-800/60 text-xs">
          <span className="text-2xs uppercase tracking-wider text-slate-500">
            Active:
          </span>
          {filters.severity && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
              Severity: <strong>{filters.severity}</strong>
              <button
                type="button"
                onClick={() => handleClearSingle('severity')}
                className="hover:text-rose-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.type && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
              Type: <strong>{filters.type}</strong>
              <button
                type="button"
                onClick={() => handleClearSingle('type')}
                className="hover:text-rose-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.source_ip && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 font-mono">
              Src: {filters.source_ip}
              <button
                type="button"
                onClick={() => handleClearSingle('source_ip')}
                className="hover:text-rose-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.destination_ip && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 font-mono">
              Dst: {filters.destination_ip}
              <button
                type="button"
                onClick={() => handleClearSingle('destination_ip')}
                className="hover:text-rose-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.start_timestamp_us && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 font-mono text-2xs">
              From: {filters.start_timestamp_us}
              <button
                type="button"
                onClick={() => handleClearSingle('start_timestamp_us')}
                className="hover:text-rose-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.end_timestamp_us && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 font-mono text-2xs">
              To: {filters.end_timestamp_us}
              <button
                type="button"
                onClick={() => handleClearSingle('end_timestamp_us')}
                className="hover:text-rose-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
