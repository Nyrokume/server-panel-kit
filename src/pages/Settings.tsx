import { useState } from 'react'
import {
  PageHeader, Panel, Section, DocPage, CardGrid, Card, Callout,
  Field, Input, Select, SelectItem, Switch, Button, toast, Divider, InfoRow,
} from '@/kit'
import { useTheme } from '@/lib/theme'
import { useLive } from '@/lib/live'
import { tenants } from '@/lib/mock'
import { useAppState } from '@/lib/app-state'
import { Sun, Moon, Shield, FileText } from 'lucide-react'

function ToggleRow({ title, hint, checked, defaultChecked, onCheckedChange }: {
  title: string; hint: string; checked?: boolean; defaultChecked?: boolean; onCheckedChange?: (v: boolean) => void
}) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 py-3">
      <div className="min-w-0"><div className="text-sm font-medium text-fg">{title}</div><div className="mt-0.5 text-[13px] text-muted">{hint}</div></div>
      <Switch checked={checked} defaultChecked={defaultChecked} onCheckedChange={onCheckedChange} ariaLabel={title} />
    </div>
  )
}

const toc = [
  { id: 'org', label: 'Организация' },
  { id: 'monitoring', label: 'Мониторинг' },
  { id: 'security', label: 'Безопасность' },
  { id: 'appearance', label: 'Внешний вид' },
]

