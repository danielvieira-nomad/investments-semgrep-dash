import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { OverviewPage } from './OverviewPage'

vi.mock('../context/ReportContext', () => ({
  useReport: () => ({
    status: 'ready',
    report: {
      v: 1,
      includedDates: ['2026.10.06'],
      findings: [
        {
          id: '1',
          repositoryName: 'org/alpha',
          severity: 'High',
          status: 'Open',
          ruleName: 'r1',
          confidence: 'High',
          category: 'security',
          repositoryUrl: '',
          lineOfCodeUrl: '',
          semgrepPlatformLink: '',
          branch: '',
          createdAt: '',
          lastOpenedAt: '',
          ruleDescription: '',
          triageComment: '',
          triageReason: '',
        },
        {
          id: '2',
          repositoryName: 'org/beta',
          severity: 'Low',
          status: 'Open',
          ruleName: 'r2',
          confidence: 'High',
          category: 'security',
          repositoryUrl: '',
          lineOfCodeUrl: '',
          semgrepPlatformLink: '',
          branch: '',
          createdAt: '',
          lastOpenedAt: '',
          ruleDescription: '',
          triageComment: '',
          triageReason: '',
        },
      ],
    },
    error: null,
  }),
}))

describe('OverviewPage', () => {
  it('renders a card per project', () => {
    render(
      <MemoryRouter>
        <OverviewPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('org/alpha')).toBeInTheDocument()
    expect(screen.getByText('org/beta')).toBeInTheDocument()
  })
})
