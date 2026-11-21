import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { PageHeader, Input, Segmented, StatusDot, UsageBar, Chip, DataList, Section, CardGrid, Card, type Column } from '@/kit'
import { useAppState } from '@/lib/app-state'
import { useLive, fleetFor } from '@/lib/live'
import { plural, ago } from '@/lib/format'
import type { Machine, Status } from '@/lib/mock'
import { Search, Server, Monitor, AlertCircle } from 'lucide-react'

type SortKey = 'name' | 'cpu' | 'ram' | 'status'

export default function Machines() {
  const { tenant } = useAppState()
  const { samples } = useLive()
  const navigate = useNavigate()
  const fleet = fleetFor(tenant)
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<SortKey>('status')
  const [dir, setDir] = useState<1 | -1>(1)

  const rows = useMemo(() => {
    const rank: Record<Status, number> = { warning: 0, offline: 1, online: 2 }
    let r = fleet.filter((m) => {
      if (kind !== 'all' && m.kind !== kind) return false
      if (status !== 'all' && m.status !== status) return false
      if (q && !`${m.name} ${m.role} ${m.ip} ${m.os} ${m.owner}`.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
    r = [...r].sort((a, b) => {
      const d = sort === 'name' ? a.name.localeCompare(b.name) : sort === 'cpu' ? (samples[a.id]?.cpu ?? 0) - (samples[b.id]?.cpu ?? 0)
        : sort === 'ram' ? (samples[a.id]?.ram ?? 0) - (samples[b.id]?.ram ?? 0) : rank[a.status] - rank[b.status]
      return d * dir
    })
    return r
  }, [fleet, q, kind, status, sort, dir, samples])

  const onSort = (k: string) => { if (sort === k) setDir((d) => (d === 1 ? -1 : 1)); else { setSort(k as SortKey); setDir(1) } }
  const counts = { all: fleet.length, server: fleet.filter((m) => m.kind === 'server').length, workstation: fleet.filter((m) => m.kind === 'workstation').length }

  const columns: Column<Machine>[] = [
    { key: 'name', header: 'Машина', sortable: true, primary: true, cell: (m) => (
      <span className="flex items-center gap-2.5">
        {m.kind === 'server' ? <Server className="size-4 shrink-0 text-muted" /> : <Monitor className="size-4 shrink-0 text-muted" />}
        <span className="flex flex-col"><span className="font-medium text-fg">{m.name}</span><span className="text-xs text-muted">{m.owner}</span></span>
      </span>
    ) },
    { key: 'role', header: 'Роль', meta: true, cell: (m) => <span className="text-muted">{m.role}</span> },
    { key: 'os', header: 'ОС', hideBelow: 'lg', cell: (m) => <span className="text-muted">{m.os}</span> },
    { key: 'ip', header: 'Адрес', hideBelow: 'lg', cell: (m) => <span className="font-mono text-xs text-muted">{m.ip}</span> },
    { key: 'cpu', header: 'CPU', sortable: true, cell: (m) => m.status === 'offline' ? <span className="text-muted">—</span> : <div className="w-28"><UsageBar value={samples[m.id]?.cpu ?? 0} /></div> },
    { key: 'ram', header: 'ОЗУ', sortable: true, cell: (m) => m.status === 'offline' ? <span className="text-muted">—</span> : <div className="w-28"><UsageBar value={samples[m.id]?.ram ?? 0} /></div> },
    { key: 'status', header: 'Статус', sortable: true, cell: (m) => m.status === 'offline' ? <Chip tone="neutral">офлайн · {ago(m.bootAt)}</Chip> : <StatusDot status={m.status} /> },
  ]

  return (
    <>
      <PageHeader title="Машины" description={`${fleet.length} ${plural(fleet.length, ['устройство', 'устройства', 'устройств'])} под управлением. В карточке каждой машины — телеметрия, службы, обновления, сеансы, события, сеть, питание и файлы.`} />

      <CardGrid cols={3}>
        <Card as="button" aria-pressed={kind === 'server' && status === 'all'} className={kind === 'server' && status === 'all' ? '!border-fg/40' : ''} onClick={() => { setKind('server'); setStatus('all') }} icon={Server} title="Серверы" description="СУБД, приложения, файлы, домен и резервные копии.">
          <span className="text-xl font-semibold tnum text-fg">{counts.server}<span className="ml-1.5 text-sm font-normal text-muted">всего</span></span>
        </Card>
        <Card as="button" aria-pressed={kind === 'workstation' && status === 'all'} className={kind === 'workstation' && status === 'all' ? '!border-fg/40' : ''} onClick={() => { setKind('workstation'); setStatus('all') }} icon={Monitor} title="Рабочие станции" description="Устройства сотрудников по отделам и площадкам.">
          <span className="text-xl font-semibold tnum text-fg">{counts.workstation}<span className="ml-1.5 text-sm font-normal text-muted">всего</span></span>
        </Card>
        <Card as="button" aria-pressed={status === 'warning'} className={status === 'warning' ? '!border-fg/40' : ''} onClick={() => { setKind('all'); setStatus('warning') }} icon={AlertCircle} title="Требуют внимания" description="Машины с предупреждением от агента мониторинга.">
          <span className="text-xl font-semibold tnum text-fg">{fleet.filter((m) => m.status === 'warning').length}<span className="ml-1.5 text-sm font-normal text-muted">с предупреждением</span></span>
        </Card>
      </CardGrid>

      <Section id="fleet" title="Парк устройств" description="Поиск по имени, роли, адресу или владельцу. Откройте устройство для администрирования.">


      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя, роль, адрес, владелец…" className="pl-8" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Segmented value={kind} onValueChange={setKind} ariaLabel="Тип"
            options={[{ value: 'all', label: `Все ${counts.all}` }, { value: 'server', label: `Серверы ${counts.server}` }, { value: 'workstation', label: `Станции ${counts.workstation}` }]} />
          <Segmented value={status} onValueChange={setStatus} ariaLabel="Статус"
            options={[{ value: 'all', label: 'Все' }, { value: 'online', label: 'В сети' }, { value: 'warning', label: 'Внимание' }, { value: 'offline', label: 'Офлайн' }]} />
        </div>
      </div>

      <DataList columns={columns} rows={rows} rowKey={(m) => m.id} onRowClick={(m) => navigate(`/machines/${m.id}`)}
        sortKey={sort} sortDir={dir} onSort={onSort}
        footer={`Показано ${rows.length} из ${fleet.length}.`} />
      </Section>
    </>
  )
}
