import { useState } from 'react'
import { Button, Chip, Switch, DataList, Spinner, toast, type Column } from '@/kit'
import { tasksFor, type Task } from '@/lib/admin-mock'
import type { Machine } from '@/lib/mock'
import { ago, fmtDateTime } from '@/lib/format'
import { Play } from 'lucide-react'

export function TasksTab({ machine }: { machine: Machine }) {
  const [rows, setRows] = useState<Task[]>(() => tasksFor(machine))
  const set = (n: string, p: Partial<Task>) => setRows((r) => r.map((t) => (t.name === n ? { ...t, ...p } : t)))
  const run = (t: Task) => {
    set(t.name, { lastResult: 'running', last: Date.now() })
    setTimeout(() => { set(t.name, { lastResult: 'ok' }); toast.success(`Задача «${t.name}» выполнена`, 'Код возврата 0x0 (демо).') }, 1800)
  }
  const cols: Column<Task>[] = [
    { key: 'name', header: 'Задача', primary: true, cell: (t) => <div><div className="font-medium text-fg">{t.name}</div><div className="font-mono text-xs text-muted">{t.path}</div></div> },
    { key: 'trigger', header: 'Триггер', meta: true, cell: (t) => <span className="text-muted">{t.trigger}</span> },
    { key: 'last', header: 'Последний запуск', cell: (t) => (
      <span className="inline-flex items-center gap-2">
        {t.lastResult === 'running' ? <span className="inline-flex items-center gap-1.5 text-muted"><Spinner className="size-3.5" /> выполняется</span>
          : t.lastResult === 'ok' ? <Chip tone="ok">успешно</Chip> : <Chip tone="bad">ошибка 0x1</Chip>}
        <span className="text-xs text-muted">{ago(t.last)}</span>
      </span>
    ) },
    { key: 'next', header: 'Следующий', hideBelow: 'lg', cell: (t) => <span className="text-muted">{t.enabled ? fmtDateTime(t.next) : '—'}</span> },
    { key: 'enabled', header: 'Включена', cell: (t) => (
      <span onClick={(e) => e.stopPropagation()}><Switch checked={t.enabled} ariaLabel={`Включить ${t.name}`} onCheckedChange={(v) => { set(t.name, { enabled: v }); toast.info(v ? `Задача «${t.name}» включена` : `Задача «${t.name}» отключена`) }} /></span>
    ) },
  ]
  return (
    <DataList columns={cols} rows={rows} rowKey={(t) => t.name}
      rowActions={(t) => <Button variant="ghost" size="sm" disabled={t.lastResult === 'running'} onClick={() => run(t)}><Play className="size-4" /> <span className="hidden xl:inline">Запустить</span></Button>}
      footer="Планировщик заданий Windows. Запуск вручную не меняет расписание." />
  )
}
