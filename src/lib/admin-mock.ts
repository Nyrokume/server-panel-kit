/* Mock PC-administration data, generated per machine. Nothing connects to real machines. */
import { rng, hash, type Machine } from './mock'

const pick = <T>(r: () => number, a: readonly T[]) => a[Math.floor(r() * a.length)]
const between = (r: () => number, lo: number, hi: number) => lo + r() * (hi - lo)
const now = Date.now()

export type SvcState = 'running' | 'stopped' | 'paused'
export type Startup = 'auto' | 'delayed' | 'manual' | 'disabled'
export type Service = { name: string; display: string; state: SvcState; startup: Startup; account: string; pid?: number }

const svcBase: [string, string, string][] = [
  ['wuauserv', 'Центр обновления Windows', 'LocalSystem'],
  ['Spooler', 'Диспетчер печати', 'LocalSystem'],
  ['WinRM', 'Служба удалённого управления Windows', 'NetworkService'],
  ['Dnscache', 'DNS-клиент', 'NetworkService'],
  ['W32Time', 'Служба времени Windows', 'LocalService'],
  ['BITS', 'Фоновая интеллектуальная служба передачи', 'LocalSystem'],
  ['EventLog', 'Журнал событий Windows', 'LocalService'],
  ['MpsSvc', 'Брандмауэр Защитника Windows', 'LocalService'],
  ['WinDefend', 'Антивирусная программа Защитника', 'LocalSystem'],
  ['TermService', 'Службы удалённых рабочих столов', 'NetworkService'],
  ['PultAgent', 'Агент «Пульт»', 'LocalSystem'],
  ['MSSQLSERVER', 'SQL Server (MSSQLSERVER)', 'NT Service\\MSSQLSERVER'],
  ['1C:Enterprise 8.3 Server Agent', 'Агент сервера 1С:Предприятия 8.3', 'USR1CV8'],
  ['VSS', 'Теневое копирование тома', 'LocalSystem'],
  ['SysMain', 'SysMain', 'LocalSystem'],
]
export function servicesFor(m: Machine): Service[] {
  const r = rng(hash(m.id + 'svc'))
  return svcBase
    .filter(([n]) => (m.kind === 'server' ? true : !['MSSQLSERVER', '1C:Enterprise 8.3 Server Agent'].includes(n)))
    .map(([name, display, account]) => {
      const x = r()
      const state: SvcState = name === 'PultAgent' || name === 'EventLog' ? 'running' : x < 0.72 ? 'running' : x < 0.95 ? 'stopped' : 'paused'
      const startup: Startup = state === 'running' ? pick(r, ['auto', 'auto', 'delayed'] as const) : pick(r, ['manual', 'disabled', 'manual'] as const)
      return { name, display, account, state, startup, pid: state === 'running' ? 400 + Math.floor(r() * 9000) : undefined }
    })
}

