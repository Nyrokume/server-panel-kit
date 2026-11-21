import { createContext, useCallback, useContext, useState } from 'react'
import { tenants } from './mock'

const LAST_KEY = 'spk.lastMachine'

type AppState = {
  tenant: string // tenant id or 'all'
  setTenant: (id: string) => void
  lastMachineId: string | null
  setLastMachineId: (id: string) => void
}
const Ctx = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<string>(tenants[0].id)
  const [lastMachineId, setLast] = useState<string | null>(() => {
    try { return localStorage.getItem(LAST_KEY) } catch { return null }
  })
  const setLastMachineId = useCallback((id: string) => {
    setLast(id)
    try { localStorage.setItem(LAST_KEY, id) } catch { /* ignore */ }
  }, [])
  return <Ctx.Provider value={{ tenant, setTenant, lastMachineId, setLastMachineId }}>{children}</Ctx.Provider>
}
export function useAppState() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAppState outside provider')
  return c
}
