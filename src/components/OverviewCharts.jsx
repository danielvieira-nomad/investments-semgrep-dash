import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SEVERITY_ORDER } from '@shared/severity.mjs'

const SEVERITY_COLORS = {
  Critical: '#d32f2f',
  High: '#ed6c02',
  Medium: '#0288d1',
  Low: '#757575',
  Info: '#9e9e9e',
}

export function OverviewCharts({ severityCounts, statusCounts, topProjects }) {
  const severityData = SEVERITY_ORDER
    .filter((s) => severityCounts[s])
    .map((s) => ({ name: s, value: severityCounts[s] }))

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }))

  const topData = topProjects.map((p) => ({
    name: p.repositoryName.split('/').pop() ?? p.repositoryName,
    fullName: p.repositoryName,
    count: p.highCriticalCount,
  }))

  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, flex: 1, minHeight: 280 }}>
          <Typography variant="subtitle2" gutterBottom>
            Findings by severity
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, flex: 1, minHeight: 280 }}>
          <Typography variant="subtitle2" gutterBottom>
            Findings by status
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" hide={statusData.length > 6} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#1565c0" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Stack>
      <Paper variant="outlined" sx={{ p: 2, minHeight: 280 }}>
        <Typography variant="subtitle2" gutterBottom>
          Top projects (High + Critical)
        </Typography>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip
              formatter={(value) => [value, 'High + Critical']}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
            />
            <Bar dataKey="count" fill="#ed6c02" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Stack>
  )
}