export type App = { name: string; publisher: string; version: string; sizeMb: number; installed: number }
export type Update = { kb: string; title: string; kind: 'security' | 'critical' | 'feature' | 'driver'; sizeMb: number; reboot: boolean }
const appsBase: [string, string, string[]][] = [
  ['Microsoft 365 Apps', 'Microsoft', ['16.0.17928', '16.0.18025']],
  ['Google Chrome', 'Google LLC', ['130.0.6723.117', '131.0.6778.86']],
  ['7-Zip 24.08 (x64)', 'Igor Pavlov', ['24.08']],
  ['1С:Предприятие 8.3', '1С-Софт', ['8.3.24.1548', '8.3.25.1374']],
  ['Kaspersky Endpoint Security', 'АО «Лаборатория Касперского»', ['12.6.0.438']],
  ['Notepad++ (64-bit)', 'Notepad++ Team', ['8.7.1']],
  ['Microsoft Edge', 'Microsoft', ['130.0.2849.80']],
  ['КриптоПро CSP', 'ООО «КРИПТО-ПРО»', ['5.0.13000']],
  ['Microsoft Visual C++ 2015-2022', 'Microsoft', ['14.40.33816']],
  ['Агент «Пульт»', 'Пульт (демо)', ['4.8.2']],
  ['PowerShell 7-x64', 'Microsoft', ['7.4.6']],
  ['Adobe Acrobat Reader', 'Adobe', ['24.004.20220']],
]
export function appsFor(m: Machine): App[] {
  const r = rng(hash(m.id + 'apps'))
  return appsBase.filter(() => r() > 0.15).map(([name, publisher, v]) => ({
    name, publisher, version: pick(r, v), sizeMb: Math.round(between(r, 4, 2400)), installed: now - Math.floor(between(r, 3, 600)) * 86400000,
  }))
}
const updBase: Omit<Update, 'sizeMb'>[] = [
  { kb: 'KB5046617', title: 'Накопительное обновление 2026-11 для Windows', kind: 'security', reboot: true },
  { kb: 'KB5045934', title: 'Обновление .NET Framework 3.5 и 4.8.1', kind: 'critical', reboot: false },
  { kb: 'KB2267602', title: 'Обновление аналитики безопасности Защитника', kind: 'security', reboot: false },
  { kb: 'KB5044032', title: 'Обновление компонентов: функции 24H2', kind: 'feature', reboot: true },
  { kb: 'DRV-INTEL', title: 'Intel — Net — 23.70.0.5 (сетевой адаптер)', kind: 'driver', reboot: false },
  { kb: 'KB890830', title: 'Средство удаления вредоносных программ', kind: 'critical', reboot: false },
]
export function updatesFor(m: Machine): Update[] {
  const r = rng(hash(m.id + 'upd'))
  return updBase.filter(() => r() > 0.35).map((u) => ({ ...u, sizeMb: Math.round(between(r, 2, 900)) }))
}

export type Session = { id: number; user: string; kind: 'console' | 'rdp'; state: 'active' | 'idle' | 'disconnected'; since: number; idleMin: number; client?: string }
export function sessionsFor(m: Machine, people: string[]): Session[] {
  const r = rng(hash(m.id + 'ses'))
  if (m.status === 'offline') return []
  const n = m.kind === 'server' ? 1 + Math.floor(r() * 4) : 1
  return Array.from({ length: n }, (_, i) => {
    const kind: Session['kind'] = m.kind === 'workstation' || i === 0 ? (m.kind === 'workstation' ? 'console' : 'rdp') : 'rdp'
    const state: Session['state'] = r() < 0.6 ? 'active' : r() < 0.6 ? 'idle' : 'disconnected'
    return {
      id: i + 1, user: m.kind === 'workstation' ? m.owner : pick(r, people), kind, state,
      since: now - Math.floor(between(r, 10, 2000)) * 60000, idleMin: state === 'active' ? 0 : Math.floor(between(r, 5, 240)),
      client: kind === 'rdp' ? `WS-${pick(r, ['ACC', 'IT', 'HR', 'LOG'])}-${100 + Math.floor(r() * 12)}` : undefined,
    }
  })
}

export type Task = { name: string; path: string; trigger: string; last: number; lastResult: 'ok' | 'fail' | 'running'; next: number; enabled: boolean }
const taskBase: [string, string, string][] = [
  ['Резервное копирование 1С', '\\Пульт\\', 'Ежедневно в 02:00'],
  ['Очистка временных файлов', '\\Пульт\\', 'Еженедельно, вс 03:30'],
  ['ScheduledDefrag', '\\Microsoft\\Windows\\Defrag\\', 'Еженедельно'],
  ['Проверка обновлений', '\\Microsoft\\Windows\\WindowsUpdate\\', 'При запуске + каждые 22 ч'],
  ['Отчёт о дисках', '\\Пульт\\', 'Ежедневно в 08:00'],
  ['Перезапуск службы печати', '\\Пульт\\', 'Ежедневно в 06:00'],
]
export function tasksFor(m: Machine): Task[] {
  const r = rng(hash(m.id + 'task'))
  return taskBase.map(([name, path, trigger]) => {
    const x = r()
    return { name, path, trigger, last: now - Math.floor(between(r, 1, 30)) * 3600000, lastResult: x < 0.12 ? 'fail' : x < 0.18 ? 'running' : 'ok', next: now + Math.floor(between(r, 1, 48)) * 3600000, enabled: r() > 0.15 }
  })
}

