import { useEffect, useMemo, useRef, useState } from 'react'
import {
  PageHeader, Segmented, Input, NoticeBar, ScreenTile, StatusDot, Chip, Button, IconButton,
  Dialog, DialogContent, DialogHeader, DialogTitleText, EmptyState, toast,
} from '@/kit'
import { useAppState } from '@/lib/app-state'
import { fleetFor } from '@/lib/live'
import { fakeScreen } from '@/lib/fakescreen'
import { fmtTime } from '@/lib/format'
import { ShieldAlert, Search, RefreshCw, Camera, X, MonitorOff } from 'lucide-react'

export default function Screen() {
  const { tenant } = useAppState()
  const fleet = fleetFor(tenant)
  const online = fleet.filter((m) => m.status !== 'offline')
  const [tick, setTick] = useState(1)
  const [interval, setIntervalMs] = useState(3000)
  const [q, setQ] = useState('')
  const [fsId, setFsId] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (timer.current) window.clearInterval(timer.current)
    timer.current = window.setInterval(() => setTick((t) => t + 1), interval) as unknown as number
    return () => { if (timer.current) window.clearInterval(timer.current) }
  }, [interval])

  const list = useMemo(() => online.filter((m) => !q || `${m.name} ${m.owner} ${m.role}`.toLowerCase().includes(q.toLowerCase())), [online, q])
  const fsMachine = fleet.find((m) => m.id === fsId)
  const snapshot = (name: string) => toast.success(`Снимок экрана ${name} сохранён`, 'Демо: изображение сгенерировано, реальный экран не захватывается.')

  return (
    <>
      <PageHeader title="Просмотр экрана" description="Миниатюры экранов включённых машин. Откройте на весь экран, выберите интервал обновления и делайте снимки.">
        <Segmented value={String(interval)} onValueChange={(v) => setIntervalMs(Number(v))} ariaLabel="Интервал обновления"
          options={[{ value: '1000', label: '1 с' }, { value: '3000', label: '3 с' }, { value: '10000', label: '10 с' }]} />
      </PageHeader>

      <NoticeBar icon={ShieldAlert} title="Демонстрационный режим" tone="warn">
        Изображения экранов генерируются локально. Реальный захват экрана не выполняется.
      </NoticeBar>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени или пользователю…" className="pl-8" />
      </div>

      {list.length === 0 ? (
        <div className="rounded-[var(--radius-pk)] border border-line bg-raised">
          <EmptyState icon={MonitorOff} title="Нет включённых машин" description="По заданному фильтру нет машин в сети." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {list.map((m) => (
            <ScreenTile key={m.id} name={m.name} meta={m.owner} status={m.status} src={fakeScreen(m, tick)}
              onOpen={() => setFsId(m.id)} onSnapshot={() => snapshot(m.name)} />
          ))}
        </div>
      )}

      <Dialog open={!!fsId} onOpenChange={(o) => !o && setFsId(null)}>
        <DialogContent size="xl" hideClose title={fsMachine?.name ?? 'Экран'} className="max-w-[min(1120px,calc(100vw-2rem))] p-0">
          <DialogHeader>
            <div className="flex min-w-0 items-center gap-2">
              <DialogTitleText>{fsMachine?.name}</DialogTitleText>
              {fsMachine && <StatusDot status={fsMachine.status} withLabel={false} />}
              <Chip tone="neutral"><span className="size-1.5 animate-pulse rounded-full bg-bad" /> LIVE · {fmtTime(Date.now())}</Chip>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={() => setTick((t) => t + 1)}><RefreshCw className="size-4" /> <span className="hidden sm:inline">Обновить</span></Button>
              <Button variant="outline" size="sm" onClick={() => fsMachine && snapshot(fsMachine.name)}><Camera className="size-4" /> <span className="hidden sm:inline">Снимок</span></Button>
              <IconButton label="Закрыть" onClick={() => setFsId(null)}><X className="size-4" /></IconButton>
            </div>
          </DialogHeader>
          {fsMachine && <img src={fakeScreen(fsMachine, tick, 1280, 760)} alt={`Экран машины ${fsMachine.name}`} className="w-full bg-black" />}
          <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2 text-xs text-muted">
            <span className="truncate">{fsMachine?.os} · {fsMachine?.ip}</span>
            <span className="shrink-0">Демо 1280×760 · интервал {interval / 1000} с</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
