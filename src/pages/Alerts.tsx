import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { PageHeader, LevelBadge } from '@/components/app/common'
import { KpiCard } from '@/components/app/dataviz'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { useAppState } from '@/lib/app-state'
import { alerts as allAlerts, machineById } from '@/lib/mock'
import { fmtDateTime, ago, plural } from '@/lib/format'
import { CheckIcon, BellOffIcon } from 'lucide-react'

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

  const ackOne = (id: string, title: string) => { setAcked((s) => new Set(s).add(id)); toast.success('Оповещение принято', { description: title }) }
  const ackAll = () => { setAcked(new Set(scoped.map((a) => a.id))); toast.success(`Принято оповещений: ${open.length}`) }

  return (
    <>
      <PageHeader title="Оповещения" description="Аварии и предупреждения по парку. Принимайте в работу по одному или все сразу.">
        <Button variant="outline" onClick={ackAll} disabled={open.length === 0} className="gap-1.5"><CheckIcon /> Принять все</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Открытых" value={`${open.length}`} note={`из ${scoped.length} всего`} />
        <KpiCard label="Критичных" value={`${crit}`} note={crit ? 'нужна реакция' : 'нет'} />
        <KpiCard label="Предупреждений" value={`${warn}`} />
        <KpiCard label="Принято" value={`${acked.size}`} note="в этой сессии" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup type="single" value={level} onValueChange={(v) => v && setLevel(v)} variant="outline">
          <ToggleGroupItem value="all">Все</ToggleGroupItem>
          <ToggleGroupItem value="crit">Критичные</ToggleGroupItem>
          <ToggleGroupItem value="warn">Предупреждения</ToggleGroupItem>
          <ToggleGroupItem value="info">Инфо</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="ghost" size="sm" onClick={() => setShowAcked((v) => !v)}>{showAcked ? 'Скрыть принятые' : 'Показать принятые'}</Button>
      </div>

      {rows.length === 0 ? (
        <Card className="py-0">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><BellOffIcon /></EmptyMedia>
              <EmptyTitle>Открытых оповещений нет</EmptyTitle>
              <EmptyDescription>Все предупреждения приняты в работу. Новые появятся здесь.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      ) : (
        <Card className="overflow-hidden py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Уровень</TableHead>
                  <TableHead>Событие</TableHead>
                  <TableHead className="hidden md:table-cell">Машина</TableHead>
                  <TableHead className="hidden sm:table-cell">Время</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => {
                  const m = machineById(a.machineId)
                  const isAcked = acked.has(a.id)
                  return (
                    <TableRow key={a.id} className={isAcked ? 'opacity-55' : ''}>
                      <TableCell><LevelBadge level={a.level} /></TableCell>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell className="hidden md:table-cell">{m ? <Link to={`/machines/${m.id}`} className="text-sm text-muted-foreground hover:text-foreground hover:underline">{m.name}</Link> : '—'}</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell" title={fmtDateTime(a.at)}>{ago(a.at)}</TableCell>
                      <TableCell className="text-right">
                        {isAcked ? <Badge variant="secondary" className="gap-1"><CheckIcon className="size-3" /> принято</Badge>
                          : <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => ackOne(a.id, a.title)}><CheckIcon /> Принять</Button>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
      <p className="text-xs text-muted-foreground">{rows.length} {plural(rows.length, ['запись', 'записи', 'записей'])} в списке.</p>
    </>
  )
}
