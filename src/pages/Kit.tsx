import { useState } from 'react'
import {
  PageHeader, Panel, SectionHeader, KpiStrip, Stat, Sparkline, InfoRow, NoticeBar, EmptyState,
  Button, IconButton, Input, Textarea, Field, Kbd, Chip, StatusDot, Divider, Spinner, UsageBar,
  Select, SelectItem, Switch, Tabs, TabsList, TabsTab, TabsPanel, Segmented,
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogBody, DialogTitleText, ConfirmDialog,
  Sheet, SheetTrigger, SheetContent, Tooltip, Menu, MenuItem, MenuSeparator,
  DataList, type Column, ChartFrame, TimeLine, Bars, VizTable, toast,
} from '@/kit'
import { Inbox, Camera, Plus, MoreHorizontal } from 'lucide-react'
import { Workbench } from '@/components/app/workbench'
import { InspectorShell, InspectorHead } from '@/components/app/inspector'

const swatches: [string, string][] = [
  ['bg', '--pk-bg'], ['surface', '--pk-surface'], ['raised', '--pk-raised'], ['line', '--pk-line'],
  ['fg', '--pk-fg'], ['muted', '--pk-muted'], ['accent', '--pk-accent'], ['ok', '--pk-ok'], ['warn', '--pk-warn'], ['bad', '--pk-bad'],
]
const demoLine = Array.from({ length: 24 }, (_, i) => ({ label: `${i}`, a: 40 + Math.round(30 * Math.sin(i / 3)), b: 25 + Math.round(18 * Math.cos(i / 4)) }))
const demoBars = [{ label: 'A', v: 42 }, { label: 'B', v: 88 }, { label: 'C', v: 61 }, { label: 'D', v: 95 }]

type Row = { id: string; name: string; role: string; cpu: number }
const rows: Row[] = [
  { id: '1', name: 'srv-core-01', role: 'Контроллер домена', cpu: 23 },
  { id: '2', name: 'srv-db-02', role: 'PostgreSQL', cpu: 71 },
  { id: '3', name: 'ws-eng-14', role: 'Рабочая станция', cpu: 12 },
]
const cols: Column<Row>[] = [
  { key: 'name', header: 'Машина', primary: true, cell: (r) => <span className="font-medium text-fg">{r.name}</span> },
  { key: 'role', header: 'Роль', meta: true, cell: (r) => <span className="text-muted">{r.role}</span> },
  { key: 'cpu', header: 'CPU', align: 'right', cell: (r) => <div className="w-28"><UsageBar value={r.cpu} /></div> },
]

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader as="h2" title={title} />
      <Panel flush className="p-4"><div className="flex flex-wrap items-start gap-3">{children}</div></Panel>
    </section>
  )
}

