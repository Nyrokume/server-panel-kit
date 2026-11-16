import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  PageHeader, KpiStrip, Stat, Sparkline, ChartFrame, TimeLine, VizTable,
  StatusDot, UsageBar, Panel, SectionHeader, InfoRow, Button, ConfirmDialog, toast,
  Table, THead, TBody, TR, TH, TD,
} from '@/kit'
import { SmartChip } from '@/components/app/status'
import { machineById, volumesFor, procsFor } from '@/lib/mock'
import { useMachineLive } from '@/lib/live'
import { fmtNumber, fmtUptime, fmtBytes, fmtDelta } from '@/lib/format'
import { RotateCcw, Power, Terminal as TerminalIcon, MonitorPlay, ArrowLeft, ChevronRight } from 'lucide-react'

export default function MachineDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const machine = machineById(id)
  const { sample, history } = useMachineLive(id)
  const chartData = useMemo(() => history.map((h) => ({ label: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(h.t), cpu: h.cpu, ram: h.ram })), [history])

  if (!machine) {
    return (
      <div className="flex flex-col items-start gap-3">
        <PageHeader title="Машина не найдена" description="Возможно, устройство выведено из эксплуатации." />
        <Button asChild variant="outline"><Link to="/machines"><ArrowLeft className="size-4" /> К списку машин</Link></Button>
      </div>
    )
  }

  const vols = volumesFor(machine)
  const procs = procsFor(machine).slice(0, 6)
  const prev = history[history.length - 7]

  return (
    <>
      <nav className="flex items-center gap-1 text-sm text-muted">
        <Link to="/machines" className="hover:text-fg">Машины</Link><ChevronRight className="size-3.5" /><span className="text-fg">{machine.name}</span>
      </nav>

      <PageHeader title={machine.name} description={`${machine.role} · ${machine.os} · ${machine.site}`}>
        <Button asChild variant="outline" size="sm"><Link to="/powershell"><TerminalIcon className="size-4" /> PowerShell</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/screen"><MonitorPlay className="size-4" /> Экран</Link></Button>
        <ConfirmDialog trigger={<Button variant="outline" size="sm"><RotateCcw className="size-4" /> Перезагрузить</Button>}
          title={`Перезагрузить ${machine.name}?`} danger={false} confirmLabel="Перезагрузить"
          description="Машина станет недоступна на 1–2 минуты. Активные сессии будут закрыты. Это демо — реальная машина не затрагивается."
          onConfirm={() => toast.success(`Команда перезагрузки отправлена на ${machine.name}`, 'Демо: реальная машина не затронута.')} />
        <ConfirmDialog trigger={<Button variant="danger" size="sm"><Power className="size-4" /> Выключить</Button>}
          title={`Выключить ${machine.name}?`} confirmLabel="Выключить" confirmText={machine.name}
          description="Устройство будет полностью остановлено и потребует ручного включения. Введите имя машины для подтверждения. Это демо — реальная машина не затрагивается."
          onConfirm={() => toast.warning(`${machine.name} выключается`, 'Демо: реальная машина не затронута.')} />
      </PageHeader>

      <KpiStrip>
        <Stat label="Процессор" value={fmtNumber(sample?.cpu ?? 0, { digits: 0 })} unit="%" spark={<Sparkline data={history.map((h) => h.cpu)} />}
          delta={fmtDelta(sample?.cpu ?? 0, prev?.cpu ?? sample?.cpu ?? 0, { kind: 'pp', goodWhen: 'down', period: 'за 12 с' })} />
        <Stat label="Память" value={fmtNumber(sample?.ram ?? 0, { digits: 0 })} unit="%" spark={<Sparkline data={history.map((h) => h.ram)} />} note={`${machine.ramGb} ГБ всего`} />
        <Stat label="Температура" value={fmtNumber(sample?.temp ?? 0, { digits: 0 })} unit="°C" spark={<Sparkline data={history.map((h) => h.temp)} />} />
        <Stat label="Аптайм" value={fmtUptime((Date.now() - machine.bootAt) / 1000)} note={`агент v${machine.agent}`} />
      </KpiStrip>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ChartFrame title="Нагрузка CPU и ОЗУ" subtitle={`Телеметрия ${machine.name} за последние ~80 с, обновление раз в 2 с`}
          source="Источник: агент на машине (демо-данные)"
          table={<VizTable head={['Время', 'CPU, %', 'ОЗУ, %']} rows={chartData.slice(-12).map((d) => [d.label, d.cpu, d.ram])} />}>
          <TimeLine data={chartData} unit=" %" max={100} series={[{ key: 'cpu', label: 'CPU, %', focus: true }, { key: 'ram', label: 'ОЗУ, %' }]} />
        </ChartFrame>
        <Panel flush className="p-4">
          <div className="mb-2 text-sm font-semibold text-fg">Паспорт устройства</div>
          <InfoRow k="Статус" v={<StatusDot status={machine.status} />} />
          <InfoRow k="Тип" v={machine.kind === 'server' ? 'Сервер' : 'Рабочая станция'} />
          <InfoRow k="Процессор" v={`${machine.cpuModel} · ${machine.cores} ядер`} />
          <InfoRow k="ОЗУ" v={`${machine.ramGb} ГБ`} />
          <InfoRow k="Адрес" v={<span className="font-mono text-xs">{machine.ip}</span>} />
          <InfoRow k="Размещение" v={machine.site} />
          <InfoRow k="Владелец" v={machine.owner} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel flush>
          <SectionHeader className="border-b border-line p-4" title="Накопители" />
          <div className="flex flex-col gap-3 p-4">
            {vols.map((v) => (
              <div key={v.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm"><span className="font-medium text-fg">{v.mount} · {v.label} <span className="text-xs font-normal text-muted">{v.type}</span></span><SmartChip smart={v.smart} /></div>
                <UsageBar value={(v.usedGb / v.sizeGb) * 100} />
                <div className="text-xs text-muted tnum">{fmtBytes(v.usedGb)} из {fmtBytes(v.sizeGb)} · {v.tempC} °C</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel flush>
          <SectionHeader className="border-b border-line p-4" title="Топ процессов по CPU"
            actions={<Button variant="link" size="sm" onClick={() => navigate('/processes')}>Все процессы</Button>} />
          <div className="overflow-x-auto pk-scroll">
            <Table>
              <THead><tr className="border-b border-line"><TH className="pl-4">Процесс</TH><TH align="right">CPU, %</TH><TH align="right" className="pr-4">Память</TH></tr></THead>
              <TBody>
                {procs.map((p) => (
                  <TR key={p.pid}>
                    <TD className="pl-4"><div className="font-medium text-fg">{p.name}</div><div className="text-xs text-muted">PID {p.pid} · {p.user}</div></TD>
                    <TD align="right">{fmtNumber(p.cpu, { digits: 1 })}</TD>
                    <TD align="right" className="pr-4">{fmtNumber(p.memMb)} МБ</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Panel>
      </div>
    </>
  )
}
