import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  PageHeader, KpiStrip, Stat, Sparkline, ChartFrame, TimeLine, VizTable, Button,
  StatusDot, UsageBar, Panel, InfoRow, Select, SelectItem, DocPage, Section, Callout,
} from '@/kit'
import { useAppState } from '@/lib/app-state'
import { fleetFor, useMachineLive } from '@/lib/live'
import { fmtDelta, fmtNumber, fmtUptime, fmtBytes } from '@/lib/format'
import { volumesFor } from '@/lib/mock'
import { ArrowRight } from 'lucide-react'

const toc = [
  { id: 'now', label: 'Сейчас' },
  { id: 'passport', label: 'Паспорт машины' },
  { id: 'charts', label: 'Телеметрия' },
  { id: 'volumes', label: 'Накопители' },
]

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
  const hot = (sample?.temp ?? 0) >= 70

  return (
    <DocPage toc={toc} header={
      <PageHeader title="Состояние системы" description="Телеметрия одной машины в реальном времени: процессор, память, сеть, температура и накопители. Выберите машину справа.">
        <Select value={machine.id} onValueChange={setId} ariaLabel="Выбор машины" className="w-64 max-w-full">
          {fleet.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} · {m.role}</SelectItem>)}
        </Select>
      </PageHeader>
    }>
      {machine.status === 'offline'
        ? <Callout tone="note" title={`${machine.name} не в сети`}>Показаны последние полученные значения. Пробуждение по сети — на вкладке «Питание» карточки машины.</Callout>
        : hot ? <Callout tone="warn" title={`Температура ${fmtNumber(sample?.temp ?? 0)} °C`}>Выше рекомендуемых 70 °C. Проверьте охлаждение и самые нагруженные процессы.</Callout>
        : null}

      <Section id="now" title="Сейчас">
        <KpiStrip>
          <Stat label="Процессор" value={fmtNumber(sample?.cpu ?? 0, { digits: 0 })} unit="%" spark={<Sparkline data={history.map((h) => h.cpu)} />}
            delta={fmtDelta(sample?.cpu ?? 0, prev?.cpu ?? sample?.cpu ?? 0, { kind: 'pp', goodWhen: 'down', period: 'за 12 с' })} />
          <Stat label="Память" value={fmtNumber(sample?.ram ?? 0, { digits: 0 })} unit="%" spark={<Sparkline data={history.map((h) => h.ram)} />}
            note={`${fmtNumber(Math.round((machine.ramGb * (sample?.ram ?? 0)) / 100))} из ${machine.ramGb} ГБ`} />
          <Stat label="Сеть" value={fmtNumber(sample?.net ?? 0, { digits: 0 })} unit="Мбит/с" spark={<Sparkline data={history.map((h) => h.net)} />} />
          <Stat label="Температура" value={fmtNumber(sample?.temp ?? 0, { digits: 0 })} unit="°C" spark={<Sparkline data={history.map((h) => h.temp)} />}
            delta={fmtDelta(sample?.temp ?? 0, prev?.temp ?? sample?.temp ?? 0, { kind: 'abs', unit: '°C', goodWhen: 'down', period: 'за 12 с' })} />
        </KpiStrip>
      </Section>

      <Section id="passport" title="Паспорт машины" actions={<Button variant="link" size="sm" asChild><Link to={`/machines/${machine.id}`}>Карточка машины <ArrowRight className="size-3.5" /></Link></Button>}>
        <Panel className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <div>
            <InfoRow k="Статус" v={<StatusDot status={machine.status} />} />
            <InfoRow k="Роль" v={machine.role} />
            <InfoRow k="ОС" v={machine.os} />
            <InfoRow k="Размещение" v={machine.site} />
          </div>
          <div>
            <InfoRow k="Процессор" v={`${machine.cpuModel}, ${machine.cores} ядер`} />
            <InfoRow k="Адрес" v={<span className="font-mono text-xs">{machine.ip}</span>} />
            <InfoRow k="Аптайм" v={fmtUptime((Date.now() - machine.bootAt) / 1000)} />
            <InfoRow k="Агент" v={`v${machine.agent}`} />
          </div>
        </Panel>
      </Section>

      <Section id="charts" title="Телеметрия" description="Последние ~80 секунд, точка раз в 2 секунды. Кнопка «Таблица» показывает те же данные текстом.">
        <ChartFrame title={`Сейчас ${sample?.cpu ?? 0} % CPU и ${sample?.ram ?? 0} % ОЗУ`}
          subtitle="Процессор, память и температура"
          source="Источник: агент на машине, демо-данные"
          table={<VizTable head={['Время', 'CPU, %', 'ОЗУ, %', '°C']} rows={chartData.slice(-12).map((d) => [d.label, d.cpu, d.ram, d.temp])} />}>
          <TimeLine data={chartData} unit=" %" max={100} series={[{ key: 'cpu', label: 'CPU, %', focus: true }, { key: 'ram', label: 'ОЗУ, %' }, { key: 'temp', label: 'Температура, °C' }]} />
        </ChartFrame>
        <ChartFrame title="Сетевой трафик" subtitle="Суммарно входящий и исходящий, Мбит/с" source="Источник: агент на машине, демо-данные"
          table={<VizTable head={['Время', 'Мбит/с']} rows={netData.slice(-12).map((d) => [d.label, d.net])} />}>
          <TimeLine data={netData} series={[{ key: 'net', label: 'Трафик, Мбит/с', focus: true }]} />
        </ChartFrame>
      </Section>

      <Section id="volumes" title="Накопители" description={`Занято ${fmtBytes(diskUsed)} из ${fmtBytes(diskTotal)}.`}
        actions={<Button variant="link" size="sm" asChild><Link to="/disks">Подробнее о дисках</Link></Button>}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {vols.map((v) => (
            <Panel key={v.id} className="flex flex-col gap-2 !p-4">
              <div className="flex items-center justify-between gap-2 text-sm"><span className="truncate font-semibold text-fg">{v.mount} {v.label}</span><span className="shrink-0 text-xs text-muted">{v.type}</span></div>
              <UsageBar value={(v.usedGb / v.sizeGb) * 100} />
              <div className="text-xs text-muted tnum">{fmtBytes(v.usedGb)} из {fmtBytes(v.sizeGb)}</div>
            </Panel>
          ))}
        </div>
      </Section>
    </DocPage>
  )
}
