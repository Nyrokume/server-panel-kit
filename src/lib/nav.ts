import {
  LayoutDashboardIcon, ActivityIcon, TerminalIcon, MonitorPlayIcon, ListTreeIcon,
  HardDriveIcon, ServerIcon, BellIcon, UsersIcon, SettingsIcon, FlaskConicalIcon, ComponentIcon, type LucideIcon,
} from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon; group: string; hint?: string }

export const nav: NavItem[] = [
  { to: '/', label: 'Обзор', icon: LayoutDashboardIcon, group: 'Мониторинг', hint: 'KPI по всему парку' },
  { to: '/system', label: 'Состояние системы', icon: ActivityIcon, group: 'Мониторинг', hint: 'CPU, ОЗУ, сеть, температура' },
  { to: '/machines', label: 'Машины', icon: ServerIcon, group: 'Мониторинг', hint: 'Серверы и рабочие станции' },
  { to: '/alerts', label: 'Оповещения', icon: BellIcon, group: 'Мониторинг', hint: 'Аварии и предупреждения' },
  { to: '/powershell', label: 'PowerShell', icon: TerminalIcon, group: 'Управление', hint: 'Веб-терминал (демо)' },
  { to: '/screen', label: 'Просмотр экрана', icon: MonitorPlayIcon, group: 'Управление', hint: 'Экраны машин (демо)' },
  { to: '/processes', label: 'Процессы', icon: ListTreeIcon, group: 'Управление', hint: 'Все процессы на ПК' },
  { to: '/disks', label: 'Диски', icon: HardDriveIcon, group: 'Управление', hint: 'Тома, S.M.A.R.T., ввод-вывод' },
  { to: '/users', label: 'Пользователи и роли', icon: UsersIcon, group: 'Организация' },
  { to: '/experiments', label: 'A/B-тест', icon: FlaskConicalIcon, group: 'Организация', hint: 'Результаты эксперимента' },
  { to: '/settings', label: 'Настройки', icon: SettingsIcon, group: 'Организация' },
  { to: '/kit', label: 'Panel kit', icon: ComponentIcon, group: 'Организация', hint: 'Дизайн-система проекта' },
]

export const navGroups = ['Мониторинг', 'Управление', 'Организация']
