import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

export function FindingRow({ finding }) {
  return (
    <Accordion disableGutters variant="outlined" sx={{ mb: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack spacing={0.5} sx={{ width: '100%', pr: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {finding.ruleName}
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={finding.status} />
            <Chip size="small" label={finding.confidence} variant="outlined" />
            <Chip size="small" label={finding.category} variant="outlined" />
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="caption" color="text.secondary" display="block">
          Branch: {finding.branch || '—'} · Created: {finding.createdAt || '—'}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 1, mb: 1 }} flexWrap="wrap">
          {finding.semgrepPlatformLink ? (
            <Link href={finding.semgrepPlatformLink} target="_blank" rel="noopener noreferrer">
              Semgrep
            </Link>
          ) : null}
          {finding.lineOfCodeUrl ? (
            <Link href={finding.lineOfCodeUrl} target="_blank" rel="noopener noreferrer">
              Line of code
            </Link>
          ) : null}
        </Stack>
        {finding.ruleDescription ? (
          <Typography variant="body2" color="text.secondary">
            {finding.ruleDescription}
          </Typography>
        ) : null}
        {finding.triageComment || finding.triageReason ? (
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Triage: {finding.triageComment || finding.triageReason}
          </Typography>
        ) : null}
      </AccordionDetails>
    </Accordion>
  )
}
