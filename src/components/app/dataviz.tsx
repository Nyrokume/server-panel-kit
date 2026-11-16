import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fmtDelta, fmtNumber, niceTicks, type Delta } from '@/lib/format'
import { TableIcon, ChartLineIcon, ArrowUpRightIcon, ArrowDownRightIcon } from 'lucide-react'

/* Figure wrapper: headline (the message) → factual subtitle → plot/table toggle → source. */
export function ChartFigure({
  title, subtitle, source, children, table, className, actions,
}: {
  title: string; subtitle?: string; source?: string; children: React.ReactNode
  table: React.ReactNode; className?: string; actions?: React.ReactNode
}) {
  const [asTable, setAsTable] = useState(false)
  return (
    <Card className={cn('gap-0 overflow-hidden py-0', className)}>
      <CardHeader className="gap-1 border-b px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex flex-col gap-0.5">
            <h3 className="text-[15px] leading-snug font-medium text-balance">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground text-pretty">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {actions}
            <Button
              variant="outline" size="sm" className="h-8 gap-1.5 px-2.5"
              aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}
            >
              {asTable ? <ChartLineIcon /> : <TableIcon />}
              <span className="hidden sm:inline">{asTable ? 'График' : 'Таблица'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4 sm:px-5">
        {asTable ? <div className="overflow-x-auto">{table}</div> : children}
      </CardContent>
      {source && <div className="border-t px-4 py-2.5 text-xs text-muted-foreground sm:px-5">{source}</div>}
    </Card>
  )
}