export type EvLevel = 'error' | 'warning' | 'info'
export type EventRec = { id: number; at: number; level: EvLevel; source: string; eventId: number; log: 'System' | 'Application' | 'Security'; message: string }
const evBase: [EvLevel, string, number, EventRec['log'], string][] = [
  ['error', 'Disk', 7, 'System', 'Устройство \\Device\\Harddisk1\\DR1 имеет плохой блок.'],
  ['warning', 'Ntfs', 140, 'System', 'Системе не удалось сбросить данные в журнал транзакций.'],
  ['info', 'Service Control Manager', 7036, 'System', 'Служба «Центр обновления Windows» перешла в состояние «Работает».'],
  ['error', 'Application Error', 1000, 'Application', 'Имя сбойного приложения: 1cv8.exe, версия 8.3.24.1548.'],
  ['info', 'Microsoft-Windows-Security-Auditing', 4624, 'Security', 'Вход в учётную запись выполнен успешно.'],
  ['warning', 'Microsoft-Windows-Security-Auditing', 4625, 'Security', 'Не удалось выполнить вход в учётную запись.'],
  ['info', 'PultAgent', 100, 'Application', 'Агент «Пульт» подключился к брокеру команд (mTLS).'],
  ['warning', 'Microsoft-Windows-Time-Service', 36, 'System', 'Служба времени не синхронизировала время 86 400 секунд.'],
  ['error', 'Service Control Manager', 7031, 'System', 'Служба «Диспетчер печати» неожиданно завершена.'],
  ['info', 'Microsoft-Windows-WindowsUpdateClient', 19, 'System', 'Установка завершена: KB2267602.'],
  ['info', 'Microsoft-Windows-Kernel-General', 1, 'System', 'Системное время изменено.'],
  ['warning', 'Microsoft-Windows-DNS-Client', 1014, 'System', 'Истекло время ожидания разрешения имени kedr.local.'],
]
export function eventsFor(m: Machine): EventRec[] {
  const r = rng(hash(m.id + 'ev'))
  return Array.from({ length: 36 }, (_, i) => {
    const [level, source, eventId, log, message] = pick(r, evBase)
    return { id: i, at: now - Math.floor(between(r, 1, 4320)) * 60000, level, source, eventId, log, message }
  }).sort((a, b) => b.at - a.at)
}

