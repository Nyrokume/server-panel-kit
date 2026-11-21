import { Link } from 'react-router'
import { cn } from '@/kit'
import { fmtNumber, fmtUptime, fmtDelta, ago, plural } from '@/lib/format'
import { Sparkline } from '@/kit'
import type { Alert, Machine, Sample } from '@/lib/mock'
import { tenants } from '@/lib/mock'

export function InspectorShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <aside className={cn('flex min-h-0 min-w-0 flex-col overflow-y-auto bg-bg pk-scroll', className)}>
      {children}
    </aside>
  )
}

export function InspectorHead({ title, lead }: { title: React.ReactNode; lead?: React.ReactNode }) {
  return (
    <div className="px-4 pb-2 pt-4">
      <h1 className="text-xl font-semibold leading-tight tracking-tight text-fg">{title}</h1>
      {lead && <p className="mt-1.5 text-sm text-muted text-pretty">{lead}</p>}
    </div>
  )
}

export function InspectorKpis({ items }: { items: { label: string; value: React.ReactNode; unit?: string; note?: React.ReactNode; tone?: 'ok' | 'bad'; spark?: number[] }[] }) {
  return (
    <div className="grid grid-cols-2 gap-px border-y border-line bg-line">
      {items.map((it) => (
        <div key={it.label} className="bg-bg px-4 py-3">
          <div className="text-[11px] text-muted">{it.label}</div>
          <div className="mt-1 font-mono text-[22px] font-semibold leading-tight tracking-tight text-fg tnum">
            {it.value}
            {it.unit && <u className="ml-1 text-xs font-medium not-italic text-muted no-underline">{it.unit}</u>}
          </div>
          {it.spark && it.spark.length > 1 && <div className="mt-1.5 max-w-[140px]"><Sparkline data={it.spark} className="h-5" /></div>}
          {it.note && <div className={cn('mt-1 text-xs', it.tone === 'bad' ? 'text-bad' : it.tone === 'ok' ? 'text-ok' : 'text-muted')}>{it.note}</div>}
        </div>
      ))}
    </div>
  )
}

export function SelectedMachineCard({ machine, sample, tenantName }: { machine: Machine; sample?: Sample; tenantName?: string }) {
  const tenant = tenantName ?? tenants.find((t) => t.id === machine.tenantId)?.name
  return (
    <div className="border-b border-line px-4 py-3.5">
      <div className="text-[13px] font-medium text-fg">Выбранная машина</div>
      <Link to={`/machines/${machine.id}`} className="mt-2 block rounded-[10px] border border-line-strong bg-raised p-3 transition-colors hover:bg-surface">
        <div className="font-mono text-sm font-medium text-fg">{machine.name}</div>
        <div className="mt-0.5 text-xs text-muted">{machine.role}{tenant ? ` · ${tenant}` : ''}</div>
        <div className="mt-2.5 flex gap-3">
          <div className="flex-1"><div className="text-[11px] text-muted">CPU</div><div className="font-mono text-[15px] font-semibold tnum">{fmtNumber(sample?.cpu ?? 0, { digits: 0 })} %</div></div>
          <div className="flex-1"><div className="text-[11px] text-muted">ОЗУ</div><div className="font-mono text-[15px] font-semibold tnum">{fmtNumber(sample?.ram ?? 0, { digits: 0 })} %</div></div>
          <div className="flex-1"><div className="text-[11px] text-muted">Сеть</div><div className="font-mono text-[15px] font-semibold tnum">{fmtNumber(sample?.net ?? 0, { digits: 0 })}</div></div>
        </div>
      </Link>
    </div>
  )
}

export function AlertList({ alerts, machineName, limit = 5 }: { alerts: Alert[]; machineName: (id: string) => string | undefined; limit?: number }) {
  const items = alerts.slice(0, limit)
  return (
    <div className="px-4 py-3.5">
      <div className="text-[13px] font-medium text-fg">Открытые оповещения</div>
      {items.length === 0 && <p className="mt-2 text-sm text-muted">Открытых оповещений нет.</p>}
      <ul>
        {items.map((a) => (
          <li key={a.id} className="grid grid-cols-[8px_minmax(0,1fr)_auto] items-start gap-2 border-t border-line py-2 first:border-0 first:pt-2">
            <i className={cn('mt-1.5 size-2 rounded-full', a.level === 'crit' ? 'bg-bad' : a.level === 'warn' ? 'bg-warn' : 'bg-faint')} />
            <p className="min-w-0 text-sm text-fg">{a.title}<small className="mt-0.5 block text-xs text-muted">{machineName(a.machineId)}</small></p>
            <span className="font-mono text-xs text-faint">{ago(a.at)}</span>
          </li>
        ))}
      </ul>
      {alerts.length > limit && (
        <Link to="/alerts" className="mt-1 inline-block text-sm text-muted hover:text-fg">Все {alerts.length} →</Link>
      )}
    </div>
  )
}

function sparkDelta(series?: number[]) {
  if (!series || series.length < 2) return null
  const prev = series[0]
  const cur = series[series.length - 1]
  return fmtDelta(cur, prev, { kind: 'pp', digits: 1, goodWhen: 'down', period: 'за сессию' })
}

export function OverviewInspector({
  servers, stations, leaderUptime, online, total, warning, cpu, ram, net, openAlerts,
  selected, sample, machineName, cpuSpark, ramSpark,
}: {
  servers: number; stations: number; leaderUptime: number
  online: number; total: number; warning: number
  cpu: number; ram: number; net: number
  openAlerts: Alert[]
  selected: Machine | null
  sample?: Sample
  machineName: (id: string) => string | undefined
  cpuSpark?: number[]
  ramSpark?: number[]
}) {
  const lead = (
    <>
      {servers} {plural(servers, ['сервер', 'сервера', 'серверов'])} и {stations} {plural(stations, ['станция', 'станции', 'станций'])}.{' '}
      Лидер в сети уже {fmtUptime(leaderUptime)}.{' '}
      {selected && <>Выбран {selected.role.toLowerCase()} <span className="whitespace-nowrap">{selected.name}</span>.</>}
    </>
  )
  const cpuD = sparkDelta(cpuSpark)
  const ramD = sparkDelta(ramSpark)

  return (
    <InspectorShell className="h-full w-full">
      <InspectorHead title="Обзор парка" lead={lead} />
      <InspectorKpis items={[
        { label: 'В сети', value: <>{online}<u className="ml-1 text-xs font-medium not-italic text-muted no-underline">/ {total}</u></>, note: warning ? `${warning} ${plural(warning, ['требует', 'требуют', 'требуют'])} внимания` : 'Все в порядке', tone: warning ? 'bad' : 'ok' },
        { label: 'CPU', value: fmtNumber(cpu, { digits: 0 }), unit: '%', spark: cpuSpark, note: cpuD ? cpuD.text : 'среднее по парку', tone: cpuD?.tone === 'bad' ? 'bad' : 'ok' },
        { label: 'ОЗУ', value: fmtNumber(ram, { digits: 0 }), unit: '%', spark: ramSpark, note: ramD ? ramD.text : 'среднее по парку', tone: ramD?.tone === 'bad' ? 'bad' : 'ok' },
        { label: 'Сеть', value: fmtNumber(net, { digits: 0 }), unit: 'Мбит/с', note: openAlerts.length ? `${openAlerts.length} открытых` : 'Без открытых', tone: openAlerts.length ? 'bad' : 'ok' },
      ]} />
      {selected && <SelectedMachineCard machine={selected} sample={sample} />}
      <AlertList alerts={openAlerts} machineName={machineName} />
    </InspectorShell>
  )
}
