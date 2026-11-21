import * as React from 'react'
import { cn } from './cn'

/* Panel — сдержанный контейнер: hairline-рамка, без теней, минимальный радиус.
   В минимализме используется экономно, многое строится на разделителях. */
export function Panel({ className, children, flush, ...props }: React.HTMLAttributes<HTMLDivElement> & { flush?: boolean }) {
  return (
    <div className={cn('rounded-[var(--radius-pk)] border border-line bg-raised', !flush && 'p-4 sm:p-5', className)} {...props}>
      {children}
    </div>
  )
}

/* SectionHeader — заголовок раздела с тонкой подложкой-разделителем. */
export function SectionHeader({ title, description, actions, className, as = 'h2' }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; className?: string; as?: 'h1' | 'h2' | 'h3' }) {
  const T = as
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-4 gap-y-2', className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <T className={cn('font-semibold tracking-tight text-fg', as === 'h1' ? 'text-xl sm:text-2xl' : as === 'h2' ? 'text-base' : 'text-sm')}>{title}</T>
        {description && <p className="max-w-2xl text-sm text-muted text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* PageHeader — шапка страницы (блок). */
export function PageHeader({ title, description, children }: { title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode }) {
  return <SectionHeader as="h1" title={title} description={description} actions={children} className="pb-1" />
}

/* Stat / KPI — метрика без коробки: подпись → значение → дельта словами → спарклайн. */
export type StatDelta = { text: string; dir: 'up' | 'down' | 'flat'; tone: 'good' | 'bad' | 'neutral'; sr: string }
export function Stat({ label, value, unit, delta, note, spark, className }: {
  label: string; value: React.ReactNode; unit?: string; delta?: StatDelta; note?: React.ReactNode; spark?: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5 p-4', className)}>
      <div className="text-[13px] text-muted">{label}</div>
      <div className="flex items-end gap-1 leading-none">
        <span className="text-2xl font-semibold tracking-tight text-fg tnum truncate">{value}</span>
        {unit && <span className="pb-0.5 text-sm font-normal text-muted">{unit}</span>}
      </div>
      {delta && (
        <div className={cn('flex items-center gap-1 text-[13px] tnum',
          delta.tone === 'good' && 'text-ok', delta.tone === 'bad' && 'text-bad', delta.tone === 'neutral' && 'text-muted')}>
          {delta.dir === 'up' && <span aria-hidden>↑</span>}
          {delta.dir === 'down' && <span aria-hidden>↓</span>}
          <span className="font-semibold">{delta.text}</span>
          {note && <span className="font-normal text-muted">· {note}</span>}
          <span className="sr-only">{delta.sr}</span>
        </div>
      )}
      {!delta && note && <div className="text-[13px] text-muted">{note}</div>}
      {spark && <div className="mt-0.5 h-7 w-full">{spark}</div>}
    </div>
  )
}

/* KpiStrip — полоса метрик с hairline-разделителями, 2×2 на телефоне. */
export function KpiStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 overflow-hidden rounded-[var(--radius-pk)] border border-line bg-raised lg:grid-cols-4',
      '[&>*]:border-line [&>*]:border-t [&>*]:border-l',
      '[&>*:nth-child(1)]:border-t-0 [&>*:nth-child(2)]:border-t-0',
      '[&>*:nth-child(odd)]:border-l-0 lg:[&>*]:border-t-0 lg:[&>*:nth-child(odd)]:border-l',
      'lg:[&>*:nth-child(1)]:border-l-0', className)}>
      {children}
    </div>
  )
}

/* EmptyState — пусто/ошибка словами, без спиннеров. */
export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon?: React.ComponentType<{ className?: string }>; title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-14 text-center', className)}>
      {Icon && <Icon className="size-6 text-faint" />}
      <div className="text-sm font-medium text-fg">{title}</div>
      {description && <p className="max-w-sm text-sm text-muted text-pretty">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/* InfoRow — строка «ключ · значение» в паспортах, с тонким пунктиром. */
export function InfoRow({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 overflow-hidden border-b border-dashed border-line py-1.5 text-sm last:border-0">
      <span className="shrink-0 text-muted">{k}</span>
      <span className="min-w-0 truncate text-right font-medium text-fg">{v}</span>
    </div>
  )
}

/* NoticeBar — плоское уведомление (замена Alert), hairline, без заливки-коробки. */
export function NoticeBar({ icon: Icon, title, children, tone = 'neutral', className }: {
  icon?: React.ComponentType<{ className?: string }>; title?: React.ReactNode; children?: React.ReactNode; tone?: 'neutral' | 'accent' | 'warn'; className?: string
}) {
  const accentColor = tone === 'warn' ? 'var(--pk-warn)' : tone === 'accent' ? 'var(--pk-accent)' : 'var(--pk-line-strong)'
  return (
    <div className={cn('flex items-start gap-2.5 rounded-[var(--radius-pk)] border border-line bg-surface px-3.5 py-2.5', className)} style={{ borderLeftColor: accentColor, borderLeftWidth: 2 }}>
      {Icon && <Icon className="mt-0.5 size-4 shrink-0 text-muted" />}
      <div className="min-w-0 text-sm">
        {title && <div className="font-medium text-fg">{title}</div>}
        {children && <div className="text-muted text-pretty">{children}</div>}
      </div>
    </div>
  )
}
