import { useMemo } from 'react'
import {
  PageHeader, KpiStrip, Stat, ChartFrame, Bars, VizTable, NoticeBar, Chip, Button, Segmented,
  Panel, SectionHeader, Table, THead, TBody, TR, TH, TD, toast,
} from '@/kit'
import { useAb, clearAbEvents } from '@/lib/ab'
import { fmtNumber, fmtPercent, plural } from '@/lib/format'
import { FlaskConical, Info } from 'lucide-react'

export default function Experiments() {
  const { layout, cta, events, force, forced, vid } = useAb()

  const stats = useMemo(() => {
    const arms = [
      { key: 'control', label: 'Контроль (строка KPI → графики)', exposures: 1840, clicks: 190 },
      { key: 'split-board', label: 'Вариант (сплит-доска)', exposures: 1795, clicks: 228 },
    ]
    const realViews = events.filter((e) => e.name === 'experiment_viewed')
    const realClicks = events.filter((e) => e.name === 'overview_cta_click')
    arms.forEach((a) => { if (a.key === layout) { a.exposures += realViews.length; a.clicks += realClicks.length } })
    return arms.map((a) => ({ ...a, cr: a.clicks / a.exposures }))
  }, [events, layout])

  const control = stats[0]
  const variant = stats[1]
  const lift = (variant.cr - control.cr) / control.cr
  const chartData = stats.map((a) => ({ label: a.key === 'control' ? 'Контроль' : 'Вариант', cr: Number((a.cr * 100).toFixed(2)) }))

  return (
    <>
      <PageHeader title="A/B-тест обзорной страницы" description="Сравнение двух раскладок обзора и двух формулировок главной кнопки. Назначение детерминированное и «липкое» по браузеру.">
        <Chip tone="neutral"><FlaskConical className="size-3.5" /> GrowthBook · локально</Chip>
      </PageHeader>

      <NoticeBar icon={Info} title="Как это устроено">
        Флаги оцениваются SDK GrowthBook в браузере, без сети. Ваш вариант: раскладка «{layout === 'control' ? 'контроль' : 'сплит-доска'}», кнопка «{cta === 'control' ? 'Подробнее' : 'Открыть все машины'}». Идентификатор посетителя: <span className="font-mono text-fg">{vid}</span>.
      </NoticeBar>

      <KpiStrip>
        <Stat label="Показов, контроль" value={fmtNumber(control.exposures)} note={`CR ${fmtPercent(control.cr, { digits: 2 })}`} />
        <Stat label="Показов, вариант" value={fmtNumber(variant.exposures)} note={`CR ${fmtPercent(variant.cr, { digits: 2 })}`} />
        <Stat label="Прирост конверсии" value={fmtPercent(lift, { digits: 1, signed: true })} note="к контролю" />
        <Stat label="Событий в сессии" value={events.length} note={plural(events.length, ['событие', 'события', 'событий'])} />
      </KpiStrip>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartFrame title={`Вариант даёт конверсию ${fmtPercent(variant.cr, { digits: 2 })} против ${fmtPercent(control.cr, { digits: 2 })}`}
          subtitle="Конверсия в клик по главной кнопке обзора, две группы"
          source="Источник: локальный лог событий A/B (демо-данные)"
          table={<VizTable head={['Группа', 'CR, %']} rows={chartData.map((d) => [d.label, d.cr])} />}>
          <Bars data={chartData} dataKey="cr" label="Конверсия, %" />
        </ChartFrame>

        <Panel flush>
          <SectionHeader className="border-b border-line p-4" title="Результаты по группам" description="ITT, двусторонний тест, α = 0,05" />
          <div className="overflow-x-auto pk-scroll">
            <Table>
              <THead><tr className="border-b border-line"><TH className="pl-4">Группа</TH><TH align="right">Показы</TH><TH align="right">Клики</TH><TH align="right" className="pr-4">CR</TH></tr></THead>
              <TBody>
                {stats.map((a) => (
                  <TR key={a.key}>
                    <TD className="pl-4"><div className="font-medium text-fg">{a.key === 'control' ? 'Контроль' : 'Вариант'}</div><div className="text-xs text-muted">{a.label}</div></TD>
                    <TD align="right">{fmtNumber(a.exposures)}</TD>
                    <TD align="right">{fmtNumber(a.clicks)}</TD>
                    <TD align="right" className="pr-4 font-medium">{fmtPercent(a.cr, { digits: 2 })}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
          <div className="border-t border-line px-4 py-3 text-xs text-muted">Прирост {fmtPercent(lift, { digits: 1, signed: true })}. Для достоверного вывода нужен расчёт мощности и полный бизнес-цикл — это демонстрация чтения результатов.</div>
        </Panel>
      </div>

      <Panel flush>
        <SectionHeader className="border-b border-line p-4" title="Переопределить вариант (QA)" description="Принудительно включите группу, чтобы проверить обе раскладки. Сохраняется для этого браузера." />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-36 text-sm text-muted">Раскладка обзора</span>
            <Segmented value={forced['overview_layout'] ?? ''} onValueChange={(v) => force('overview_layout', v || null)} ariaLabel="Раскладка"
              options={[{ value: '', label: 'Авто' }, { value: 'control', label: 'Контроль' }, { value: 'split-board', label: 'Сплит-доска' }]} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-36 text-sm text-muted">Текст кнопки</span>
            <Segmented value={forced['overview_cta'] ?? ''} onValueChange={(v) => force('overview_cta', v || null)} ariaLabel="Текст кнопки"
              options={[{ value: '', label: 'Авто' }, { value: 'control', label: 'Подробнее' }, { value: 'action', label: 'Открыть все машины' }]} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line p-4">
          <Button variant="outline" onClick={() => { clearAbEvents(); toast.success('Лог событий очищен'); location.reload() }}>Очистить лог событий</Button>
          <Button variant="ghost" onClick={() => { force('overview_layout', null); force('overview_cta', null); toast.success('Переопределения сброшены') }}>Сбросить переопределения</Button>
        </div>
      </Panel>
    </>
  )
}
