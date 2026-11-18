import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WindowDetailPage } from './WindowDetailPage'
import * as windowsApi from '@/api/windows'

vi.mock('@/api/windows')

describe('WindowDetailPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  it('handles clean window where detection returns null (backend 404)', async () => {
    vi.mocked(windowsApi.useWindow).mockReturnValue({
      data: {
        id: 1,
        start_timestamp_us: '2026-11-12T10:00:00Z',
        duration_us: '00:01:00',
        type: 'GLOBAL',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof windowsApi.useWindow>)

    vi.mocked(windowsApi.useWindowStatistics).mockReturnValue({
      data: {
        total_network_flows: 15,
        packets_per_second: 120.5,
        bytes_per_second: 54000,
        active_connections: 5,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof windowsApi.useWindowStatistics>)

    vi.mocked(windowsApi.useWindowFlows).mockReturnValue({
      data: { count: 0, results: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof windowsApi.useWindowFlows>)

    // Detection is null (404 from backend)
    vi.mocked(windowsApi.useWindowDetection).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as ReturnType<typeof windowsApi.useWindowDetection>)

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/windows/1']}>
          <Routes>
            <Route path="/windows/:id" element={<WindowDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByText('Time Window #1')).toBeInTheDocument()
    expect(screen.getByText('GLOBAL Window')).toBeInTheDocument()
    expect(
      screen.getByText('No Detection Associated (Clean Window)')
    ).toBeInTheDocument()
    expect(screen.getByText('120.5 pkts/s')).toBeInTheDocument()
  })

  it('renders associated detection when present', async () => {
    vi.mocked(windowsApi.useWindow).mockReturnValue({
      data: {
        id: 2,
        start_timestamp_us: '2026-11-12T10:00:00Z',
        duration_us: '00:01:00',
        type: 'SOURCE',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof windowsApi.useWindow>)

    vi.mocked(windowsApi.useWindowStatistics).mockReturnValue({
      data: {
        total_network_flows: 50,
        packets_per_second: 500,
        bytes_per_second: 100000,
        active_connections: 12,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof windowsApi.useWindowStatistics>)

    vi.mocked(windowsApi.useWindowFlows).mockReturnValue({
      data: { count: 0, results: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof windowsApi.useWindowFlows>)

    // Detection exists
    vi.mocked(windowsApi.useWindowDetection).mockReturnValue({
      data: {
        id: 88,
        type: 'SYN_FLOOD',
        severity: 'CRITICAL',
        confidence: 0.98,
        method: 'RULE_ENGINE',
        rule_id: 'RULE_01',
        detected_at_us: '2026-11-12T10:00:30Z',
        source_ip: '192.168.1.5',
        destination_ip: '10.0.0.1',
        key_feature_values: {},
        explanation: 'Extreme SYN packet flood',
        window: 2,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof windowsApi.useWindowDetection>)

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/windows/2']}>
          <Routes>
            <Route path="/windows/:id" element={<WindowDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByText('SYN_FLOOD')).toBeInTheDocument()
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('98.0%')).toBeInTheDocument()
    expect(screen.getByText(/Inspect Detection #88/)).toBeInTheDocument()
  })
})
