import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import {
  Button, IconButton, Chip, StatusDot, Tooltip, Divider,
  Menu, MenuItem, MenuLabel, MenuSeparator, MenuRadioGroup, MenuRadioItem,
  Sheet, SheetContent, SheetTrigger, SheetClose,
} from '@/kit'
import { CommandPalette, CommandButton } from './command-palette'
import { nav, navGroups } from '@/lib/nav'
import { tenants, alerts, machineById } from '@/lib/mock'
import { useAppState } from '@/lib/app-state'
import { useTheme } from '@/lib/theme'
import { useLive } from '@/lib/live'
import { useAb } from '@/lib/ab'
import { Building2, ChevronsUpDown, Moon, Sun, Bell, Pause, Play, Menu as MenuIcon, ShieldCheck, LayoutGrid } from 'lucide-react'

function TenantSwitcher({ compact }: { compact?: boolean }) {
  const { tenant, setTenant } = useAppState()
  const current = tenants.find((t) => t.id === tenant)
  return (
    <Menu align="start" className="min-w-60" trigger={
      <button className="flex w-full items-center gap-2.5 rounded-[var(--radius-pk)] px-2 py-1.5 text-left transition-colors hover:bg-surface">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-fg"><Building2 className="size-4" /></span>
        {!compact && <>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-fg">{current?.name ?? 'Все организации'}</span>
            <span className="truncate text-xs text-muted">{current ? `${current.plan} · ${current.city}` : 'Сводно'}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted" />
        </>}
      </button>
    }>
      <MenuLabel>Организация-арендатор</MenuLabel>
      <MenuRadioGroup value={tenant} onValueChange={setTenant}>
        {tenants.map((t) => (
          <MenuRadioItem key={t.id} value={t.id}>
            <span className="flex flex-col"><span>{t.name}</span><span className="text-xs text-muted">{t.plan} · {t.city}</span></span>
          </MenuRadioItem>
        ))}
        <MenuSeparator />
        <MenuRadioItem value="all">Все организации (сводно)</MenuRadioItem>
      </MenuRadioGroup>
    </Menu>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const { tenant } = useAppState()
  const openAlerts = alerts.filter((a) => !a.acked && (tenant === 'all' || machineById(a.machineId)?.tenantId === tenant))
  const crit = openAlerts.some((a) => a.level === 'crit')
  return (
    <nav className="flex flex-col gap-4">
      {navGroups.map((g) => (
        <div key={g} className="flex flex-col gap-0.5">
          <div className="px-2 pb-1 text-[11px] uppercase tracking-wide text-faint">{g}</div>
          {nav.filter((n) => n.group === g).map((n) => {
            const active = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)
            return (
              <Link key={n.to} to={n.to} onClick={onNavigate}
                className={`flex items-center gap-2.5 rounded-[var(--radius-pk)] px-2 py-2 text-sm transition-colors ${active ? 'bg-surface font-medium text-fg' : 'text-muted hover:bg-surface hover:text-fg'}`}>
                <n.icon className="size-4 shrink-0" />
                <span className="truncate">{n.label}</span>
                {n.to === '/alerts' && openAlerts.length > 0 && (
                  <Chip tone={crit ? 'bad' : 'warn'} className="ml-auto border-0 px-1.5 py-0">{openAlerts.length}</Chip>
                )}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

function LivePill() {
  const { paused, setPaused, tick } = useLive()
  return (
    <Tooltip content={paused ? 'Данные на паузе' : `Обновление раз в 2 с · кадр ${tick}`}>
      <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setPaused(!paused)}>
        {paused ? <Play /> : <Pause />}
        <span className="hidden items-center gap-1.5 sm:inline-flex">
          {!paused && <StatusDot status="online" withLabel={false} />}{paused ? 'Пауза' : 'Онлайн'}
        </span>
      </Button>
    </Tooltip>
  )
}

const bottomNav = ['/', '/machines', '/powershell', '/screen']

export function AppShell() {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()
  const { tenant } = useAppState()
  const { layout, cta } = useAb()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const openAlerts = alerts.filter((a) => !a.acked && (tenant === 'all' || machineById(a.machineId)?.tenantId === tenant))
  const crit = openAlerts.some((a) => a.level === 'crit')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setCmdOpen((v) => !v) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[244px_minmax(0,1fr)]">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-4 border-r border-line bg-bg px-3 py-3 lg:flex">
        <TenantSwitcher />
        <Divider />
        <div className="min-h-0 flex-1 overflow-y-auto pk-scroll"><NavLinks /></div>
        <div className="flex items-center gap-2 rounded-[var(--radius-pk)] border border-line bg-surface px-2.5 py-2 text-xs text-muted">
          <ShieldCheck className="size-4 shrink-0 text-ok" />
          <span>Демо-данные. Реальные машины не подключены.</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-bg/85 px-3 backdrop-blur sm:px-4">
          {/* mobile nav trigger */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <span className="lg:hidden"><IconButton label="Меню"><MenuIcon className="size-5" /></IconButton></span>
            </SheetTrigger>
            <SheetContent side="left" title="Навигация" className="gap-4 p-3">
              <div className="pt-1"><TenantSwitcher /></div>
              <Divider />
              <div onClick={() => setMoreOpen(false)}><NavLinks /></div>
              <SheetClose asChild><Button variant="ghost" className="mt-auto">Закрыть</Button></SheetClose>
            </SheetContent>
          </Sheet>
          <span className="hidden min-w-0 flex-1 sm:block lg:max-w-64"><CommandButton onClick={() => setCmdOpen(true)} /></span>
          <span className="flex-1 sm:hidden" />
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <span data-ab-layout={layout} data-ab-cta={cta} className="sr-only">ab</span>
            <IconButton label="Поиск" className="sm:hidden" onClick={() => setCmdOpen(true)}><LayoutGrid className="size-5" /></IconButton>
            <LivePill />
            <Tooltip content={`Открытых оповещений: ${openAlerts.length}`}>
              <IconButton label="Оповещения" asChild>
                <Link to="/alerts" className="relative">
                  <Bell className="size-5" />
                  {openAlerts.length > 0 && <span className={`absolute right-1.5 top-1.5 size-2 rounded-full ${crit ? 'bg-bad' : 'bg-warn'}`} />}
                </Link>
              </IconButton>
            </Tooltip>
            <IconButton label="Переключить тему" onClick={toggle}>{theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}</IconButton>
            <Menu align="end" trigger={
              <button className="flex h-9 items-center gap-2 rounded-[var(--radius-pk)] px-1.5 pr-2 transition-colors hover:bg-surface">
                <span className="flex size-7 items-center justify-center rounded-full bg-surface text-xs font-medium text-fg">АК</span>
                <span className="hidden text-left leading-tight sm:block"><span className="block text-sm font-medium text-fg">Анна Ковалёва</span><span className="block text-xs text-muted">Владелец</span></span>
              </button>
            }>
              <MenuLabel>a.kovaleva@kedr.ru</MenuLabel>
              <MenuSeparator />
              <MenuItem onSelect={() => {}}>Профиль</MenuItem>
              <MenuSeparator />
              <MenuItem danger onSelect={() => {}}>Выйти</MenuItem>
            </Menu>
          </div>
        </header>

        <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-24 sm:p-6 lg:pb-6">
          <Outlet />
        </main>

        {/* mobile bottom nav */}
        <nav data-float className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-line bg-bg/90 backdrop-blur lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {nav.filter((n) => bottomNav.includes(n.to)).map((n) => {
            const active = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)
            return (
              <Link key={n.to} to={n.to} className={`flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] ${active ? 'text-accent' : 'text-muted'}`}>
                <n.icon className="size-5" /><span className="truncate">{n.label.split(' ')[0]}</span>
              </Link>
            )
          })}
          <button onClick={() => setMoreOpen(true)} className="flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] text-muted">
            <MenuIcon className="size-5" /><span>Ещё</span>
          </button>
        </nav>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  )
}
