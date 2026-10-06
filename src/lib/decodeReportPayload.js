import { inflate } from 'pako'
import { REPORT_PAYLOAD_VERSION } from '@shared/reportPayload.mjs'

function fromBase64Url(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4))
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function decodeReportPayloadFromHash(encoded) {
  const bytes = fromBase64Url(encoded)
  const json = new TextDecoder().decode(inflate(bytes))
  const report = JSON.parse(json)
  if (report.v !== REPORT_PAYLOAD_VERSION) {
    throw new Error(`Unsupported report version: ${report.v}`)
  }
  return report
}