export function DataTable({
  caption, head, rows,
}: { caption?: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <Table>
      {caption && <TableCaption className="text-left">{caption}</TableCaption>}
      <TableHeader>
        <TableRow>
          {head.map((h, i) => (
            <TableHead key={h} className={cn('whitespace-nowrap', i > 0 && 'text-right')}>{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={i}>
            {r.map((c, j) => (
              <TableCell key={j} className={cn(j === 0 ? 'font-medium' : 'text-right tabular-nums')}>{c}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/* Multi-line time chart: one accent series + grey context, direct end labels, zero baseline. */
export function TimeLineChart({
  data, series, unit = '', max,
}: {
  data: Record<string, number | string>[]
  series: { key: string; label: string; focus?: boolean }[]
  unit?: string; max?: number
}) {
  const config = useMemo<ChartConfig>(() => {
    const c: ChartConfig = {}
    series.forEach((s) => { c[s.key] = { label: s.label, color: s.focus ? 'var(--chart-1)' : 'var(--muted-foreground)' } })
    return c
  }, [series])
  const values = data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0))
  const hi = max ?? Math.max(1, ...values)
  const ticks = niceTicks(0, hi, { count: 4 })
  return (
    <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
      <LineChart data={data} margin={{ left: 4, right: 52, top: 10, bottom: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={48} />
        <YAxis ticks={ticks} domain={[0, ticks[ticks.length - 1]]} tickLine={false} axisLine={false}
          width={40} tickFormatter={(v: number) => fmtNumber(v)} tickMargin={6} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map((s) => {
          const renderEnd = (props: { x?: number; y?: number; index?: number; value?: number }) => {
            const x = Number(props.x), y = Number(props.y)
            if (props.index !== data.length - 1 || Number.isNaN(x) || Number.isNaN(y)) return <g key={`${s.key}-${props.index}`} />
            return (
              <text key={`${s.key}-end`} x={x + 8} y={y} dominantBaseline="middle"
                fontSize={12} fontWeight={s.focus ? 600 : 500}
                className={s.focus ? 'fill-foreground' : 'fill-muted-foreground'}>
                {`${fmtNumber(Number(props.value))}${unit}`}
              </text>
            )
          }
          return (
            <Line key={s.key} dataKey={s.key} type="monotone" stroke={`var(--color-${s.key})`}
              strokeWidth={s.focus ? 2.5 : 1.75} dot={false} isAnimationActive={false} label={renderEnd as never} />
          )
        })}
      </LineChart>
    </ChartContainer>
  )
}

/* Bars from zero, single accent, thinned labels, no second axis. */
export function BarsChart({
  data, dataKey, label, color = 'var(--chart-1)', threshold,
}: {
  data: { label: string; [k: string]: number | string }[]
  dataKey: string; label: string; color?: string; threshold?: number
}) {
  const config: ChartConfig = { [dataKey]: { label, color } }
  const hi = Math.max(1, ...data.map((d) => Number(d[dataKey]) || 0))
  const ticks = niceTicks(0, hi, { count: 4 })
  return (
    <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 10, bottom: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
        <YAxis ticks={ticks} domain={[0, ticks[ticks.length - 1]]} tickLine={false} axisLine={false}
          width={40} tickFormatter={(v: number) => fmtNumber(v)} tickMargin={6} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {threshold != null && <ReferenceLine y={threshold} stroke="var(--destructive)" strokeDasharray="4 4" />}
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={threshold != null && Number(d[dataKey]) >= threshold ? 'var(--destructive)' : color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/* Stacked area for I/O (read + write), zero baseline, ≤2 colours. */
export function IoAreaChart({ data }: { data: { label: string; read: number; write: number }[] }) {
  const config: ChartConfig = {
    read: { label: 'Чтение, МБ/с', color: 'var(--chart-1)' },
    write: { label: 'Запись, МБ/с', color: 'var(--chart-2)' },
  }
  return (
    <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 10, bottom: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={48} />
        <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => fmtNumber(v)} tickMargin={6} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area dataKey="read" stackId="io" type="monotone" stroke="var(--color-read)" fill="var(--color-read)" fillOpacity={0.18} strokeWidth={2} isAnimationActive={false} />
        <Area dataKey="write" stackId="io" type="monotone" stroke="var(--color-write)" fill="var(--color-write)" fillOpacity={0.18} strokeWidth={2} isAnimationActive={false} />
      </AreaChart>
    </ChartContainer>
  )
}

/* KPI card: label → value → signed delta sentence → sparkline. */
export function KpiCard({
  label, value, unit = '', delta, spark = [], note,
}: {
  label: string; value: string; unit?: string; delta?: Delta; spark?: number[]; note?: string
}) {
  const pts = useMemo(() => {
    if (spark.length < 2) return ''
    const w = 120, h = 28, min = Math.min(...spark), max = Math.max(...spark), r = max - min || 1
    return spark.map((v, i) => `${(i / (spark.length - 1)) * w},${h - ((v - min) / r) * h}`).join(' ')
  }, [spark])
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-4">
        <div className="flex items-end gap-1 text-2xl font-medium tabular-nums tracking-tight leading-none">
          <span className="truncate">{value}</span>
          {unit && <span className="text-base text-muted-foreground font-normal">{unit}</span>}
        </div>
        {delta && (
          <div className={cn('flex items-center gap-1 text-sm tabular-nums',
            delta.tone === 'good' && 'text-emerald-600 dark:text-emerald-400',
            delta.tone === 'bad' && 'text-destructive',
            delta.tone === 'neutral' && 'text-muted-foreground')}>
            {delta.dir === 'up' && <ArrowUpRightIcon className="size-3.5" aria-hidden />}
            {delta.dir === 'down' && <ArrowDownRightIcon className="size-3.5" aria-hidden />}
            <span className="font-semibold">{delta.text}</span>
            {note && <span className="text-muted-foreground font-normal">· {note}</span>}
            <span className="sr-only">{delta.sr}</span>
          </div>
        )}
        {pts && (
          <svg viewBox="0 0 120 28" className="mt-1 h-7 w-full" preserveAspectRatio="none" aria-hidden>
            <polyline points={pts} fill="none" stroke="var(--chart-1)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </CardContent>
    </Card>
  )
}

export { fmtDelta }
