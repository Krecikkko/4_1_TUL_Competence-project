import { describe, it, expect } from 'vitest'
import {
  parseDjangoDuration,
  calculateEndTime,
  formatBytes,
  formatPackets,
  formatRate,
  formatConfidence,
  isValidIsoDate,
} from './formatters'

describe('formatters', () => {
  describe('parseDjangoDuration', () => {
    it('parses typical Django duration HH:MM:SS.uuuuuu', () => {
      const res = parseDjangoDuration('00:01:31.000003')
      expect(res.days).toBe(0)
      expect(res.hours).toBe(0)
      expect(res.minutes).toBe(1)
      expect(res.seconds).toBe(31)
      expect(res.microseconds).toBe(3)
      expect(res.totalSeconds).toBeCloseTo(91.000003, 5)
      expect(res.formatted).toBe('1m 31s')
    })

    it('parses short duration 00:00:01.000002', () => {
      const res = parseDjangoDuration('00:00:01.000002')
      expect(res.seconds).toBe(1)
      expect(res.microseconds).toBe(2)
      expect(res.totalSeconds).toBeCloseTo(1.000002, 5)
      expect(res.formatted).toBe('1s')
    })

    it('parses sub-second microseconds', () => {
      const res = parseDjangoDuration('00:00:00.005000')
      expect(res.totalSeconds).toBeCloseTo(0.005, 5)
      expect(res.formatted).toBe('5.00ms')
    })

    it('parses days and time', () => {
      const res = parseDjangoDuration('2 04:05:06.123456')
      expect(res.days).toBe(2)
      expect(res.hours).toBe(4)
      expect(res.minutes).toBe(5)
      expect(res.seconds).toBe(6)
      expect(res.microseconds).toBe(123456)
    })

    it('handles null and undefined gracefully', () => {
      expect(parseDjangoDuration(null).totalSeconds).toBe(0)
      expect(parseDjangoDuration(undefined).totalSeconds).toBe(0)
      expect(parseDjangoDuration('').totalSeconds).toBe(0)
    })
  })

  describe('calculateEndTime', () => {
    it('accurately adds duration to start timestamp', () => {
      const start = '2026-11-12T12:00:00.000Z'
      const duration = '00:01:30' // 90 seconds
      const res = calculateEndTime(start, duration)
      expect(res.isValid).toBe(true)
      expect(res.iso).toBe('2026-11-12T12:01:30.000Z')
    })

    it('handles invalid inputs', () => {
      const res = calculateEndTime('not-a-date', '00:01:00')
      expect(res.isValid).toBe(false)
    })
  })

  describe('formatBytes', () => {
    it('formats bytes, KB, MB, GB properly', () => {
      expect(formatBytes(0)).toBe('0 B')
      expect(formatBytes(500)).toBe('500 B')
      expect(formatBytes(1024)).toBe('1.00 KB')
      expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB')
    })
  })

  describe('formatPackets', () => {
    it('formats numbers with thousand separator and unit', () => {
      expect(formatPackets(100)).toBe('100 pkts')
      expect(formatPackets(2500000)).toBe('2,500,000 pkts')
    })
  })

  describe('formatRate', () => {
    it('formats rate per second', () => {
      expect(formatRate(1024, 'B/s')).toBe('1.00 KB/s')
      expect(formatRate(45.67, 'pkts/s')).toBe('45.67 pkts/s')
    })
  })

  describe('formatConfidence', () => {
    it('formats decimal confidence (0-1) to percentage', () => {
      expect(formatConfidence(0.85)).toBe('85.0%')
      expect(formatConfidence(0.999)).toBe('99.9%')
      expect(formatConfidence(1.0)).toBe('100.0%')
    })

    it('formats 0-100 scale confidence', () => {
      expect(formatConfidence(75)).toBe('75.0%')
    })
  })

  describe('isValidIsoDate', () => {
    it('validates proper ISO dates and rejects garbage', () => {
      expect(isValidIsoDate('2026-11-12T10:00:00Z')).toBe(true)
      expect(isValidIsoDate('2026-11-12')).toBe(true)
      expect(isValidIsoDate('not-a-date')).toBe(false)
      expect(isValidIsoDate('')).toBe(false)
    })
  })
})
