import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildUrl, apiFetch, ApiError } from './client'
import { fetchWindowDetection } from './windows'

describe('client.ts', () => {
  describe('buildUrl', () => {
    it('normalizes routes with leading /api/ and trailing slashes', () => {
      expect(buildUrl('health')).toBe('/api/health/')
      expect(buildUrl('/health')).toBe('/api/health/')
      expect(buildUrl('/api/health/')).toBe('/api/health/')
      expect(buildUrl('/flows/123')).toBe('/api/flows/123/')
    })

    it('appends and encodes query parameters correctly while dropping null/undefined', () => {
      const url = buildUrl('/detections/', {
        severity: 'HIGH',
        source_ip: '192.168.1.1',
        empty: undefined,
        nullVal: null,
        blank: '',
      })
      expect(url).toBe('/api/detections/?severity=HIGH&source_ip=192.168.1.1')
    })
  })

  describe('apiFetch', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn())
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('returns parsed json on success', async () => {
      const mockData = { count: 1, results: [{ id: 1 }] }
      ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const res = await apiFetch<typeof mockData>('/flows/')
      expect(res).toEqual(mockData)
    })

    it('throws ApiError with status and message on 404', async () => {
      ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Resource not found' }),
      })

      await expect(apiFetch('/flows/999/')).rejects.toThrow(ApiError)
    })

    it('throws ApiError on network error', async () => {
      ;(fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Failed to connect')
      )

      await expect(apiFetch('/health/')).rejects.toThrow('Network error')
    })
  })

  describe('fetchWindowDetection 404 handling', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn())
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('returns null when window detection returns 404 (window has no detection)', async () => {
      ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: "Window doesn't have a detection" }),
      })

      const res = await fetchWindowDetection(5)
      expect(res).toBeNull()
    })

    it('re-throws when status is 500 server error', async () => {
      ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: async () => ({ error: 'Database crash' }),
      })

      await expect(fetchWindowDetection(5)).rejects.toThrow(ApiError)
    })
  })
})
