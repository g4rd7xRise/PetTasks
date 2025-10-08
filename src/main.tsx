import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/Problems/ThemeContext.tsx'
import { AppThemeProvider } from './components/UI/theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </ThemeProvider>
  </StrictMode>,
)