export default function Settings() {
  const { theme, toggle } = useTheme()
  const { paused, setPaused } = useLive()
  const { tenant, setTenant } = useAppState()
  const active = tenants.find((t) => t.id === tenant) ?? tenants[0]
  const [interval, setIntervalV] = useState(2)

  return (
    <DocPage toc={toc} header={<PageHeader title="Настройки" description="Параметры организации, опроса агентов, доступа и оформления. Изменения в демонстрации не отправляются на сервер." />}>
      <Section id="org" title="Организация" description="Профиль арендатора и контакт для уведомлений.">
        <Panel flush>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <Field label="Название" htmlFor="org-name"><Input key={active.id} id="org-name" defaultValue={active.name} /></Field>
            <Field label="Активная организация" htmlFor="org-tenant">
              <Select value={tenant === 'all' ? 'all' : active.id} onValueChange={setTenant} ariaLabel="Организация">
                {tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                <SelectItem value="all">Все организации</SelectItem>
              </Select>
            </Field>
            <Field label="Контакт для оповещений" htmlFor="org-contact"><Input id="org-contact" type="email" defaultValue="noc@kedr.ru" /></Field>
            <div className="flex flex-col justify-center"><InfoRow k="Город" v={active.city} /><InfoRow k="Тариф" v={active.plan} /></div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-b-[var(--radius-pk-lg)] border-t border-line bg-surface/40 px-4 py-3 sm:px-5">
            <p className="text-xs text-muted">В демонстрации — только в текущей сессии.</p>
            <Button variant="solid" onClick={() => toast.success('Профиль сохранён', 'Демо: на сервер не отправлено.')}>Сохранить</Button>
          </div>
        </Panel>
      </Section>

      <Section id="monitoring" title="Мониторинг" description="Как часто опрашивать агенты и когда сообщать о проблеме.">
        <Panel flush>
          <div className="px-4 sm:px-5">
            <ToggleRow title="Живое обновление" hint="Опрашивать агенты и обновлять графики в реальном времени." checked={!paused} onCheckedChange={(v) => setPaused(!v)} />
            <Divider />
            <div className="py-4">
              <div className="flex items-center justify-between text-sm"><label htmlFor="poll-interval" className="font-medium text-fg">Интервал опроса</label><span className="tnum text-muted">{interval} с</span></div>
              <input id="poll-interval" type="range" min={1} max={10} step={1} value={interval} onChange={(e) => setIntervalV(Number(e.target.value))} className="mt-3 h-5 w-full accent-[var(--pk-primary)] pointer-coarse:h-11" />
              <div className="mt-1 text-xs text-muted">Для демо фактический интервал зафиксирован на 2 секундах.</div>
            </div>
            <Divider />
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <Field label="Порог CPU, %" htmlFor="cpu-th" hint="Выше этого значения — предупреждение."><Input id="cpu-th" type="number" min={1} max={100} defaultValue={85} /></Field>
              <Field label="Порог ОЗУ, %" htmlFor="ram-th" hint="Оценивается по последнему опросу."><Input id="ram-th" type="number" min={1} max={100} defaultValue={90} /></Field>
            </div>
          </div>
          <div className="flex justify-end rounded-b-[var(--radius-pk-lg)] border-t border-line bg-surface/40 px-4 py-3 sm:px-5"><Button variant="solid" onClick={() => toast.success('Параметры мониторинга применены', 'Демо: фактические пороги не изменились.')}>Применить</Button></div>
        </Panel>
      </Section>

      <Section id="security" title="Безопасность" description="Доступ, двухфакторная аутентификация и журнал действий.">
        <CardGrid cols={2}>
          <Card icon={Shield} title="Доступ к машинам" description="SSO и роли проверяются на шлюзе перед отправкой каждой команды." />
          <Card icon={FileText} title="Аудит действий" description="Команды, просмотры экрана и опасные операции попадают в журнал." />
        </CardGrid>
        <Panel flush>
          <div className="divide-y divide-line px-4 sm:px-5">
            <ToggleRow title="Обязательная MFA" hint="Требовать второй фактор для администраторов." defaultChecked />
            <ToggleRow title="Подтверждение опасных действий" hint="Перезагрузка и выключение требуют ввода имени машины." defaultChecked />
            <ToggleRow title="Журнал аудита" hint="Записывать команды и просмотры экрана." defaultChecked />
          </div>
          <div className="flex justify-end rounded-b-[var(--radius-pk-lg)] border-t border-line bg-surface/40 px-4 py-3 sm:px-5"><Button variant="solid" onClick={() => toast.success('Политики безопасности сохранены', 'Демо: реальные политики не менялись.')}>Сохранить политики</Button></div>
        </Panel>
        <Callout tone="note">Это демонстрация интерфейса, не средство защиты информации. Соответствие требованиям безопасности здесь не заявляется.</Callout>
      </Section>

      <Section id="appearance" title="Внешний вид" description="Тема сохраняется в этом браузере. Primary остаётся тёмным в светлой теме и инвертируется в тёмной.">
        <CardGrid cols={2}>
          <Card as="button" icon={Sun} title="Светлая" description="Тёплая бумага, тёмный текст, тонкие рамки." aria-pressed={theme === 'light'} className={theme === 'light' ? '!border-fg/40' : ''} onClick={() => theme !== 'light' && toggle()}>
            <div aria-hidden className="mt-1 flex h-20 gap-2 overflow-hidden rounded-md border border-[#dfdfda] bg-[#fbfbf9] p-2.5"><div className="w-10 rounded bg-[#eaeae5]" /><div className="flex flex-1 flex-col gap-2"><div className="h-2 w-2/3 rounded bg-[#18181b]" /><div className="h-1.5 w-full rounded bg-[#e3e3de]" /><div className="h-6 rounded border border-[#e3e3de] bg-white" /></div></div>
          </Card>
          <Card as="button" icon={Moon} title="Тёмная" description="Почти чёрный фон, светлый primary, цветные данные." aria-pressed={theme === 'dark'} className={theme === 'dark' ? '!border-fg/40' : ''} onClick={() => theme !== 'dark' && toggle()}>
            <div aria-hidden className="mt-1 flex h-20 gap-2 overflow-hidden rounded-md border border-[#303034] bg-[#0c0c0e] p-2.5"><div className="w-10 rounded bg-[#202023]" /><div className="flex flex-1 flex-col gap-2"><div className="h-2 w-2/3 rounded bg-[#f4f4f5]" /><div className="h-1.5 w-full rounded bg-[#303034]" /><div className="h-6 rounded border border-[#303034] bg-[#111113]" /></div></div>
          </Card>
        </CardGrid>
      </Section>
    </DocPage>
  )
}
