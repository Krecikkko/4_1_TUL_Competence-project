import { useQuery } from '@tanstack/react-query'
import { apiFetch, ApiError } from './client'
import type { ApiCollection, Detection, NetworkFlow, TimeWindow, WindowStatistics } from './types'

export async function fetchWindows(): Promise<ApiCollection<TimeWindow>> {
  return apiFetch<ApiCollection<TimeWindow>>('/windows/')
}

export async function fetchWindow(id: number): Promise<TimeWindow> {
  return apiFetch<TimeWindow>(`/windows/${id}/`)
}

export async function fetchWindowStatistics(id: number): Promise<WindowStatistics> {
  return apiFetch<WindowStatistics>(`/windows/${id}/statistics/`)
}

export async function fetchWindowFlows(id: number): Promise<ApiCollection<NetworkFlow>> {
  return apiFetch<ApiCollection<NetworkFlow>>(`/windows/${id}/flows/`)
}

/**
 * Fetches the detection associated with a window.
 * Returns null if the backend returns HTTP 404 (indicating the window has no detection).
 */
export async function fetchWindowDetection(id: number): Promise<Detection | null> {
  try {
    return await apiFetch<Detection>(`/windows/${id}/detection/`)
  } catch (err: unknown) {
    if (err instanceof ApiError && err.isNotFound) {
      return null
    }
    throw err
  }
}

export function useWindows(refetchInterval: number | false = 30000) {
  return useQuery<ApiCollection<TimeWindow>, Error>({
    queryKey: ['windows'],
    queryFn: fetchWindows,
    refetchInterval,
  })
}

export function useWindow(id: number | null | undefined) {
  return useQuery<TimeWindow, Error>({
    queryKey: ['window', id],
    queryFn: () => {
      if (id === null || id === undefined) throw new Error('Window ID is required')
      return fetchWindow(id)
    },
    enabled: typeof id === 'number' && !Number.isNaN(id),
  })
}

export function useWindowStatistics(id: number | null | undefined) {
  return useQuery<WindowStatistics, Error>({
    queryKey: ['window', id, 'statistics'],
    queryFn: () => {
      if (id === null || id === undefined) throw new Error('Window ID is required')
      return fetchWindowStatistics(id)
    },
    enabled: typeof id === 'number' && !Number.isNaN(id),
  })
}

export function useWindowFlows(id: number | null | undefined) {
  return useQuery<ApiCollection<NetworkFlow>, Error>({
    queryKey: ['window', id, 'flows'],
    queryFn: () => {
      if (id === null || id === undefined) throw new Error('Window ID is required')
      return fetchWindowFlows(id)
    },
    enabled: typeof id === 'number' && !Number.isNaN(id),
  })
}

export function useWindowDetection(id: number | null | undefined) {
  return useQuery<Detection | null, Error>({
    queryKey: ['window', id, 'detection'],
    queryFn: () => {
      if (id === null || id === undefined) throw new Error('Window ID is required')
      return fetchWindowDetection(id)
    },
    enabled: typeof id === 'number' && !Number.isNaN(id),
  })
}
