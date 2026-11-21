/* Docs-постановка блоков (по мотивам раскладки документации, свой код):
   хлебные крошки, страница с TOC, разделы с якорем, сетка карточек, callout,
   блок кода с шапкой и копированием, шаги, «назад/вперёд». */
import * as React from 'react'
import { cn } from './cn'
import { Check, ChevronRight, Copy, Info, Lightbulb, OctagonX, StickyNote, TriangleAlert, TextAlignStart, ArrowLeft, ArrowRight, Link2 } from 'lucide-react'

type AnyLink = React.ElementType

/* ------------------------------------------------------------- Breadcrumbs */
export type Crumb = { label: React.ReactNode; to?: string }
export function Breadcrumbs({ items, as: L = 'a', className }: { items: Crumb[]; as?: AnyLink; className?: string }) {
  return (
    <nav aria-label="Хлебные крошки" className={cn('flex min-w-0 flex-wrap items-center gap-1 text-[13px] text-muted', className)}>
      {items.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-faint" aria-hidden />}
          {c.to && i < items.length - 1
            ? <L to={c.to} href={c.to} className="rounded-sm transition-colors hover:text-fg">{c.label}</L>
            : <span className={cn('truncate', i === items.length - 1 && 'text-fg')} aria-current={i === items.length - 1 ? 'page' : undefined}>{c.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  )
}

/* ------------------------------------------------------------------ Callout */
export type CalloutTone = 'note' | 'info' | 'tip' | 'warn' | 'danger'
const calloutMeta: Record<CalloutTone, { icon: React.ComponentType<{ className?: string }>; box: string; ic: string }> = {
  note: { icon: StickyNote, box: 'border-line bg-surface/60', ic: 'text-muted' },
  info: { icon: Info, box: 'border-[color-mix(in_oklab,var(--pk-accent)_28%,transparent)] bg-[var(--pk-info-bg)]', ic: 'text-accent' },
  tip: { icon: Lightbulb, box: 'border-[color-mix(in_oklab,var(--pk-ok)_30%,transparent)] bg-[var(--pk-ok-bg)]', ic: 'text-ok' },
  warn: { icon: TriangleAlert, box: 'border-[color-mix(in_oklab,var(--pk-warn)_38%,transparent)] bg-[var(--pk-warn-bg)]', ic: 'text-warn' },
  danger: { icon: OctagonX, box: 'border-[color-mix(in_oklab,var(--pk-bad)_34%,transparent)] bg-[var(--pk-bad-bg)]', ic: 'text-bad' },
}
export function Callout({ tone = 'note', icon, title, children, action, className }: {
  tone?: CalloutTone; icon?: React.ComponentType<{ className?: string }>; title?: React.ReactNode; children?: React.ReactNode; action?: React.ReactNode; className?: string
}) {
  const m = calloutMeta[tone]
  const Icon = icon ?? m.icon
  return (
    <div role={tone === 'danger' || tone === 'warn' ? 'note' : undefined} className={cn('flex items-start gap-3 rounded-[var(--radius-pk-lg)] border px-4 py-3', m.box, className)}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', m.ic)} />
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        {title && <div className="font-semibold text-fg">{title}</div>}
        {children && <div className="text-fg/80 text-pretty">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  )
}

/* ----------------------------------------------------------------- Section */
export function Section({ id, title, description, actions, children, className }: {
  id: string; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  const jump = () => {
    document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={cn('flex min-w-0 flex-col gap-3', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={`${id}-h`} className="group pk-display flex items-center gap-2 text-[22px] font-normal leading-snug text-fg">
            {title}
            <button type="button" onClick={jump} aria-label="Ссылка на раздел" className="text-faint opacity-0 transition-opacity hover:text-fg focus-visible:opacity-100 group-hover:opacity-100">
              <Link2 className="size-4" />
            </button>
          </h2>
          {description && <p className="max-w-[68ch] text-sm text-muted text-pretty">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  )
}

/* --------------------------------------------------------------------- TOC */
export type TocItem = { id: string; label: string; depth?: 0 | 1 }
export function Toc({ items, title = 'На странице' }: { items: TocItem[]; title?: string }) {
  const [active, setActive] = React.useState(items[0]?.id)
  React.useEffect(() => {
    let raf = 0
    const calc = () => {
      raf = 0
      const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pk-header-h')) || 100
      let cur = items[0]?.id
      for (const it of items) {
        const el = document.getElementById(it.id)
        if (el && el.getBoundingClientRect().top - top - 40 <= 0) cur = it.id
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = items[items.length - 1]?.id
      setActive(cur)
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(calc) }
    calc()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf) }
  }, [items])
  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    setActive(id)
  }
  return (
    <nav aria-label={title} className="flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2 font-medium text-fg"><TextAlignStart className="size-4 text-muted" />{title}</div>
      <ul className="flex flex-col border-l border-line">
        {items.map((it) => (
          <li key={it.id}>
            <button type="button" onClick={() => go(it.id)} aria-current={active === it.id ? 'location' : undefined}
              className={cn('-ml-px block w-full border-l py-1 text-left pointer-coarse:min-h-11 leading-snug transition-colors',
                it.depth ? 'pl-6 text-[13px]' : 'pl-3',
                active === it.id ? 'border-fg font-medium text-fg' : 'border-transparent text-muted hover:text-fg')}>
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/* --------------------------------------------------------------- DocPage
   Центральная колонка (крошки → H1 → лид → разделы) + правое «На странице». */
export function DocPage({ header, toc, children, className }: { header: React.ReactNode; toc?: TocItem[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid min-w-0 grid-cols-1 gap-10', toc && toc.length > 1 && 'xl:grid-cols-[minmax(0,1fr)_208px]', className)}>
      <div className="flex min-w-0 flex-col gap-8">
        {header}
        {children}
      </div>
      {toc && toc.length > 1 && (
        <aside className="hidden xl:block">
          <div className="sticky top-[calc(var(--pk-header-h)+28px)] max-h-[calc(100dvh-var(--pk-header-h)-56px)] overflow-y-auto pk-scroll"><Toc items={toc} /></div>
        </aside>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ Card grid */
export function CardGrid({ children, cols = 3, className }: { children: React.ReactNode; cols?: 2 | 3 | 4; className?: string }) {
  const c = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[cols]
  return <div className={cn('grid grid-cols-1 gap-3', c, className)}>{children}</div>
}

type CardProps = {
  icon?: React.ComponentType<{ className?: string }>; title: React.ReactNode; description?: React.ReactNode
  children?: React.ReactNode; aside?: React.ReactNode; className?: string; as?: AnyLink; interactive?: boolean
  [k: string]: unknown
}
export function Card({ icon: Icon, title, description, children, aside, className, as: Comp = 'div', interactive, ...rest }: CardProps) {
  const isLink = interactive ?? Comp !== 'div'
  return (
    <Comp {...rest} className={cn('group flex min-w-0 flex-col gap-2 rounded-[var(--radius-pk-lg)] border border-line bg-raised p-4 text-left',
      isLink && 'pk-tactile cursor-pointer hover:border-line-strong hover:shadow-[var(--pk-shadow-card)] focus-visible:outline-2 focus-visible:outline-[var(--pk-ring)] active:bg-surface',
      className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && <Icon className="size-4 shrink-0 text-fg" />}
          <span className="truncate text-sm font-semibold text-fg">{title}</span>
        </div>
        {aside ?? (isLink && <ArrowRight className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg motion-reduce:transition-none" />)}
      </div>
      {description && <p className="text-[13px] leading-relaxed text-muted text-pretty">{description}</p>}
      {children}
    </Comp>
  )
}

/* -------------------------------------------------------------- CodeBlock */
export function CopyButton({ text, className, label = 'Скопировать' }: { text: string; className?: string; label?: string }) {
  const [ok, setOk] = React.useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text) } catch { /* clipboard may be blocked */ }
    setOk(true); setTimeout(() => setOk(false), 1400)
  }
  return (
    <button type="button" onClick={copy} aria-label={ok ? 'Скопировано' : label} title={ok ? 'Скопировано' : label}
      className={cn('inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-fg motion-safe:active:scale-95 pointer-coarse:size-11', className)}>
      {ok ? <Check className="size-4 text-ok" /> : <Copy className="size-4" />}
    </button>
  )
}

export function CodeBlock({ title, code, tabs, actions, className, maxHeight }: {
  title?: React.ReactNode; code?: string; tabs?: { label: string; code: string }[]; actions?: (code: string) => React.ReactNode; className?: string; maxHeight?: number
}) {
  const [i, setI] = React.useState(0)
  const cur = tabs ? tabs[Math.min(i, tabs.length - 1)].code : code ?? ''
  return (
    <div className={cn('overflow-hidden rounded-[var(--radius-pk-lg)] border border-line bg-raised', className)}>
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-2 border-b border-line pl-2 pr-1.5">
        {tabs ? (
          <div role="tablist" aria-label="Варианты" className="flex min-w-0 flex-wrap items-center gap-x-0.5">
            {tabs.map((t, k) => (
              <button key={t.label} role="tab" aria-selected={k === i} onClick={() => setI(k)}
                className={cn('relative min-h-11 shrink-0 px-2.5 text-[13px] transition-colors',
                  k === i ? 'font-medium text-fg after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary' : 'text-muted hover:text-fg')}>{t.label}</button>
            ))}
          </div>
        ) : <span className="min-w-0 truncate px-1.5 text-[13px] font-medium text-muted">{title}</span>}
        <div className="flex shrink-0 items-center gap-1">{actions?.(cur)}<CopyButton text={cur} /></div>
      </div>
      <pre className="overflow-auto px-4 py-3 font-mono text-[13px] leading-6 text-fg pk-scroll" style={maxHeight ? { maxHeight } : undefined}><code>{cur}</code></pre>
    </div>
  )
}

/* ------------------------------------------------------------------ Steps */
export function Steps({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ol className={cn('flex flex-col', className)}>{children}</ol>
}
export function Step({ n, title, children, state = 'todo', onClick, last }: {
  n: number; title: React.ReactNode; children?: React.ReactNode; state?: 'todo' | 'current' | 'done'; onClick?: () => void; last?: boolean
}) {
  const Head = onClick ? 'button' : 'div'
  return (
    <li className="relative flex gap-3.5 pb-5 last:pb-0" aria-current={state === 'current' ? 'step' : undefined}>
      {!last && <span aria-hidden className="absolute left-3 top-7 bottom-1 w-px bg-line" />}
      <span className={cn('relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tnum transition-colors',
        state === 'current' ? 'bg-primary text-primary-fg' : state === 'done' ? 'border border-line-strong bg-surface text-fg' : 'border border-line bg-raised text-muted')}>
        {state === 'done' ? <Check className="size-3.5" /> : n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Head {...(onClick ? { type: 'button', onClick } : {})} className={cn('min-h-6 text-left text-[15px] font-semibold leading-6 text-fg', onClick && 'rounded-sm hover:underline decoration-line-strong underline-offset-4 pointer-coarse:min-h-11')}>{title}</Head>
        {children && <div className="text-sm text-muted text-pretty">{children}</div>}
      </div>
    </li>
  )
}

/* --------------------------------------------------------------- PrevNext */
export function PrevNext({ prev, next, as: L = 'a' }: { prev?: { to: string; label: string }; next?: { to: string; label: string }; as?: AnyLink }) {
  if (!prev && !next) return null
  const cls = 'pk-tactile group flex min-h-16 min-w-0 flex-1 flex-col justify-center gap-0.5 rounded-[var(--radius-pk-lg)] border border-line bg-raised px-4 py-3 hover:border-line-strong'
  return (
    <nav aria-label="Соседние разделы" className="flex flex-col gap-3 sm:flex-row">
      {prev ? (
        <L to={prev.to} href={prev.to} className={cls}>
          <span className="flex items-center gap-1 text-[13px] text-muted"><ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />Назад</span>
          <span className="truncate text-sm font-semibold text-fg">{prev.label}</span>
        </L>
      ) : <span className="hidden flex-1 sm:block" />}
      {next ? (
        <L to={next.to} href={next.to} className={cn(cls, 'items-end text-right')}>
          <span className="flex items-center gap-1 text-[13px] text-muted">Дальше<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
          <span className="truncate text-sm font-semibold text-fg">{next.label}</span>
        </L>
      ) : <span className="hidden flex-1 sm:block" />}
    </nav>
  )
}
