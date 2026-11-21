import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button, Dialog, DialogTrigger, DialogContent, DialogHeader, DialogBody, DialogTitleText, DialogClose, Field, Textarea, Switch, Spinner, StatusDot, toast } from '@/kit'
import type { Machine } from '@/lib/mock'
import { LifeBuoy, MonitorPlay } from 'lucide-react'

type Phase = 'form' | 'waiting' | 'accepted'

/** Remote-assistance request: the user on the PC must accept before the operator sees the screen. */
export function RemoteAssist({ machine }: { machine: Machine }) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('form')
  const [note, setNote] = useState('Здравствуйте! Это ИТ-отдел, хотим помочь с настройкой. Разрешите подключение к экрану.')
  const [control, setControl] = useState(false)
  useEffect(() => {
    if (phase !== 'waiting') return
    const t = setTimeout(() => { setPhase('accepted'); toast.success(`${machine.owner} принял(а) запрос`, 'Демо: подключение имитируется.') }, 2600)
    return () => clearTimeout(t)
  }, [phase, machine.owner])

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPhase('form') }}>
      <DialogTrigger asChild><Button variant="outline" size="sm" disabled={machine.status === 'offline'}><LifeBuoy className="size-4" /> Удалённая помощь</Button></DialogTrigger>
      <DialogContent title="Запрос удалённой помощи" size="sm">
        <DialogHeader><DialogTitleText>Удалённая помощь · {machine.name}</DialogTitleText></DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          {phase === 'form' && <>
            <p className="text-sm text-muted">Пользователь <b className="font-medium text-fg">{machine.owner}</b> увидит окно с запросом и сам решит, пустить ли вас. Без согласия экран не открывается.</p>
            <Field label="Сообщение пользователю" htmlFor="ra-note"><Textarea id="ra-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm"><span className="text-fg">Запросить управление</span><span className="block text-xs text-muted">иначе — только просмотр</span></span>
              <Switch checked={control} onCheckedChange={setControl} ariaLabel="Запросить управление" />
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild><Button variant="ghost">Отмена</Button></DialogClose>
              <Button variant="solid" disabled={!note.trim()} onClick={() => setPhase('waiting')}>Отправить запрос</Button>
            </div>
          </>}
          {phase === 'waiting' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
              <Spinner className="size-6" />
              <div className="text-sm text-fg">Ждём ответа пользователя…</div>
              <div className="text-xs text-muted">Запрос действует 2 минуты. Событие записано в журнал аудита.</div>
              <Button variant="ghost" size="sm" onClick={() => { setPhase('form'); toast.info('Запрос отозван') }}>Отозвать</Button>
            </div>
          )}
          {phase === 'accepted' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-fg"><StatusDot status="online" withLabel={false} /> Сеанс помощи активен · {control ? 'просмотр и управление' : 'только просмотр'}</div>
              <p className="text-xs text-muted">Пользователь видит рамку вокруг экрана и может завершить сеанс в любой момент.</p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setOpen(false); setPhase('form'); toast.info('Сеанс помощи завершён') }}>Завершить</Button>
                <Button variant="solid" asChild><Link to="/screen" onClick={() => setOpen(false)}><MonitorPlay className="size-4" /> Открыть экран</Link></Button>
              </div>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
