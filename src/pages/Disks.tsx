import { useMemo, useState } from 'react'
import {
  PageHeader, KpiStrip, Stat, Select, SelectItem, Panel, SectionHeader, InfoRow,
  UsageBar, ChartFrame, IoArea, VizTable, Chip, DocPage, Section, Callout,
} from '@/kit'

const toc = [{ id: 'summary', label: 'Сводка' }, { id: 'io', label: 'Ввод-вывод' }, { id: 'volumes', label: 'Тома' }]
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
    <DocPage toc={toc} header={
      <PageHeader title="Диски" description="Тома выбранной машины: заполнение, здоровье по S.M.A.R.T. и дисковый ввод-вывод.">
        <Select value={machine.id} onValueChange={setId} ariaLabel="Машина" className="w-56 max-w-full">
          {fleet.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
        </Select>
      </PageHeader>
    }>
      {failing > 0 && <Callout tone="warn" title={`${failing} ${plural(failing, ['том требует', 'тома требуют', 'томов требуют'])} внимания`}>S.M.A.R.T. сообщает об износе или переназначенных секторах. Сделайте резервную копию и запланируйте замену накопителя.</Callout>}
      <Section id="summary" title="Сводка">
      <KpiStrip>
        <Stat label="Томов" value={vols.length} note={plural(vols.length, ['накопитель', 'накопителя', 'накопителей'])} />
        <Stat label="Занято" value={fmtBytes(used)} note={`из ${fmtBytes(total)}`} />
        <Stat label="Заполнение" value={fmtNumber((used / total) * 100, { digits: 0 })} unit="%" />
        <Stat label="S.M.A.R.T." value={failing === 0 ? 'Норма' : failing} note={failing === 0 ? 'все тома здоровы' : 'требуют внимания'} />
      </KpiStrip>
      </Section>

      <Section id="io" title="Ввод-вывод">
      <ChartFrame title="Дисковый ввод-вывод" subtitle="Чтение и запись, МБ/с, последние ~80 с" source="Источник: агент на машине (демо-данные)"
        table={<VizTable head={['Время', 'Чтение', 'Запись']} rows={io.slice(-12).map((d) => [d.label, d.read, d.write])} />}>
        <IoArea data={io} />
      </ChartFrame>
      </Section>

      <Section id="volumes" title="Тома" description={`${vols.length} ${plural(vols.length, ['том', 'тома', 'томов'])}, свободно ${fmtBytes(total - used)}.`}>
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        {vols.map((v) => (
          <Panel key={v.id} flush>
            <SectionHeader className="border-b border-line px-4 py-3" title={`${v.mount} ${v.label}`}
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
      </Section>
    </DocPage>
  )
}
