import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export function EmptyReportState({ variant }) {
  if (variant === 'invalid') {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Invalid or corrupted report link. Generate a new link with{' '}
        <code>npm run report:link</code> on your machine.
      </Alert>
    )
  }
  if (variant === 'unsupported_version') {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        This report uses an unsupported version. Update the dashboard or regenerate
        the link.
      </Alert>
    )
  }
  if (variant === 'not_found') {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Project not found in this report.
      </Alert>
    )
  }
  if (variant === 'empty') {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        This report contains no findings for the selected snapshot dates.
      </Alert>
    )
  }
  return (
    <Box sx={{ mt: 4, maxWidth: 560 }}>
      <Typography variant="h5" gutterBottom>
        Open a Semgrep report
      </Typography>
      <Typography color="text.secondary">
        Reports are not stored in this app. Run{' '}
        <code>npm run report:link</code> locally (with CSVs in{' '}
        <code>findings/</code>) and open the generated URL, or ask a teammate
        to share their link.
      </Typography>
    </Box>
  )
}
