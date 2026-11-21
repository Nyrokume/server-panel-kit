import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { machines, sampleFor, seedHistory, type HistPoint, type Machine, type Sample } from './mock'

const HISTORY = 40
const INTERVAL = 2000

type LiveState = {
  tick: number
  samples: Record<string, Sample>
  history: Record<string, HistPoint[]>
  paused: boolean
  pausedAt: number | null
  setPaused: (v: boolean) => void
}

const LiveCtx = createContext<LiveState | null>(null)

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const start = useRef(1000)
  const [tick, setTick] = useState(start.current)
  const [paused, setPausedState] = useState(false)
  const [pausedAt, setPausedAt] = useState<number | null>(null)
  const setPaused = (v: boolean) => {
    setPausedState(v)
    setPausedAt(v ? Date.now() : null)
  }
  const [samples, setSamples] = useState<Record<string, Sample>>(() =>
    Object.fromEntries(machines.map((m) => [m.id, sampleFor(m, start.current)])),
  )
  const [history, setHistory] = useState<Record<string, HistPoint[]>>(() =>
    Object.fromEntries(machines.map((m) => [m.id, seedHistory(m, HISTORY, start.current)])),
  )

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setTick((prev) => {
        const next = prev + 1
        const s: Record<string, Sample> = {}
        const now = Date.now()
        setHistory((h) => {
          const nh: Record<string, HistPoint[]> = {}
          for (const m of machines) {
            const smp = sampleFor(m, next)
            s[m.id] = smp
            nh[m.id] = [...h[m.id].slice(1), { t: now, tick: next, ...smp }]
          }
          return nh
        })
        setSamples(s)
        return next
      })
    }, INTERVAL)
    return () => clearInterval(id)
  }, [paused])

  return <LiveCtx.Provider value={{ tick, samples, history, paused, pausedAt, setPaused }}>{children}</LiveCtx.Provider>
}

export function useLive() {
  const ctx = useContext(LiveCtx)
  if (!ctx) throw new Error('useLive must be used within LiveProvider')
  return ctx
}

export function useMachineLive(id: string) {
  const { samples, history } = useLive()
  return { sample: samples[id], history: history[id] ?? [] }
}

export function fleetFor(tenantId: string | 'all'): Machine[] {
  return tenantId === 'all' ? machines : machines.filter((m) => m.tenantId === tenantId)
}

export function preferredMachine(fleet: Machine[], lastId: string | null | undefined): Machine | undefined {
  return fleet.find((m) => m.id === lastId) ?? fleet.find((m) => m.status !== 'offline') ?? fleet[0]
}
