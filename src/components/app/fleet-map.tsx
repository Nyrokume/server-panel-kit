import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import type { Machine, Status } from '@/lib/mock'
import { layoutFleet } from '@/lib/fleet-layout'
import { usePrefersReducedMotion } from '@/hooks/use-media'
import { cn } from '@/kit'

const MIN_Z = 0.28
const MAX_Z = 2.4
const ringColor: Record<Status, string> = {
  online: 'var(--pk-ok)',
  warning: 'var(--pk-warn)',
  offline: 'var(--pk-off)',
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

export function FleetMap({
  fleet, selectedId, onSelect, className,
}: {
  fleet: Machine[]
  selectedId: string | null
  onSelect: (id: string) => void
  className?: string
}) {
  const navigate = useNavigate()
  const reduced = usePrefersReducedMotion()
  const layout = useMemo(() => layoutFleet(fleet), [fleet])
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>(() =>
    Object.fromEntries(layout.nodes.map((n) => [n.id, { x: n.x, y: n.y }])),
  )
  const layoutKey = layout.nodes.map((n) => n.id).join(',')
  useEffect(() => {
    setPos(Object.fromEntries(layout.nodes.map((n) => [n.id, { x: n.x, y: n.y }])))
    fitted.current = false
  }, [layoutKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const viewport = useRef<HTMLDivElement>(null)
  const [view, setView] = useState({ x: 0, y: 0, s: 1 })
  const viewRef = useRef(view)
  viewRef.current = view
  const fitted = useRef(false)

  const posRef = useRef(pos)
  posRef.current = pos

  const fit = useCallback(() => {
    const el = viewport.current
    if (!el) return
    const w = el.clientWidth, h = el.clientHeight
    if (w < 40 || h < 40) return
    const pts = layout.nodes.map((n) => posRef.current[n.id] ?? n)
    if (!pts.length) return
    const minX = Math.min(...pts.map((p) => p.x)) - 160
    const maxX = Math.max(...pts.map((p) => p.x)) + 160
    const minY = Math.min(...pts.map((p) => p.y)) - 90
    const maxY = Math.max(...pts.map((p) => p.y)) + 110
    const s = clamp(Math.min(w / Math.max(1, maxX - minX), h / Math.max(1, maxY - minY)) * 0.9, MIN_Z, 1.2)
    setView({ s, x: (w - (minX + maxX) * s) / 2, y: (h - (minY + maxY) * s) / 2 })
  }, [layout.nodes])

  useEffect(() => {
    fitted.current = false
    let cancelled = false
    const tryFit = () => {
      if (cancelled) return
      const el = viewport.current
      if (!el || el.clientWidth < 40 || el.clientHeight < 40) {
        requestAnimationFrame(tryFit)
        return
      }
      fitted.current = true
      fit()
    }
    const id = requestAnimationFrame(tryFit)
    return () => { cancelled = true; cancelAnimationFrame(id) }
  }, [fit, layoutKey])

  useEffect(() => {
    const el = viewport.current
    if (!el) return
    const ro = new ResizeObserver(() => { if (!pan.current && !drag.current) fit() })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fit])

  const pan = useRef<{ id: number; x: number; y: number; vx: number; vy: number } | null>(null)
  const drag = useRef<{ id: string; pointer: number; dx: number; dy: number; moved: boolean } | null>(null)
  const pinch = useRef<{ d: number; s: number; cx: number; cy: number } | null>(null)
  const lastTap = useRef<{ id: string; t: number } | null>(null)

  const toWorld = (clientX: number, clientY: number) => {
    const r = viewport.current!.getBoundingClientRect()
    const v = viewRef.current
    return { x: (clientX - r.left - v.x) / v.s, y: (clientY - r.top - v.y) / v.s }
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const v = viewRef.current
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08
    const next = clamp(v.s * factor, MIN_Z, MAX_Z)
    const r = viewport.current!.getBoundingClientRect()
    const px = e.clientX - r.left, py = e.clientY - r.top
    const wx = (px - v.x) / v.s, wy = (py - v.y) / v.s
    setView({ s: next, x: px - wx * next, y: py - wy * next })
  }

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())

  const onPointerDownCanvas = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      pinch.current = { d, s: viewRef.current.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }
      pan.current = null
      return
    }
    pan.current = { id: e.pointerId, x: e.clientX, y: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      const next = clamp(pinch.current.s * (d / (pinch.current.d || 1)), MIN_Z, MAX_Z)
      const r = viewport.current!.getBoundingClientRect()
      const px = pinch.current.cx - r.left, py = pinch.current.cy - r.top
      const v = viewRef.current
      const wx = (px - v.x) / v.s, wy = (py - v.y) / v.s
      setView({ s: next, x: px - wx * next, y: py - wy * next })
      return
    }
    if (drag.current && drag.current.pointer === e.pointerId) {
      const w = toWorld(e.clientX, e.clientY)
      const { id, dx, dy } = drag.current
      const nx = w.x - dx, ny = w.y - dy
      if (Math.hypot(nx - (pos[id]?.x ?? 0), ny - (pos[id]?.y ?? 0)) > 2) drag.current.moved = true
      setPos((p) => ({ ...p, [id]: { x: nx, y: ny } }))
      return
    }
    if (pan.current && pan.current.id === e.pointerId) {
      setView((v) => ({ ...v, x: pan.current!.vx + (e.clientX - pan.current!.x), y: pan.current!.vy + (e.clientY - pan.current!.y) }))
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pan.current?.id === e.pointerId) pan.current = null
    if (drag.current?.pointer === e.pointerId) {
      const d = drag.current
      drag.current = null
      if (!d.moved) {
        const now = Date.now()
        if (lastTap.current && lastTap.current.id === d.id && now - lastTap.current.t < 380) {
          lastTap.current = null
          navigate(`/machines/${d.id}`)
        } else {
          lastTap.current = { id: d.id, t: now }
          onSelect(d.id)
        }
      }
    }
  }

  const onNodeDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation()
    const w = toWorld(e.clientX, e.clientY)
    const p = pos[id] ?? { x: 0, y: 0 }
    drag.current = { id, pointer: e.pointerId, dx: w.x - p.x, dy: w.y - p.y, moved: false }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const selectedLinks = useMemo(() => {
    const set = new Set<string>()
    if (!selectedId) return set
    for (const [a, b] of layout.links) {
      if (a === selectedId || b === selectedId) set.add(`${a}|${b}`)
    }
    return set
  }, [layout.links, selectedId])

  const onKeyNav = (e: React.KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) return
    const ids = fleet.map((m) => m.id)
    const cur = selectedId && pos[selectedId] ? selectedId : ids[0]
    if (!cur || !pos[cur]) return
    if (e.key === 'Enter') {
      e.preventDefault()
      navigate(`/machines/${cur}`)
      return
    }
    e.preventDefault()
    const dir = e.key === 'ArrowLeft' ? [-1, 0] : e.key === 'ArrowRight' ? [1, 0] : e.key === 'ArrowUp' ? [0, -1] : [0, 1]
    const c = pos[cur]
    let best: string | null = null, bestScore = Infinity
    for (const m of fleet) {
      if (m.id === cur || !pos[m.id]) continue
      const p = pos[m.id]
      const dx = p.x - c.x, dy = p.y - c.y
      const proj = dx * dir[0] + dy * dir[1]
      if (proj <= 8) continue
      const orth = Math.abs(dx * dir[1] - dy * dir[0])
      const score = proj + orth * 1.4
      if (score < bestScore) { bestScore = score; best = m.id }
    }
    if (best) {
      onSelect(best)
      const el = viewport.current?.querySelector(`[data-node="${best}"]`) as HTMLElement | null
      el?.focus()
    }
  }

  const nodeW = (m: Machine) => {
    const nameW = m.name.length * 8.4
    const longest = Math.max(...m.role.split(' ').map((w) => w.length), Math.ceil(m.role.length / 2))
    const roleW = longest * 7.2
    return Math.min(228, Math.max(168, 44 + Math.max(nameW, roleW)))
  }

  return (
    <div
      ref={viewport}
      className={cn('pk-map relative min-h-0 min-w-0 flex-1 overflow-hidden', className)}
      onWheel={onWheel}
      onPointerDown={onPointerDownCanvas}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyNav}
      role="application"
      aria-label="Карта парка машин. Стрелки выбирают узел, Enter открывает карточку. Перетаскивание двигает карту и узлы, колесо масштабирует."
    >
      <div
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{
          width: layout.width,
          height: layout.height,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`,
          transition: reduced ? undefined : undefined,
        }}
      >
        <svg className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height} aria-hidden>
          {layout.links.map(([a, b]) => {
            const pa = pos[a], pb = pos[b]
            if (!pa || !pb) return null
            const hot = selectedLinks.has(`${a}|${b}`)
            return (
              <line key={`${a}|${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                stroke={hot ? 'var(--pk-accent)' : 'var(--pk-link)'}
                strokeWidth={hot ? 2 : 1.4} />
            )
          })}
        </svg>
        {fleet.map((m) => {
          const p = pos[m.id]
          if (!p) return null
          const w = nodeW(m)
          const h = 64
          const sel = selectedId === m.id
          const oval = m.kind === 'workstation'
          return (
            <button
              key={m.id}
              type="button"
              data-node={m.id}
              aria-pressed={sel}
              aria-label={`${m.name}, ${m.role}, ${m.status === 'online' ? 'в сети' : m.status === 'warning' ? 'внимание' : 'офлайн'}`}
              onPointerDown={(e) => onNodeDown(e, m.id)}
              onDoubleClick={(e) => { e.preventDefault(); navigate(`/machines/${m.id}`) }}
              className={cn(
                'absolute flex items-center gap-2 px-3 text-left outline-none',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pk-ring)]',
              )}
              style={{
                left: p.x - w / 2,
                top: p.y - h / 2,
                width: w,
                height: h,
                borderRadius: oval ? 999 : 10,
                background: sel ? 'var(--pk-node-sel)' : 'var(--pk-node)',
                boxShadow: sel
                  ? (reduced ? 'inset 0 0 0 1.8px var(--pk-accent)' : 'inset 0 0 0 1.8px var(--pk-accent), 0 0 14px color-mix(in oklab, var(--pk-accent) 45%, transparent)')
                  : m.status === 'warning'
                    ? 'inset 0 0 0 1.5px var(--pk-warn)'
                    : 'inset 0 0 0 1.2px color-mix(in oklab, var(--pk-fg) 12%, transparent)',
                zIndex: sel ? 2 : 1,
                minHeight: 44,
              }}
            >
              <span className="size-2.5 shrink-0 rounded-full border-[2.5px]" style={{ borderColor: ringColor[m.status] }} aria-hidden />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate font-mono text-[12px] font-medium text-fg">{m.name}</span>
                <span className="mt-0.5 block overflow-hidden text-[11px] leading-snug text-muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{m.role}</span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-wrap gap-x-3.5 gap-y-1 rounded-lg border border-line bg-bg/80 px-3 py-2 text-xs text-muted backdrop-blur">
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full border-2 border-ok" />В сети</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full border-2 border-warn" />Внимание</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full border-2 border-off" />Офлайн</span>
        <span>Прямоугольник: сервер, овал: станция</span>
      </div>
    </div>
  )
}
