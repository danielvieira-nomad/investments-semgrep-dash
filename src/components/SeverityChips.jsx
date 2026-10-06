import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import { SEVERITY_ORDER, normalizeSeverity } from '@shared/severity.mjs'

const SEVERITY_COLOR = {
  Critical: 'error',
  High: 'warning',
  Medium: 'info',
  Low: 'default',
  Info: 'default',
}

export function SeverityChips({ counts, size = 'small' }) {
  const keys = [
    ...SEVERITY_ORDER.filter((s) => counts[s]),
    ...Object.keys(counts).filter(
      (k) => !SEVERITY_ORDER.includes(normalizeSeverity(k)),
    ),
  ]
  if (!keys.length) return null
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {keys.map((severity) => (
        <Chip
          key={severity}
          size={size}
          label={`${severity}: ${counts[severity] ?? counts[normalizeSeverity(severity)]}`}
          color={SEVERITY_COLOR[normalizeSeverity(severity)] ?? 'default'}
          variant="outlined"
        />
      ))}
    </Stack>
  )
}
