import { createTheme } from '@mui/material/styles'

export function getTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: mode === 'dark' ? '#90caf9' : '#1565c0' },
    },
  })
}
