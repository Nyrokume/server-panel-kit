import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import { ThemeProvider } from './lib/theme'
import { LiveProvider } from './lib/live'
import { AppStateProvider } from './lib/app-state'
import { AbProvider } from './lib/ab'
import { TooltipProvider } from './kit'
import { ToastHost } from './kit'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <HashRouter>
        <AppStateProvider>
          <LiveProvider>
            <AbProvider>
              <TooltipProvider>
                <App />
                <ToastHost />
              </TooltipProvider>
            </AbProvider>
          </LiveProvider>
        </AppStateProvider>
      </HashRouter>
    </ThemeProvider>
  </StrictMode>,
)
