import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { EmptyReportState } from './EmptyReportState'
import { FindingRow } from './FindingRow'
import { SeverityChips } from './SeverityChips'
import { useReport } from '../context/ReportContext'
import {
  groupFindingsBySeverity,
  groupFindingsByProject,
} from '../utils/aggregations'
import { fromRepoSlug } from '../utils/repoSlug'

export function ProjectPage() {
  const { repoSlug } = useParams()
  const { status, report, error } = useReport()

  if (status === 'loading') return null
  if (status === 'missing') return <EmptyReportState />
  if (status === 'error') return <EmptyReportState variant={error} />

  const repoName = fromRepoSlug(repoSlug ?? '')
  const projects = groupFindingsByProject(report.findings)
  const project = projects.find((p) => p.repositoryName === repoName)

  if (!project) return <EmptyReportState variant="not_found" />

  const severityGroups = groupFindingsBySeverity(project.findings)

  return (
    <Stack spacing={2}>
      <Breadcrumbs>
        <Link component={RouterLink} to="/" underline="hover">
          Overview
        </Link>
        <Typography color="text.primary">{repoName}</Typography>
      </Breadcrumbs>
      <SeverityChips counts={project.severityCounts} size="medium" />
      <Typography variant="caption" color="text.secondary">
        Snapshots: {report.includedDates.join(', ')}
      </Typography>
      {severityGroups.map(([severity, findings]) => (
        <Stack key={severity} spacing={1}>
          <Typography variant="h6">
            {severity} ({findings.length})
          </Typography>
          {findings.map((finding) => (
            <FindingRow key={finding.id} finding={finding} />
          ))}
        </Stack>
      ))}
    </Stack>
  )
}
