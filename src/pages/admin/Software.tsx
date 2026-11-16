import { useMemo, useState } from 'react'
import { Input, Button, Chip, DataList, ConfirmDialog, Menu, MenuItem, MenuLabel, Panel, SectionHeader, NoticeBar, Spinner, toast, type Column } from '@/kit'
import { appsFor, updatesFor, type App, type Update } from '@/lib/admin-mock'
import type { Machine } from '@/lib/mock'
import { fmtNumber, ago, plural } from '@/lib/format'
import { Search, Download, Clock, Trash2, RefreshCw } from 'lucide-react'

type UState = 'pending' | 'installing' | 'installed' | 'deferred'
const kindChip: Record<Update['kind'], React.ReactNode> = {
  security: <Chip tone="bad">безопасность</Chip>, critical: <Chip tone="warn">критическое</Chip>, feature: <Chip tone="accent">компоненты</Chip>, driver: <Chip tone="neutral">драйвер</Chip>,
}

export function SoftwareTab({ machine }: { machine: Machine }) {
  const [upd, setUpd] = useState(() => updatesFor(machine).map((u) => ({ ...u, st: 'pending' as UState, until: 0 })))
  const [apps, setApps] = useState<App[]>(() => appsFor(machine))
  const [q, setQ] = useState('')
  const [checking, setChecking] = useState(false)
  const pending = upd.filter((u) => u.st === 'pending')
  const needReboot = upd.some((u) => u.st === 'installed' && u.reboot)

  const install = (kbs: string[]) => {
    setUpd((l) => l.map((u) => (kbs.includes(u.kb) ? { ...u, st: 'installing' } : u)))
    setTimeout(() => {
      setUpd((l) => l.map((u) => (kbs.includes(u.kb) ? { ...u, st: 'installed' } : u)))
      toast.success(`Установлено обновлений: ${kbs.length}`, 'Демо: на машину ничего не устанавливалось.')
    }, 2200)
  }
  const defer = (u: { kb: string }, days: number) => {
    setUpd((l) => l.map((x) => (x.kb === u.kb ? { ...x, st: 'deferred', until: Date.now() + days * 86400000 } : x)))
    toast.info(`${u.kb} отложено на ${days} ${plural(days, ['день', 'дня', 'дней'])}`)
  }
  const check = () => { setChecking(true); setTimeout(() => { setChecking(false); toast.info('Проверка завершена', 'Новых обновлений не найдено.') }, 1500) }

  const uCols: Column<(typeof upd)[number]>[] = [
    { key: 'title', header: 'Обновление', primary: true, cell: (u) => <div><div className="text-fg">{u.title}</div><div className="font-mono text-xs text-muted">{u.kb}</div></div> },
    { key: 'kind', header: 'Тип', cell: (u) => kindChip[u.kind] },
    { key: 'size', header: 'Размер', align: 'right', cell: (u) => `${fmtNumber(u.sizeMb)} МБ` },
    { key: 'st', header: 'Статус', cell: (u) => u.st === 'installing' ? <span className="inline-flex items-center gap-1.5 text-muted"><Spinner className="size-3.5" /> установка…</span>
      : u.st === 'installed' ? <Chip tone="ok">установлено</Chip>
      : u.st === 'deferred' ? <Chip tone="neutral">отложено до {new Date(u.until).toLocaleDateString('ru-RU')}</Chip>
      : <span className="text-muted">{u.reboot ? 'ждёт · нужна перезагрузка' : 'ждёт установки'}</span> },
  ]
  const list = useMemo(() => apps.filter((a) => !q || `${a.name} ${a.publisher}`.toLowerCase().includes(q.toLowerCase())), [apps, q])
  const aCols: Column<App>[] = [
    { key: 'name', header: 'Программа', primary: true, cell: (a) => <span className="font-medium text-fg">{a.name}</span> },
    { key: 'publisher', header: 'Издатель', meta: true, cell: (a) => <span className="text-muted">{a.publisher}</span> },
    { key: 'version', header: 'Версия', cell: (a) => <span className="font-mono text-xs">{a.version}</span> },
    { key: 'size', header: 'Размер', align: 'right', hideBelow: 'lg', cell: (a) => `${fmtNumber(a.sizeMb)} МБ` },
    { key: 'installed', header: 'Установлена', hideBelow: 'lg', cell: (a) => <span className="text-muted">{ago(a.installed)}</span> },
  ]

  return (
    <div className="flex flex-col gap-5">
      {needReboot && <NoticeBar tone="warn" title="Нужна перезагрузка">Часть установленных обновлений применится после перезагрузки. Запланируйте её на вкладке «Питание».</NoticeBar>}
      <section className="flex flex-col gap-3">
        <SectionHeader title="Центр обновления Windows" description={pending.length ? `${pending.length} ${plural(pending.length, ['обновление ждёт', 'обновления ждут', 'обновлений ждут'])} установки` : 'Все обновления установлены или отложены'}
          actions={<>
            <Button variant="outline" size="sm" onClick={check} disabled={checking}>{checking ? <Spinner className="size-4" /> : <RefreshCw className="size-4" />} Проверить</Button>
            <ConfirmDialog trigger={<Button variant="solid" size="sm" disabled={!pending.length}><Download className="size-4" /> Установить все</Button>}
              title={`Установить ${pending.length} ${plural(pending.length, ['обновление', 'обновления', 'обновлений'])}?`} danger={false} confirmLabel="Установить"
              description={`Установка займёт несколько минут${pending.some((u) => u.reboot) ? ', затем потребуется перезагрузка' : ''}. Пользователь получит уведомление. Демо: на машину ничего не устанавливается.`}
              onConfirm={() => install(pending.map((u) => u.kb))} />
          </>} />
        <DataList columns={uCols} rows={upd} rowKey={(u) => u.kb} empty="Ожидающих обновлений нет."
          rowActions={(u) => u.st === 'pending' ? (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="sm" onClick={() => install([u.kb])}><Download className="size-4" /> <span className="hidden xl:inline">Установить</span></Button>
              <Menu trigger={<Button variant="ghost" size="sm"><Clock className="size-4" /> <span className="hidden xl:inline">Отложить</span></Button>}>
                <MenuLabel>Отложить {u.kb}</MenuLabel>
                {[1, 7, 30].map((d) => <MenuItem key={d} onSelect={() => defer(u, d)}>на {d} {plural(d, ['день', 'дня', 'дней'])}</MenuItem>)}
              </Menu>
            </div>
          ) : null} />
      </section>

      <Panel flush>
        <SectionHeader className="border-b border-line p-4" title="Установленные программы" description={`${apps.length} ${plural(apps.length, ['программа', 'программы', 'программ'])}`}
          actions={<div className="relative w-full sm:w-64"><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск программы…" className="pl-8" /></div>} />
        <div className="p-0 [&>div]:rounded-none [&>div]:border-0">
          <DataList columns={aCols} rows={list} rowKey={(a) => a.name}
            rowActions={(a) => a.name.startsWith('Агент «Пульт»') ? <span className="text-xs text-faint">системная</span> : (
              <ConfirmDialog trigger={<Button variant="ghost" size="sm" className="text-bad"><Trash2 className="size-4" /> <span className="hidden xl:inline">Удалить</span></Button>}
                title={`Удалить ${a.name}?`} confirmLabel="Удалить"
                description="Программа будет удалена в фоне без участия пользователя. Демо: на машине ничего не удаляется."
                onConfirm={() => { setApps((l) => l.filter((x) => x.name !== a.name)); toast.warning(`${a.name} удалена`, 'Демо: на машине ничего не удалялось.') }} />
            )} />
        </div>
      </Panel>
    </div>
  )
}
