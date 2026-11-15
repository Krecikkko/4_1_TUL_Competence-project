export interface ParsedDuration {
  days: number
  hours: number
  minutes: number
  seconds: number
  microseconds: number
  totalSeconds: number
  totalMicroseconds: number
  formatted: string
}

/**
 * Parses a Django DurationField string or numeric value into a structured object.
 * Django standard format: [DD] [HH:[MM:]]ss[.uuuuuu]
 * Examples: "00:01:31.000003", "1 02:03:04.000005", "00:00:01.000002"
 */
export function parseDjangoDuration(value: string | number | null | undefined): ParsedDuration {
  const zeroResult: ParsedDuration = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    microseconds: 0,
    totalSeconds: 0,
    totalMicroseconds: 0,
    formatted: '0s',
  }

  if (value === null || value === undefined || value === '') {
    return zeroResult
  }

  if (typeof value === 'number') {
    // Treat as seconds if reasonable, or microseconds if huge
    const isMicroseconds = value > 10_000_000
    const totalSec = isMicroseconds ? value / 1_000_000 : value
    const totalUs = isMicroseconds ? value : Math.round(value * 1_000_000)
    return {
      days: Math.floor(totalSec / 86400),
      hours: Math.floor((totalSec % 86400) / 3600),
      minutes: Math.floor((totalSec % 3600) / 60),
      seconds: Math.floor(totalSec % 60),
      microseconds: totalUs % 1_000_000,
      totalSeconds: totalSec,
      totalMicroseconds: totalUs,
      formatted: formatDurationParts(totalSec, totalUs % 1_000_000),
    }
  }

  const str = String(value).trim()

  // Handle ISO 8601 duration: P...
  if (str.startsWith('P') || str.startsWith('-P')) {
    const isoMatch = str.match(
      /^(-)?P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i
    )
    if (isoMatch) {
      const isNeg = Boolean(isoMatch[1])
      const days = parseInt(isoMatch[2] || '0', 10)
      const hours = parseInt(isoMatch[3] || '0', 10)
      const minutes = parseInt(isoMatch[4] || '0', 10)
      const secFloat = parseFloat(isoMatch[5] || '0')
      const seconds = Math.floor(secFloat)
      const microseconds = Math.round((secFloat - seconds) * 1_000_000)

      let totalSec = days * 86400 + hours * 3600 + minutes * 60 + secFloat
      if (isNeg) totalSec = -totalSec
      const totalUs = Math.round(totalSec * 1_000_000)

      return {
        days,
        hours,
        minutes,
        seconds,
        microseconds,
        totalSeconds: totalSec,
        totalMicroseconds: totalUs,
        formatted: formatDurationParts(totalSec, microseconds),
      }
    }
  }

  // Django string format regex:
  // [-]?(?:(\d+)\s+)?(?:(\d+):)?(\d+):(\d+)(?:\.(\d+))?
  // Also handles [HH:]MM:SS or just seconds
  const djangoRegex =
    /^(-)?(?:(\d+)\s+(?:days?,\s*)?)?(?:(?:(\d+):)?(\d+):)?(\d+)(?:\.(\d+))?$/
  const match = str.match(djangoRegex)

  if (match) {
    const isNegative = match[1] === '-'
    const days = parseInt(match[2] || '0', 10)
    let hours = 0
    let minutes = 0
    let seconds: number

    if (match[3] !== undefined && match[4] !== undefined) {
      // Format: HH:MM:SS
      hours = parseInt(match[3] || '0', 10)
      minutes = parseInt(match[4] || '0', 10)
      seconds = parseInt(match[5] || '0', 10)
    } else if (match[4] !== undefined) {
      // Format: MM:SS
      minutes = parseInt(match[4] || '0', 10)
      seconds = parseInt(match[5] || '0', 10)
    } else {
      // Just seconds
      seconds = parseInt(match[5] || '0', 10)
    }

    // Microseconds part: pad or slice to 6 digits
    const rawUs = match[6] || '0'
    const paddedUs = (rawUs + '000000').slice(0, 6)
    const microseconds = parseInt(paddedUs, 10)

    let totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds + microseconds / 1_000_000
    if (isNegative) totalSeconds = -totalSeconds
    const totalMicroseconds = Math.round(totalSeconds * 1_000_000)

    return {
      days,
      hours,
      minutes,
      seconds,
      microseconds,
      totalSeconds,
      totalMicroseconds,
      formatted: formatDurationParts(totalSeconds, microseconds),
    }
  }

  // Fallback: check if numeric string
  const num = Number(str)
  if (!Number.isNaN(num)) {
    return parseDjangoDuration(num)
  }

  return {
    ...zeroResult,
    formatted: str,
  }
}

