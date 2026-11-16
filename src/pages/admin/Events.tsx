import { useMemo, useState } from 'react'
import { Input, Segmented, Select, SelectItem, Chip, DataList, KpiStrip, Stat, type Column } from '@/kit'
import { eventsFor, type EventRec, type EvLevel } from '@/lib/admin-mock'
import type { Machine } from '@/lib/mock'
import { fmtDateTime, plural } from '@/lib/format'
import { Search } from 'lucide-react'

const lvl: Record<EvLevel, React.ReactNode> = { error: <Chip tone="bad">ошибка</Chip>, warning: <Chip tone="warn">предупреждение</Chip>, info: <Chip tone="neutral">сведения</Chip> }

export function EventsTab({ machine }: { machine: Machine }) {
  const all = useMemo(() => eventsFor(machine), [machine])
  const [level, setLevel] = useState<'all' | EvLevel>('all')
  const [log, setLog] = useState('all')
  const [source, setSource] = useState('all')
  const [q, setQ] = useState('')
  const sources = useMemo(() => [...new Set(all.map((e) => e.source))].sort(), [all])
  const rows = all.filter((e) => (level === 'all' || e.level === level) && (log === 'all' || e.log === log) && (source === 'all' || e.source === source)
    && (!q || `${e.message} ${e.eventId}`.toLowerCase().includes(q.toLowerCase())))
  const n = (l: EvLevel) => all.filter((e) => e.level === l).length

  const cols: Column<EventRec>[] = [
    { key: 'message', header: 'Событие', primary: true, cell: (e) => <span className="text-fg">{e.message}</span> },
    { key: 'source', header: 'Источник', meta: true, cell: (e) => <span className="text-muted">{e.source} · ID {e.eventId}</span> },
    { key: 'level', header: 'Уровень', cell: (e) => lvl[e.level] },
    { key: 'log', header: 'Журнал', hideBelow: 'lg', cell: (e) => <span className="text-muted">{e.log}</span> },
    { key: 'at', header: 'Время', cell: (e) => <span className="whitespace-nowrap text-muted">{fmtDateTime(e.at)}</span> },
  ]
  return (
    <div className="flex flex-col gap-3">
      <KpiStrip>
        <Stat label="Событий за 3 дня" value={all.length} />
        <Stat label="Ошибок" value={n('error')} note={n('error') ? 'стоит разобрать' : 'нет'} />
        <Stat label="Предупреждений" value={n('warning')} />
        <Stat label="Сведений" value={n('info')} />
      </KpiStrip>
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative min-w-0 flex-1 lg:min-w-56">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Текст или код события…" className="pl-8" />
        </div>
        <Segmented value={level} onValueChange={setLevel} ariaLabel="Уровень"
          options={[{ value: 'all', label: 'Все' }, { value: 'error', label: 'Ошибки' }, { value: 'warning', label: 'Предупр.' }, { value: 'info', label: 'Сведения' }]} />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select value={log} onValueChange={setLog} ariaLabel="Журнал" className="sm:w-40">
            <SelectItem value="all">Все журналы</SelectItem><SelectItem value="System">System</SelectItem><SelectItem value="Application">Application</SelectItem><SelectItem value="Security">Security</SelectItem>
          </Select>
          <Select value={source} onValueChange={setSource} ariaLabel="Источник" className="min-w-0 sm:w-56">
            <SelectItem value="all">Все источники</SelectItem>
            {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </Select>
        </div>
      </div>
      <DataList columns={cols} rows={rows} rowKey={(e) => String(e.id)} empty="Событий по фильтру нет."
        footer={`${rows.length} ${plural(rows.length, ['событие', 'события', 'событий'])} · журналы Windows за последние 72 ч (демо).`} />
    </div>
  )
}
