import { useMemo, useState } from 'react'
import {
  PageHeader, KpiStrip, Stat, Sparkline, ChartFrame, TimeLine, VizTable,
  StatusDot, UsageBar, Panel, SectionHeader, InfoRow, Select, SelectItem,
} from '@/kit'
import { useAppState } from '@/lib/app-state'
import { fleetFor, useMachineLive } from '@/lib/live'
import { fmtDelta, fmtNumber, fmtUptime, fmtBytes } from '@/lib/format'
import { volumesFor } from '@/lib/mock'
import { Workbench } from '@/components/app/workbench'
import { InspectorShell, InspectorHead } from '@/components/app/inspector'

export default function System() {
  const { tenant } = useAppState()
  const fleet = fleetFor(tenant)
  const live = fleet.filter((m) => m.status !== 'offline')
  const [id, setId] = useState(live[0]?.id ?? fleet[0]?.id)
  const machine = fleet.find((m) => m.id === id) ?? fleet[0]
  const { sample, history } = useMachineLive(machine.id)

  const t = (h: { t: number }) => new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(h.t)
  const chartData = useMemo(() => history.map((h) => ({ label: t(h), cpu: h.cpu, ram: h.ram, temp: h.temp })), [history])
  const netData = useMemo(() => history.map((h) => ({ label: t(h), net: h.net })), [history])
  const vols = volumesFor(machine)
  const diskUsed = vols.reduce((s, v) => s + v.usedGb, 0)
  const diskTotal = vols.reduce((s, v) => s + v.sizeGb, 0)
  const prev = history[history.length - 7]

  const inspector = (
    <InspectorShell>
      <InspectorHead title="Состояние системы" lead="Сводные показания по выбранной организации. Цветные ряды на графиках — живые серии, не нейтральная заливка." />
    </InspectorShell>
  )

  return (
    <Workbench inspector={inspector}>
    <>
      <PageHeader title="Состояние системы" description="Телеметрия выбранной машины в реальном времени: процессор, память, сеть, температура и аптайм.">
        <Select value={machine.id} onValueChange={setId} ariaLabel="Выбор машины" className="w-60">
          {fleet.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} · {m.role}</SelectItem>)}
        </Select>
      </PageHeader>

      <div className="grid grid-cols-1 min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <KpiStrip>
          <Stat label="Процессор" value={fmtNumber(sample?.cpu ?? 0, { digits: 0 })} unit="%" spark={<Sparkline data={history.map((h) => h.cpu)} />}
            delta={fmtDelta(sample?.cpu ?? 0, prev?.cpu ?? sample?.cpu ?? 0, { kind: 'pp', goodWhen: 'down', period: 'за 12 с' })} />
          <Stat label="Память" value={fmtNumber(sample?.ram ?? 0, { digits: 0 })} unit="%" spark={<Sparkline data={history.map((h) => h.ram)} />}
            note={`${fmtNumber(Math.round((machine.ramGb * (sample?.ram ?? 0)) / 100))} / ${machine.ramGb} ГБ`} />
          <Stat label="Сеть" value={fmtNumber(sample?.net ?? 0, { digits: 0 })} unit="Мбит/с" spark={<Sparkline data={history.map((h) => h.net)} />} />
          <Stat label="Температура" value={fmtNumber(sample?.temp ?? 0, { digits: 0 })} unit="°C" spark={<Sparkline data={history.map((h) => h.temp)} />}
            delta={fmtDelta(sample?.temp ?? 0, prev?.temp ?? sample?.temp ?? 0, { kind: 'abs', unit: '°C', goodWhen: 'down', period: 'за 12 с' })} />
        </KpiStrip>
        <Panel flush className="p-4">
          <div className="mb-2 text-sm font-semibold text-fg">{machine.name}</div>
          <InfoRow k="Статус" v={<StatusDot status={machine.status} />} />
          <InfoRow k="Роль" v={machine.role} />
          <InfoRow k="ОС" v={machine.os} />
          <InfoRow k="Процессор" v={`${machine.cpuModel} · ${machine.cores} ядер`} />
          <InfoRow k="Адрес" v={<span className="font-mono text-xs">{machine.ip}</span>} />
          <InfoRow k="Аптайм" v={fmtUptime((Date.now() - machine.bootAt) / 1000)} />
          <InfoRow k="Агент" v={`v${machine.agent}`} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartFrame title={`Загрузка ${sample?.cpu ?? 0} % CPU и ${sample?.ram ?? 0} % ОЗУ`}
          subtitle="Процессор, память и температура этой машины за последние ~80 с"
          source="Источник: агент на машине (демо-данные), интервал 2 с"
          table={<VizTable head={['Время', 'CPU, %', 'ОЗУ, %', '°C']} rows={chartData.slice(-12).map((d) => [d.label, d.cpu, d.ram, d.temp])} />}>
          <TimeLine data={chartData} unit=" %" max={100} series={[{ key: 'cpu', label: 'CPU, %', focus: true }, { key: 'ram', label: 'ОЗУ, %' }, { key: 'temp', label: 'Температура, °C' }]} />
        </ChartFrame>
        <ChartFrame title="Сетевой трафик" subtitle="Суммарный трафик, Мбит/с" source="Источник: агент на машине (демо-данные)"
          table={<VizTable head={['Время', 'Мбит/с']} rows={netData.slice(-12).map((d) => [d.label, d.net])} />}>
          <TimeLine data={netData} series={[{ key: 'net', label: 'Трафик, Мбит/с', focus: true }]} />
        </ChartFrame>
      </div>

      <Panel flush>
        <SectionHeader className="border-b border-line p-4" title="Накопители"
          actions={<span className="text-sm text-muted">Занято <b className="font-semibold text-fg tnum">{fmtBytes(diskUsed)}</b> из {fmtBytes(diskTotal)}</span>} />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {vols.map((v) => (
            <div key={v.id} className="flex flex-col gap-1.5 rounded-[var(--radius-pk)] border border-line p-3">
              <div className="flex items-center justify-between text-sm"><span className="font-medium text-fg">{v.mount} · {v.label}</span><span className="text-xs text-muted">{v.type}</span></div>
              <UsageBar value={(v.usedGb / v.sizeGb) * 100} />
              <div className="text-xs text-muted tnum">{fmtBytes(v.usedGb)} из {fmtBytes(v.sizeGb)}</div>
            </div>
          ))}
        </div>
      </Panel>
    </>
    </Workbench>
  )
}
