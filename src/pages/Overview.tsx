import { useMemo } from 'react'
import { Link } from 'react-router'
import {
  PageHeader, KpiStrip, Stat, Sparkline, ChartFrame, TimeLine, Bars, VizTable,
  StatusDot, UsageBar, Button, Panel, SectionHeader, DocPage, Section, CardGrid, Card, Callout,
} from '@/kit'
import { useAppState } from '@/lib/app-state'
import { useLive, fleetFor } from '@/lib/live'
import { alerts, machineById, users, volumesFor } from '@/lib/mock'
import { fmtDelta, fmtNumber, plural, ago } from '@/lib/format'
import { ArrowRight, Server, Monitor, Bell, TerminalSquare, MonitorPlay, HardDrive, Users as UsersIcon, Workflow } from 'lucide-react'

const toc = [
  { id: 'summary', label: 'Сводка' },
  { id: 'load', label: 'Нагрузка парка' },
  { id: 'hot', label: 'Самые нагруженные', depth: 1 as const },
  { id: 'sections', label: 'Разделы пульта' },
  { id: 'recent', label: 'Последние оповещения' },
]

export default function Overview() {
  const { tenant } = useAppState()
  const { samples, history } = useLive()
  const fleet = fleetFor(tenant)

  const stats = useMemo(() => {
    const online = fleet.filter((m) => m.status === 'online').length
    const warning = fleet.filter((m) => m.status === 'warning').length
    const live = fleet.filter((m) => m.status !== 'offline')
    const avg = (f: (id: string) => number) => (live.length ? live.reduce((s, m) => s + f(m.id), 0) / live.length : 0)
    return {
      online, warning, live: live.length, total: fleet.length, servers: fleet.filter((m) => m.kind === 'server').length,
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
      return { label: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(t), cpu: Math.round(cpu), ram: Math.round(ram) }
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
  const crit = openAlerts.filter((a) => a.level === 'crit')
  const hottest = [...fleet].filter((m) => m.status !== 'offline').sort((a, b) => (samples[b.id]?.cpu ?? 0) - (samples[a.id]?.cpu ?? 0)).slice(0, 6)
  const prevCpu = trend.length > 6 ? trend[trend.length - 6].cpu : stats.cpu
  const prevRam = trend.length > 6 ? trend[trend.length - 6].ram : stats.ram
  const vols = fleet.flatMap((m) => volumesFor(m))
  const badVols = vols.filter((v) => v.smart !== 'ok').length
  const noMfa = users.filter((u) => !u.mfa).length

  return (
    <DocPage toc={toc} header={
      <PageHeader title="Обзор парка" description={`Состояние серверов и рабочих станций в реальном времени: ${stats.servers} ${plural(stats.servers, ['сервер', 'сервера', 'серверов'])} и ${stats.total - stats.servers} ${plural(stats.total - stats.servers, ['рабочая станция', 'рабочие станции', 'рабочих станций'])}. Данные обновляются каждые 2 секунды.`}>
        <Button variant="outline" asChild><Link to="/alerts"><Bell /> Оповещения</Link></Button>
        <Button variant="solid" asChild><Link to="/machines">Все машины <ArrowRight /></Link></Button>
      </PageHeader>
    }>
      {crit.length > 0 ? (
        <Callout tone="danger" title={`${crit.length} ${plural(crit.length, ['критичное оповещение', 'критичных оповещения', 'критичных оповещений'])} ждут реакции`}
          action={<Button size="sm" variant="outline" asChild><Link to="/alerts">Разобрать</Link></Button>}>
          {crit.slice(0, 2).map((a) => `${machineById(a.machineId)?.name}: ${a.title}`).join('; ')}.
        </Callout>
      ) : (
        <Callout tone="tip" title="Критичных оповещений нет">Все машины в пределах порогов. Предупреждений: {openAlerts.length}.</Callout>
      )}

      <Section id="summary" title="Сводка" description="Средние значения по машинам в сети. Стрелка — изменение за последние 12 секунд.">
        <KpiStrip>
          <Stat label="Машин в сети" value={stats.live} unit={`/ ${stats.total}`}
            note={`${stats.warning} ${plural(stats.warning, ['требует', 'требуют', 'требуют'])} внимания`} />
          <Stat label="Средняя загрузка CPU" value={fmtNumber(stats.cpu, { digits: 0 })} unit="%"
            delta={fmtDelta(stats.cpu, prevCpu, { kind: 'pp', digits: 1, goodWhen: 'down', period: 'за 12 с' })}
            spark={<Sparkline data={trend.map((d) => d.cpu)} />} />
          <Stat label="Средняя занятость ОЗУ" value={fmtNumber(stats.ram, { digits: 0 })} unit="%"
            delta={fmtDelta(stats.ram, prevRam, { kind: 'pp', digits: 1, goodWhen: 'down', period: 'за 12 с' })}
            spark={<Sparkline data={trend.map((d) => d.ram)} />} />
          <Stat label="Сетевой трафик" value={fmtNumber(stats.net, { digits: 0 })} unit="Мбит/с"
            note={`${openAlerts.length} ${plural(openAlerts.length, ['открытое оповещение', 'открытых оповещения', 'открытых оповещений'])}`} />
        </KpiStrip>
      </Section>

      <Section id="load" title="Нагрузка парка" description={`CPU и ОЗУ по ${stats.live} ${plural(stats.live, ['машине', 'машинам', 'машинам'])} в сети за последние ~80 секунд.`}>
        <ChartFrame
          title={`Средняя загрузка держится около ${fmtNumber(stats.cpu, { digits: 0 })} %`}
          subtitle="Средние по машинам в сети, интервал опроса 2 с"
          source="Источник: агент мониторинга, демо-данные"
          table={<VizTable head={['Время', 'CPU, %', 'ОЗУ, %']} rows={trend.slice(-12).map((d) => [d.label, d.cpu, d.ram])} caption="Средние по парку" />}>
          <TimeLine data={trend} unit=" %" max={100} series={[{ key: 'cpu', label: 'CPU, %', focus: true }, { key: 'ram', label: 'ОЗУ, %' }]} />
        </ChartFrame>
        <div id="hot" className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
          <Panel flush className="overflow-hidden">
            <SectionHeader className="border-b border-line px-4 py-3" title="Самые нагруженные" description="Шесть машин с наибольшей загрузкой CPU сейчас"
              actions={<Button asChild variant="link" size="sm"><Link to="/machines">Все машины</Link></Button>} />
            <ul className="divide-y divide-line">
              {hottest.map((m) => (
                <li key={m.id}>
                  <Link to={`/machines/${m.id}`} className="flex min-h-12 items-center gap-3 px-4 py-2 transition-colors hover:bg-surface/70 active:bg-surface">
                    {m.kind === 'server' ? <Server className="size-4 shrink-0 text-muted" /> : <Monitor className="size-4 shrink-0 text-muted" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-fg"><span className="truncate">{m.name}</span><StatusDot status={m.status} withLabel={false} /></div>
                      <div className="truncate text-xs text-muted">{m.role}</div>
                    </div>
                    <div className="w-28 shrink-0 sm:w-36"><UsageBar value={samples[m.id]?.cpu ?? 0} /></div>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          <ChartFrame title="Загрузка CPU по ролям" subtitle="Среднее по роли сейчас; выше 80 % — красным"
            table={<VizTable head={['Роль', 'CPU, %']} rows={byRole.map((d) => [d.label, d.cpu])} />}>
            <Bars data={byRole} dataKey="cpu" label="CPU, %" threshold={80} />
          </ChartFrame>
        </div>
      </Section>

      <Section id="sections" title="Разделы пульта" description="Куда перейти дальше. В каждой карточке — текущее состояние раздела.">
        <CardGrid cols={3}>
          <Card as={Link} to="/machines" icon={Server} title="Машины" description="Серверы и рабочие станции, карточка машины с девятью вкладками администрирования.">
            <p className="text-sm text-fg tnum">{stats.total} {plural(stats.total, ['устройство', 'устройства', 'устройств'])} · {stats.warning} с предупреждением</p>
          </Card>
          <Card as={Link} to="/alerts" icon={Bell} title="Оповещения" description="Аварии и предупреждения: принять по одному или все сразу.">
            <p className="text-sm text-fg tnum">{openAlerts.length} {plural(openAlerts.length, ['открытое', 'открытых', 'открытых'])}, из них {crit.length} {plural(crit.length, ['критичное', 'критичных', 'критичных'])}</p>
          </Card>
          <Card as={Link} to="/powershell" icon={TerminalSquare} title="PowerShell" description="Удалённая сессия с историей, автодополнением и готовыми командами.">
            <p className="text-sm text-fg tnum">{stats.live} {plural(stats.live, ['машина доступна', 'машины доступны', 'машин доступно'])}</p>
          </Card>
          <Card as={Link} to="/screen" icon={MonitorPlay} title="Просмотр экрана" description="Миниатюры экранов включённых машин, полный экран и снимки.">
            <p className="text-sm text-fg tnum">{stats.live} {plural(stats.live, ['экран', 'экрана', 'экранов'])} в сети</p>
          </Card>
          <Card as={Link} to="/disks" icon={HardDrive} title="Диски" description="Заполнение томов, здоровье SMART и дисковый ввод-вывод.">
            <p className="text-sm text-fg tnum">{vols.length} {plural(vols.length, ['том', 'тома', 'томов'])} · {badVols ? `${badVols} с износом или отказом` : 'все исправны'}</p>
          </Card>
          <Card as={Link} to="/users" icon={UsersIcon} title="Пользователи и роли" description="Доступ к пульту, роли и двухфакторная аутентификация.">
            <p className="text-sm text-fg tnum">{users.length} {plural(users.length, ['пользователь', 'пользователя', 'пользователей'])} · без 2ФА: {noMfa}</p>
          </Card>
        </CardGrid>
      </Section>

      <Section id="recent" title="Последние оповещения" actions={<Button asChild variant="link" size="sm"><Link to="/alerts">Все оповещения</Link></Button>}>
        <Panel flush className="overflow-hidden">
          <ul className="divide-y divide-line">
            {openAlerts.slice(0, 6).map((a) => {
              const m = machineById(a.machineId)
              return (
                <li key={a.id}>
                  <Link to={m ? `/machines/${m.id}` : '/alerts'} className="flex min-h-12 items-start gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface/70">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${a.level === 'crit' ? 'bg-bad' : a.level === 'warn' ? 'bg-warn' : 'bg-faint'}`} aria-hidden />
                    <span className="sr-only">{a.level === 'crit' ? 'Критично' : a.level === 'warn' ? 'Предупреждение' : 'Инфо'}.</span>
                    <div className="min-w-0 flex-1"><div className="truncate text-fg">{a.title}</div><div className="text-xs text-muted">{m?.name} · {m?.role}</div></div>
                    <span className="shrink-0 text-xs text-muted">{ago(a.at)}</span>
                  </Link>
                </li>
              )
            })}
            {openAlerts.length === 0 && <li className="px-4 py-6 text-sm text-muted">Открытых оповещений нет.</li>}
          </ul>
        </Panel>
        <Card as={Link} to="/architecture" icon={Workflow} title="Как команда доходит до машины" description="Интерактивная схема: шлюз, брокер заданий, агент, телеметрия и аудит — по шагам." />
      </Section>
    </DocPage>
  )
}
