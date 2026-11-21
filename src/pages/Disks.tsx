import { useMemo, useState } from 'react'
import {
  PageHeader, KpiStrip, Stat, Select, SelectItem, Panel, SectionHeader, InfoRow,
  UsageBar, ChartFrame, IoArea, VizTable, Chip,
} from '@/kit'
import { SmartChip } from '@/components/app/status'
import { useAppState } from '@/lib/app-state'
import { fleetFor, useMachineLive } from '@/lib/live'
import { volumesFor } from '@/lib/mock'
import { fmtNumber, fmtBytes, plural } from '@/lib/format'

export default function Disks() {
  const { tenant } = useAppState()
  const fleet = fleetFor(tenant)
  const [id, setId] = useState(fleet[0]?.id)
  const machine = fleet.find((m) => m.id === id) ?? fleet[0]
  const { history } = useMachineLive(machine.id)
  const vols = useMemo(() => volumesFor(machine), [machine])

  const io = useMemo(() => history.map((h, i) => {
    const r = history[i] ?? h
    return { label: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(r.t),
      read: Math.round(40 + r.net * 1.6 + (i % 5) * 7), write: Math.round(20 + r.net * 0.9 + (i % 3) * 5) }
  }), [history])

  const total = vols.reduce((s, v) => s + v.sizeGb, 0)
  const used = vols.reduce((s, v) => s + v.usedGb, 0)
  const failing = vols.filter((v) => v.smart !== 'ok').length

  return (
    <>
      <PageHeader title="Диски" description="Тома, заполнение, здоровье SMART и ввод-вывод по выбранной машине.">
        <Select value={machine.id} onValueChange={setId} ariaLabel="Машина" className="w-56">
          {fleet.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
        </Select>
      </PageHeader>

      <KpiStrip>
        <Stat label="Томов" value={vols.length} note={plural(vols.length, ['накопитель', 'накопителя', 'накопителей'])} />
        <Stat label="Занято" value={fmtBytes(used)} note={`из ${fmtBytes(total)}`} />
        <Stat label="Заполнение" value={fmtNumber((used / total) * 100, { digits: 0 })} unit="%" />
        <Stat label="SMART" value={failing === 0 ? 'OK' : failing} note={failing === 0 ? 'все тома здоровы' : 'требуют внимания'} />
      </KpiStrip>

      <ChartFrame title="Дисковый ввод-вывод" subtitle="Чтение и запись, МБ/с, последние ~80 с" source="Источник: агент на машине (демо-данные)"
        table={<VizTable head={['Время', 'Чтение', 'Запись']} rows={io.slice(-12).map((d) => [d.label, d.read, d.write])} />}>
        <IoArea data={io} />
      </ChartFrame>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {vols.map((v) => (
          <Panel key={v.id} flush>
            <SectionHeader className="border-b border-line p-4" title={`${v.mount} · ${v.label}`}
              actions={<div className="flex items-center gap-2"><Chip tone="neutral">{v.type}</Chip><SmartChip smart={v.smart} /></div>} />
            <div className="p-4">
              <UsageBar value={(v.usedGb / v.sizeGb) * 100} />
              <div className="mt-1 text-xs text-muted tnum">{fmtBytes(v.usedGb)} из {fmtBytes(v.sizeGb)} · свободно {fmtBytes(v.sizeGb - v.usedGb)}</div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2">
                <InfoRow k="Модель" v={<span className="truncate" title={v.model}>{v.model}</span>} />
                <InfoRow k="Температура" v={`${v.tempC} °C`} />
                <InfoRow k="Чтение" v={`${fmtNumber(v.readMb)} МБ/с`} />
                <InfoRow k="Запись" v={`${fmtNumber(v.writeMb)} МБ/с`} />
                <InfoRow k="Наработка" v={`${fmtNumber(Math.round(v.powerOnH / 24))} сут`} />
                <InfoRow k="Переназначено" v={v.reallocated === 0 ? 'нет' : `${v.reallocated} секторов`} />
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </>
  )
}
