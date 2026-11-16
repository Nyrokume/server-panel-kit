import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { PageHeader, StatusDot, UsageBar, SmartBadge } from '@/components/app/common'
import { KpiCard, ChartFigure, TimeLineChart, DataTable } from '@/components/app/dataviz'
import { ConfirmAction } from '@/components/app/confirm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { machineById, volumesFor, procsFor } from '@/lib/mock'
import { useMachineLive } from '@/lib/live'
import { fmtNumber, fmtUptime, fmtBytes, fmtDelta } from '@/lib/format'
import { RotateCcwIcon, PowerIcon, TerminalIcon, MonitorPlayIcon, ArrowLeftIcon } from 'lucide-react'

export default function MachineDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const machine = machineById(id)
  const { sample, history } = useMachineLive(id)

  const chartData = useMemo(() => history.map((h) => ({
    label: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(h.t),
    cpu: h.cpu, ram: h.ram,
  })), [history])

  if (!machine) {
    return (
      <div className="flex flex-col items-start gap-3">
        <PageHeader title="Машина не найдена" description="Возможно, устройство выведено из эксплуатации." />
        <Button asChild variant="outline"><Link to="/machines"><ArrowLeftIcon /> К списку машин</Link></Button>
      </div>
    )
  }

  const vols = volumesFor(machine)
  const procs = procsFor(machine).slice(0, 6)
  const prev = history[history.length - 7]

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/machines">Машины</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{machine.name}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader title={machine.name} description={`${machine.role} · ${machine.os} · ${machine.site}`}>
        <Button asChild variant="outline" size="sm" className="gap-1.5"><Link to="/powershell"><TerminalIcon /> PowerShell</Link></Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5"><Link to="/screen"><MonitorPlayIcon /> Экран</Link></Button>
        <ConfirmAction
          trigger={<Button variant="outline" size="sm" className="gap-1.5"><RotateCcwIcon /> Перезагрузить</Button>}
          title={`Перезагрузить ${machine.name}?`}
          description={<>Машина станет недоступна на 1–2 минуты. Активные сессии пользователей будут закрыты. Это демо — реальная машина не затрагивается.</>}
          confirmLabel="Перезагрузить"
          onConfirm={() => toast.success(`Команда перезагрузки отправлена на ${machine.name}`, { description: 'Демо: реальная машина не затронута.' })}
        />
        <ConfirmAction
          trigger={<Button variant="destructive" size="sm" className="gap-1.5"><PowerIcon /> Выключить</Button>}
          title={`Выключить ${machine.name}?`}
          description={<>Устройство будет полностью остановлено и потребует ручного включения. Введите имя машины, чтобы подтвердить. Это демо — реальная машина не затрагивается.</>}
          confirmLabel="Выключить"
          confirmText={machine.name}
          onConfirm={() => toast.warning(`${machine.name} выключается`, { description: 'Демо: реальная машина не затронута.' })}
        />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Процессор" value={fmtNumber(sample?.cpu ?? 0, { digits: 0 })} unit="%" spark={history.map((h) => h.cpu)}
          delta={fmtDelta(sample?.cpu ?? 0, prev?.cpu ?? sample?.cpu ?? 0, { kind: 'pp', goodWhen: 'down', period: 'за 12 с' })} />
        <KpiCard label="Память" value={fmtNumber(sample?.ram ?? 0, { digits: 0 })} unit="%" spark={history.map((h) => h.ram)}
          note={`${machine.ramGb} ГБ всего`} />
        <KpiCard label="Температура" value={fmtNumber(sample?.temp ?? 0, { digits: 0 })} unit="°C" spark={history.map((h) => h.temp)} />
        <KpiCard label="Аптайм" value={fmtUptime((Date.now() - machine.bootAt) / 1000)} note={`агент v${machine.agent}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ChartFigure
          title={`Нагрузка CPU и ОЗУ`}
          subtitle={`Телеметрия ${machine.name} за последние ~80 секунд, обновление раз в 2 с`}
          source="Источник: агент на машине (демо-данные)"
          table={<DataTable head={['Время', 'CPU, %', 'ОЗУ, %']} rows={chartData.slice(-12).map((d) => [d.label, d.cpu, d.ram])} />}
        >
          <TimeLineChart data={chartData} unit=" %" max={100} series={[{ key: 'cpu', label: 'CPU, %', focus: true }, { key: 'ram', label: 'ОЗУ, %' }]} />
        </ChartFigure>
        <Card>
          <CardHeader><CardTitle className="text-base">Паспорт устройства</CardTitle></CardHeader>
          <CardContent className="grid gap-1.5 text-sm">
            <Row k="Статус" v={<StatusDot status={machine.status} />} />
            <Row k="Тип" v={machine.kind === 'server' ? 'Сервер' : 'Рабочая станция'} />
            <Row k="Процессор" v={`${machine.cpuModel} · ${machine.cores} ядер`} />
            <Row k="ОЗУ" v={`${machine.ramGb} ГБ`} />
            <Row k="Адрес" v={<span className="font-mono text-xs">{machine.ip}</span>} />
            <Row k="Размещение" v={machine.site} />
            <Row k="Владелец" v={machine.owner} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Накопители</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {vols.map((v) => (
              <div key={v.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{v.mount} · {v.label} <span className="text-xs font-normal text-muted-foreground">{v.type}</span></span>
                  <SmartBadge smart={v.smart} />
                </div>
                <UsageBar value={(v.usedGb / v.sizeGb) * 100} />
                <div className="text-xs text-muted-foreground tabular-nums">{fmtBytes(v.usedGb)} из {fmtBytes(v.sizeGb)} · {v.tempC} °C</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="overflow-hidden py-0">
          <CardHeader className="px-5 pt-5"><CardTitle className="text-base">Топ процессов по CPU</CardTitle></CardHeader>
          <CardContent className="px-0 pt-3">
            <Table>
              <TableHeader>
                <TableRow><TableHead className="pl-5">Процесс</TableHead><TableHead className="text-right">CPU, %</TableHead><TableHead className="pr-5 text-right">Память</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {procs.map((p) => (
                  <TableRow key={p.pid}>
                    <TableCell className="pl-5"><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">PID {p.pid} · {p.user}</div></TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNumber(p.cpu, { digits: 1 })}</TableCell>
                    <TableCell className="pr-5 text-right tabular-nums">{fmtNumber(p.memMb)} МБ</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-5 py-3"><Button asChild variant="ghost" size="sm" onClick={() => navigate('/processes')}><Link to="/processes">Все процессы</Link></Button></div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed py-1 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  )
}
