import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import { ThemeProvider } from './lib/theme'
import { LiveProvider } from './lib/live'
import { AppStateProvider } from './lib/app-state'
import { TooltipProvider } from './kit'
import { ToastHost } from './kit'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <HashRouter>
        <AppStateProvider>
          <LiveProvider>
              <TooltipProvider>
                <App />
                <ToastHost />
              </TooltipProvider>
          </LiveProvider>
        </AppStateProvider>
      </HashRouter>
    </ThemeProvider>
  </StrictMode>,
)
