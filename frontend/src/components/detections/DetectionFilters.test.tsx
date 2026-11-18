import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DetectionFilters } from './DetectionFilters'

describe('DetectionFilters', () => {
  it('renders filter inputs and active count', () => {
    render(
      <DetectionFilters
        filters={{ severity: 'HIGH', type: 'PORT_SCAN' }}
        onApplyFilters={vi.fn()}
        onResetFilters={vi.fn()}
      />
    )

    expect(screen.getByText('Detection Filters')).toBeInTheDocument()
    expect(screen.getByText('2 active')).toBeInTheDocument()
    expect(screen.getByDisplayValue('PORT_SCAN')).toBeInTheDocument()
    expect(screen.getByDisplayValue('HIGH')).toBeInTheDocument()
  })

  it('validates date range when start is after end', () => {
    const onApply = vi.fn()
    render(
      <DetectionFilters
        filters={{}}
        onApplyFilters={onApply}
        onResetFilters={vi.fn()}
      />
    )

    const startInput = screen.getByLabelText('Start Time (ISO)')
    const endInput = screen.getByLabelText('End Time (ISO)')

    fireEvent.change(startInput, { target: { value: '2026-11-12T15:00' } })
    fireEvent.change(endInput, { target: { value: '2026-11-12T10:00' } })

    const applyBtn = screen.getByText('Apply Filters')
    fireEvent.click(applyBtn)

    expect(
      screen.getByText('Start time cannot be after end time.')
    ).toBeInTheDocument()
    expect(onApply).not.toHaveBeenCalled()
  })

  it('submits valid filter values', () => {
    const onApply = vi.fn()
    render(
      <DetectionFilters
        filters={{}}
        onApplyFilters={onApply}
        onResetFilters={vi.fn()}
      />
    )

    const srcInput = screen.getByLabelText('Source IP')
    fireEvent.change(srcInput, { target: { value: '192.168.1.100' } })

    const applyBtn = screen.getByText('Apply Filters')
    fireEvent.click(applyBtn)

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        source_ip: '192.168.1.100',
      })
    )
  })

  it('calls onResetFilters on reset button click', () => {
    const onReset = vi.fn()
    render(
      <DetectionFilters
        filters={{ severity: 'CRITICAL' }}
        onApplyFilters={vi.fn()}
        onResetFilters={onReset}
      />
    )

    const resetBtn = screen.getByText('Reset All')
    fireEvent.click(resetBtn)
    expect(onReset).toHaveBeenCalled()
  })
})
