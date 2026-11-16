import { useMemo } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/app/common'
import { KpiCard, ChartFigure, BarsChart, DataTable } from '@/components/app/dataviz'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAb, clearAbEvents } from '@/lib/ab'
import { fmtNumber, fmtPercent, plural } from '@/lib/format'
import { FlaskConicalIcon, InfoIcon } from 'lucide-react'

/* Synthetic preregistered baseline so the readout page is full before many local events accrue;
 * this browser's real events are layered onto the matching arm. */
export default function Experiments() {
  const { layout, cta, events, force, forced, vid } = useAb()

  const stats = useMemo(() => {
    // Seeded synthetic arm data (preregistered MDE illustration) + this session's real clicks.
    const arms = [
      { key: 'control', label: 'Контроль (строка KPI → графики)', exposures: 1840, clicks: 190 },
      { key: 'split-board', label: 'Вариант (сплит-доска)', exposures: 1795, clicks: 228 },
    ]
    const realViews = events.filter((e) => e.name === 'experiment_viewed')
    const realClicks = events.filter((e) => e.name === 'overview_cta_click')
    // attribute this visitor's activity to the live arm
    arms.forEach((a) => {
      if (a.key === layout) {
        a.exposures += realViews.length
        a.clicks += realClicks.length
      }
    })
    return arms.map((a) => ({ ...a, cr: a.clicks / a.exposures }))
  }, [events, layout])

  const control = stats[0]
  const variant = stats[1]
  const lift = (variant.cr - control.cr) / control.cr
  const chartData = stats.map((a) => ({ label: a.key === 'control' ? 'Контроль' : 'Вариант', cr: Number((a.cr * 100).toFixed(2)) }))

  return (
    <>
      <PageHeader title="A/B-тест обзорной страницы" description="Эксперимент сравнивает две раскладки обзора и две формулировки главной кнопки. Назначение детерминированное и «липкое» по браузеру.">
        <Badge variant="outline" className="gap-1.5"><FlaskConicalIcon className="size-3.5" /> GrowthBook · локально</Badge>
      </PageHeader>

      <Alert>
        <InfoIcon />
        <AlertTitle>Как это устроено</AlertTitle>
        <AlertDescription>
          Флаги оцениваются SDK GrowthBook в браузере, без сети. Ваш вариант: раскладка «{layout === 'control' ? 'контроль' : 'сплит-доска'}», кнопка «{cta === 'control' ? 'Подробнее' : 'Открыть все машины'}». Идентификатор посетителя: <span className="font-mono">{vid}</span>.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Показов, контроль" value={fmtNumber(control.exposures)} note={`CR ${fmtPercent(control.cr, { digits: 2 })}`} />
        <KpiCard label="Показов, вариант" value={fmtNumber(variant.exposures)} note={`CR ${fmtPercent(variant.cr, { digits: 2 })}`} />
        <KpiCard label="Прирост конверсии" value={fmtPercent(lift, { digits: 1, signed: true })} note="к контролю" />
        <KpiCard label="Событий в сессии" value={`${events.length}`} note={`${plural(events.length, ['событие', 'события', 'событий'])}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartFigure
          title={`Вариант даёт конверсию ${fmtPercent(variant.cr, { digits: 2 })} против ${fmtPercent(control.cr, { digits: 2 })}`}
          subtitle="Конверсия в клик по главной кнопке обзора, две группы"
          source="Источник: локальный лог событий A/B (демо-данные)"
          table={<DataTable head={['Группа', 'CR, %']} rows={chartData.map((d) => [d.label, d.cr])} />}
        >
          <BarsChart data={chartData} dataKey="cr" label="Конверсия, %" color="var(--chart-1)" />
        </ChartFigure>

        <Card className="overflow-hidden py-0">
          <CardHeader className="px-5 pt-5"><CardTitle className="text-base">Результаты по группам</CardTitle><CardDescription>ITT, двусторонний тест, α = 0,05</CardDescription></CardHeader>
          <CardContent className="px-0 pt-3">
            <Table>
              <TableHeader>
                <TableRow><TableHead className="pl-5">Группа</TableHead><TableHead className="text-right">Показы</TableHead><TableHead className="text-right">Клики</TableHead><TableHead className="pr-5 text-right">CR</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((a) => (
                  <TableRow key={a.key}>
                    <TableCell className="pl-5"><div className="font-medium">{a.key === 'control' ? 'Контроль' : 'Вариант'}</div><div className="text-xs text-muted-foreground">{a.label}</div></TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNumber(a.exposures)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNumber(a.clicks)}</TableCell>
                    <TableCell className="pr-5 text-right tabular-nums font-medium">{fmtPercent(a.cr, { digits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-5 py-3 text-xs text-muted-foreground">Прирост {fmtPercent(lift, { digits: 1, signed: true })}. Для достоверного вывода нужен расчёт мощности и полный бизнес-цикл — это демонстрация чтения результатов.</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Переопределить вариант (QA)</CardTitle><CardDescription>Принудительно включите группу, чтобы проверить обе раскладки. Сохраняется для этого браузера.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-36 text-sm">Раскладка обзора</span>
            <ToggleGroup type="single" variant="outline" value={forced['overview_layout'] ?? ''} onValueChange={(v) => force('overview_layout', v || null)}>
              <ToggleGroupItem value="">Авто</ToggleGroupItem>
              <ToggleGroupItem value="control">Контроль</ToggleGroupItem>
              <ToggleGroupItem value="split-board">Сплит-доска</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-36 text-sm">Текст кнопки</span>
            <ToggleGroup type="single" variant="outline" value={forced['overview_cta'] ?? ''} onValueChange={(v) => force('overview_cta', v || null)}>
              <ToggleGroupItem value="">Авто</ToggleGroupItem>
              <ToggleGroupItem value="control">Подробнее</ToggleGroupItem>
              <ToggleGroupItem value="action">Открыть все машины</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button variant="outline" onClick={() => { clearAbEvents(); toast.success('Лог событий очищен'); location.reload() }}>Очистить лог событий</Button>
          <Button variant="ghost" onClick={() => { force('overview_layout', null); force('overview_cta', null); toast.success('Переопределения сброшены') }}>Сбросить переопределения</Button>
        </CardFooter>
      </Card>
    </>
  )
}
