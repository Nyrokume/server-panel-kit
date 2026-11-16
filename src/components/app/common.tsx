import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Status } from '@/lib/mock'

const statusMeta: Record<Status, { label: string; dot: string; text: string }> = {
  online: { label: 'В сети', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  warning: { label: 'Внимание', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  offline: { label: 'Не в сети', dot: 'bg-muted-foreground', text: 'text-muted-foreground' },
}

export function StatusDot({ status, withLabel = true, className }: { status: Status; withLabel?: boolean; className?: string }) {
  const m = statusMeta[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', className)}>
      <span className={cn('relative flex size-2 shrink-0')}>
        {status === 'online' && <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', m.dot)} />}
        <span className={cn('relative inline-flex size-2 rounded-full', m.dot)} />
      </span>
      {withLabel && <span className={cn('text-sm', m.text)}>{m.label}</span>}
    </span>
  )
}

export function SmartBadge({ smart }: { smart: 'ok' | 'warn' | 'fail' }) {
  const map = {
    ok: { label: 'Исправен', variant: 'secondary' as const, cls: 'text-emerald-600 dark:text-emerald-400' },
    warn: { label: 'Износ', variant: 'secondary' as const, cls: 'text-amber-600 dark:text-amber-400' },
    fail: { label: 'Отказ', variant: 'destructive' as const, cls: '' },
  }[smart]
  return <Badge variant={map.variant} className={cn('font-medium', map.cls)}>{map.label}</Badge>
}

export function LevelBadge({ level }: { level: 'crit' | 'warn' | 'info' }) {
  const map = {
    crit: { label: 'Критично', variant: 'destructive' as const, cls: '' },
    warn: { label: 'Предупреждение', variant: 'secondary' as const, cls: 'text-amber-600 dark:text-amber-400' },
    info: { label: 'Инфо', variant: 'outline' as const, cls: 'text-muted-foreground' },
  }[level]
  return <Badge variant={map.variant} className={cn('font-medium', map.cls)}>{map.label}</Badge>
}

/* Horizontal usage bar (0–100) with threshold tint, tabular % at the end. */
export function UsageBar({ value, danger = 90, warn = 75, className }: { value: number; danger?: number; warn?: number; className?: string }) {
  const tone = value >= danger ? 'bg-destructive' : value >= warn ? 'bg-amber-500' : 'bg-chart-1'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-[width] duration-500', tone)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{Math.round(value)} %</span>
    </div>
  )
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground text-pretty">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
