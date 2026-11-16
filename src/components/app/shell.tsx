import { Link, Outlet, useLocation } from 'react-router'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { nav, navGroups } from '@/lib/nav'
import { tenants, alerts, machineById } from '@/lib/mock'
import { useAppState } from '@/lib/app-state'
import { useTheme } from '@/lib/theme'
import { useLive } from '@/lib/live'
import { useAb } from '@/lib/ab'
import { CommandPalette } from './command-palette'
import { StatusDot } from './common'
import { ShieldCheckIcon, MoonIcon, SunIcon, ChevronsUpDownIcon, PlayIcon, PauseIcon, BellIcon, BuildingIcon } from 'lucide-react'

function TenantSwitcher() {
  const { tenant, setTenant } = useAppState()
  const current = tenants.find((t) => t.id === tenant)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BuildingIcon className="size-4" />
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate text-sm font-semibold">{current?.name ?? 'Все организации'}</span>
            <span className="truncate text-xs text-muted-foreground">{current ? `${current.plan} · ${current.city}` : 'Сводно по всем'}</span>
          </div>
          <ChevronsUpDownIcon className="ml-auto size-4 opacity-60" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-60" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Организация-арендатор</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={tenant} onValueChange={setTenant}>
          {tenants.map((t) => (
            <DropdownMenuRadioItem key={t.id} value={t.id}>
              <div className="flex flex-col">
                <span>{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.plan} · {t.city}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuRadioItem value="all">Все организации (сводно)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LivePill() {
  const { paused, setPaused, tick } = useLive()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setPaused(!paused)}>
          {paused ? <PlayIcon /> : <PauseIcon />}
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            {!paused && <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>}
            {paused ? 'Пауза' : 'Онлайн'}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{paused ? 'Данные на паузе' : `Обновление раз в 2 с · кадр ${tick}`}</TooltipContent>
    </Tooltip>
  )
}

export function AppShell() {
  const location = useLocation()
  const { theme, toggle } = useTheme()
  const { tenant } = useAppState()
  const { layout, cta } = useAb()
  const openAlerts = alerts.filter((a) => !a.acked && (tenant === 'all' || machineById(a.machineId)?.tenantId === tenant))
  const crit = openAlerts.filter((a) => a.level === 'crit').length

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem><TenantSwitcher /></SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {navGroups.map((g) => (
            <SidebarGroup key={g}>
              <SidebarGroupLabel>{g}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.filter((n) => n.group === g).map((n) => {
                    const active = n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
                    return (
                      <SidebarMenuItem key={n.to}>
                        <SidebarMenuButton asChild isActive={active} tooltip={n.label}>
                          <Link to={n.to}>
                            <n.icon />
                            <span>{n.label}</span>
                            {n.to === '/alerts' && openAlerts.length > 0 && (
                              <Badge variant={crit ? 'destructive' : 'secondary'} className="ml-auto h-5 min-w-5 justify-center px-1 tabular-nums">{openAlerts.length}</Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            <ShieldCheckIcon className="size-4 shrink-0 text-emerald-500" />
            <span>Демо-данные. Реальные машины не подключены.</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur sm:px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 !h-5" />
          <div className="min-w-0 flex-1 sm:flex-initial"><CommandPalette /></div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <span data-ab-layout={layout} data-ab-cta={cta} className="sr-only">ab</span>
            <LivePill />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" className="relative size-9">
                  <Link to="/alerts" aria-label={`Оповещения: ${openAlerts.length}`}>
                    <BellIcon />
                    {openAlerts.length > 0 && <span className={`absolute right-1.5 top-1.5 size-2 rounded-full ${crit ? 'bg-destructive' : 'bg-amber-500'}`} />}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Открытых оповещений: {openAlerts.length}</TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="icon" className="size-9" onClick={toggle} aria-label="Переключить тему">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-1.5 pr-2">
                  <Avatar className="size-7"><AvatarFallback className="text-xs">АК</AvatarFallback></Avatar>
                  <div className="hidden text-left leading-tight sm:block">
                    <div className="text-sm font-medium">Анна Ковалёва</div>
                    <div className="text-xs text-muted-foreground">Владелец</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-2"><StatusDot status="online" withLabel={false} /> a.kovaleva@kedr.ru</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/users">Пользователи и роли</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/settings">Настройки</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">Выйти</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 sm:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
