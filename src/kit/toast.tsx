import * as React from 'react'
import { cn } from './cn'
import { Check, Info, TriangleAlert, X } from 'lucide-react'

/* Minimal own toast — no external toast library. */
type ToastTone = 'ok' | 'warn' | 'bad' | 'info'
type ToastItem = { id: number; title: string; description?: string; tone: ToastTone }

let push: ((t: Omit<ToastItem, 'id'>) => void) | null = null
let seq = 1

function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([])
  React.useEffect(() => {
    push = (t) => {
      const id = seq++
      setItems((prev) => [...prev, { ...t, id }])
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 4200)
    }
    return () => { push = null }
  }, [])
  const icon = { ok: Check, warn: TriangleAlert, bad: X, info: Info }
  const tone = { ok: 'text-ok', warn: 'text-warn', bad: 'text-bad', info: 'text-accent' }
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6" role="region" aria-label="Уведомления">
      {items.map((t) => {
        const Icon = icon[t.tone]
        return (
          <div key={t.id} className="pk-pop pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-[var(--radius-pk)] border border-line bg-raised px-3.5 py-3 shadow-lg shadow-black/10" data-state="open" role="status">
            <Icon className={cn('mt-0.5 size-4 shrink-0', tone[t.tone])} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-fg">{t.title}</div>
              {t.description && <div className="mt-0.5 text-[13px] text-muted text-pretty">{t.description}</div>}
            </div>
            <button aria-label="Закрыть" onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))} className="rounded p-0.5 text-faint transition-colors hover:text-fg"><X className="size-3.5" /></button>
          </div>
        )
      })}
    </div>
  )
}

export function ToastHost() { return <Toaster /> }

function emit(tone: ToastTone, title: string, description?: string) {
  if (push) push({ tone, title, description })
}
export const toast = {
  success: (title: string, description?: string) => emit('ok', title, description),
  warning: (title: string, description?: string) => emit('warn', title, description),
  error: (title: string, description?: string) => emit('bad', title, description),
  info: (title: string, description?: string) => emit('info', title, description),
}
