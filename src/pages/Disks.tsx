import { useMemo, useState } from 'react'
import { PageHeader, StatusDot, UsageBar, SmartBadge } from '@/components/app/common'
import { ChartFigure, IoAreaChart, BarsChart, DataTable, KpiCard } from '@/components/app/dataviz'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAppState } from '@/lib/app-state'
import { fleetFor, useMachineLive } from '@/lib/live'
import { volumesFor, type Volume } from '@/lib/mock'
import { fmtBytes, fmtNumber, plural } from '@/lib/format'

export default function Disks() {
  const { tenant } = useAppState()
  const fleet = fleetFor(tenant).filter((m) => m.status !== 'offline')
  const [id, setId] = useState(fleet.find((m) => m.kind === 'server')?.id ?? fleet[0]?.id)
  const machine = fleet.find((m) => m.id === id) ?? fleet[0]
  const { history } = useMachineLive(machine.id)
  const vols = useMemo(() => volumesFor(machine), [machine])

  const io = useMemo(() => history.map((h) => ({
    label: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(h.t),
    read: h.disk, write: Math.round(h.disk * 0.6),
  })), [history])

  const totalSize = vols.reduce((s, v) => s + v.sizeGb, 0)
  const totalUsed = vols.reduce((s, v) => s + v.usedGb, 0)
  const failing = vols.filter((v) => v.smart !== 'ok').length
  const usageData = vols.map((v) => ({ label: v.mount, used: Math.round((v.usedGb / v.sizeGb) * 100) }))

  return (
    <>
      <PageHeader title="Диски" description="Тома, заполнение, здоровье S.M.A.R.T. и ввод-вывод по выбранной машине.">
        <Select value={machine.id} onValueChange={setId}>
          <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
          <SelectContent>{fleet.map((m) => <SelectItem key={m.id} value={m.id}><span className="flex items-center gap-2"><StatusDot status={m.status} withLabel={false} />{m.name}</span></SelectItem>)}</SelectContent>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Томов" value={`${vols.length}`} note={`${plural(vols.length, ['накопитель', 'накопителя', 'накопителей'])}`} />
        <KpiCard label="Ёмкость" value={fmtBytes(totalSize)} note={`занято ${fmtBytes(totalUsed)}`} />
        <KpiCard label="Заполнение" value={fmtNumber((totalUsed / totalSize) * 100, { digits: 0 })} unit="%" />
        <KpiCard label="Проблемные" value={`${failing}`} note={failing ? 'требуют замены' : 'все исправны'} />
      </div>

      <Card className="overflow-hidden py-0">
        <CardHeader className="px-5 pt-5"><CardTitle className="text-base">Тома и S.M.A.R.T.</CardTitle></CardHeader>
        <CardContent className="px-0 pt-3">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Том</TableHead>
                  <TableHead className="hidden md:table-cell">Модель</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead className="w-44">Заполнение</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Чтение/Запись</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">°C</TableHead>
                  <TableHead className="pr-5">S.M.A.R.T.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vols.map((v) => <VolRow key={v.id} v={v} />)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartFigure
          title="Ввод-вывод накопителей"
          subtitle={`Чтение и запись ${machine.name}, МБ/с, последние ~80 секунд`}
          source="Источник: агент на машине (демо-данные), интервал 2 с"
          table={<DataTable head={['Время', 'Чтение', 'Запись']} rows={io.slice(-12).map((d) => [d.label, d.read, d.write])} />}
        >
          <IoAreaChart data={io} />
        </ChartFigure>
        <ChartFigure
          title="Заполнение томов"
          subtitle="Доля занятого места по каждому тому; красным — выше 90 %"
          source="Источник: агент на машине (демо-данные)"
          table={<DataTable head={['Том', 'Заполнение, %']} rows={usageData.map((d) => [d.label, d.used])} />}
        >
          <BarsChart data={usageData} dataKey="used" label="Заполнение, %" threshold={90} />
        </ChartFigure>
      </div>
    </>
  )
}

function VolRow({ v }: { v: Volume }) {
  return (
    <TableRow>
      <TableCell className="pl-5"><div className="font-medium">{v.mount}</div><div className="text-xs text-muted-foreground">{v.label} · {v.fs}</div></TableCell>
      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{v.model}</TableCell>
      <TableCell><Badge variant="outline">{v.type}</Badge></TableCell>
      <TableCell className="w-44"><UsageBar value={(v.usedGb / v.sizeGb) * 100} /><div className="mt-1 text-xs text-muted-foreground tabular-nums">{fmtBytes(v.usedGb)} из {fmtBytes(v.sizeGb)}</div></TableCell>
      <TableCell className="hidden text-right text-sm tabular-nums lg:table-cell">{v.readMb} / {v.writeMb} МБ/с</TableCell>
      <TableCell className="hidden text-right tabular-nums sm:table-cell">{v.tempC}</TableCell>
      <TableCell className="pr-5"><div className="flex flex-col items-start gap-0.5"><SmartBadge smart={v.smart} />{v.reallocated > 0 && <span className="text-xs text-muted-foreground">переназначено: {v.reallocated}</span>}</div></TableCell>
    </TableRow>
  )
}
