import { useState } from 'react'
import {
  PageHeader, Panel, SectionHeader, Tabs, TabsList, TabsTab, TabsPanel,
  Field, Input, Select, SelectItem, Switch, Button, toast, Divider,
} from '@/kit'
import { useTheme } from '@/lib/theme'
import { useLive } from '@/lib/live'
import { tenants } from '@/lib/mock'
import { Workbench } from '@/components/app/workbench'
import { InspectorShell, InspectorHead } from '@/components/app/inspector'

function ToggleRow({ title, hint, checked, defaultChecked, onCheckedChange }: {
  title: string; hint: string; checked?: boolean; defaultChecked?: boolean; onCheckedChange?: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0"><div className="text-sm font-medium text-fg">{title}</div><div className="text-xs text-muted">{hint}</div></div>
      <Switch checked={checked} defaultChecked={defaultChecked} onCheckedChange={onCheckedChange} ariaLabel={title} />
    </div>
  )
}

export default function Settings() {
  const { theme, toggle } = useTheme()
  const { paused, setPaused } = useLive()
  const [interval, setIntervalV] = useState(2)

  const inspector = (
    <InspectorShell>
      <InspectorHead title="Настройки" />
    </InspectorShell>
  )

  return (
    <Workbench inspector={inspector}>
    <>
      <PageHeader title="Настройки" description="В демо настройки хранятся только в этой вкладке браузера" />

      <Tabs defaultValue="org">
        <TabsList>
          <TabsTab value="org">Организация</TabsTab>
          <TabsTab value="monitoring">Мониторинг</TabsTab>
          <TabsTab value="security">Безопасность</TabsTab>
          <TabsTab value="appearance">Вид</TabsTab>
        </TabsList>

        <TabsPanel value="org">
          <Panel flush className="max-w-xl">
            <SectionHeader className="border-b border-line p-4" title="Организация" description="Профиль арендатора и контактные данные." />
            <div className="flex flex-col gap-4 p-4">
              <Field label="Название" htmlFor="org-name"><Input id="org-name" defaultValue="Кедр Логистика" /></Field>
              <Field label="Активная организация" htmlFor="org-tenant">
                <Select value={tenants[0].id} onValueChange={() => {}} ariaLabel="Организация">
                  {tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} · {t.plan}</SelectItem>)}
                </Select>
              </Field>
              <Field label="Контакт для оповещений" htmlFor="org-contact"><Input id="org-contact" type="email" defaultValue="noc@kedr.ru" /></Field>
              <div><Button onClick={() => toast.success('Профиль сохранён', 'Демо: на сервер не отправлено.')}>Сохранить</Button></div>
            </div>
          </Panel>
        </TabsPanel>

        <TabsPanel value="monitoring">
          <Panel flush className="max-w-xl">
            <SectionHeader className="border-b border-line p-4" title="Мониторинг" description="Частота опроса агентов и пороги оповещений." />
            <div className="flex flex-col p-4">
              <ToggleRow title="Живое обновление" hint="Опрашивать агенты в реальном времени." checked={!paused} onCheckedChange={(v) => setPaused(!v)} />
              <Divider />
              <div className="py-3">
                <div className="flex items-center justify-between text-sm"><span className="font-medium text-fg">Интервал опроса</span><span className="tnum text-muted">{interval} с</span></div>
                <input type="range" min={1} max={10} step={1} value={interval} onChange={(e) => setIntervalV(Number(e.target.value))} className="mt-2 w-full accent-[var(--pk-accent)]" />
                <div className="text-xs text-muted">В демо всегда 2 с</div>
              </div>
              <Divider />
              <Field label="Порог CPU для предупреждения, %" htmlFor="cpu-th" className="py-3"><Input id="cpu-th" type="number" defaultValue={85} className="max-w-32" /></Field>
              <div className="pt-1"><Button onClick={() => toast.success('Параметры мониторинга сохранены')}>Сохранить</Button></div>
            </div>
          </Panel>
        </TabsPanel>

        <TabsPanel value="security">
          <Panel flush className="max-w-xl">
            <SectionHeader className="border-b border-line p-4" title="Безопасность" description="Доступ, двухфакторная аутентификация и аудит." />
            <div className="flex flex-col divide-y divide-line p-4 pt-0">
              <ToggleRow title="Обязательная 2ФА" hint="Требовать второй фактор для администраторов." defaultChecked />
              <ToggleRow title="Подтверждение опасных действий" hint="Перезагрузка и выключение требуют ввода имени машины." defaultChecked />
              <ToggleRow title="Журнал аудита" hint="Записывать все команды и просмотры экрана." defaultChecked />
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-line p-4">
              <Button onClick={() => toast.success('Политики безопасности сохранены')}>Сохранить</Button>
            </div>
          </Panel>
        </TabsPanel>

        <TabsPanel value="appearance">
          <Panel flush className="max-w-xl">
            <SectionHeader className="border-b border-line p-4" title="Вид" description="Тема оформления панели." />
            <div className="p-4"><ToggleRow title="Тёмная тема" hint={`Сейчас: ${theme === 'dark' ? 'тёмная' : 'светлая'}.`} checked={theme === 'dark'} onCheckedChange={toggle} /></div>
          </Panel>
        </TabsPanel>
      </Tabs>
    </>
    </Workbench>
  )
}
