import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import {
  IconButton, Tooltip, Divider, Breadcrumbs, PrevNext,
  Menu, MenuItem, MenuLabel, MenuSeparator, MenuRadioGroup, MenuRadioItem,
  Sheet, SheetContent, SheetTrigger, SheetClose,
} from '@/kit'
import { CommandPalette, CommandButton } from './command-palette'
import { nav, navGroups } from '@/lib/nav'
import { tenants, alerts, machineById } from '@/lib/mock'
import { useAppState } from '@/lib/app-state'
import { useTheme } from '@/lib/theme'
import { useLive } from '@/lib/live'
import { Building2, ChevronsUpDown, Moon, Sun, Bell, Pause, Play, Menu as MenuIcon, Search, PanelTop, ArrowUpRight, X } from 'lucide-react'

function TenantSwitcher({ full }: { full?: boolean }) {
  const { tenant, setTenant } = useAppState()
  const current = tenants.find((t) => t.id === tenant)
  return (
    <Menu align={full ? 'start' : 'end'} className="min-w-64" trigger={
      <button aria-label="Организация" className={`flex min-h-9 items-center gap-2 rounded-[var(--radius-pk)] px-2 text-left text-sm transition-colors hover:bg-surface pointer-coarse:min-h-11 ${full ? 'w-full border border-line' : 'max-w-[230px]'}`}>
        <Building2 className="size-4 shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate font-medium text-fg">{current?.name ?? 'Все организации'}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-faint" />
      </button>
    }>
      <MenuLabel>Организация</MenuLabel>
      <MenuRadioGroup value={tenant} onValueChange={setTenant}>
        {tenants.map((t) => (
          <MenuRadioItem key={t.id} value={t.id}>
            <span className="flex flex-col"><span>{t.name}</span><span className="text-xs text-muted">{t.city}</span></span>
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
  return (
    <nav aria-label="Главное меню" className="flex flex-col gap-6">
      {navGroups.map((g) => (
        <div key={g} className="flex flex-col gap-0.5">
          <div className="px-3 pb-1.5 text-[13px] font-semibold text-fg">{g}</div>
          {nav.filter((n) => n.group === g).map((n) => {
            const active = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)
            return (
              <Link key={n.to} to={n.to} onClick={onNavigate} aria-current={active ? 'page' : undefined}
                className={`flex min-h-9 items-center gap-2.5 rounded-[var(--radius-pk-lg)] px-3 py-1.5 text-[13.5px] transition-colors pointer-coarse:min-h-11 ${active ? 'bg-fg/[0.07] font-medium text-fg' : 'text-muted hover:bg-surface hover:text-fg'}`}>
                <n.icon className="size-4 shrink-0" strokeWidth={1.6} />
                <span className="truncate">{n.label}</span>
                {n.to === '/alerts' && openAlerts.length > 0 && <span className="ml-auto text-xs text-muted tnum">{openAlerts.length}</span>}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

function LiveButton() {
  const { paused, setPaused } = useLive()
  const label = paused ? 'Продолжить обновление данных' : 'Приостановить обновление данных'
  return <Tooltip content={label}><IconButton label={label} onClick={() => setPaused(!paused)}>{paused ? <Play /> : <Pause />}</IconButton></Tooltip>
}

const groupHome: Record<string, string> = { 'Мониторинг': '/', 'Управление': '/powershell', 'Организация': '/users' }

export function AppShell() {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()
  const { tenant } = useAppState()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const current = nav.find((n) => n.to === pathname) ?? (pathname.startsWith('/machines/') ? nav.find((n) => n.to === '/machines') : nav[0])!
  const index = nav.findIndex((n) => n.to === current.to)
  const openAlerts = alerts.filter((a) => !a.acked && (tenant === 'all' || machineById(a.machineId)?.tenantId === tenant))
  const machine = pathname.startsWith('/machines/') ? machineById(pathname.split('/')[2]) : undefined

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setCmdOpen((v) => !v) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => { window.scrollTo(0, 0); setMenuOpen(false); document.title = `${machine?.name ?? current.label} — Пульт` }, [pathname, current.label, machine?.name])

  return (
    <div className="min-h-dvh">
      <a href="#main-content" onClick={(e) => { e.preventDefault(); document.getElementById('main-content')?.focus() }} className="sr-only rounded-md bg-primary px-4 py-2 text-sm text-primary-fg focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100]">К содержимому</a>
      {/* Два ряда: продукт и инструменты, затем разделы. */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1800px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-md" aria-label="Пульт — обзор парка">
            <span className="flex size-7 items-center justify-center rounded-[7px] bg-primary text-primary-fg"><PanelTop className="size-[18px]" strokeWidth={1.6} /></span>
            <span className="pk-display text-[23px] leading-[1.2] text-fg">Пульт</span>
            <span className="hidden self-end pb-[3px] pl-1 text-[13px] text-muted xl:block">Управление парком</span>
          </Link>
          <div className="mx-auto hidden w-full max-w-[360px] px-3 md:block"><CommandButton onClick={() => setCmdOpen(true)} /></div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <div className="hidden sm:block"><TenantSwitcher /></div>
            <span className="mx-1 hidden h-4 w-px bg-line md:block" />
            <div className="hidden md:block"><LiveButton /></div>
            <IconButton label="Поиск" className="md:hidden" onClick={() => setCmdOpen(true)}><Search className="size-[18px]" /></IconButton>
            <Tooltip content={openAlerts.length ? `Открытых оповещений: ${openAlerts.length}` : 'Оповещений нет'}>
              <IconButton label="Оповещения" asChild>
                <Link to="/alerts" className="relative"><Bell className="size-[18px]" />{openAlerts.length > 0 && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-warn" />}</Link>
              </IconButton>
            </Tooltip>
            <IconButton label="Переключить тему" onClick={toggle}>{theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}</IconButton>
            <Menu align="end" trigger={
              <button aria-label="Профиль" className="ml-1 flex size-9 items-center justify-center rounded-full border border-line bg-surface text-[11px] font-semibold text-fg transition-colors hover:border-line-strong pointer-coarse:size-11">АК</button>
            }>
              <MenuLabel>Анна Ковалёва · a.kovaleva@kedr.ru</MenuLabel>
              <MenuSeparator />
              <MenuItem onSelect={() => {}}>Профиль</MenuItem>
              <MenuSeparator />
              <MenuItem danger onSelect={() => {}}>Выйти</MenuItem>
            </Menu>
          </div>
        </div>
        <div className="mx-auto flex h-11 max-w-[1800px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button aria-label="Открыть меню" className="-ml-1 flex h-11 min-w-0 items-center gap-2 rounded-md px-1 text-sm lg:hidden">
                <MenuIcon className="size-4 shrink-0 text-muted" /><span className="truncate text-muted">{current.group}</span><span className="text-faint">›</span><span className="truncate font-medium text-fg">{machine?.name ?? current.label}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" title="Навигация" description="Разделы пульта" className="gap-5 p-4">
              <div className="flex items-center justify-between gap-3"><Link to="/" onClick={() => setMenuOpen(false)} className="pk-display text-2xl text-fg">Пульт</Link><SheetClose asChild><IconButton label="Закрыть меню"><X className="size-5" /></IconButton></SheetClose></div>
              <TenantSwitcher full /><Divider />
              <NavLinks onNavigate={() => setMenuOpen(false)} />
              <p className="mt-auto pt-2 text-xs text-muted">Все данные сгенерированы локально, реальные машины не подключены.</p>
            </SheetContent>
          </Sheet>
          <nav aria-label="Разделы" className="hidden h-full items-center gap-7 lg:flex">
            {navGroups.map((g) => <Link key={g} to={groupHome[g]} aria-current={current.group === g ? 'true' : undefined}
              className={`relative flex h-full items-center text-[13.5px] transition-colors ${current.group === g ? 'font-medium text-fg after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary' : 'text-muted hover:text-fg'}`}>{g}</Link>)}
          </nav>
          <Link to="/architecture" className="ml-auto hidden h-full items-center gap-1 text-[13px] text-muted transition-colors hover:text-fg lg:flex">Как устроена система<ArrowUpRight className="size-3.5" /></Link>
        </div>
      </header>

      <div className="mx-auto grid min-w-0 max-w-[1800px] grid-cols-1 lg:grid-cols-[248px_minmax(0,1fr)] 2xl:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="sticky top-[var(--pk-header-h)] hidden h-[calc(100dvh-var(--pk-header-h))] min-h-0 flex-col gap-4 py-7 pl-5 pr-3 lg:flex 2xl:pl-8">
          <div className="min-h-0 flex-1 overflow-y-auto pb-4 pk-scroll"><NavLinks /></div>
          <p className="border-t border-line px-3 pt-4 text-xs leading-relaxed text-muted">Все данные сгенерированы локально. Реальные машины не подключены.</p>
        </aside>

        <div className="min-w-0">
          <main id="main-content" tabIndex={-1} className="mx-auto flex min-w-0 max-w-[1400px] flex-col gap-3 px-4 pb-8 pt-5 outline-none sm:px-6 sm:pt-7 lg:px-8 xl:px-10">
            <Breadcrumbs as={Link} className="hidden lg:flex" items={[{ label: current.group, to: groupHome[current.group] }, { label: current.label, ...(machine ? { to: '/machines' } : {}) }, ...(machine ? [{ label: machine.name }] : [])]} />
            <div className="flex min-w-0 flex-col gap-6"><Outlet /></div>
            <div className="mt-8"><PrevNext as={Link} prev={index > 0 ? { to: nav[index - 1].to, label: nav[index - 1].label } : undefined} next={index < nav.length - 1 ? { to: nav[index + 1].to, label: nav[index + 1].label } : undefined} /></div>
          </main>
          <footer className="border-t border-line px-4 pt-6 text-[13px] text-muted sm:px-6 lg:px-8 xl:px-10" style={{ paddingBottom: 'max(clamp(24px,4vw,40px),env(safe-area-inset-bottom))' }}>
            <div className="mx-auto grid max-w-[1400px] gap-6 sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
              <div className="flex flex-col gap-1.5"><span className="pk-display text-xl leading-[1.25] text-fg">Пульт</span><span>Удалённое управление серверами и рабочими станциями.</span></div>
              {navGroups.map((g) => (
                <div key={g} className="flex flex-col gap-1.5">
                  <span className="font-semibold text-fg">{g}</span>
                  {nav.filter((n) => n.group === g).map((n) => <Link key={n.to} to={n.to} className="w-fit py-0.5 transition-colors hover:text-fg pointer-coarse:py-2">{n.label}</Link>)}
                </div>
              ))}
            </div>
          </footer>
        </div>
      </div>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  )
}
