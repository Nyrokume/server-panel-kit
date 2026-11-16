import { useState } from 'react'
import { Panel, SectionHeader, Button, ConfirmDialog, Field, Input, Select, SelectItem, Switch, Chip, EmptyState, toast } from '@/kit'
import type { Machine } from '@/lib/mock'
import { fmtDateTime, fmtUptime } from '@/lib/format'
import { RotateCcw, Power, Zap, Moon, CalendarClock, X } from 'lucide-react'

type Job = { id: number; action: 'reboot' | 'shutdown'; at: number; warn: number; skipIfActive: boolean }
const actLabel = { reboot: 'Перезагрузка', shutdown: 'Выключение' }

function localInput(ts: number) {
  const d = new Date(ts - new Date().getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 16)
}

export function PowerTab({ machine }: { machine: Machine }) {
  const offline = machine.status === 'offline'
  const [jobs, setJobs] = useState<Job[]>([{ id: 1, action: 'reboot', at: Date.now() + 26 * 3600000, warn: 15, skipIfActive: true }])
  const [action, setAction] = useState<Job['action']>('reboot')
  const [at, setAt] = useState(() => localInput(Date.now() + 3 * 3600000))
  const [warn, setWarn] = useState('15')
  const [skip, setSkip] = useState(true)
  const demo = 'Демо: реальная машина не затронута.'

  const schedule = () => {
    const ts = new Date(at).getTime()
    if (!Number.isFinite(ts) || ts < Date.now()) { toast.error('Время уже прошло', 'Выберите момент в будущем.'); return }
    setJobs((j) => [...j, { id: Date.now(), action, at: ts, warn: Number(warn), skipIfActive: skip }].sort((a, b) => a.at - b.at))
    toast.success(`${actLabel[action]} запланирована`, fmtDateTime(ts))
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Panel flush>
        <SectionHeader className="border-b border-line p-4" title="Сейчас" description={offline ? 'Машина не в сети — доступно только пробуждение по сети.' : 'Команды выполняются немедленно и пишутся в аудит.'} />
        <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
          <ConfirmDialog trigger={<Button variant="outline" disabled={offline} className="justify-start"><RotateCcw className="size-4" /> Перезагрузить</Button>}
            title={`Перезагрузить ${machine.name}?`} danger={false} confirmLabel="Перезагрузить"
            description="Пользователи получат предупреждение за 1 минуту, затем машина перезагрузится. Сеансы будут закрыты."
            onConfirm={() => toast.success(`${machine.name}: перезагрузка`, demo)} />
          <ConfirmDialog trigger={<Button variant="outline" disabled={offline} className="justify-start"><Moon className="size-4" /> Спящий режим</Button>}
            title={`Перевести ${machine.name} в сон?`} danger={false} confirmLabel="Усыпить"
            description="Машина уйдёт в сон; разбудить можно Wake-on-LAN с этой же вкладки."
            onConfirm={() => toast.info(`${machine.name}: спящий режим`, demo)} />
          <ConfirmDialog trigger={<Button variant="danger" disabled={offline} className="justify-start"><Power className="size-4" /> Выключить</Button>}
            title={`Выключить ${machine.name}?`} confirmLabel="Выключить" confirmText={machine.name}
            description="Машина будет полностью остановлена. Включить её удалённо можно только через Wake-on-LAN, если он поддерживается сетью."
            onConfirm={() => toast.warning(`${machine.name} выключается`, demo)} />
          <Button variant="outline" disabled={!offline} className="justify-start" onClick={() => toast.success('Magic packet отправлен', `${machine.name} · широковещательно на UDP 9. ${demo}`)}>
            <Zap className="size-4" /> Wake-on-LAN
          </Button>
        </div>
        <dl className="grid grid-cols-1 border-t border-line text-sm sm:grid-cols-2">
          {[
            ['Состояние', offline ? 'Не в сети' : 'Включена'],
            ['Время работы', offline ? '—' : fmtUptime((Date.now() - machine.bootAt) / 1000)],
            ['Последний запуск', fmtDateTime(machine.bootAt)],
            ['Ждёт перезагрузки', machine.kind === 'server' ? 'Да' : 'Нет'],
            ['План питания', machine.kind === 'server' ? 'Максимум' : 'Баланс'],
            ['Wake-on-LAN', 'Поддерживается'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 sm:[&:nth-last-child(-n+2)]:border-b-0 max-sm:last:border-b-0">
              <dt className="whitespace-nowrap text-muted">{k}</dt><dd className="min-w-0 truncate text-right text-fg">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="border-t border-line px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted">Последние события питания</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {[
              [machine.bootAt, 'Запуск системы', 'Kernel-General 12'],
              [machine.bootAt - 95_000, 'Перезагрузка по расписанию', 'User32 1074 · Пульт'],
              [machine.bootAt - 8.2 * 86400000, 'Запуск системы', 'Kernel-General 12'],
              [machine.bootAt - 8.2 * 86400000 - 70_000, 'Перезагрузка после обновлений', 'User32 1074 · TrustedInstaller'],
            ].map(([t, what, src]) => (
              <li key={String(t)} className="flex items-baseline gap-3">
                <span className="w-28 shrink-0 tabular-nums text-faint">{fmtDateTime(t as number)}</span>
                <span className="min-w-0 flex-1 truncate text-fg">{what}</span>
                <span className="hidden truncate font-mono text-xs text-faint sm:inline">{src}</span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      <Panel flush>
        <SectionHeader className="border-b border-line p-4" title="Запланировать" description="Например, перезагрузку после установки обновлений ночью." />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <Field label="Действие">
            <Select value={action} onValueChange={(v) => setAction(v as Job['action'])} ariaLabel="Действие">
              <SelectItem value="reboot">Перезагрузка</SelectItem><SelectItem value="shutdown">Выключение</SelectItem>
            </Select>
          </Field>
          <Field label="Когда" htmlFor="pw-at"><Input id="pw-at" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} /></Field>
          <Field label="Предупредить пользователя">
            <Select value={warn} onValueChange={setWarn} ariaLabel="Предупредить за">
              <SelectItem value="0">Не предупреждать</SelectItem><SelectItem value="5">за 5 минут</SelectItem><SelectItem value="15">за 15 минут</SelectItem><SelectItem value="60">за 1 час</SelectItem>
            </Select>
          </Field>
          <div className="flex items-center justify-between gap-3 sm:pt-6">
            <span className="text-sm text-muted">Отложить, если есть активный сеанс</span>
            <Switch checked={skip} onCheckedChange={setSkip} ariaLabel="Отложить при активном сеансе" />
          </div>
          <div className="sm:col-span-2"><Button variant="solid" onClick={schedule}><CalendarClock className="size-4" /> Запланировать</Button></div>
        </div>
        <div className="border-t border-line">
          {jobs.length === 0 ? <EmptyState icon={CalendarClock} title="Ничего не запланировано" /> : (
            <ul className="divide-y divide-line">
              {jobs.map((j) => (
                <li key={j.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <Chip tone={j.action === 'shutdown' ? 'bad' : 'accent'}>{actLabel[j.action]}</Chip>
                  <div className="min-w-0 flex-1">
                    <div className="tnum text-fg">{fmtDateTime(j.at)}</div>
                    <div className="truncate text-xs text-muted">{j.warn ? `предупреждение за ${j.warn} мин` : 'без предупреждения'}{j.skipIfActive ? ' · отложить при активном сеансе' : ''}</div>
                  </div>
                  <ConfirmDialog trigger={<Button variant="ghost" size="sm" aria-label="Отменить"><X className="size-4" /> <span className="hidden sm:inline">Отменить</span></Button>}
                    title="Отменить запланированное действие?" danger={false} confirmLabel="Отменить действие"
                    description={`${actLabel[j.action]} ${fmtDateTime(j.at)} не будет выполнена.`}
                    onConfirm={() => { setJobs((l) => l.filter((x) => x.id !== j.id)); toast.info('Запланированное действие отменено') }} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  )
}
