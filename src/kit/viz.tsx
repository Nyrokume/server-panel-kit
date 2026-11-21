import * as React from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'
import { cn } from './cn'
import { Button } from './primitives'
import { Table, THead, TBody, TR, TH, TD } from './table'
import { fmtNumber, niceTicks } from '../lib/format'
import { LineChart as LineIcon, Table2 } from 'lucide-react'

/* Sparkline — crisp mini line, accent stroke, no axes. */
export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null
  const w = 120, h = 28, min = Math.min(...data), max = Math.max(...data), r = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / r) * h}`).join(' ')
  return (
    <svg viewBox="0 0 120 28" className={cn('h-7 w-full', className)} preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--pk-c1)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/* ChartFrame — headline (the message) → factual subtitle → plot/table toggle → source. */
export function ChartFrame({ title, subtitle, source, children, table, className, actions }: {
  title: string; subtitle?: string; source?: string; children: React.ReactNode; table: React.ReactNode; className?: string; actions?: React.ReactNode
}) {
  const [asTable, setAsTable] = React.useState(false)
  return (
    <section className={cn('flex flex-col rounded-[var(--radius-pk)] border border-line bg-raised', className)}>
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium leading-snug text-fg text-balance">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted text-pretty">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {actions}
          <Button variant="outline" size="sm" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)} className="gap-1.5">
            {asTable ? <LineIcon /> : <Table2 />}<span className="hidden sm:inline">{asTable ? 'График' : 'Таблица'}</span>
          </Button>
        </div>
      </header>
      <div className="px-2 py-4 sm:px-4">{asTable ? <div className="overflow-x-auto px-2 pk-scroll">{table}</div> : children}</div>
      {source && <div className="border-t border-line px-4 py-2.5 text-xs text-muted sm:px-5">{source}</div>}
    </section>
  )
}

/* DataTable — the chart's text equivalent. */
export function VizTable({ head, rows, caption }: { head: string[]; rows: (string | number)[][]; caption?: string }) {
  return (
    <Table>
      {caption && <caption className="pb-2 text-left text-xs text-muted">{caption}</caption>}
      <THead><tr className="border-b border-line">{head.map((h, i) => <TH key={h} align={i > 0 ? 'right' : 'left'}>{h}</TH>)}</tr></THead>
      <TBody>
        {rows.map((r, i) => (
          <TR key={i}>{r.map((c, j) => <TD key={j} align={j > 0 ? 'right' : 'left'} className={j === 0 ? 'font-medium' : ''}>{c}</TD>)}</TR>
        ))}
      </TBody>
    </Table>
  )
}

const axisProps = { tickLine: false, axisLine: false, tickMargin: 8 } as const

/* Multi-line time chart — accent series + grey context, direct end labels, zero baseline. */
export function TimeLine({ data, series, unit = '', max }: {
  data: Record<string, number | string>[]
  series: { key: string; label: string; focus?: boolean }[]
  unit?: string; max?: number
}) {
  const colorFor = (s: { focus?: boolean }, i: number) => (s.focus ? 'var(--pk-c1)' : i === 1 ? 'var(--pk-c2)' : 'var(--pk-c3)')
  const values = data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0))
  const hi = max ?? Math.max(1, ...values)
  const ticks = niceTicks(0, hi, { count: 4 })
  const renderEnd = (s: { key: string; focus?: boolean }) => (props: { x?: number; y?: number; index?: number; value?: number }) => {
    const x = Number(props.x), y = Number(props.y)
    if (props.index !== data.length - 1 || Number.isNaN(x) || Number.isNaN(y)) return <g key={`${s.key}-${props.index}`} />
    return (
      <text key={`${s.key}-end`} x={x + 8} y={y} dominantBaseline="middle" fontSize={12} fontWeight={s.focus ? 600 : 500}
        fill={s.focus ? 'var(--pk-fg)' : 'var(--pk-muted)'}>{`${fmtNumber(Number(props.value))}${unit}`}</text>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ left: 4, right: 52, top: 10, bottom: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} stroke="var(--pk-line)" />
        <XAxis dataKey="label" {...axisProps} minTickGap={48} />
        <YAxis ticks={ticks} domain={[0, ticks[ticks.length - 1]]} {...axisProps} width={40} tickFormatter={(v: number) => fmtNumber(v)} />
        <RTooltip content={<VizTooltip unit={unit} />} />
        {series.map((s, i) => (
          <Line key={s.key} dataKey={s.key} type="monotone" stroke={colorFor(s, i)} strokeWidth={s.focus ? 2.5 : 1.75} dot={false} isAnimationActive={false} label={renderEnd(s) as never} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

/* Bars from zero — single accent, optional danger threshold. */
export function Bars({ data, dataKey, label, color = 'var(--pk-c1)', threshold }: {
  data: { label: string; [k: string]: number | string }[]; dataKey: string; label: string; color?: string; threshold?: number
}) {
  const hi = Math.max(1, ...data.map((d) => Number(d[dataKey]) || 0))
  const ticks = niceTicks(0, hi, { count: 4 })
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 10, bottom: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} stroke="var(--pk-line)" />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={14} tickFormatter={(v: string) => (v.length > 11 ? v.slice(0, 10) + '…' : v)} />
        <YAxis ticks={ticks} domain={[0, ticks[ticks.length - 1]]} {...axisProps} width={40} tickFormatter={(v: number) => fmtNumber(v)} />
        <RTooltip content={<VizTooltip unit={` ${label}`} />} cursor={{ fill: 'var(--pk-surface)' }} />
        {threshold != null && <ReferenceLine y={threshold} stroke="var(--pk-bad)" strokeDasharray="4 4" />}
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((d, i) => <Cell key={i} fill={threshold != null && Number(d[dataKey]) >= threshold ? 'var(--pk-bad)' : color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* Stacked area I/O — two tones, zero baseline. */
export function IoArea({ data }: { data: { label: string; read: number; write: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 10, bottom: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} stroke="var(--pk-line)" />
        <XAxis dataKey="label" {...axisProps} minTickGap={48} />
        <YAxis {...axisProps} width={44} tickFormatter={(v: number) => fmtNumber(v)} />
        <RTooltip content={<VizTooltip unit=" МБ/с" />} />
        <Area dataKey="read" name="Чтение" stackId="io" type="monotone" stroke="var(--pk-c1)" fill="var(--pk-c1)" fillOpacity={0.16} strokeWidth={2} isAnimationActive={false} />
        <Area dataKey="write" name="Запись" stackId="io" type="monotone" stroke="var(--pk-c2)" fill="var(--pk-c2)" fillOpacity={0.16} strokeWidth={2} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function VizTooltip({ active, payload, label, unit = '' }: { active?: boolean; payload?: { name?: string; value?: number; color?: string; dataKey?: string }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div role="status" className="rounded-md border border-line bg-raised px-2.5 py-1.5 text-xs shadow-md">
      <div className="mb-0.5 font-medium text-fg">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-muted">
          <span className="size-2 rounded-[2px]" style={{ background: p.color }} />
          <span>{p.name ?? p.dataKey}</span>
          <span className="ml-auto font-medium text-fg tnum">{fmtNumber(Number(p.value))}{unit}</span>
        </div>
      ))}
    </div>
  )
}
