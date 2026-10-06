/* eslint-disable react-refresh/only-export-components -- context module */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { parseHashParam } from '@shared/reportPayload.mjs'
import { decodeReportPayloadFromHash } from '../lib/decodeReportPayload'

const ReportContext = createContext({
  status: 'loading',
  report: null,
  error: null,
})

function readPayloadFromLocation() {
  const encoded = parseHashParam(window.location.hash)
  if (!encoded) {
    return { status: 'missing', report: null, error: null }
  }
  try {
    const report = decodeReportPayloadFromHash(encoded)
    if (!report.findings?.length) {
      return { status: 'ready', report, error: null }
    }
    return { status: 'ready', report, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid report link'
    if (message.includes('Unsupported report version')) {
      return { status: 'error', report: null, error: 'unsupported_version' }
    }
    return { status: 'error', report: null, error: 'invalid' }
  }
}

export function ReportProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', report: null, error: null })

  useEffect(() => {
    const apply = () => setState(readPayloadFromLocation())
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  const value = useMemo(() => state, [state])
  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>
}

export function useReport() {
  return useContext(ReportContext)
}
