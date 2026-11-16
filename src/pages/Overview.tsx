import { useMemo } from 'react'
import { Link } from 'react-router'
import { PageHeader, StatusDot, UsageBar } from '@/components/app/common'
import { KpiCard, ChartFigure, TimeLineChart, BarsChart, DataTable } from '@/components/app/dataviz'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppState } from '@/lib/app-state'
import { useLive, fleetFor } from '@/lib/live'
import { useAb } from '@/lib/ab'
import { alerts, machineById } from '@/lib/mock'
import { fmtDelta, fmtNumber, fmtUptime, plural, ago } from '@/lib/format'
import { ArrowRightIcon, ServerIcon, MonitorIcon } from 'lucide-react'

export default function Overview() {
  const { tenant } = useAppState()
  const { samples, history, tick } = useLive()
  const { layout, cta, track } = useAb()
  const fleet = fleetFor(tenant)

  const stats = useMemo(() => {
    const online = fleet.filter((m) => m.status === 'online').length
    const warning = fleet.filter((m) => m.status === 'warning').length
    const offline = fleet.filter((m) => m.status === 'offline').length
    const live = fleet.filter((m) => m.status !== 'offline')
    const avg = (f: (id: string) => number) => live.length ? live.reduce((s, m) => s + f(m.id), 0) / live.length : 0
    const cpu = avg((id) => samples[id]?.cpu ?? 0)
    const ram = avg((id) => samples[id]?.ram ?? 0)
    const net = fleet.reduce((s, m) => s + (samples[m.id]?.net ?? 0), 0)
    return { online, warning, offline, cpu, ram, net, total: fleet.length, servers: fleet.filter((m) => m.kind === 'server').length }
  }, [fleet, samples])

  // Aggregate fleet-average CPU history for the trend chart
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
      const arr = m.get(key) ?? []
      arr.push(samples[x.id]?.cpu ?? 0)
      m.set(key, arr)
    })
    return [...m.entries()].map(([label, arr]) => ({ label, cpu: Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) }))
      .sort((a, b) => b.cpu - a.cpu).slice(0, 7)
  }, [fleet, samples])

  const openAlerts = alerts.filter((a) => !a.acked && (tenant === 'all' || machineById(a.machineId)?.tenantId === tenant))
  const hottest = [...fleet].filter((m) => m.status !== 'offline').sort((a, b) => (samples[b.id]?.cpu ?? 0) - (samples[a.id]?.cpu ?? 0)).slice(0, 5)

  const prevCpu = trend.length > 6 ? trend[trend.length - 6].cpu : stats.cpu
  const prevRam = trend.length > 6 ? trend[trend.length - 6].ram : stats.ram
  const ctaLabel = cta === 'action' ? 'Открыть все машины' : 'Подробнее'

  const kpis = (
    <>
      <KpiCard label="Машин в сети" value={`${stats.online}`} unit={`/ ${stats.total}`}
        delta={fmtDelta(stats.online, stats.total, { kind: 'abs', digits: 0, goodWhen: 'up', period: 'из парка' })}
        note={`${stats.warning} ${plural(stats.warning, ['требует', 'требуют', 'требуют'])} внимания`} />
      <KpiCard label="Средняя загрузка CPU" value={fmtNumber(stats.cpu, { digits: 0 })} unit="%"
        delta={fmtDelta(stats.cpu, prevCpu, { kind: 'pp', digits: 1, goodWhen: 'down', period: 'за 12 с' })}
        spark={trend.map((d) => d.cpu)} />
      <KpiCard label="Средняя занятость ОЗУ" value={fmtNumber(stats.ram, { digits: 0 })} unit="%"
        delta={fmtDelta(stats.ram, prevRam, { kind: 'pp', digits: 1, goodWhen: 'down', period: 'за 12 с' })}
        spark={trend.map((d) => d.ram)} />
      <KpiCard label="Сетевой трафик" value={fmtNumber(stats.net, { digits: 0 })} unit="Мбит/с"
        delta={fmtDelta(openAlerts.length, 0, { kind: 'abs', digits: 0, goodWhen: 'down', period: 'оповещений' })}
        note={`${openAlerts.length} ${plural(openAlerts.length, ['открытое', 'открытых', 'открытых'])}`} />
    </>
  )

  const cpuChart = (
    <ChartFigure
      title={`Средняя загрузка парка держится около ${fmtNumber(stats.cpu, { digits: 0 })} %`}
      subtitle={`CPU и ОЗУ по ${stats.total} ${plural(stats.total, ['машине', 'машинам', 'машинам'])}, последние ~80 секунд, кадр ${tick}`}
      source="Источник: агент мониторинга (демо-данные), интервал 2 с"
      table={<DataTable head={['Время', 'CPU, %', 'ОЗУ, %']} rows={trend.slice(-12).map((d) => [d.label, d.cpu, d.ram])} caption="Средние значения по парку" />}
    >
      <TimeLineChart data={trend} unit=" %" max={100}
        series={[{ key: 'cpu', label: 'CPU, %', focus: true }, { key: 'ram', label: 'ОЗУ, %' }]} />
    </ChartFigure>
  )

  const roleChart = (
    <ChartFigure
      title="Загрузка CPU по ролям машин"
      subtitle="Среднее по каждой роли сейчас; красным — выше 80 %"
      source="Источник: агент мониторинга (демо-данные)"
      table={<DataTable head={['Роль', 'CPU, %']} rows={byRole.map((d) => [d.label, d.cpu])} />}
    >
      <BarsChart data={byRole} dataKey="cpu" label="CPU, %" threshold={80} />
    </ChartFigure>
  )

  const sidePanels = (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Самые нагруженные</CardTitle>
          <CardDescription>Топ-5 машин по загрузке CPU сейчас</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {hottest.map((m) => (
            <Link key={m.id} to={`/machines/${m.id}`} className="group flex items-center gap-3 rounded-md -mx-2 px-2 py-1.5 transition-colors hover:bg-muted active:scale-[0.99]">
              {m.kind === 'server' ? <ServerIcon className="size-4 shrink-0 text-muted-foreground" /> : <MonitorIcon className="size-4 shrink-0 text-muted-foreground" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium"><span className="truncate">{m.name}</span><StatusDot status={m.status} withLabel={false} /></div>
                <div className="truncate text-xs text-muted-foreground">{m.role}</div>
              </div>
              <div className="w-28 shrink-0"><UsageBar value={samples[m.id]?.cpu ?? 0} /></div>
            </Link>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Последние оповещения</CardTitle>
          <CardDescription>{openAlerts.length} {plural(openAlerts.length, ['открытое', 'открытых', 'открытых'])}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {openAlerts.slice(0, 5).map((a) => {
            const m = machineById(a.machineId)
            return (
              <div key={a.id} className="flex items-start gap-2.5 text-sm">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${a.level === 'crit' ? 'bg-destructive' : a.level === 'warn' ? 'bg-amber-500' : 'bg-muted-foreground'}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{m?.name} · {ago(a.at)}</div>
                </div>
              </div>
            )
          })}
          {openAlerts.length === 0 && <p className="text-sm text-muted-foreground">Открытых оповещений нет.</p>}
          <Button asChild variant="ghost" size="sm" className="mt-1 self-start gap-1.5"><Link to="/alerts">Все оповещения <ArrowRightIcon /></Link></Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <>
      <PageHeader title="Обзор парка" description={`Состояние серверов и рабочих станций в реальном времени. ${stats.servers} ${plural(stats.servers, ['сервер', 'сервера', 'серверов'])}, ${stats.total - stats.servers} ${plural(stats.total - stats.servers, ['станция', 'станции', 'станций'])}.`}>
        <Badge variant="outline" className="gap-1.5 py-1"><StatusDot status={stats.warning > 0 ? 'warning' : 'online'} withLabel={false} />{fmtUptime(Math.max(...fleet.map((m) => (Date.now() - m.bootAt) / 1000)))} аптайм лидера</Badge>
        <Button className="gap-1.5" onClick={() => track('overview_cta_click', { cta })} asChild>
          <Link to="/machines">{ctaLabel} <ArrowRightIcon /></Link>
        </Button>
      </PageHeader>

      {layout === 'split-board' ? (
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{kpis}</div>
            {cpuChart}
          </div>
          <div className="flex flex-col gap-4">{roleChart}{sidePanels}</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{kpis}</div>
          <div className="grid gap-4 xl:grid-cols-2">{cpuChart}{roleChart}</div>
          {sidePanels}
        </>
      )}
    </>
  )
}
