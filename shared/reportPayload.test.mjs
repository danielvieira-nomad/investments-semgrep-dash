import { gzipSync, gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import {
  REPORT_PAYLOAD_VERSION,
  buildHashParam,
  decodeReportPayload,
  encodeReportPayload,
  parseHashParam,
} from './reportPayload.mjs'

describe('reportPayload', () => {
  const sample = {
    v: REPORT_PAYLOAD_VERSION,
    generatedAt: '2026-10-06T12:00:00.000Z',
    includedDates: ['2026.10.06'],
    findings: [
      {
        id: '1',
        repositoryName: 'org/repo-a',
        severity: 'High',
        status: 'Open',
        ruleName: 'rule.a',
        confidence: 'High',
        category: 'security',
        repositoryUrl: '',
        lineOfCodeUrl: '',
        semgrepPlatformLink: '',
        branch: 'refs/heads/main',
        createdAt: '',
        lastOpenedAt: '',
        ruleDescription: 'desc',
        triageComment: '',
        triageReason: '',
      },
    ],
  }

  it('round-trips encode/decode', () => {
    const enc = encodeReportPayload(sample, gzipSync)
    expect(typeof enc).toBe('string')
    const out = decodeReportPayload(enc, gunzipSync)
    expect(out).toEqual(sample)
  })

  it('parseHashParam reads d from hash', () => {
    const enc = encodeReportPayload(sample, gzipSync)
    expect(parseHashParam(buildHashParam(enc))).toBe(enc)
    expect(parseHashParam('#d=abc')).toBe('abc')
    expect(parseHashParam('')).toBeNull()
  })
})
