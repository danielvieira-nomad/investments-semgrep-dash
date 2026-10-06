import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid2'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { EmptyReportState } from './EmptyReportState'
import { OverviewCharts } from './OverviewCharts'
import { ProjectCard } from './ProjectCard'
import { SeverityChips } from './SeverityChips'
import { useReport } from '../context/ReportContext'
import {
  countByStatus,
  getOrgStats,
  groupFindingsByProject,
  topProjectsByHighCritical,
} from '../utils/aggregations'

export function OverviewPage() {
  const { status, report, error } = useReport()
  const [filter, setFilter] = useState('')

  const findings = useMemo(() => report?.findings ?? [], [report])
  const projects = useMemo(
    () => (findings.length ? groupFindingsByProject(findings) : []),
    [findings],
  )
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => p.repositoryName.toLowerCase().includes(q))
  }, [projects, filter])

  if (status === 'loading') return null
  if (status === 'missing') return <EmptyReportState />
  if (status === 'error') return <EmptyReportState variant={error} />
  if (!findings.length) return <EmptyReportState variant="empty" />

  const stats = getOrgStats(findings)

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {report.includedDates.map((d) => (
          <Chip key={d} label={d} size="small" />
        ))}
      </Stack>
      <Typography variant="h5">All projects</Typography>
      <Typography color="text.secondary">
        {stats.totalFindings} findings across {stats.projectCount} repositories
      </Typography>
      <SeverityChips counts={stats.severityCounts} size="medium" />
      <OverviewCharts
        severityCounts={stats.severityCounts}
        statusCounts={countByStatus(findings)}
        topProjects={topProjectsByHighCritical(projects)}
      />
      <TextField
        size="small"
        label="Filter repositories"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        sx={{ maxWidth: 400 }}
      />
      <Grid container spacing={2}>
        {filtered.map((project) => (
          <Grid key={project.repositoryName} size={{ xs: 12, sm: 6, md: 4 }}>
            <ProjectCard project={project} />
          </Grid>
        ))}
      </Grid>
      {!filtered.length ? (
        <Box>
          <Typography color="text.secondary">No repositories match your filter.</Typography>
        </Box>
      ) : null}
    </Stack>
  )
}
