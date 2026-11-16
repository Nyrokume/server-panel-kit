import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader, StatusDot } from '@/components/app/common'
import { ConfirmAction } from '@/components/app/confirm'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useAppState } from '@/lib/app-state'
import { fleetFor } from '@/lib/live'
import { procsFor, type Proc } from '@/lib/mock'
import { fmtNumber, ago, plural } from '@/lib/format'
import { SearchIcon, ArrowUpDownIcon, XSquareIcon } from 'lucide-react'

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
    r = [...r].sort((a, b) => {
      const d = sort === 'name' ? a.name.localeCompare(b.name) : (a[sort] as number) - (b[sort] as number)
      return d * dir
    })
    return r
  }, [base, killed, q, statusF, sort, dir])

  const toggleSort = (k: SortKey) => { if (sort === k) setDir((d) => (d === 1 ? -1 : 1)); else { setSort(k); setDir(k === 'name' ? 1 : -1) } }
  const kill = (p: Proc) => { setKilled((s) => new Set(s).add(p.pid)); toast.warning(`Процесс ${p.name} (PID ${p.pid}) завершён`, { description: 'Демо: реальный процесс не затронут.' }) }

  const totalCpu = base.reduce((s, p) => s + p.cpu, 0)
  const totalMem = base.reduce((s, p) => s + p.memMb, 0)

  return (
    <>
      <PageHeader title="Процессы" description="Все процессы выбранной машины. Сортируйте и фильтруйте, завершайте процесс с подтверждением.">
        <Select value={machine?.id} onValueChange={(v) => { setId(v); setKilled(new Set()) }}>
          <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
          <SelectContent>{fleet.map((m) => <SelectItem key={m.id} value={m.id}><span className="flex items-center gap-2"><StatusDot status={m.status} withLabel={false} />{m.name}</span></SelectItem>)}</SelectContent>
        </Select>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя, PID, пользователь…" className="pl-8" />
        </div>
        <ToggleGroup type="single" value={statusF} onValueChange={(v) => v && setStatusF(v)} variant="outline">
          <ToggleGroupItem value="all">Все</ToggleGroupItem>
          <ToggleGroupItem value="running">Активные</ToggleGroupItem>
          <ToggleGroupItem value="sleeping">Ожидают</ToggleGroupItem>
        </ToggleGroup>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="tabular-nums">CPU {fmtNumber(totalCpu, { digits: 0 })} %</Badge>
          <Badge variant="outline" className="tabular-nums">ОЗУ {fmtNumber(Math.round(totalMem / 1024), { digits: 1 })} ГБ</Badge>
        </div>
      </div>

      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortBtn label="Процесс" active={sort === 'name'} onClick={() => toggleSort('name')} /></TableHead>
                <TableHead className="hidden sm:table-cell"><SortBtn label="PID" active={sort === 'pid'} onClick={() => toggleSort('pid')} /></TableHead>
                <TableHead className="hidden md:table-cell">Пользователь</TableHead>
                <TableHead className="text-right"><SortBtn label="CPU, %" active={sort === 'cpu'} onClick={() => toggleSort('cpu')} className="justify-end" /></TableHead>
                <TableHead className="text-right"><SortBtn label="Память" active={sort === 'memMb'} onClick={() => toggleSort('memMb')} className="justify-end" /></TableHead>
                <TableHead className="hidden lg:table-cell">Статус</TableHead>
                <TableHead className="text-right">Действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.pid}>
                  <TableCell><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.cmd} · {ago(p.started)}</div></TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground tabular-nums sm:table-cell">{p.pid}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{p.user}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNumber(p.cpu, { digits: 1 })}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNumber(p.memMb)} МБ</TableCell>
                  <TableCell className="hidden lg:table-cell">{p.status === 'running' ? <Badge variant="secondary" className="text-emerald-600 dark:text-emerald-400">активен</Badge> : <Badge variant="outline" className="text-muted-foreground">ожидает</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <ConfirmAction
                      trigger={<Button variant="ghost" size="sm" className="h-8 gap-1.5 text-destructive hover:text-destructive"><XSquareIcon /> Завершить</Button>}
                      title={`Завершить ${p.name}?`}
                      description={<>Процесс PID {p.pid} ({p.user}) будет принудительно остановлен. Несохранённые данные могут быть потеряны. Это демо — реальный процесс не затрагивается.</>}
                      confirmLabel="Завершить процесс"
                      onConfirm={() => kill(p)}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Процессы не найдены.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">{rows.length} {plural(rows.length, ['процесс', 'процесса', 'процессов'])}{killed.size > 0 && ` · завершено в сессии: ${killed.size}`}</p>
    </>
  )
}

function SortBtn({ label, active, onClick, className }: { label: string; active: boolean; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1 whitespace-nowrap font-medium transition-colors hover:text-foreground data-[a=1]:text-foreground ${className ?? ''}`} data-a={active ? 1 : 0}>
      {label}<ArrowUpDownIcon className="size-3 opacity-60" />
    </button>
  )
}
