import { useMemo } from 'react'
import { Link } from 'react-router'
import {
  PageHeader, KpiStrip, Stat, Sparkline, ChartFrame, TimeLine, Bars, VizTable,
  StatusDot, UsageBar, Chip, Button, Panel, SectionHeader,
} from '@/kit'
import { useAppState } from '@/lib/app-state'
import { useLive, fleetFor } from '@/lib/live'
import { alerts, machineById } from '@/lib/mock'
import { fmtDelta, fmtNumber, fmtUptime, plural, ago } from '@/lib/format'
import { ArrowRight, Server, Monitor } from 'lucide-react'

export default function Overview() {
  const { tenant } = useAppState()
  const { samples, history, tick } = useLive()
  const fleet = fleetFor(tenant)

  const stats = useMemo(() => {
    const online = fleet.filter((m) => m.status === 'online').length
    const warning = fleet.filter((m) => m.status === 'warning').length
    const live = fleet.filter((m) => m.status !== 'offline')
    const avg = (f: (id: string) => number) => (live.length ? live.reduce((s, m) => s + f(m.id), 0) / live.length : 0)
    return {
      online, warning, total: fleet.length, servers: fleet.filter((m) => m.kind === 'server').length,
      cpu: avg((id) => samples[id]?.cpu ?? 0), ram: avg((id) => samples[id]?.ram ?? 0),
      net: fleet.reduce((s, m) => s + (samples[m.id]?.net ?? 0), 0),
    }
  }, [fleet, samples])

  const trend = useMemo(() => {
    const live = fleet.filter((m) => m.status !== 'offline')
    const len = live.length ? history[live[0].id]?.length ?? 0 : 0
    return Array.from({ length: len }, (_, i) => {
      const cpu = live.reduce((s, m) => s + (history[m.id]?.[i]?.cpu ?? 0), 0) / (live.length || 1)
      const ram = live.reduce((s, m) => s + (history[m.id]?.[i]?.ram ?? 0), 0) / (live.length || 1)
      const t = history[live[0]?.id]?.[i]?.t ?? 0
      return { label: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(t), cpu: Math.round(cpu), ram: Math.round(ram) }
    })
  }, [fleet, history])

  const byRole = useMemo(() => {
    const m = new Map<string, number[]>()
    fleet.filter((x) => x.status !== 'offline').forEach((x) => {
      const key = x.kind === 'server' ? x.role.split(',')[0] : x.role
      const arr = m.get(key) ?? []; arr.push(samples[x.id]?.cpu ?? 0); m.set(key, arr)
    })
    return [...m.entries()].map(([label, arr]) => ({ label, cpu: Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) }))
      .sort((a, b) => b.cpu - a.cpu).slice(0, 6)
  }, [fleet, samples])

  const openAlerts = alerts.filter((a) => !a.acked && (tenant === 'all' || machineById(a.machineId)?.tenantId === tenant))
  const hottest = [...fleet].filter((m) => m.status !== 'offline').sort((a, b) => (samples[b.id]?.cpu ?? 0) - (samples[a.id]?.cpu ?? 0)).slice(0, 5)
  const prevCpu = trend.length > 6 ? trend[trend.length - 6].cpu : stats.cpu
  const prevRam = trend.length > 6 ? trend[trend.length - 6].ram : stats.ram

  const kpis = (
    <KpiStrip>
      <Stat label="Машин в сети" value={stats.online} unit={`/ ${stats.total}`}
        delta={fmtDelta(stats.online, stats.total, { kind: 'abs', digits: 0, goodWhen: 'up', period: 'из парка' })}
        note={`${stats.warning} ${plural(stats.warning, ['требует', 'требуют', 'требуют'])} внимания`} />
      <Stat label="Средняя загрузка CPU" value={fmtNumber(stats.cpu, { digits: 0 })} unit="%"
        delta={fmtDelta(stats.cpu, prevCpu, { kind: 'pp', digits: 1, goodWhen: 'down', period: 'за 12 с' })}
        spark={<Sparkline data={trend.map((d) => d.cpu)} />} />
      <Stat label="Средняя занятость ОЗУ" value={fmtNumber(stats.ram, { digits: 0 })} unit="%"
        delta={fmtDelta(stats.ram, prevRam, { kind: 'pp', digits: 1, goodWhen: 'down', period: 'за 12 с' })}
        spark={<Sparkline data={trend.map((d) => d.ram)} />} />
      <Stat label="Сетевой трафик" value={fmtNumber(stats.net, { digits: 0 })} unit="Мбит/с"
        delta={fmtDelta(openAlerts.length, 0, { kind: 'abs', digits: 0, goodWhen: 'down', period: 'оповещений' })}
        note={`${openAlerts.length} ${plural(openAlerts.length, ['открытое', 'открытых', 'открытых'])}`} />
    </KpiStrip>
  )

  const cpuChart = (
    <ChartFrame
      title={`Средняя загрузка парка держится около ${fmtNumber(stats.cpu, { digits: 0 })} %`}
      subtitle={`CPU и ОЗУ по ${stats.total} ${plural(stats.total, ['машине', 'машинам', 'машинам'])}, последние ~80 с, кадр ${tick}`}
      source="Источник: агент мониторинга (демо-данные), интервал 2 с"
      table={<VizTable head={['Время', 'CPU, %', 'ОЗУ, %']} rows={trend.slice(-12).map((d) => [d.label, d.cpu, d.ram])} caption="Средние по парку" />}>
      <TimeLine data={trend} unit=" %" max={100} series={[{ key: 'cpu', label: 'CPU, %', focus: true }, { key: 'ram', label: 'ОЗУ, %' }]} />
    </ChartFrame>
  )

  const roleChart = (
    <ChartFrame title="Загрузка CPU по ролям машин" subtitle="Среднее по каждой роли сейчас; красным — выше 80 %"
      source="Источник: агент мониторинга (демо-данные)"
      table={<VizTable head={['Роль', 'CPU, %']} rows={byRole.map((d) => [d.label, d.cpu])} />}>
      <Bars data={byRole} dataKey="cpu" label="CPU, %" threshold={80} />
    </ChartFrame>
  )

  const hottestPanel = (
      <Panel flush>
        <SectionHeader className="border-b border-line p-4" title="Самые нагруженные" description="Топ-5 по загрузке CPU" />
        <ul className="divide-y divide-line">
          {hottest.map((m) => (
            <li key={m.id}>
              <Link to={`/machines/${m.id}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface active:bg-surface">
                {m.kind === 'server' ? <Server className="size-4 shrink-0 text-muted" /> : <Monitor className="size-4 shrink-0 text-muted" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-fg"><span className="truncate">{m.name}</span><StatusDot status={m.status} withLabel={false} /></div>
                  <div className="truncate text-xs text-muted">{m.role}</div>
                </div>
                <div className="w-24 shrink-0 sm:w-28"><UsageBar value={samples[m.id]?.cpu ?? 0} /></div>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
  )
  const alertsPanel = (
      <Panel flush>
        <SectionHeader className="border-b border-line p-4" title="Последние оповещения"
          description={`${openAlerts.length} ${plural(openAlerts.length, ['открытое', 'открытых', 'открытых'])}`}
          actions={<Button asChild variant="link" size="sm"><Link to="/alerts">Все <ArrowRight className="size-3.5" /></Link></Button>} />
        <ul className="divide-y divide-line">
          {openAlerts.slice(0, 5).map((a) => {
            const m = machineById(a.machineId)
            return (
              <li key={a.id} className="flex items-start gap-2.5 px-4 py-2.5 text-sm">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${a.level === 'crit' ? 'bg-bad' : a.level === 'warn' ? 'bg-warn' : 'bg-faint'}`} />
                <div className="min-w-0 flex-1"><div className="truncate text-fg">{a.title}</div><div className="text-xs text-muted">{m?.name} · {ago(a.at)}</div></div>
              </li>
            )
          })}
          {openAlerts.length === 0 && <li className="px-4 py-6 text-sm text-muted">Открытых оповещений нет.</li>}
        </ul>
      </Panel>
  )

  return (
    <>
      <PageHeader title="Обзор парка" description={`Состояние серверов и рабочих станций в реальном времени. ${stats.servers} ${plural(stats.servers, ['сервер', 'сервера', 'серверов'])}, ${stats.total - stats.servers} ${plural(stats.total - stats.servers, ['станция', 'станции', 'станций'])}.`}>
        <Chip tone="neutral" className="gap-1.5"><StatusDot status={stats.warning > 0 ? 'warning' : 'online'} withLabel={false} />{fmtUptime(Math.max(...fleet.map((m) => (Date.now() - m.bootAt) / 1000)))} аптайм лидера</Chip>
        <Button variant="solid" asChild><Link to="/machines">Подробнее <ArrowRight className="size-4" /></Link></Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">{kpis}{cpuChart}{hottestPanel}</div>
        <div className="flex flex-col gap-4">{roleChart}{alertsPanel}</div>
      </div>
    </>
  )
}
