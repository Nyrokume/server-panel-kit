import { useMemo, useState } from 'react'
import { PageHeader, KpiStrip, Stat, Input, Segmented, Button, Chip, StatusDot, DataList, ConfirmDialog, toast, InfoRow, type Column } from '@/kit'
import { users as allUsers, roleScopes, tenants, type User, type Role } from '@/lib/mock'
import { ago, plural } from '@/lib/format'
import { Search, ShieldCheck, ShieldOff, UserPlus } from 'lucide-react'
import { Workbench } from '@/components/app/workbench'
import { InspectorShell, InspectorHead } from '@/components/app/inspector'

const roleTone: Record<Role, 'accent' | 'ok' | 'neutral'> = { 'Владелец': 'accent', 'Администратор': 'accent', 'Оператор': 'ok', 'Наблюдатель': 'neutral' }

export default function Users() {
  const [q, setQ] = useState('')
  const [roleF, setRoleF] = useState('all')
  const [disabled, setDisabled] = useState<Set<string>>(new Set())

  const rows = useMemo(() => allUsers.filter((u) =>
    (roleF === 'all' || u.role === roleF) && (!q || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q.toLowerCase()))
  ), [q, roleF])

  const active = allUsers.filter((u) => u.status === 'активен' && !disabled.has(u.id)).length
  const admins = allUsers.filter((u) => u.role === 'Владелец' || u.role === 'Администратор').length
  const noMfa = allUsers.filter((u) => !u.mfa).length

  const toggle = (u: User) => {
    setDisabled((s) => { const n = new Set(s); if (n.has(u.id)) n.delete(u.id); else n.add(u.id); return n })
    toast.success(disabled.has(u.id) ? `Доступ восстановлен: ${u.name}` : `Доступ отключён: ${u.name}`)
  }

  const columns: Column<User>[] = [
    { key: 'name', header: 'Пользователь', primary: true, cell: (u) => <div><div className="font-medium text-fg">{u.name}</div><div className="text-xs text-muted">{u.email}</div></div> },
    { key: 'role', header: 'Роль', meta: true, cell: (u) => <Chip tone={roleTone[u.role]}>{u.role}</Chip> },
    { key: 'tenants', header: 'Организации', hideBelow: 'lg', cell: (u) => <span className="text-muted">{u.tenants.map((t) => tenants.find((x) => x.id === t)?.name ?? t).join(', ')}</span> },
    { key: 'mfa', header: '2ФА', hideBelow: 'sm', cell: (u) => u.mfa ? <Chip tone="ok"><ShieldCheck className="size-3" /> вкл</Chip> : <Chip tone="warn"><ShieldOff className="size-3" /> нет</Chip> },
    { key: 'status', header: 'Статус', cell: (u) => disabled.has(u.id)
      ? <Chip tone="neutral">отключён</Chip>
      : <span className="flex items-center gap-2"><StatusDot status={u.status === 'активен' ? 'online' : u.status === 'приглашён' ? 'warning' : 'offline'} withLabel={false} /><span className="text-fg">{u.status}</span><span className="text-xs text-muted">· {ago(u.lastSeen)}</span></span> },
  ]

  const inspector = (
    <InspectorShell>
      <InspectorHead title="Пользователи" lead="В демо приглашения и роли не меняют внешние каталоги" />
      <div className="border-t border-line px-4 py-3.5">
        <div className="text-[13px] font-medium text-fg">Область ролей</div>
        <div className="mt-2">
          {(Object.keys(roleScopes) as Role[]).map((r) => <InfoRow key={r} k={<Chip tone={roleTone[r]}>{r}</Chip>} v={<span className="text-xs">{roleScopes[r]}</span>} />)}
        </div>
      </div>
    </InspectorShell>
  )

  return (
    <Workbench inspector={inspector}>
    <>
      <PageHeader title="Пользователи">
        <ConfirmDialog trigger={<Button variant="outline"><UserPlus className="size-4" /> Пригласить</Button>}
          title="Пригласить пользователя" confirmLabel="Отправить приглашение" danger={false}
          description="В демо-режиме приглашения не отправляются. В боевой версии здесь будет форма с e-mail и выбором роли."
          onConfirm={() => toast.success('Приглашение отправлено', 'Демо: письмо не отправляется.')} />
      </PageHeader>

      <KpiStrip>
        <Stat label="Пользователей" value={allUsers.length} />
        <Stat label="Активных" value={active} />
        <Stat label="Администраторов" value={admins} note="с полным доступом" />
        <Stat label="Без 2ФА" value={noMfa} note={noMfa ? 'рекомендуется включить' : 'все защищены'} />
      </KpiStrip>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя, e-mail, роль…" className="pl-8" />
        </div>
        <Segmented value={roleF} onValueChange={setRoleF} ariaLabel="Роль"
          options={[{ value: 'all', label: 'Все' }, { value: 'Администратор', label: 'Админы' }, { value: 'Оператор', label: 'Операторы' }, { value: 'Наблюдатель', label: 'Наблюдатели' }]} />
      </div>
      <DataList columns={columns} rows={rows} rowKey={(u) => u.id}
        rowActions={(u) => (
          <Button variant="ghost" size="sm" className="whitespace-nowrap" onClick={() => toggle(u)}>
            {disabled.has(u.id) ? 'Включить' : 'Отключить'}
          </Button>
        )}
        footer={`${rows.length} ${plural(rows.length, ['пользователь', 'пользователя', 'пользователей'])}.`} />
    </>
    </Workbench>
  )
}
