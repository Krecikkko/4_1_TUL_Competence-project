import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SeverityBadge } from './SeverityBadge'

describe('SeverityBadge', () => {
  it('renders LOW severity badge with correct styling', () => {
    render(<SeverityBadge severity="LOW" />)
    const badge = screen.getByTestId('severity-badge-low')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('LOW')
    expect(badge.className).toContain('text-emerald-400')
  })

  it('renders MEDIUM severity badge', () => {
    render(<SeverityBadge severity="MEDIUM" />)
    const badge = screen.getByTestId('severity-badge-medium')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('MEDIUM')
    expect(badge.className).toContain('text-amber-400')
  })

  it('renders HIGH severity badge', () => {
    render(<SeverityBadge severity="HIGH" />)
    const badge = screen.getByTestId('severity-badge-high')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('HIGH')
    expect(badge.className).toContain('text-orange-400')
  })

  it('renders CRITICAL severity badge', () => {
    render(<SeverityBadge severity="CRITICAL" />)
    const badge = screen.getByTestId('severity-badge-critical')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('CRITICAL')
    expect(badge.className).toContain('text-rose-400')
  })

  it('handles lowercase or unknown severity safely', () => {
    render(<SeverityBadge severity={'low' as unknown as string} />)
    expect(screen.getByTestId('severity-badge-low')).toBeInTheDocument()
  })
})
