import {
  LayoutDashboardIcon, TerminalIcon, MonitorPlayIcon,
  ServerIcon, BellIcon, UsersIcon, SettingsIcon, WorkflowIcon, type LucideIcon,
} from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

export const nav: NavItem[] = [
  { to: '/', label: 'Обзор', icon: LayoutDashboardIcon },
  { to: '/alerts', label: 'Оповещения', icon: BellIcon },
  { to: '/machines', label: 'Машины', icon: ServerIcon },
  { to: '/powershell', label: 'Консоль', icon: TerminalIcon },
  { to: '/screen', label: 'Экраны', icon: MonitorPlayIcon },
  { to: '/users', label: 'Пользователи', icon: UsersIcon },
  { to: '/settings', label: 'Настройки', icon: SettingsIcon },
  { to: '/architecture', label: 'Схема пульта', icon: WorkflowIcon, end: true },
]

export const navMain = nav.filter((n) => !n.end)
export const navEnd = nav.filter((n) => n.end)

/** Machine-detail administration tabs (?tab=…). */
export const adminTabs: [string, string][] = [
  ['overview', 'Обзор'], ['services', 'Службы'], ['software', 'ПО и обновления'], ['sessions', 'Сеансы'], ['tasks', 'Планировщик'],
  ['events', 'Журнал событий'], ['network', 'Сеть'], ['power', 'Питание'], ['files', 'Файлы'],
  ['processes', 'Процессы'], ['disks', 'Диски'],
]