export default function Kit() {
  const [seg, setSeg] = useState('day')
  const [tab, setTab] = useState('a')
  const inspector = (
    <InspectorShell>
      <InspectorHead title="Panel kit" lead="Язык «Карта парка»: Onest и JetBrains Mono, фиолет только для выбора, фокуса и логотипа." />
    </InspectorShell>
  )

  return (
    <Workbench inspector={inspector}>
    <>
      <PageHeader title="Panel kit" description="Живой гайд по дизайн-системе проекта: токены, примитивы и блоки. Собственный набор поверх headless-примитивов, без дефолтной библиотеки.">
        <Chip tone="accent">v2 · минимализм</Chip>
      </PageHeader>

      <Block title="Токены цвета">
        {swatches.map(([name, v]) => (
          <div key={v} className="flex w-28 flex-col gap-1.5">
            <div className="h-12 rounded-[var(--radius-pk)] border border-line" style={{ background: `var(${v})` }} />
            <div className="text-xs text-fg">{name}</div>
            <div className="font-mono text-[10px] text-muted">{v}</div>
          </div>
        ))}
      </Block>

      <Block title="Типографика · табличные цифры">
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-semibold text-fg">Заголовок H1</div>
          <div className="text-base font-semibold text-fg">Заголовок H2</div>
          <div className="text-sm text-fg">Основной текст — Inter, 14px</div>
          <div className="text-sm text-muted">Вторичный текст — muted</div>
          <div className="tnum text-sm text-fg">1 234 567,89 · 00:12:48 · 42,0 %</div>
          <div className="font-mono text-sm text-fg">PS C:\Windows\system32&gt; Get-Process</div>
        </div>
      </Block>

      <Block title="Кнопки">
        <Button>Основная</Button>
        <Button variant="outline">Контур</Button>
        <Button variant="ghost">Призрак</Button>
        <Button variant="danger">Опасно</Button>
        <Button variant="link">Ссылка</Button>
        <Button size="sm">Маленькая</Button>
        <Button size="lg">Большая</Button>
        <IconButton label="Снимок"><Camera className="size-4" /></IconButton>
        <Button disabled>Выключена</Button>
      </Block>

      <Block title="Формы">
        <div className="w-full max-w-xs"><Field label="Поле ввода" htmlFor="k1" hint="Подсказка под полем"><Input id="k1" placeholder="Текст…" /></Field></div>
        <div className="w-full max-w-xs"><Field label="Многострочное" htmlFor="k2"><Textarea id="k2" placeholder="Комментарий…" /></Field></div>
        <div className="w-56"><Select value="a" onValueChange={() => {}} ariaLabel="demo"><SelectItem value="a">Вариант A</SelectItem><SelectItem value="b">Вариант B</SelectItem></Select></div>
        <div className="flex items-center gap-2"><Switch defaultChecked ariaLabel="Переключатель" /><span className="text-sm text-muted">Переключатель</span></div>
        <Segmented value={seg} onValueChange={setSeg} ariaLabel="Период" options={[{ value: 'day', label: 'День' }, { value: 'week', label: 'Неделя' }, { value: 'month', label: 'Месяц' }]} />
      </Block>

      <Block title="Индикаторы и чипы">
        <StatusDot status="online" /><StatusDot status="warning" /><StatusDot status="offline" />
        <Chip tone="neutral">нейтральный</Chip><Chip tone="accent">акцент</Chip><Chip tone="ok">ок</Chip><Chip tone="warn">внимание</Chip><Chip tone="bad">авария</Chip>
        <Kbd>⌘</Kbd><Kbd>K</Kbd>
        <Spinner />
        <div className="w-40"><UsageBar value={82} /></div>
      </Block>

      <Block title="Overlay: диалоги, лист, меню, тултип">
        <Dialog><DialogTrigger asChild><Button variant="outline">Диалог</Button></DialogTrigger>
          <DialogContent title="Пример диалога" description="Демонстрация">
            <DialogHeader><DialogTitleText>Пример диалога</DialogTitleText></DialogHeader>
            <DialogBody><p className="text-sm text-muted">Контент диалога на собственных примитивах поверх headless Radix.</p></DialogBody>
          </DialogContent>
        </Dialog>
        <ConfirmDialog trigger={<Button variant="danger">Опасное действие</Button>} title="Подтвердите действие"
          description="Это демо. Реальное действие не выполняется." confirmLabel="Подтвердить"
          onConfirm={() => toast.success('Подтверждено')} />
        <Sheet><SheetTrigger asChild><Button variant="outline">Боковая панель</Button></SheetTrigger>
          <SheetContent side="right" title="Лист" description="demo"><p className="text-sm text-muted">Выезжающая панель (Sheet).</p></SheetContent>
        </Sheet>
        <Menu trigger={<Button variant="outline"><MoreHorizontal className="size-4" /> Меню</Button>}>
          <MenuItem onSelect={() => toast.info('Первый')}>Первый пункт</MenuItem>
          <MenuItem onSelect={() => toast.info('Второй')}>Второй пункт</MenuItem>
          <MenuSeparator />
          <MenuItem onSelect={() => toast.success('Готово')}>С действием</MenuItem>
        </Menu>
        <Tooltip content="Подсказка"><Button variant="ghost">Наведи</Button></Tooltip>
        <Button variant="outline" onClick={() => toast.success('Сохранено', 'С описанием события.')}>Тост</Button>
      </Block>

      <Block title="Вкладки">
        <div className="w-full">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList><TabsTab value="a">Первая</TabsTab><TabsTab value="b">Вторая</TabsTab><TabsTab value="c">Третья</TabsTab></TabsList>
            <TabsPanel value="a"><p className="text-sm text-muted">Содержимое первой вкладки.</p></TabsPanel>
            <TabsPanel value="b"><p className="text-sm text-muted">Содержимое второй вкладки.</p></TabsPanel>
            <TabsPanel value="c"><p className="text-sm text-muted">Содержимое третьей вкладки.</p></TabsPanel>
          </Tabs>
        </div>
      </Block>

      <section className="flex flex-col gap-3">
        <SectionHeader as="h2" title="Блок KPI" />
        <KpiStrip>
          <Stat label="Машин онлайн" value={48} note="из 52" spark={<Sparkline data={[30, 35, 33, 40, 44, 48]} />} />
          <Stat label="Загрузка CPU" value="37" unit="%" delta={{ text: '4 п.п.', dir: 'down', tone: 'good', sr: 'снизилось' }} />
          <Stat label="Открытых аварий" value={3} note="нужна реакция" />
          <Stat label="Аптайм" value="99,95" unit="%" />
        </KpiStrip>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader as="h2" title="Блоки графиков (chart ↔ таблица)" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartFrame title="Линейный график" subtitle="Два ряда, метки на концах" source="Демо-данные"
            table={<VizTable head={['t', 'A', 'B']} rows={demoLine.slice(-8).map((d) => [d.label, d.a, d.b])} />}>
            <TimeLine data={demoLine} unit=" %" max={100} series={[{ key: 'a', label: 'Ряд A', focus: true }, { key: 'b', label: 'Ряд B' }]} />
          </ChartFrame>
          <ChartFrame title="Столбцы от нуля" subtitle="С порогом аварии" source="Демо-данные"
            table={<VizTable head={['Группа', 'Значение']} rows={demoBars.map((d) => [d.label, d.v])} />}>
            <Bars data={demoBars} dataKey="v" label="Значение" threshold={90} />
          </ChartFrame>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader as="h2" title="Блок таблицы (DataList → карточки на мобильном)" />
        <DataList columns={cols} rows={rows} rowKey={(r) => r.id} footer="На узких экранах строки превращаются в карточки." />
      </section>

      <Block title="Строки информации и уведомления">
        <div className="w-full max-w-md">
          <InfoRow k="Статус" v={<StatusDot status="online" />} />
          <InfoRow k="Адрес" v={<span className="font-mono text-xs">10.0.4.21</span>} />
          <InfoRow k="Аптайм" v="18 сут 4 ч" />
        </div>
        <div className="w-full max-w-md flex flex-col gap-2">
          <NoticeBar title="Нейтральное уведомление">Плоская панель-замена карточке-алерту.</NoticeBar>
          <NoticeBar tone="warn" title="Предупреждение">Демонстрационный режим.</NoticeBar>
        </div>
      </Block>

      <section className="flex flex-col gap-3">
        <SectionHeader as="h2" title="Пустое состояние" />
        <Panel flush><EmptyState icon={Inbox} title="Здесь пока пусто" description="Данные появятся, когда появятся события." action={<Button variant="outline"><Plus className="size-4" /> Добавить</Button>} /></Panel>
      </section>
      <Divider />
      <p className="text-xs text-muted">Полная документация — в <span className="font-mono text-fg">src/kit/README.md</span>.</p>
    </>
    </Workbench>
  )
}
