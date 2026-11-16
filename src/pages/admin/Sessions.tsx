import { useState } from 'react'
import { Button, Chip, DataList, ConfirmDialog, Dialog, DialogContent, DialogHeader, DialogBody, DialogTitleText, DialogClose, Field, Textarea, Select, SelectItem, EmptyState, toast, type Column } from '@/kit'
import { sessionsFor, type Session } from '@/lib/admin-mock'
import { people, type Machine } from '@/lib/mock'
import { ago, plural } from '@/lib/format'
import { MessageSquare, Lock, LogOut, UserX } from 'lucide-react'

const stChip: Record<Session['state'], React.ReactNode> = { active: <Chip tone="ok">активен</Chip>, idle: <Chip tone="warn">простаивает</Chip>, disconnected: <Chip tone="neutral">отключён</Chip> }

export function SessionsTab({ machine }: { machine: Machine }) {
  const [rows, setRows] = useState<Session[]>(() => sessionsFor(machine, people))
  const [msgFor, setMsgFor] = useState<Session | null>(null)
  const [text, setText] = useState('Через 10 минут компьютер будет перезагружен для установки обновлений. Сохраните документы.')
  const [timeout, setTimeoutS] = useState('60')

  if (!rows.length) return <div className="rounded-[var(--radius-pk)] border border-line bg-raised"><EmptyState icon={UserX} title="Нет активных сеансов" description={machine.status === 'offline' ? 'Машина не в сети.' : 'Пользователи сейчас не вошли в систему.'} /></div>

  const cols: Column<Session>[] = [
    { key: 'user', header: 'Пользователь', primary: true, cell: (s) => <span className="font-medium text-fg">{s.user}</span> },
    { key: 'kind', header: 'Сеанс', meta: true, cell: (s) => <span className="text-muted">{s.kind === 'console' ? 'Консоль' : `RDP-Tcp#${s.id}`}{s.client ? ` · с ${s.client}` : ''}</span> },
    { key: 'state', header: 'Состояние', cell: (s) => stChip[s.state] },
    { key: 'since', header: 'Вход', cell: (s) => <span className="text-muted">{ago(s.since)}</span> },
    { key: 'idle', header: 'Простой', align: 'right', hideBelow: 'sm', cell: (s) => (s.idleMin ? `${s.idleMin} мин` : '—') },
  ]

  return (
    <div className="flex flex-col gap-3">
      <DataList columns={cols} rows={rows} rowKey={(s) => String(s.id)}
        rowActions={(s) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setMsgFor(s)}><MessageSquare className="size-4" /> <span className="hidden xl:inline">Сообщение</span></Button>
            <ConfirmDialog trigger={<Button variant="ghost" size="sm"><Lock className="size-4" /> <span className="hidden xl:inline">Заблокировать</span></Button>}
              title={`Заблокировать сеанс ${s.user}?`} danger={false} confirmLabel="Заблокировать"
              description="Экран будет заблокирован, программы продолжат работу. Пользователь войдёт снова своим паролем. Демо."
              onConfirm={() => toast.success(`Сеанс ${s.user} заблокирован`, 'Демо: реальный сеанс не затронут.')} />
            <ConfirmDialog trigger={<Button variant="ghost" size="sm" className="text-bad"><LogOut className="size-4" /> <span className="hidden xl:inline">Завершить</span></Button>}
              title={`Завершить сеанс ${s.user}?`} confirmLabel="Завершить сеанс"
              description="Все программы пользователя будут закрыты, несохранённые данные потеряются. Демо: реальный сеанс не затрагивается."
              onConfirm={() => { setRows((r) => r.filter((x) => x.id !== s.id)); toast.warning(`Сеанс ${s.user} завершён`, 'Демо: реальный сеанс не затронут.') }} />
          </div>
        )}
        footer={`${rows.length} ${plural(rows.length, ['сеанс', 'сеанса', 'сеансов'])} на ${machine.name}.`} />

      <Dialog open={!!msgFor} onOpenChange={(o) => !o && setMsgFor(null)}>
        <DialogContent title="Сообщение пользователю" size="sm">
          <DialogHeader><DialogTitleText>Сообщение для {msgFor?.user}</DialogTitleText></DialogHeader>
          <DialogBody className="flex flex-col gap-3">
            <Field label="Текст" htmlFor="msg-text" hint="Появится поверх всех окон в сеансе пользователя."><Textarea id="msg-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} /></Field>
            <Field label="Скрыть через">
              <Select value={timeout} onValueChange={setTimeoutS} ariaLabel="Скрыть через">
                <SelectItem value="30">30 секунд</SelectItem><SelectItem value="60">1 минуту</SelectItem><SelectItem value="0">Пока не закроет</SelectItem>
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <DialogClose asChild><Button variant="ghost">Отмена</Button></DialogClose>
              <Button variant="solid" disabled={!text.trim()} onClick={() => { toast.success(`Сообщение отправлено: ${msgFor?.user}`, 'Демо: сообщение никуда не отправлялось.'); setMsgFor(null) }}>Отправить</Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}
