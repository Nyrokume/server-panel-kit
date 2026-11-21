import { useMemo } from 'react'
import {
  KpiStrip, Stat, Panel, SectionHeader,
  UsageBar, ChartFrame, IoArea, VizTable, Chip,
} from '@/kit'
import { SmartChip } from '@/components/app/status'
import { useMachineLive } from '@/lib/live'
import { volumesFor, type Machine } from '@/lib/mock'
import { fmtNumber, fmtBytes, plural } from '@/lib/format'

export function DisksPanel({ machine }: { machine: Machine }) {
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
    <div className="flex flex-col gap-5">
      <KpiStrip>
        <Stat label="Томов" value={vols.length} note={plural(vols.length, ['диск', 'диска', 'дисков'])} />
        <Stat label="Занято" value={fmtBytes(used)} note={`из ${fmtBytes(total)}`} />
        <Stat label="Заполнение" value={fmtNumber((used / total) * 100, { digits: 0 })} unit="%" />
        <Stat label="SMART" value={failing === 0 ? 'OK' : failing} note={failing === 0 ? 'все тома здоровы' : 'требуют внимания'} />
      </KpiStrip>

      <ChartFrame title="Ввод-вывод, МБ/с" subtitle="Последние 80 с" source="Источник: агент на машине, демо-данные"
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
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5">
                {[
                  ['Модель', v.model],
                  ['Температура', `${v.tempC} °C`],
                  ['Чтение', `${fmtNumber(v.readMb)} МБ/с`],
                  ['Запись', `${fmtNumber(v.writeMb)} МБ/с`],
                  ['Наработка', `${fmtNumber(Math.round(v.powerOnH / 24))} сут`],
                  ['Переназначено', v.reallocated === 0 ? 'нет' : `${v.reallocated} секторов`],
                ].map(([k, val]) => (
                  <div key={k} className="min-w-0">
                    <div className="text-xs text-muted">{k}</div>
                    <div className="truncate text-sm font-medium text-fg tnum" title={String(val)}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}
