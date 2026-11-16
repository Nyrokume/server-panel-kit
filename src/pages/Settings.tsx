import { toast } from 'sonner'
import { PageHeader } from '@/components/app/common'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldSet, FieldLegend } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/lib/theme'
import { useLive } from '@/lib/live'
import { tenants } from '@/lib/mock'
import { useState } from 'react'

export default function Settings() {
  const { theme, toggle } = useTheme()
  const { paused, setPaused } = useLive()
  const [interval, setInterval] = useState([2])

  return (
    <>
      <PageHeader title="Настройки" description="Параметры организации, безопасности и мониторинга. Демо: изменения не сохраняются на сервере." />

      <Tabs defaultValue="org" className="gap-4">
        <TabsList>
          <TabsTrigger value="org">Организация</TabsTrigger>
          <TabsTrigger value="monitoring">Мониторинг</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
          <TabsTrigger value="appearance">Вид</TabsTrigger>
        </TabsList>

        <TabsContent value="org">
          <Card>
            <CardHeader><CardTitle>Организация</CardTitle><CardDescription>Профиль арендатора и контактные данные.</CardDescription></CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="org-name">Название</FieldLabel>
                  <Input id="org-name" defaultValue="Кедр Логистика" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="org-tenant">Активная организация</FieldLabel>
                  <Select defaultValue={tenants[0].id}>
                    <SelectTrigger id="org-tenant"><SelectValue /></SelectTrigger>
                    <SelectContent>{tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} · {t.plan}</SelectItem>)}</SelectContent>
                  </Select>
                  <FieldDescription>Панель поддерживает несколько организаций с переключением в шапке.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="org-contact">Контакт для оповещений</FieldLabel>
                  <Input id="org-contact" type="email" defaultValue="noc@kedr.ru" />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter><Button onClick={() => toast.success('Профиль сохранён', { description: 'Демо: на сервер не отправлено.' })}>Сохранить</Button></CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader><CardTitle>Мониторинг</CardTitle><CardDescription>Частота опроса агентов и пороги оповещений.</CardDescription></CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation="horizontal">
                  <div className="flex flex-col gap-0.5"><FieldLabel>Живое обновление</FieldLabel><FieldDescription>Опрашивать агенты в реальном времени.</FieldDescription></div>
                  <Switch checked={!paused} onCheckedChange={(v) => setPaused(!v)} />
                </Field>
                <Field>
                  <FieldLabel>Интервал опроса: {interval[0]} с</FieldLabel>
                  <Slider value={interval} onValueChange={setInterval} min={1} max={10} step={1} className="max-w-sm" />
                  <FieldDescription>Для демо фактический интервал зафиксирован на 2 секундах.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="cpu-th">Порог CPU для предупреждения, %</FieldLabel>
                  <Input id="cpu-th" type="number" defaultValue={85} className="max-w-32" />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter><Button onClick={() => toast.success('Параметры мониторинга применены')}>Применить</Button></CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle>Безопасность</CardTitle><CardDescription>Доступ, двухфакторная аутентификация и аудит.</CardDescription></CardHeader>
            <CardContent>
              <FieldSet>
                <FieldLegend>Политики</FieldLegend>
                <FieldGroup>
                  <Field orientation="horizontal"><div className="flex flex-col gap-0.5"><FieldLabel>Обязательная MFA</FieldLabel><FieldDescription>Требовать второй фактор для администраторов.</FieldDescription></div><Switch defaultChecked /></Field>
                  <Field orientation="horizontal"><div className="flex flex-col gap-0.5"><FieldLabel>Подтверждение опасных действий</FieldLabel><FieldDescription>Перезагрузка и выключение требуют ввода имени машины.</FieldDescription></div><Switch defaultChecked /></Field>
                  <Field orientation="horizontal"><div className="flex flex-col gap-0.5"><FieldLabel>Журнал аудита</FieldLabel><FieldDescription>Записывать все команды и просмотры экрана.</FieldDescription></div><Switch defaultChecked /></Field>
                </FieldGroup>
              </FieldSet>
            </CardContent>
            <CardFooter className="gap-2"><Button onClick={() => toast.success('Политики безопасности сохранены')}>Сохранить</Button><Badge variant="outline">Соответствие 152-ФЗ</Badge></CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader><CardTitle>Вид</CardTitle><CardDescription>Тема оформления панели.</CardDescription></CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation="horizontal">
                  <div className="flex flex-col gap-0.5"><FieldLabel>Тёмная тема</FieldLabel><FieldDescription>Сейчас: {theme === 'dark' ? 'тёмная' : 'светлая'}.</FieldDescription></div>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggle} />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
