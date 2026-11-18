import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { ApiCollection, Detection, DetectionFilterParams, TimeWindow } from './types'

export async function fetchDetections(filters?: DetectionFilterParams): Promise<ApiCollection<Detection>> {
  const params: Record<string, string | undefined> = {}

  if (filters) {
    if (filters.start_timestamp_us) params.start_timestamp_us = filters.start_timestamp_us
    if (filters.end_timestamp_us) params.end_timestamp_us = filters.end_timestamp_us
    if (filters.type) params.type = filters.type
    if (filters.severity) params.severity = filters.severity
    if (filters.source_ip) params.source_ip = filters.source_ip
    if (filters.destination_ip) params.destination_ip = filters.destination_ip
  }

  return apiFetch<ApiCollection<Detection>>('/detections/', params)
}

export async function fetchDetection(id: number): Promise<Detection> {
  return apiFetch<Detection>(`/detections/${id}/`)
}

export async function fetchDetectionWindow(id: number): Promise<TimeWindow> {
  return apiFetch<TimeWindow>(`/detections/${id}/window/`)
}

export function useDetections(filters?: DetectionFilterParams, refetchInterval: number | false = 30000) {
  return useQuery<ApiCollection<Detection>, Error>({
    queryKey: ['detections', filters],
    queryFn: () => fetchDetections(filters),
    refetchInterval,
  })
}

export function useDetection(id: number | null | undefined) {
  return useQuery<Detection, Error>({
    queryKey: ['detection', id],
    queryFn: () => {
      if (id === null || id === undefined) throw new Error('Detection ID is required')
      return fetchDetection(id)
    },
    enabled: typeof id === 'number' && !Number.isNaN(id),
  })
}

export function useDetectionWindow(id: number | null | undefined) {
  return useQuery<TimeWindow, Error>({
    queryKey: ['detection', id, 'window'],
    queryFn: () => {
      if (id === null || id === undefined) throw new Error('Detection ID is required')
      return fetchDetectionWindow(id)
    },
    enabled: typeof id === 'number' && !Number.isNaN(id),
  })
}
