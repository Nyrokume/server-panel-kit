import {
  LayoutDashboardIcon, ActivityIcon, TerminalIcon, MonitorPlayIcon, ListTreeIcon,
  HardDriveIcon, ServerIcon, BellIcon, UsersIcon, SettingsIcon, ComponentIcon, WorkflowIcon, type LucideIcon,
} from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon; group: string; hint?: string }

export const nav: NavItem[] = [
  { to: '/', label: 'Обзор', icon: LayoutDashboardIcon, group: 'Мониторинг', hint: 'KPI по всему парку' },
  { to: '/system', label: 'Состояние системы', icon: ActivityIcon, group: 'Мониторинг', hint: 'CPU, ОЗУ, сеть, температура' },
  { to: '/machines', label: 'Машины', icon: ServerIcon, group: 'Мониторинг', hint: 'Серверы и станции · администрирование' },
  { to: '/alerts', label: 'Оповещения', icon: BellIcon, group: 'Мониторинг', hint: 'Аварии и предупреждения' },
  { to: '/powershell', label: 'PowerShell', icon: TerminalIcon, group: 'Управление', hint: 'Веб-терминал (демо)' },
  { to: '/screen', label: 'Просмотр экрана', icon: MonitorPlayIcon, group: 'Управление', hint: 'Экраны машин (демо)' },
  { to: '/processes', label: 'Процессы', icon: ListTreeIcon, group: 'Управление', hint: 'Все процессы на ПК' },
  { to: '/disks', label: 'Диски', icon: HardDriveIcon, group: 'Управление', hint: 'Тома, S.M.A.R.T., ввод-вывод' },
  { to: '/users', label: 'Пользователи и роли', icon: UsersIcon, group: 'Организация' },
  { to: '/settings', label: 'Настройки', icon: SettingsIcon, group: 'Организация' },
  { to: '/architecture', label: 'Схема взаимодействия', icon: WorkflowIcon, group: 'Организация', hint: 'Архитектура и потоки команд' },
  { to: '/kit', label: 'Panel kit', icon: ComponentIcon, group: 'Организация', hint: 'Дизайн-система проекта' },
]

export const navGroups = ['Мониторинг', 'Управление', 'Организация']

/** Machine-detail administration tabs (?tab=…). */
export const adminTabs: [string, string][] = [
  ['overview', 'Обзор'], ['services', 'Службы'], ['software', 'ПО и обновления'], ['sessions', 'Сеансы'], ['tasks', 'Планировщик'],
  ['events', 'Журнал событий'], ['network', 'Сеть'], ['power', 'Питание'], ['files', 'Файлы'],
]

