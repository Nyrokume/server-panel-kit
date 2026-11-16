import { useMemo, useState } from 'react'
import { PageHeader, StatusDot, UsageBar } from '@/components/app/common'
import { KpiCard, ChartFigure, TimeLineChart, DataTable } from '@/components/app/dataviz'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useAppState } from '@/lib/app-state'
import { useLive, fleetFor, useMachineLive } from '@/lib/live'
import { fmtDelta, fmtNumber, fmtUptime, fmtBytes } from '@/lib/format'
import { volumesFor } from '@/lib/mock'

export default function System() {
  const { tenant } = useAppState()
  const fleet = fleetFor(tenant)
  const live = fleet.filter((m) => m.status !== 'offline')
  const [id, setId] = useState(live[0]?.id ?? fleet[0]?.id)
  const machine = fleet.find((m) => m.id === id) ?? fleet[0]
  const { sample, history } = useMachineLive(machine.id)
  useLive()

  const chartData = useMemo(() => history.map((h) => ({
    label: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(h.t),
    cpu: h.cpu, ram: h.ram, temp: h.temp,
  })), [history])
  const netData = useMemo(() => history.map((h) => ({
    label: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(h.t),
    net: h.net,
  })), [history])

  const vols = volumesFor(machine)
  const diskUsed = vols.reduce((s, v) => s + v.usedGb, 0)
  const diskTotal = vols.reduce((s, v) => s + v.sizeGb, 0)
  const prev = history[history.length - 7]

  return (
    <>
      <PageHeader title="Состояние системы" description="Телеметрия выбранной машины в реальном времени: процессор, память, сеть, температура и аптайм.">
        <Select value={machine.id} onValueChange={setId}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {fleet.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span className="flex items-center gap-2"><StatusDot status={m.status} withLabel={false} />{m.name} · {m.role}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard label="Процессор" value={fmtNumber(sample?.cpu ?? 0, { digits: 0 })} unit="%"
            delta={fmtDelta(sample?.cpu ?? 0, prev?.cpu ?? sample?.cpu ?? 0, { kind: 'pp', goodWhen: 'down', period: 'за 12 с' })}
            spark={history.map((h) => h.cpu)} />
          <KpiCard label="Память" value={fmtNumber(sample?.ram ?? 0, { digits: 0 })} unit="%"
            delta={fmtDelta(sample?.ram ?? 0, prev?.ram ?? sample?.ram ?? 0, { kind: 'pp', goodWhen: 'down', period: 'за 12 с' })}
            note={`${fmtNumber(Math.round((machine.ramGb * (sample?.ram ?? 0)) / 100))} / ${machine.ramGb} ГБ`} spark={history.map((h) => h.ram)} />
          <KpiCard label="Сеть" value={fmtNumber(sample?.net ?? 0, { digits: 0 })} unit="Мбит/с" spark={history.map((h) => h.net)} />
          <KpiCard label="Температура" value={fmtNumber(sample?.temp ?? 0, { digits: 0 })} unit="°C"
            delta={fmtDelta(sample?.temp ?? 0, prev?.temp ?? sample?.temp ?? 0, { kind: 'abs', unit: '°C', goodWhen: 'down', period: 'за 12 с' })}
            spark={history.map((h) => h.temp)} />
        </div>
        <Card className="min-w-64">
          <CardHeader className="pb-2"><CardTitle className="text-base">{machine.name}</CardTitle></CardHeader>
          <CardContent className="grid gap-1.5 text-sm">
            <Row k="Статус" v={<StatusDot status={machine.status} />} />
            <Row k="Роль" v={machine.role} />
            <Row k="ОС" v={machine.os} />
            <Row k="Процессор" v={`${machine.cpuModel} · ${machine.cores} ядер`} />
            <Row k="Адрес" v={<span className="font-mono text-xs">{machine.ip}</span>} />
            <Row k="Аптайм" v={fmtUptime((Date.now() - machine.bootAt) / 1000)} />
            <Row k="Агент" v={`v${machine.agent}`} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartFigure
          title={`Загрузка ${sample?.cpu ?? 0} % CPU и ${sample?.ram ?? 0} % ОЗУ`}
          subtitle="Процессор, память и температура этой машины за последние ~80 секунд"
          source="Источник: агент на машине (демо-данные), интервал 2 с"
          table={<DataTable head={['Время', 'CPU, %', 'ОЗУ, %', '°C']} rows={chartData.slice(-12).map((d) => [d.label, d.cpu, d.ram, d.temp])} />}
        >
          <TimeLineChart data={chartData} unit=" %" max={100}
            series={[{ key: 'cpu', label: 'CPU, %', focus: true }, { key: 'ram', label: 'ОЗУ, %' }, { key: 'temp', label: 'Температура, °C' }]} />
        </ChartFigure>
        <ChartFigure
          title="Сетевой трафик"
          subtitle="Суммарный входящий и исходящий трафик, Мбит/с"
          source="Источник: агент на машине (демо-данные)"
          table={<DataTable head={['Время', 'Мбит/с']} rows={netData.slice(-12).map((d) => [d.label, d.net])} />}
        >
          <TimeLineChart data={netData} unit="" series={[{ key: 'net', label: 'Трафик, Мбит/с', focus: true }]} />
        </ChartFigure>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Накопители</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span>Занято <b className="tabular-nums">{fmtBytes(diskUsed)}</b> из {fmtBytes(diskTotal)}</span>
            <div className="min-w-48 flex-1"><Progress value={(diskUsed / diskTotal) * 100} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {vols.map((v) => (
              <div key={v.id} className="flex flex-col gap-1.5 rounded-md border p-3">
                <div className="flex items-center justify-between text-sm"><span className="font-medium">{v.mount} · {v.label}</span><span className="text-xs text-muted-foreground">{v.type}</span></div>
                <UsageBar value={(v.usedGb / v.sizeGb) * 100} />
                <div className="text-xs text-muted-foreground tabular-nums">{fmtBytes(v.usedGb)} из {fmtBytes(v.sizeGb)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
