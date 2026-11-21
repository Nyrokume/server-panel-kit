import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import {
  Button, IconButton, Tooltip, Divider,
  Menu, MenuItem, MenuLabel, MenuSeparator, MenuRadioGroup, MenuRadioItem,
  Sheet, SheetContent, SheetTrigger, SheetClose,
} from '@/kit'
import { CommandPalette } from './command-palette'
import { nav, navMain, navEnd } from '@/lib/nav'
import { alerts, machineById, tenants } from '@/lib/mock'
import { useAppState } from '@/lib/app-state'
import { useTheme } from '@/lib/theme'
import { useLive } from '@/lib/live'
import { useShortcutHint } from '@/hooks/use-media'
import { fmtHM, plural } from '@/lib/format'
import { Moon, Sun, Menu as MenuIcon, Search } from 'lucide-react'
import { cn } from '@/kit'

function useAlertsTooltip() {
  const { tenant } = useAppState()
  const crit = alerts.filter((a) => !a.acked && a.level === 'crit' && (tenant === 'all' || machineById(a.machineId)?.tenantId === tenant)).length
  if (!crit) return 'Оповещения'
  return `Оповещения: ${crit} ${plural(crit, ['критичное', 'критичных', 'критичных'])}`
}

function Rail({ onNavigate, compact }: { onNavigate?: () => void; compact?: boolean }) {
  const { pathname } = useLocation()
  const alertsTip = useAlertsTooltip()

  const item = (n: (typeof nav)[number]) => {
    const active = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)
    const tip = n.to === '/alerts' ? alertsTip : n.label
    return (
      <Tooltip key={n.to} content={tip} side="right">
        <Link
          to={n.to}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          aria-label={tip}
          title={tip}
          className={cn(
            'relative flex items-center rounded-[8px] text-sm transition-colors',
            compact ? 'size-10 justify-center lg:size-10' : 'min-h-11 gap-2.5 px-2 py-2',
            'max-lg:min-h-11',
            active ? 'bg-surface text-fg shadow-[inset_0_0_0_1px_var(--pk-line-strong)]' : 'text-muted hover:bg-surface hover:text-fg',
          )}
        >
          {active && compact && <span className="absolute top-2.5 bottom-2.5 left-0 w-0.5 rounded-full bg-accent" />}
          <n.icon className="size-[18px] shrink-0" />
          {!compact && <span className="truncate">{n.label}</span>}
        </Link>
      </Tooltip>
    )
  }

  return (
    <nav className={cn('flex', compact ? 'flex-col items-center gap-0.5' : 'flex-col gap-0.5')} aria-label="Разделы">
      {navMain.map(item)}
      {navEnd.length > 0 && (
        <div className={cn('flex', compact ? 'mt-1.5 w-full flex-col items-center gap-0.5 border-t border-line pt-1.5' : 'mt-3 flex-col gap-0.5 border-t border-line pt-3')}>
          {navEnd.map(item)}
        </div>
      )}
    </nav>
  )
}

function TenantMenu() {
  const { tenant, setTenant } = useAppState()
  const navigate = useNavigate()
  const current = tenants.find((t) => t.id === tenant)
  return (
    <Menu align="end" className="min-w-60" trigger={
      <button type="button" className="flex h-11 min-h-11 items-center gap-2 rounded-[var(--radius-pk)] px-1.5 pr-2 text-left transition-colors hover:bg-surface lg:h-9 lg:min-h-0">
        <span className="flex size-7 items-center justify-center rounded-full bg-surface text-[10px] font-medium text-fg">АК</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-medium text-fg">Анна Ковалёва</span>
          <span className="block text-xs text-muted">{current?.name ?? 'Все организации'}</span>
        </span>
      </button>
    }>
      <MenuLabel>a.kovaleva@kedr.ru · Владелец</MenuLabel>
      <MenuSeparator />
      <MenuLabel>Организация</MenuLabel>
      <MenuRadioGroup value={tenant} onValueChange={setTenant}>
        {tenants.map((t) => (
          <MenuRadioItem key={t.id} value={t.id}>
            <span className="flex flex-col"><span>{t.name}</span><span className="text-xs text-muted">{t.city}</span></span>
          </MenuRadioItem>
        ))}
        <MenuSeparator />
        <MenuRadioItem value="all">Все организации</MenuRadioItem>
      </MenuRadioGroup>
      <MenuSeparator />
      <MenuItem danger onSelect={() => navigate('/')}>Выйти</MenuItem>
    </Menu>
  )
}

