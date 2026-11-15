import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { JsonEvidenceViewer } from './JsonEvidenceViewer'

describe('JsonEvidenceViewer', () => {
  const sampleEvidence = {
    packet_count: 150,
    byte_count: 7500,
    syn_ratio: 0.95,
    flag_anomaly: true,
  }

  it('renders object keys and values in table view mode', () => {
    render(<JsonEvidenceViewer data={sampleEvidence} />)
    expect(screen.getByText('packet_count')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('byte_count')).toBeInTheDocument()
    expect(screen.getByText('7500')).toBeInTheDocument()
    expect(screen.getByText('syn_ratio')).toBeInTheDocument()
    expect(screen.getByText('0.95')).toBeInTheDocument()
    expect(screen.getByText('flag_anomaly')).toBeInTheDocument()
    expect(screen.getByText('true')).toBeInTheDocument()
  })

  it('can switch to raw JSON view mode', () => {
    render(<JsonEvidenceViewer data={sampleEvidence} />)
    const jsonBtn = screen.getByTitle('Raw JSON View')
    fireEvent.click(jsonBtn)

    expect(screen.getByText(/"packet_count": 150/)).toBeInTheDocument()
  })

  it('handles null or empty data gracefully', () => {
    render(<JsonEvidenceViewer data={null} />)
    expect(screen.getByText('No evidence data provided')).toBeInTheDocument()
  })

  it('copies JSON to clipboard on button click', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    render(<JsonEvidenceViewer data={sampleEvidence} />)
    const copyBtn = screen.getByTitle('Copy JSON to clipboard')
    await act(async () => {
      fireEvent.click(copyBtn)
    })

    expect(writeTextMock).toHaveBeenCalledWith(
      JSON.stringify(sampleEvidence, null, 2)
    )
  })
})
