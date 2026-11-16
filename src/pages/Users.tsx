import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/app/common'
import { ConfirmAction } from '@/components/app/confirm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { users as seed, roleScopes, tenants, type Role, type User } from '@/lib/mock'
import { ago, plural } from '@/lib/format'
import { ShieldCheckIcon, ShieldOffIcon, Trash2Icon } from 'lucide-react'

const roles: Role[] = ['Владелец', 'Администратор', 'Оператор', 'Наблюдатель']

export default function Users() {
  const [list, setList] = useState<User[]>(seed)

  const setRole = (id: string, role: Role) => {
    setList((l) => l.map((u) => (u.id === id ? { ...u, role } : u)))
    toast.success('Роль обновлена', { description: `Теперь: ${role}` })
  }
  const remove = (u: User) => { setList((l) => l.filter((x) => x.id !== u.id)); toast.warning(`Доступ пользователя ${u.name} отозван`) }

  return (
    <>
      <PageHeader title="Пользователи и роли" description="Кто имеет доступ к панели и что может делать. Роль определяет права на машины, PowerShell и управление." />

      <div className="grid gap-4 lg:grid-cols-4">
        {roles.map((r) => (
          <Card key={r}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{r}</CardTitle><CardDescription className="text-xs leading-snug">{roleScopes[r]}</CardDescription></CardHeader>
            <CardContent className="text-2xl font-medium tabular-nums">{list.filter((u) => u.role === r).length}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead className="hidden lg:table-cell">Организации</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead className="hidden sm:table-cell">Активность</TableHead>
                <TableHead className="w-52">Роль</TableHead>
                <TableHead className="text-right">Доступ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8"><AvatarFallback className="text-xs">{u.name.split(' ').map((p) => p[0]).join('')}</AvatarFallback></Avatar>
                      <div><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">{u.tenants.map((t) => <Badge key={t} variant="outline" className="font-normal">{tenants.find((x) => x.id === t)?.name ?? t}</Badge>)}</div>
                  </TableCell>
                  <TableCell>{u.mfa ? <Badge variant="secondary" className="gap-1 text-emerald-600 dark:text-emerald-400"><ShieldCheckIcon className="size-3" /> вкл</Badge> : <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400"><ShieldOffIcon className="size-3" /> выкл</Badge>}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{u.status === 'приглашён' ? <Badge variant="outline">приглашён</Badge> : ago(u.lastSeen)}</TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v) => setRole(u.id, v as Role)} disabled={u.role === 'Владелец'}>
                      <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <ConfirmAction
                      trigger={<Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" disabled={u.role === 'Владелец'} aria-label="Отозвать доступ"><Trash2Icon /></Button>}
                      title={`Отозвать доступ ${u.name}?`}
                      description={<>Пользователь потеряет доступ ко всем организациям и машинам. Это демо — реальные учётные записи не затрагиваются.</>}
                      confirmLabel="Отозвать доступ"
                      onConfirm={() => remove(u)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">{list.length} {plural(list.length, ['пользователь', 'пользователя', 'пользователей'])} с доступом.</p>
    </>
  )
}
