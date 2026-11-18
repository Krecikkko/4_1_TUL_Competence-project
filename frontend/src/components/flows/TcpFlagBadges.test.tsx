import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TcpFlagBadges } from './TcpFlagBadges'
import type { TcpFlags } from '@/api/types'

describe('TcpFlagBadges', () => {
  const flagsActive: TcpFlags = {
    SYN: true,
    ACK: true,
    FIN: false,
    RST: false,
    PSH: false,
    URG: false,
    ECE: false,
    CWR: false,
  }

  it('renders all flags in full mode with active and inactive indicators', () => {
    render(<TcpFlagBadges flags={flagsActive} compact={false} />)
    expect(screen.getByText('SYN')).toBeInTheDocument()
    expect(screen.getByText('ACK')).toBeInTheDocument()
    expect(screen.getByText('FIN')).toBeInTheDocument()
    expect(screen.getAllByText('SET (1)').length).toBe(2)
    expect(screen.getAllByText('OFF (0)').length).toBe(6)
  })

  it('renders only active flags in compact mode', () => {
    render(<TcpFlagBadges flags={flagsActive} compact={true} />)
    expect(screen.getByText('SYN')).toBeInTheDocument()
    expect(screen.getByText('ACK')).toBeInTheDocument()
    expect(screen.queryByText('FIN')).toBeNull()
  })

  it('handles null flags gracefully', () => {
    render(<TcpFlagBadges flags={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
