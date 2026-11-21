import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { PageHeader, KpiStrip, Stat, Segmented, Button, Chip, DataList, EmptyState, Callout, Section, toast, type Column } from '@/kit'
import { LevelChip } from '@/components/app/status'
import { useAppState } from '@/lib/app-state'
import { alerts as allAlerts, machineById, type Alert } from '@/lib/mock'
import { fmtDateTime, ago, plural } from '@/lib/format'
import { Check, BellOff } from 'lucide-react'

export default function Alerts() {
  const { tenant } = useAppState()
  const scoped = useMemo(() => allAlerts.filter((a) => tenant === 'all' || machineById(a.machineId)?.tenantId === tenant), [tenant])
  const [acked, setAcked] = useState<Set<string>>(new Set(scoped.filter((a) => a.acked).map((a) => a.id)))
  const [level, setLevel] = useState('all')
  const [showAcked, setShowAcked] = useState(false)

  const rows = scoped.filter((a) => (level === 'all' || a.level === level) && (showAcked || !acked.has(a.id)))
  const open = scoped.filter((a) => !acked.has(a.id))
  const crit = open.filter((a) => a.level === 'crit').length
  const warn = open.filter((a) => a.level === 'warn').length

  const ackOne = (a: Alert) => { setAcked((s) => new Set(s).add(a.id)); toast.success('Оповещение принято', a.title) }
  const ackAll = () => { setAcked(new Set(scoped.map((a) => a.id))); toast.success(`Принято оповещений: ${open.length}`) }

  const columns: Column<Alert>[] = [
    { key: 'level', header: 'Уровень', cell: (a) => <LevelChip level={a.level} /> },
    { key: 'title', header: 'Событие', primary: true, cell: (a) => <span className="text-fg">{a.title}</span> },
    { key: 'machine', header: 'Машина', meta: true, hideBelow: 'lg', cell: (a) => {
      const m = machineById(a.machineId)
      return m ? <Link to={`/machines/${m.id}`} className="text-muted hover:text-fg hover:underline" onClick={(e) => e.stopPropagation()}>{m.name}</Link> : <span className="text-muted">—</span>
    } },
    { key: 'at', header: 'Время', hideBelow: 'sm', cell: (a) => <span className="text-muted" title={fmtDateTime(a.at)}>{ago(a.at)}</span> },
  ]

  return (
    <>
      <PageHeader title="Оповещения" description="Аварии и предупреждения от агентов на машинах. Примите оповещение в работу, чтобы убрать его из списка открытых.">
        <Button variant="outline" onClick={ackAll} disabled={open.length === 0}><Check className="size-4" /> Принять все</Button>
      </PageHeader>

      <KpiStrip>
        <Stat label="Открытых" value={open.length} note={`из ${scoped.length} всего`} />
        <Stat label="Критичных" value={crit} note={crit ? 'нужна реакция' : 'нет'} />
        <Stat label="Предупреждений" value={warn} />
        <Stat label="Принято" value={acked.size} note="в этой сессии" />
      </KpiStrip>

      {crit > 0 && <Callout tone="danger" title={`Критичных: ${crit}`}>Начните с них: отказ диска и переполнение тома могут остановить службы. Карточка машины открывается по ссылке в строке.</Callout>}

      <Section id="list" title="Список" description="Фильтр по уровню. Принятые скрыты, пока не включите их показ.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented value={level} onValueChange={setLevel} ariaLabel="Уровень"
          options={[{ value: 'all', label: 'Все' }, { value: 'crit', label: 'Критичные' }, { value: 'warn', label: 'Предупреждения' }, { value: 'info', label: 'Инфо' }]} />
        <Button variant="ghost" size="sm" onClick={() => setShowAcked((v) => !v)}>{showAcked ? 'Скрыть принятые' : 'Показать принятые'}</Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-pk-lg)] border border-line bg-raised">
          <EmptyState icon={BellOff} title="Открытых оповещений нет" description="Все предупреждения приняты в работу. Новые появятся здесь." />
        </div>
      ) : (
        <DataList columns={columns} rows={rows} rowKey={(a) => a.id}
          rowActions={(a) => acked.has(a.id)
            ? <Chip tone="neutral"><Check className="size-3" /> принято</Chip>
            : <Button variant="ghost" size="sm" onClick={() => ackOne(a)}><Check className="size-4" /> Принять</Button>}
          footer={`${rows.length} ${plural(rows.length, ['запись', 'записи', 'записей'])} в списке.`} />
      )}
      </Section>
    </>
  )
}
