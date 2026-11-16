import { useMemo, useState } from 'react'
import { PageHeader, Input, Segmented, Select, SelectItem, Button, Chip, DataList, ConfirmDialog, toast, type Column } from '@/kit'
import { useAppState } from '@/lib/app-state'
import { fleetFor } from '@/lib/live'
import { procsFor, type Proc } from '@/lib/mock'
import { fmtNumber, ago, plural } from '@/lib/format'
import { Search, XSquare } from 'lucide-react'

type SortKey = 'cpu' | 'memMb' | 'name' | 'pid'

export default function Processes() {
  const { tenant } = useAppState()
  const fleet = fleetFor(tenant).filter((m) => m.status !== 'offline')
  const [id, setId] = useState(fleet[0]?.id)
  const machine = fleet.find((m) => m.id === id) ?? fleet[0]
  const [q, setQ] = useState('')
  const [statusF, setStatusF] = useState('all')
  const [sort, setSort] = useState<SortKey>('cpu')
  const [dir, setDir] = useState<1 | -1>(-1)
  const [killed, setKilled] = useState<Set<number>>(new Set())

  const base = useMemo(() => (machine ? procsFor(machine) : []), [machine])
  const rows = useMemo(() => {
    let r = base.filter((p) => !killed.has(p.pid))
    r = r.filter((p) => (statusF === 'all' || p.status === statusF) && (!q || `${p.name} ${p.user} ${p.cmd} ${p.pid}`.toLowerCase().includes(q.toLowerCase())))
    return [...r].sort((a, b) => ((sort === 'name' ? a.name.localeCompare(b.name) : (a[sort] as number) - (b[sort] as number)) * dir))
  }, [base, killed, q, statusF, sort, dir])

  const onSort = (k: string) => { if (sort === k) setDir((d) => (d === 1 ? -1 : 1)); else { setSort(k as SortKey); setDir(k === 'name' ? 1 : -1) } }
  const kill = (p: Proc) => { setKilled((s) => new Set(s).add(p.pid)); toast.warning(`Процесс ${p.name} (PID ${p.pid}) завершён`, 'Демо: реальный процесс не затронут.') }
  const totalCpu = base.reduce((s, p) => s + p.cpu, 0)
  const totalMem = base.reduce((s, p) => s + p.memMb, 0)

  const columns: Column<Proc>[] = [
    { key: 'name', header: 'Процесс', sortable: true, primary: true, cell: (p) => <div><div className="font-medium text-fg">{p.name}</div><div className="text-xs text-muted">{p.cmd} · {ago(p.started)}</div></div> },
    { key: 'pid', header: 'PID', sortable: true, hideBelow: 'sm', cell: (p) => <span className="font-mono text-xs text-muted">{p.pid}</span> },
    { key: 'user', header: 'Пользователь', meta: true, hideBelow: 'lg', cell: (p) => <span className="text-muted">{p.user}</span> },
    { key: 'cpu', header: 'CPU, %', sortable: true, align: 'right', cell: (p) => fmtNumber(p.cpu, { digits: 1 }) },
    { key: 'memMb', header: 'Память', sortable: true, align: 'right', cell: (p) => `${fmtNumber(p.memMb)} МБ` },
    { key: 'status', header: 'Статус', hideBelow: 'lg', cell: (p) => p.status === 'running' ? <Chip tone="ok">активен</Chip> : <Chip tone="neutral">ожидает</Chip> },
  ]

  return (
    <>
      <PageHeader title="Процессы" description="Все процессы выбранной машины. Сортируйте и фильтруйте, завершайте процесс с подтверждением.">
        <Select value={machine?.id} onValueChange={(v) => { setId(v); setKilled(new Set()) }} ariaLabel="Машина" className="w-56">
          {fleet.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
        </Select>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя, PID, пользователь…" className="pl-8" />
        </div>
        <Segmented value={statusF} onValueChange={setStatusF} ariaLabel="Статус"
          options={[{ value: 'all', label: 'Все' }, { value: 'running', label: 'Активные' }, { value: 'sleeping', label: 'Ожидают' }]} />
        <div className="flex gap-2">
          <Chip tone="neutral">CPU {fmtNumber(totalCpu, { digits: 0 })} %</Chip>
          <Chip tone="neutral">ОЗУ {fmtNumber(Math.round(totalMem / 1024), { digits: 1 })} ГБ</Chip>
        </div>
      </div>

      <DataList columns={columns} rows={rows} rowKey={(p) => String(p.pid)} sortKey={sort} sortDir={dir} onSort={onSort}
        rowActions={(p) => (
          <ConfirmDialog trigger={<Button variant="ghost" size="sm" className="text-bad"><XSquare className="size-4" /> Завершить</Button>}
            title={`Завершить ${p.name}?`} confirmLabel="Завершить процесс"
            description={`Процесс PID ${p.pid} (${p.user}) будет принудительно остановлен. Несохранённые данные могут быть потеряны. Это демо — реальный процесс не затрагивается.`}
            onConfirm={() => kill(p)} />
        )}
        footer={`${rows.length} ${plural(rows.length, ['процесс', 'процесса', 'процессов'])}${killed.size > 0 ? ` · завершено в сессии: ${killed.size}` : ''}`} />
    </>
  )
}
