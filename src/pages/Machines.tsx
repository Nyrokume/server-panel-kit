import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { PageHeader, StatusDot, UsageBar } from '@/components/app/common'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Badge } from '@/components/ui/badge'
import { useAppState } from '@/lib/app-state'
import { useLive, fleetFor } from '@/lib/live'
import { plural, ago } from '@/lib/format'
import type { Machine, Status } from '@/lib/mock'
import { SearchIcon, ServerIcon, MonitorIcon, ArrowUpDownIcon } from 'lucide-react'

type SortKey = 'name' | 'cpu' | 'ram' | 'status'

export default function Machines() {
  const { tenant } = useAppState()
  const { samples } = useLive()
  const fleet = fleetFor(tenant)
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('status')
  const [dir, setDir] = useState<1 | -1>(1)

  const rows = useMemo(() => {
    const statusRank: Record<Status, number> = { warning: 0, offline: 1, online: 2 }
    let r = fleet.filter((m) => {
      if (kind !== 'all' && m.kind !== kind) return false
      if (status !== 'all' && m.status !== status) return false
      if (q && !`${m.name} ${m.role} ${m.ip} ${m.os} ${m.owner}`.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
    r = [...r].sort((a, b) => {
      let d = 0
      if (sort === 'name') d = a.name.localeCompare(b.name)
      else if (sort === 'cpu') d = (samples[a.id]?.cpu ?? 0) - (samples[b.id]?.cpu ?? 0)
      else if (sort === 'ram') d = (samples[a.id]?.ram ?? 0) - (samples[b.id]?.ram ?? 0)
      else d = statusRank[a.status] - statusRank[b.status]
      return d * dir
    })
    return r
  }, [fleet, q, kind, status, sort, dir, samples])

  const toggleSort = (k: SortKey) => {
    if (sort === k) setDir((d) => (d === 1 ? -1 : 1))
    else { setSort(k); setDir(1) }
  }

  const counts = {
    all: fleet.length,
    server: fleet.filter((m) => m.kind === 'server').length,
    workstation: fleet.filter((m) => m.kind === 'workstation').length,
  }

  return (
    <>
      <PageHeader title="Машины" description={`${fleet.length} ${plural(fleet.length, ['устройство', 'устройства', 'устройств'])} под управлением: серверы и рабочие станции.`} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя, роль, адрес, владелец…" className="pl-8" />
        </div>
        <ToggleGroup type="single" value={kind} onValueChange={(v) => v && setKind(v)} variant="outline">
          <ToggleGroupItem value="all">Все ({counts.all})</ToggleGroupItem>
          <ToggleGroupItem value="server">Серверы ({counts.server})</ToggleGroupItem>
          <ToggleGroupItem value="workstation">Станции ({counts.workstation})</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="single" value={status} onValueChange={(v) => v && setStatus(v)} variant="outline">
          <ToggleGroupItem value="all">Статус</ToggleGroupItem>
          <ToggleGroupItem value="online">В сети</ToggleGroupItem>
          <ToggleGroupItem value="warning">Внимание</ToggleGroupItem>
          <ToggleGroupItem value="offline">Не в сети</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortBtn label="Машина" active={sort === 'name'} onClick={() => toggleSort('name')} /></TableHead>
                <TableHead>Роль</TableHead>
                <TableHead className="hidden md:table-cell">ОС</TableHead>
                <TableHead className="hidden lg:table-cell">Адрес</TableHead>
                <TableHead><SortBtn label="CPU" active={sort === 'cpu'} onClick={() => toggleSort('cpu')} /></TableHead>
                <TableHead><SortBtn label="ОЗУ" active={sort === 'ram'} onClick={() => toggleSort('ram')} /></TableHead>
                <TableHead><SortBtn label="Статус" active={sort === 'status'} onClick={() => toggleSort('status')} /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => <Row key={m.id} m={m} cpu={samples[m.id]?.cpu ?? 0} ram={samples[m.id]?.ram ?? 0} />)}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Ничего не найдено по заданным фильтрам.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">Показано {rows.length} из {fleet.length}. Нажмите на строку, чтобы открыть карточку машины.</p>
    </>
  )
}

function SortBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 whitespace-nowrap font-medium transition-colors hover:text-foreground data-[a=1]:text-foreground" data-a={active ? 1 : 0}>
      {label}<ArrowUpDownIcon className="size-3 opacity-60" />
    </button>
  )
}

function Row({ m, cpu, ram }: { m: Machine; cpu: number; ram: number }) {
  return (
    <TableRow className="group">
      <TableCell>
        <Link to={`/machines/${m.id}`} className="flex items-center gap-2.5">
          {m.kind === 'server' ? <ServerIcon className="size-4 shrink-0 text-muted-foreground" /> : <MonitorIcon className="size-4 shrink-0 text-muted-foreground" />}
          <div className="flex flex-col">
            <span className="font-medium group-hover:underline">{m.name}</span>
            <span className="text-xs text-muted-foreground">{m.owner}</span>
          </div>
        </Link>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{m.role}</TableCell>
      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{m.os}</TableCell>
      <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">{m.ip}</TableCell>
      <TableCell className="w-28">{m.status === 'offline' ? <span className="text-xs text-muted-foreground">—</span> : <UsageBar value={cpu} />}</TableCell>
      <TableCell className="w-28">{m.status === 'offline' ? <span className="text-xs text-muted-foreground">—</span> : <UsageBar value={ram} />}</TableCell>
      <TableCell>{m.status === 'offline' ? <Badge variant="outline" className="text-muted-foreground">офлайн · {ago(m.bootAt)}</Badge> : <StatusDot status={m.status} />}</TableCell>
    </TableRow>
  )
}
