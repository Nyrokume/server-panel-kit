import * as React from 'react'
import { cn } from './cn'
import { Callout, type CalloutTone } from './docs'

/* Panel — карточка docs-постановки: hairline-рамка, радиус 12, без тяжёлых теней. */
export function Panel({ className, children, flush, ...props }: React.HTMLAttributes<HTMLDivElement> & { flush?: boolean }) {
  return (
    <div className={cn('rounded-[var(--radius-pk-lg)] border border-line bg-raised', !flush && 'p-4 sm:p-5', className)} {...props}>
      {children}
    </div>
  )
}

/* SectionHeader — заголовок блока внутри карточки или раздела. */
export function SectionHeader({ title, description, actions, className, as = 'h3' }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; className?: string; as?: 'h1' | 'h2' | 'h3' }) {
  const T = as
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-2', className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <T className={cn('text-fg', as === 'h1' ? 'pk-display text-[30px] font-normal leading-tight sm:text-[34px]' : as === 'h2' ? 'pk-display text-[21px] font-normal leading-snug' : 'text-[15px] font-semibold leading-snug')}>{title}</T>
        {description && <p className="max-w-2xl text-[13px] text-muted text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* PageHeader — H1 (display) + лид + действия справа, как в документации. */
export function PageHeader({ title, description, children, crumbs }: { title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode; crumbs?: React.ReactNode }) {
  return (
    <header className="grid grid-cols-1 gap-x-6 gap-y-2.5 pb-1 sm:grid-cols-[minmax(0,1fr)_auto]">
      {crumbs && <div className="sm:col-span-2">{crumbs}</div>}
      <h1 className="pk-display order-1 min-w-0 text-[30px] font-normal leading-[1.15] text-fg text-balance sm:text-[36px]">{title}</h1>
      {children && <div className="order-3 flex flex-wrap items-center gap-2 sm:order-2 sm:justify-end sm:pt-1.5">{children}</div>}
      {description && <p className="order-2 max-w-[68ch] text-base leading-relaxed text-muted text-pretty sm:order-3 sm:col-span-2">{description}</p>}
    </header>
  )
}

/* Stat / KPI — подпись → значение → дельта словами → спарклайн. */
export type StatDelta = { text: string; dir: 'up' | 'down' | 'flat'; tone: 'good' | 'bad' | 'neutral'; sr: string }
export function Stat({ label, value, unit, delta, note, spark, icon: Icon, className }: {
  label: string; value: React.ReactNode; unit?: string; delta?: StatDelta; note?: React.ReactNode; spark?: React.ReactNode; className?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5 p-4', className)}>
      <div className="flex items-center gap-1.5 text-[13px] text-muted">{Icon && <Icon className="size-3.5 shrink-0" />}<span className="truncate">{label}</span></div>
      <div className="flex items-end gap-1 leading-none">
        <span className="truncate text-[26px] font-semibold tracking-tight text-fg tnum">{value}</span>
        {unit && <span className="pb-0.5 text-sm font-normal text-muted">{unit}</span>}
      </div>
      {delta && (
        <div className={cn('flex min-w-0 items-center gap-1 text-[13px] tnum',
          delta.tone === 'good' && 'text-ok', delta.tone === 'bad' && 'text-bad', delta.tone === 'neutral' && 'text-muted')}>
          {delta.dir === 'up' && <span aria-hidden>↑</span>}
          {delta.dir === 'down' && <span aria-hidden>↓</span>}
          <span className="font-semibold">{delta.text}</span>
          {note && <span className="truncate font-normal text-muted">· {note}</span>}
          <span className="sr-only">{delta.sr}</span>
        </div>
      )}
      {!delta && note && <div className="truncate text-[13px] text-muted">{note}</div>}
      {spark && <div className="mt-0.5 h-7 w-full">{spark}</div>}
    </div>
  )
}

/* KpiStrip — полоса метрик в одной рамке, 2×2 на телефоне. */
export function KpiStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 overflow-hidden rounded-[var(--radius-pk-lg)] border border-line bg-raised lg:grid-cols-4',
      '[&>*]:border-line [&>*]:border-t [&>*]:border-l',
      '[&>*:nth-child(1)]:border-t-0 [&>*:nth-child(2)]:border-t-0',
      '[&>*:nth-child(odd)]:border-l-0 lg:[&>*]:border-t-0 lg:[&>*:nth-child(odd)]:border-l',
      'lg:[&>*:nth-child(1)]:border-l-0', className)}>
      {children}
    </div>
  )
}

/* EmptyState — пусто/ошибка словами. */
export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon?: React.ComponentType<{ className?: string }>; title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)}>
      {Icon && <span className="mb-1 flex size-10 items-center justify-center rounded-[var(--radius-pk)] border border-line bg-surface"><Icon className="size-5 text-muted" /></span>}
      <div className="text-sm font-semibold text-fg">{title}</div>
      {description && <p className="max-w-sm text-sm text-muted text-pretty">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/* InfoRow — «ключ · значение» в паспортах. */
export function InfoRow({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2 text-sm last:border-0">
      <span className="min-w-0 shrink-0 text-muted">{k}</span>
      <span className="min-w-0 truncate text-right font-medium text-fg">{v}</span>
    </div>
  )
}

/* NoticeBar — совместимость: теперь это Callout. */
export function NoticeBar({ icon, title, children, tone = 'neutral', className }: {
  icon?: React.ComponentType<{ className?: string }>; title?: React.ReactNode; children?: React.ReactNode; tone?: 'neutral' | 'accent' | 'warn'; className?: string
}) {
  const t: CalloutTone = tone === 'warn' ? 'warn' : tone === 'accent' ? 'info' : 'note'
  return <Callout tone={t} icon={icon} title={title} className={className}>{children}</Callout>
}