function formatDurationParts(totalSeconds: number, microseconds: number): string {
  const absSec = Math.abs(totalSeconds)
  const sign = totalSeconds < 0 ? '-' : ''

  if (absSec < 1) {
    if (microseconds < 1000) {
      return `${sign}${microseconds}µs`
    }
    const ms = (microseconds / 1000).toFixed(2)
    return `${sign}${ms}ms`
  }

  const d = Math.floor(absSec / 86400)
  const h = Math.floor((absSec % 86400) / 3600)
  const m = Math.floor((absSec % 3600) / 60)
  const s = Math.floor(absSec % 60)
  const ms = Math.floor(microseconds / 1000)

  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)

  if (ms > 0 && d === 0 && h === 0) {
    parts.push(`${s}.${ms.toString().padStart(3, '0')}s`)
  } else if (s > 0 || parts.length === 0) {
    parts.push(`${s}s`)
  }

  return `${sign}${parts.join(' ')}`
}

/**
 * Calculates the end timestamp of a time window given start_timestamp_us and duration_us.
 */
export function calculateEndTime(
  startIso: string | null | undefined,
  durationValue: string | number | null | undefined
): { iso: string; formatted: string; isValid: boolean } {
  if (!startIso) {
    return { iso: '', formatted: '—', isValid: false }
  }

  const startDate = new Date(startIso)
  if (Number.isNaN(startDate.getTime())) {
    return { iso: '', formatted: 'Invalid start date', isValid: false }
  }

  const parsedDuration = parseDjangoDuration(durationValue)
  const endMs = startDate.getTime() + Math.round(parsedDuration.totalSeconds * 1000)
  const endDate = new Date(endMs)

  return {
    iso: endDate.toISOString(),
    formatted: formatDateTime(endDate.toISOString()),
    isValid: true,
  }
}

/**
 * Formats an ISO date/time string with timezone clarity.
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return String(isoString)

  // Returns YYYY-MM-DD HH:mm:ss.sss (UTC)
  return date.toISOString().replace('T', ' ').replace('Z', ' UTC')
}

/**
 * Formats a date for a local display string.
 */
export function formatLocalDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return String(isoString)

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/**
 * Formats byte values into human-readable B, KB, MB, GB.
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return '0 B'
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const sign = bytes < 0 ? '-' : ''
  const abs = Math.abs(bytes)
  const i = Math.min(Math.floor(Math.log(abs) / Math.log(1024)), units.length - 1)
  const val = (abs / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)

  return `${sign}${val} ${units[i]}`
}

/**
 * Formats packet count.
 */
export function formatPackets(packets: number | null | undefined): string {
  if (packets === null || packets === undefined || Number.isNaN(packets)) return '0 pkts'
  return `${Number(packets).toLocaleString('en-US')} pkts`
}

/**
 * Formats rate per second (packets/s or bytes/s).
 */
export function formatRate(val: number | null | undefined, unit: 'B/s' | 'pkts/s'): string {
  if (val === null || val === undefined || Number.isNaN(val)) return `0 ${unit}`

  if (unit === 'B/s') {
    return `${formatBytes(val)}/s`
  }

  return `${Number(val).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unit}`
}

/**
 * Formats confidence value as percentage string.
 * Handles 0..1 scale (e.g. 0.85 -> "85.0%") or 0..100 scale (85 -> "85.0%").
 */
export function formatConfidence(confidence: number | null | undefined): string {
  if (confidence === null || confidence === undefined || Number.isNaN(confidence)) {
    return '0.0%'
  }

  const num = Number(confidence)
  const pct = num <= 1.0 ? num * 100 : num
  return `${pct.toFixed(1)}%`
}

/**
 * Validates ISO-8601 date string.
 */
export function isValidIsoDate(str: string): boolean {
  if (!str || typeof str !== 'string') return false
  const date = new Date(str)
  if (Number.isNaN(date.getTime())) return false

  // Validate format has basic ISO year-month-day structure
  const isoPattern = /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?(?:Z|[+-]\d{2}:?\d{2})?$/
  return isoPattern.test(str.trim())
}
