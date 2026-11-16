/* A/B module (test panel): local GrowthBook feature-flag layer, no network.
 * Experiment: overview_layout (control = KPI row then charts; variant = split hero board).
 *   + CTA copy variant on the overview primary action.
 * Deterministic sticky assignment by a per-browser visitor id; events go to an in-memory log
 * that the «A/B-тест» results page reads. Mirrors preregistration in src/lib/ab-protocol.md. */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'

export type AbEvent = { name: string; at: number; variant: string; props?: Record<string, unknown> }

const KEY_VID = 'spk.vid'
const KEY_EVENTS = 'spk.ab.events'
const KEY_FORCE = 'spk.ab.force'

function visitorId() {
  try {
    let v = localStorage.getItem(KEY_VID)
    if (!v) { v = 'v-' + Math.random().toString(36).slice(2, 10); localStorage.setItem(KEY_VID, v) }
    return v
  } catch { return 'v-anon' }
}

function loadEvents(): AbEvent[] {
  try { return JSON.parse(localStorage.getItem(KEY_EVENTS) || '[]') } catch { return [] }
}
function saveEvents(e: AbEvent[]) {
  try { localStorage.setItem(KEY_EVENTS, JSON.stringify(e.slice(-2000))) } catch { /* ignore */ }
}

/* Local feature definitions — in production these come from the GrowthBook SDK endpoint. */
const features = {
  overview_layout: {
    defaultValue: 'control',
    rules: [{ variations: ['control', 'split-board'], weights: [0.5, 0.5], hashAttribute: 'id', coverage: 1 }],
  },
  overview_cta: {
    defaultValue: 'control',
    rules: [{ variations: ['control', 'action'], weights: [0.5, 0.5], hashAttribute: 'id', coverage: 1 }],
  },
}

type AbState = {
  gb: GrowthBook
  layout: 'control' | 'split-board'
  cta: 'control' | 'action'
  track: (name: string, props?: Record<string, unknown>) => void
  events: AbEvent[]
  force: (exp: 'overview_layout' | 'overview_cta', value: string | null) => void
  forced: Record<string, string>
  vid: string
}

const AbCtx = createContext<AbState | null>(null)

export function AbProvider({ children }: { children: React.ReactNode }) {
  const vid = useMemo(visitorId, [])
  const [events, setEvents] = useState<AbEvent[]>(loadEvents)
  const [forced, setForced] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(KEY_FORCE) || '{}') } catch { return {} }
  })

  const gb = useMemo(() => {
    const g = new GrowthBook({
      attributes: { id: vid, deviceType: 'desktop' },
      features,
      trackingCallback: (experiment, result) => {
        const ev: AbEvent = { name: 'experiment_viewed', at: Date.now(), variant: String(result.value), props: { experiment: experiment.key } }
        setEvents((prev) => { const nx = [...prev, ev]; saveEvents(nx); return nx })
      },
    })
    return g
  }, [vid])

  useEffect(() => {
    gb.setForcedFeatures(new Map(Object.entries(forced)))
  }, [gb, forced])

  const layout = (gb.getFeatureValue('overview_layout', 'control') as AbState['layout'])
  const cta = (gb.getFeatureValue('overview_cta', 'control') as AbState['cta'])

  const track = (name: string, props?: Record<string, unknown>) => {
    const ev: AbEvent = { name, at: Date.now(), variant: `${layout}/${cta}`, props }
    setEvents((prev) => { const nx = [...prev, ev]; saveEvents(nx); return nx })
  }

  const force = (exp: 'overview_layout' | 'overview_cta', value: string | null) => {
    setForced((prev) => {
      const nx = { ...prev }
      if (value === null) delete nx[exp]
      else nx[exp] = value
      try { localStorage.setItem(KEY_FORCE, JSON.stringify(nx)) } catch { /* ignore */ }
      return nx
    })
  }

  const value: AbState = { gb, layout, cta, track, events, force, forced, vid }
  return (
    <GrowthBookProvider growthbook={gb}>
      <AbCtx.Provider value={value}>{children}</AbCtx.Provider>
    </GrowthBookProvider>
  )
}

export function useAb() {
  const ctx = useContext(AbCtx)
  if (!ctx) throw new Error('useAb must be used within AbProvider')
  return ctx
}

export function clearAbEvents() {
  try { localStorage.removeItem(KEY_EVENTS) } catch { /* ignore */ }
}
