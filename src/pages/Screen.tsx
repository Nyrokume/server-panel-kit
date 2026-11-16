import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader, StatusDot } from '@/components/app/common'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Input } from '@/components/ui/input'
import { useAppState } from '@/lib/app-state'
import { fleetFor } from '@/lib/live'
import { fakeScreen } from '@/lib/fakescreen'
import { fmtTime } from '@/lib/format'
import { CameraIcon, MaximizeIcon, ShieldAlertIcon, RefreshCwIcon, SearchIcon, XIcon } from 'lucide-react'

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

  const snapshot = (name: string) => toast.success(`Снимок экрана ${name} сохранён`, { description: 'Демо: изображение сгенерировано, реальный экран не захватывается.' })

  return (
    <>
      <PageHeader title="Просмотр экрана" description="Миниатюры экранов включённых машин. Откройте любую на весь экран, выберите интервал обновления и делайте снимки.">
        <ToggleGroup type="single" value={String(interval)} onValueChange={(v) => v && setIntervalMs(Number(v))} variant="outline">
          <ToggleGroupItem value="1000">1 с</ToggleGroupItem>
          <ToggleGroupItem value="3000">3 с</ToggleGroupItem>
          <ToggleGroupItem value="10000">10 с</ToggleGroupItem>
        </ToggleGroup>
      </PageHeader>

      <Alert>
        <ShieldAlertIcon />
        <AlertTitle>Демонстрационный режим</AlertTitle>
        <AlertDescription>Изображения экранов генерируются локально. Реальный захват экрана не выполняется.</AlertDescription>
      </Alert>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени или пользователю…" className="pl-8" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((m) => (
          <Card key={m.id} className="group gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
            <button className="relative block aspect-video w-full overflow-hidden bg-black text-left" onClick={() => setFsId(m.id)} aria-label={`Открыть экран ${m.name}`}>
              <img src={fakeScreen(m, tick)} alt={`Экран машины ${m.name}`} className="size-full object-cover" draggable={false} />
              <span className="absolute left-2 top-2"><Badge variant="secondary" className="gap-1.5 bg-black/60 text-white backdrop-blur"><StatusDot status={m.status} withLabel={false} />{fmtTime(Date.now())}</Badge></span>
              <span className="absolute right-2 top-2 rounded bg-black/60 p-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"><MaximizeIcon className="size-4 text-white" /></span>
              <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2 text-xs text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
              </span>
            </button>
            <CardContent className="flex items-center justify-between gap-2 px-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{m.name}</div>
                <div className="truncate text-xs text-muted-foreground">{m.owner}</div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="size-8" aria-label="Снимок" onClick={() => snapshot(m.name)}><CameraIcon /></Button>
                <Button variant="ghost" size="icon" className="size-8" aria-label="На весь экран" onClick={() => setFsId(m.id)}><MaximizeIcon /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {list.length === 0 && <p className="text-sm text-muted-foreground">Нет включённых машин по заданному фильтру.</p>}

      <Dialog open={!!fsId} onOpenChange={(o) => !o && setFsId(null)}>
        <DialogContent showCloseButton={false} className="max-w-5xl gap-0 overflow-hidden p-0">
          <DialogHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base">{fsMachine?.name}</DialogTitle>
              {fsMachine && <StatusDot status={fsMachine.status} />}
              <Badge variant="outline" className="gap-1.5"><span className="size-1.5 animate-pulse rounded-full bg-red-500" /> LIVE · {fmtTime(Date.now())}</Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setTick((t) => t + 1)}><RefreshCwIcon /> Обновить</Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fsMachine && snapshot(fsMachine.name)}><CameraIcon /> Снимок</Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setFsId(null)} aria-label="Закрыть"><XIcon /></Button>
            </div>
          </DialogHeader>
          {fsMachine && <img src={fakeScreen(fsMachine, tick, 1280, 760)} alt={`Экран машины ${fsMachine.name}`} className="w-full bg-black" />}
          <div className="flex items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
            <span>{fsMachine?.os} · {fsMachine?.ip}</span>
            <span>Разрешение демо 1280×760 · интервал {interval / 1000} с</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
