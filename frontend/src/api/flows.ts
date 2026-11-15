import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { ApiCollection, NetworkFlow, TimeWindow } from './types'

export async function fetchFlows(): Promise<ApiCollection<NetworkFlow>> {
  return apiFetch<ApiCollection<NetworkFlow>>('/flows/')
}

export async function fetchFlow(id: number): Promise<NetworkFlow> {
  return apiFetch<NetworkFlow>(`/flows/${id}/`)
}

export async function fetchFlowWindows(id: number): Promise<ApiCollection<TimeWindow>> {
  return apiFetch<ApiCollection<TimeWindow>>(`/flows/${id}/windows/`)
}

export function useFlows(refetchInterval: number | false = 30000) {
  return useQuery<ApiCollection<NetworkFlow>, Error>({
    queryKey: ['flows'],
    queryFn: fetchFlows,
    refetchInterval,
  })
}

export function useFlow(id: number | null | undefined) {
  return useQuery<NetworkFlow, Error>({
    queryKey: ['flow', id],
    queryFn: () => {
      if (id === null || id === undefined) throw new Error('Flow ID is required')
      return fetchFlow(id)
    },
    enabled: typeof id === 'number' && !Number.isNaN(id),
  })
}

export function useFlowWindows(id: number | null | undefined) {
  return useQuery<ApiCollection<TimeWindow>, Error>({
    queryKey: ['flow', id, 'windows'],
    queryFn: () => {
      if (id === null || id === undefined) throw new Error('Flow ID is required')
      return fetchFlowWindows(id)
    },
    enabled: typeof id === 'number' && !Number.isNaN(id),
  })
}
