import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { HealthResponse } from './types'

export async function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health/')
}

export function useHealth(refetchInterval: number | false = 15000) {
  return useQuery<HealthResponse, Error>({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval,
    retry: 1,
  })
}
