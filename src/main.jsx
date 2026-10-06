import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ColorModeProvider } from './context/ColorModeContext.jsx'
import { ReportProvider } from './context/ReportContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ColorModeProvider>
      <ReportProvider>
        <App />
      </ReportProvider>
    </ColorModeProvider>
  </StrictMode>,
)
