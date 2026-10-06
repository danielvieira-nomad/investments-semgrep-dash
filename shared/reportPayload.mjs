export const REPORT_PAYLOAD_VERSION = 1

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4))
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad
  return Buffer.from(b64, 'base64')
}

export function encodeReportPayload(report, gzipSyncFn) {
  if (report.v !== REPORT_PAYLOAD_VERSION) {
    throw new Error(`Unsupported report version: ${report.v}`)
  }
  const json = JSON.stringify(report)
  const compressed = gzipSyncFn(Buffer.from(json, 'utf8'))
  return toBase64Url(compressed)
}

export function decodeReportPayload(encoded, gunzipSyncFn) {
  const buf = fromBase64Url(encoded)
  const json = gunzipSyncFn(buf).toString('utf8')
  const report = JSON.parse(json)
  if (report.v !== REPORT_PAYLOAD_VERSION) {
    throw new Error(`Unsupported report version: ${report.v}`)
  }
  return report
}

export function buildHashParam(encoded) {
  return `#d=${encoded}`
}

export function parseHashParam(hash) {
  if (!hash) return null
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(raw)
  return params.get('d')
}
