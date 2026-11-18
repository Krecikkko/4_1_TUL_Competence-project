import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DetectionDetailPage } from './DetectionDetailPage'
import * as detectionsApi from '@/api/detections'
import * as windowsApi from '@/api/windows'

vi.mock('@/api/detections')
vi.mock('@/api/windows')

describe('DetectionDetailPage', () => {
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

  it('renders detection details, explanation, and key feature values', () => {
    vi.mocked(detectionsApi.useDetection).mockReturnValue({
      data: {
        id: 42,
        type: 'DDOS_VOLUMETRIC',
        severity: 'HIGH',
        confidence: 0.92,
        method: 'STATISTICAL',
        rule_id: 'R_VOL_99',
        detected_at_us: '2026-11-12T11:00:00Z',
        source_ip: '192.168.1.15',
        destination_ip: '10.0.0.50',
        key_feature_values: {
          packet_rate: 15000,
          byte_rate: 9000000,
        },
        explanation: 'Packet rate exceeded 3 standard deviations above baseline',
        window: 7,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof detectionsApi.useDetection>)

    vi.mocked(detectionsApi.useDetectionWindow).mockReturnValue({
      data: {
        id: 7,
        start_timestamp_us: '2026-11-12T10:59:00Z',
        duration_us: '00:01:00',
        type: 'GLOBAL',
      },
      isLoading: false,
    } as unknown as ReturnType<typeof detectionsApi.useDetectionWindow>)

    vi.mocked(windowsApi.useWindowFlows).mockReturnValue({
      data: { count: 0, results: [] },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof windowsApi.useWindowFlows>)

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/detections/42']}>
          <Routes>
            <Route path="/detections/:id" element={<DetectionDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByText('Detection #42: DDOS_VOLUMETRIC')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('92.0%')).toBeInTheDocument()
    expect(screen.getByText(/R_VOL_99/)).toBeInTheDocument()
    expect(
      screen.getByText('Packet rate exceeded 3 standard deviations above baseline')
    ).toBeInTheDocument()
    expect(screen.getByText('packet_rate')).toBeInTheDocument()
    expect(screen.getByText('15000')).toBeInTheDocument()
    expect(screen.getByText('Time Window #7')).toBeInTheDocument()
  })

  it('renders not found state when detection ID does not exist', () => {
    vi.mocked(detectionsApi.useDetection).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof detectionsApi.useDetection>)

    vi.mocked(detectionsApi.useDetectionWindow).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as ReturnType<typeof detectionsApi.useDetectionWindow>)

    vi.mocked(windowsApi.useWindowFlows).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as ReturnType<typeof windowsApi.useWindowFlows>)

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/detections/999']}>
          <Routes>
            <Route path="/detections/:id" element={<DetectionDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByText('Detection not found')).toBeInTheDocument()
  })
})
