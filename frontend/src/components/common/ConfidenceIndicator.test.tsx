import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ConfidenceIndicator } from './ConfidenceIndicator'

describe('ConfidenceIndicator', () => {
  it('formats decimal confidence (0-1) correctly', () => {
    render(<ConfidenceIndicator confidence={0.875} />)
    expect(screen.getByText('87.5%')).toBeInTheDocument()
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '87.5')
  })

  it('renders progress bar with correct width style', () => {
    render(<ConfidenceIndicator confidence={0.5} />)
    expect(screen.getByText('50.0%')).toBeInTheDocument()
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveStyle('width: 50%')
  })

  it('can hide progress bar when showBar is false', () => {
    render(<ConfidenceIndicator confidence={0.9} showBar={false} />)
    expect(screen.getByText('90.0%')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })
})
