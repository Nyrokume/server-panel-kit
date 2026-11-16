import { useMemo, useState } from 'react'
import { Input, Segmented, Select, SelectItem, Button, Chip, DataList, ConfirmDialog, toast, type Column } from '@/kit'
import { servicesFor, type Service, type Startup, type SvcState } from '@/lib/admin-mock'
import type { Machine } from '@/lib/mock'
import { Search, Play, Square, RotateCw } from 'lucide-react'

const stateChip: Record<SvcState, React.ReactNode> = {
  running: <Chip tone="ok">работает</Chip>, stopped: <Chip tone="neutral">остановлена</Chip>, paused: <Chip tone="warn">приостановлена</Chip>,
}
const startupLabel: Record<Startup, string> = { auto: 'Автоматически', delayed: 'Авто (отложенно)', manual: 'Вручную', disabled: 'Отключена' }
const critical = new Set(['PultAgent', 'EventLog', 'WinRM', 'MpsSvc'])

export function ServicesTab({ machine }: { machine: Machine }) {
  const [rows, setRows] = useState<Service[]>(() => servicesFor(machine))
  const [q, setQ] = useState('')
  const [f, setF] = useState<'all' | SvcState>('all')
  const set = (name: string, patch: Partial<Service>) => setRows((r) => r.map((s) => (s.name === name ? { ...s, ...patch } : s)))
  const list = useMemo(() => rows.filter((s) => (f === 'all' || s.state === f) && (!q || `${s.name} ${s.display}`.toLowerCase().includes(q.toLowerCase()))), [rows, q, f])

  const start = (s: Service) => { set(s.name, { state: 'running', pid: 400 + Math.floor(Math.random() * 9000) }); toast.success(`Служба «${s.display}» запущена`, 'Демо: реальная служба не затронута.') }
  const stop = (s: Service) => { set(s.name, { state: 'stopped', pid: undefined }); toast.warning(`Служба «${s.display}» остановлена`, 'Демо: реальная служба не затронута.') }
  const restart = (s: Service) => { set(s.name, { state: 'running', pid: 400 + Math.floor(Math.random() * 9000) }); toast.success(`Служба «${s.display}» перезапущена`) }

  const cols: Column<Service>[] = [
    { key: 'display', header: 'Служба', primary: true, cell: (s) => <div><div className="font-medium text-fg">{s.display}</div><div className="font-mono text-xs text-muted">{s.name}{s.pid ? ` · PID ${s.pid}` : ''}</div></div> },
    { key: 'state', header: 'Состояние', cell: (s) => stateChip[s.state] },
    { key: 'startup', header: 'Тип запуска', wide: true, cell: (s) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Select value={s.startup} ariaLabel={`Тип запуска ${s.display}`} className="h-9 w-full md:h-8 md:w-44"
          onValueChange={(v) => { set(s.name, { startup: v as Startup }); toast.info(`Тип запуска: ${startupLabel[v as Startup]}`, s.display) }}>
          {(Object.keys(startupLabel) as Startup[]).map((k) => <SelectItem key={k} value={k}>{startupLabel[k]}</SelectItem>)}
        </Select>
      </div>
    ) },
    { key: 'account', header: 'Учётная запись', hideBelow: 'lg', cell: (s) => <span className="text-muted">{s.account}</span> },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:min-w-56">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя службы…" className="pl-8" />
        </div>
        <Segmented value={f} onValueChange={setF} ariaLabel="Состояние"
          options={[{ value: 'all', label: `Все ${rows.length}` }, { value: 'running', label: 'Работают' }, { value: 'stopped', label: 'Остановлены' }]} />
      </div>
      <DataList columns={cols} rows={list} rowKey={(s) => s.name}
        rowActions={(s) => (
          <div className="flex justify-end gap-1">
            {s.state !== 'running' && <Button variant="ghost" size="sm" onClick={() => start(s)}><Play className="size-4" /> Запустить</Button>}
            {s.state === 'running' && (
              <ConfirmDialog trigger={<Button variant="ghost" size="sm"><RotateCw className="size-4" /> <span className="hidden xl:inline">Перезапустить</span></Button>}
                title={`Перезапустить «${s.display}»?`} danger={false} confirmLabel="Перезапустить"
                description="Служба будет остановлена и снова запущена. Зависимые службы перезапустятся автоматически. Демо: реальная служба не затрагивается."
                onConfirm={() => restart(s)} />
            )}
            {s.state === 'running' && (
              <ConfirmDialog trigger={<Button variant="ghost" size="sm" className="text-bad"><Square className="size-4" /> <span className="hidden xl:inline">Остановить</span></Button>}
                title={`Остановить «${s.display}»?`} confirmLabel="Остановить" confirmText={critical.has(s.name) ? s.name : undefined}
                description={critical.has(s.name)
                  ? 'Это критичная служба: без неё машина может потерять связь с пультом или защиту. Введите имя службы для подтверждения. Демо: реальная служба не затрагивается.'
                  : 'Служба будет остановлена до ручного запуска или перезагрузки. Демо: реальная служба не затрагивается.'}
                onConfirm={() => stop(s)} />
            )}
          </div>
        )}
        footer={`${list.length} из ${rows.length} служб. Действия записываются в журнал аудита.`} />
    </div>
  )
}
