/* eslint-disable react-refresh/only-export-components -- context module */
import { createContext, useContext, useMemo, useState } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { getTheme } from '../theme/theme'

const STORAGE_KEY = 'semgrep-dash-color-mode'

const ColorModeContext = createContext({ mode: 'light', toggle: () => {} })

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  })

  const value = useMemo(
    () => ({
      mode,
      toggle: () => {
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light'
          localStorage.setItem(STORAGE_KEY, next)
          return next
        })
      },
    }),
    [mode],
  )

  const theme = useMemo(() => getTheme(mode), [mode])

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export function useColorMode() {
  return useContext(ColorModeContext)
}
