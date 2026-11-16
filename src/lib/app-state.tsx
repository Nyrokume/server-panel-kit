import { createContext, useContext, useState } from 'react'
import { tenants } from './mock'

type AppState = {
  tenant: string // tenant id or 'all'
  setTenant: (id: string) => void
}
const Ctx = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<string>(tenants[0].id)
  return <Ctx.Provider value={{ tenant, setTenant }}>{children}</Ctx.Provider>
}
export function useAppState() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAppState outside provider')
  return c
}