const bottomNav = ['/', '/alerts', '/machines', '/powershell']

export function AppShell() {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()
  const { paused, pausedAt, setPaused } = useLive()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const isOverview = pathname === '/'
  const shortcut = useShortcutHint()
  const themeTip = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'
  const liveLabel = paused ? 'Возобновить обновление' : 'Приостановить обновление'
  const liveText = paused && pausedAt ? `Пауза с ${fmtHM(pausedAt)}` : 'Каждые 2\u00a0с'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setCmdOpen((v) => !v) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="grid h-dvh overflow-hidden grid-cols-1 grid-rows-[var(--pk-header)_minmax(0,1fr)] bg-bg lg:grid-cols-[var(--pk-rail-w)_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col items-center gap-1 border-r border-line bg-rail px-1.5 py-2.5 lg:row-span-2 lg:flex">
        <Link to="/" aria-label="Пульт" className="mb-2 flex size-7 items-center justify-center rounded-lg bg-accent text-[13px] font-bold text-accent-fg">П</Link>
        <div className="min-h-0 flex-1 overflow-y-auto pk-scroll"><Rail compact /></div>
      </aside>

      <header className="sticky top-0 z-30 flex h-[var(--pk-header)] min-w-0 items-center gap-2 border-b border-line bg-bg px-2 sm:px-4">
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <span className="lg:hidden">
              <IconButton label="Меню" className="touch-44 size-11"><MenuIcon className="size-5" /></IconButton>
            </span>
          </SheetTrigger>
          <SheetContent side="left" title="Пульт" className="gap-4 p-3">
            <div className="flex items-center gap-2 px-1">
              <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-[13px] font-bold text-accent-fg">П</span>
              <span className="font-semibold">Пульт</span>
            </div>
            <Divider />
            <div onClick={() => setMoreOpen(false)}><Rail /></div>
            <SheetClose asChild><Button variant="ghost" className="mt-auto min-h-11">Закрыть</Button></SheetClose>
          </SheetContent>
        </Sheet>

        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="hidden h-8 min-w-0 flex-1 items-center gap-2 rounded-lg bg-raised px-2.5 text-sm text-muted shadow-[inset_0_0_0_1px_var(--pk-line)] hover:text-fg sm:flex lg:max-w-[480px]"
        >
          <Search className="size-4 shrink-0" />
          <span className="truncate">Найти машину или раздел…</span>
          <kbd className="ml-auto font-mono text-[11px] text-faint">{shortcut}</kbd>
        </button>
        <IconButton label="Найти машину или раздел" className="touch-44 size-11 sm:hidden" onClick={() => setCmdOpen(true)}><Search className="size-5" /></IconButton>

        <button
          type="button"
          onClick={() => setPaused(!paused)}
          className="ml-auto flex h-11 min-h-11 items-center gap-2 text-sm text-muted hover:text-fg lg:h-auto lg:min-h-0"
          aria-pressed={paused}
          aria-label={liveLabel}
        >
          <i className={cn('size-1.5 rounded-full', paused ? 'bg-faint' : 'bg-ok')} />
          <span className="hidden sm:inline">{liveText}</span>
        </button>
        <IconButton label={themeTip} className="touch-44 size-11 lg:size-9" onClick={toggle}>
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </IconButton>
        <TenantMenu />
      </header>

      <main className={cn('flex min-h-0 min-w-0 flex-col', isOverview ? 'overflow-hidden' : 'overflow-auto max-lg:pb-[var(--pk-tabbar)]')}>
        <Outlet />
      </main>

      <nav data-float className="fixed inset-x-0 bottom-0 z-30 flex h-[var(--pk-tabbar)] items-stretch border-t border-line bg-bg/90 backdrop-blur lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {nav.filter((n) => bottomNav.includes(n.to)).map((n) => {
          const active = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)
          return (
            <Link key={n.to} to={n.to} className={cn('flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px]', active ? 'text-fg' : 'text-muted')}>
              <n.icon className="size-5" /><span className="truncate">{n.label}</span>
            </Link>
          )
        })}
        <button onClick={() => setMoreOpen(true)} className="flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] text-muted">
          <MenuIcon className="size-5" /><span>Ещё</span>
        </button>
      </nav>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  )
}