export type Adapter = { name: string; kind: string; ip: string; mac: string; speed: string; up: boolean; rxMb: number; txMb: number }
export type Port = { port: number; proto: 'TCP' | 'UDP'; process: string; addr: string }
export type FwRule = { id: string; name: string; dir: 'in' | 'out'; action: 'allow' | 'block'; ports: string; enabled: boolean }
export function networkFor(m: Machine) {
  const r = rng(hash(m.id + 'net'))
  const mac = () => Array.from({ length: 6 }, () => Math.floor(r() * 256).toString(16).padStart(2, '0').toUpperCase()).join('-')
  const adapters: Adapter[] = [
    { name: 'Ethernet', kind: m.kind === 'server' ? 'Intel X710 10GbE' : 'Realtek PCIe GbE', ip: m.ip, mac: mac(), speed: m.kind === 'server' ? '10 Гбит/с' : '1 Гбит/с', up: m.status !== 'offline', rxMb: Math.round(between(r, 200, 90000)), txMb: Math.round(between(r, 100, 40000)) },
    { name: 'vEthernet (Default Switch)', kind: 'Hyper-V Virtual Ethernet', ip: '172.24.48.1', mac: mac(), speed: '10 Гбит/с', up: m.kind === 'server', rxMb: Math.round(between(r, 0, 300)), txMb: Math.round(between(r, 0, 300)) },
  ]
  if (m.kind === 'workstation') adapters.push({ name: 'Wi-Fi', kind: 'Intel Wi-Fi 6 AX201', ip: '—', mac: mac(), speed: '—', up: false, rxMb: 0, txMb: 0 })
  const ports: Port[] = [
    { port: 135, proto: 'TCP', process: 'svchost.exe (RpcSs)', addr: '0.0.0.0' },
    { port: 445, proto: 'TCP', process: 'System (SMB)', addr: '0.0.0.0' },
    { port: 3389, proto: 'TCP', process: 'svchost.exe (TermService)', addr: '0.0.0.0' },
    { port: 5985, proto: 'TCP', process: 'System (WinRM)', addr: '0.0.0.0' },
    { port: 8443, proto: 'TCP', process: 'PultAgent.exe', addr: '127.0.0.1' },
    { port: 123, proto: 'UDP', process: 'svchost.exe (W32Time)', addr: '0.0.0.0' },
  ]
  if (m.kind === 'server') ports.push({ port: 1433, proto: 'TCP', process: 'sqlservr.exe', addr: '0.0.0.0' }, { port: 1541, proto: 'TCP', process: 'ragent.exe (1С)', addr: '0.0.0.0' })
  const rules: FwRule[] = [
    { id: 'rdp', name: 'Удалённый рабочий стол (TCP-In)', dir: 'in', action: 'allow', ports: '3389', enabled: true },
    { id: 'winrm', name: 'Удалённое управление Windows (HTTP-In)', dir: 'in', action: 'allow', ports: '5985', enabled: true },
    { id: 'smb', name: 'Общий доступ к файлам (SMB-In)', dir: 'in', action: 'allow', ports: '445', enabled: m.kind === 'server' },
    { id: 'icmp', name: 'Эхо-запрос ICMPv4 (In)', dir: 'in', action: 'allow', ports: '—', enabled: true },
    { id: 'telnet', name: 'Блокировать Telnet (Out)', dir: 'out', action: 'block', ports: '23', enabled: true },
    { id: 'agent', name: 'Агент «Пульт» → брокер (Out)', dir: 'out', action: 'allow', ports: '443', enabled: true },
  ]
  return { adapters, ports, rules }
}

export type FsNode = { name: string; kind: 'dir' | 'file'; sizeKb?: number; modified: number; children?: FsNode[] }
export function filesFor(m: Machine): FsNode {
  const r = rng(hash(m.id + 'fs'))
  const f = (name: string): FsNode => ({ name, kind: 'file', sizeKb: Math.round(between(r, 1, 250000)), modified: now - Math.floor(between(r, 1, 900)) * 3600000 })
  const d = (name: string, children: FsNode[]): FsNode => ({ name, kind: 'dir', modified: now - Math.floor(between(r, 1, 900)) * 3600000, children })
  return d('C:', [
    d('Users', [d(m.kind === 'server' ? 'Administrator' : 'user', [d('Desktop', [f('Отчёт_ноябрь.xlsx'), f('Договор_поставки.docx')]), d('Downloads', [f('setup.exe'), f('price.pdf')]), f('NTUSER.DAT')])]),
    d('ProgramData', [d('Pult', [d('logs', [f('agent-2026-11-16.log'), f('agent-2026-11-15.log')]), f('agent.config.json')])]),
    d('Backup', [f('1c_base_2026-11-15.zip'), f('1c_base_2026-11-14.zip'), f('sql_full_2026-11-15.bak')]),
    d('Windows', [d('Temp', [f('~tmp4F21.tmp'), f('MpCmdRun.log')]), f('WindowsUpdate.log')]),
    f('pagefile.sys'),
  ])
}
