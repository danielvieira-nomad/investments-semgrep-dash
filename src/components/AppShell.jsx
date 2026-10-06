import AppBar from '@mui/material/AppBar'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { Outlet } from 'react-router-dom'
import { useColorMode } from '../context/ColorModeContext'
import { useReport } from '../context/ReportContext'

export function AppShell() {
  const { mode, toggle } = useColorMode()
  const { report } = useReport()

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Semgrep — Investments
          </Typography>
          {report?.includedDates?.length ? (
            <Typography variant="caption" sx={{ mr: 2 }} color="text.secondary">
              {report.includedDates.join(' · ')}
            </Typography>
          ) : null}
          <IconButton onClick={toggle} color="inherit" aria-label="Toggle theme">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </>
  )
}
