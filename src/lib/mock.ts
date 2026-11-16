/* Mock fleet: everything here is generated locally. Nothing connects to real machines. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const hash = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261)
const pick = <T>(r: () => number, a: readonly T[]) => a[Math.floor(r() * a.length)]
const between = (r: () => number, lo: number, hi: number) => lo + r() * (hi - lo)

export type Tenant = { id: string; name: string; plan: string; city: string }
export const tenants: Tenant[] = [
  { id: 'kedr', name: 'Кедр Логистика', plan: 'Enterprise', city: 'Екатеринбург' },
  { id: 'sever', name: 'Северный терминал', plan: 'Business', city: 'Мурманск' },
  { id: 'polimer', name: 'Полимер-Урал', plan: 'Enterprise', city: 'Пермь' },
]

export type Status = 'online' | 'warning' | 'offline'
export type Machine = {
  id: string; tenantId: string; name: string; kind: 'server' | 'workstation'; role: string
  os: string; ip: string; site: string; owner: string; status: Status
  cores: number; ramGb: number; bootAt: number; agent: string; cpuModel: string
  base: { cpu: number; ram: number; net: number; temp: number }
}

const serverRoles = [
  ['DB', 'СУБД MS SQL'], ['APP', 'Сервер приложений 1С'], ['FS', 'Файловый сервер'], ['DC', 'Контроллер домена'],
  ['WEB', 'IIS, внутренний портал'], ['BKP', 'Сервер резервных копий'], ['RDS', 'Терминальный сервер'], ['MON', 'Сбор логов'],
] as const
const wsDept = [['ACC', 'Бухгалтерия'], ['LOG', 'Логистика'], ['HR', 'Кадры'], ['SALES', 'Продажи'], ['DSP', 'Диспетчерская'], ['IT', 'ИТ-отдел']] as const
const people = ['Анна Ковалёва', 'Игорь Савин', 'Мария Лебедева', 'Денис Орлов', 'Ольга Никитина', 'Павел Зуев', 'Елена Фомина', 'Артём Гусев', 'Светлана Белова', 'Роман Титов', 'Ксения Жукова', 'Михаил Ершов']
const sites = ['Офис, 4 этаж', 'Склад №2', 'ЦОД, стойка A3', 'ЦОД, стойка B1', 'Филиал, Тюмень', 'Офис, 2 этаж']
const cpus = ['Xeon Silver 4314', 'Xeon Gold 6338', 'EPYC 7313P', 'Core i5-12500', 'Core i7-13700', 'Ryzen 5 PRO 5650G']

const now = Date.now()
let ipN = 10

export const machines: Machine[] = tenants.flatMap((t) => {
  const r = rng(hash(t.id))
  const out: Machine[] = []
  serverRoles.forEach(([code, role], i) => {
    const linux = code === 'MON' || code === 'WEB'
    const st: Status = r() < 0.14 ? 'warning' : 'online'
    out.push({
      id: `${t.id}-srv-${code.toLowerCase()}`, tenantId: t.id, name: `SRV-${code}-0${(i % 2) + 1}`, kind: 'server', role,
      os: linux ? 'Ubuntu Server 24.04 LTS' : 'Windows Server 2022', ip: `10.${hash(t.id) % 240}.1.${ipN++}`,
      site: pick(r, sites.slice(2, 4)), owner: 'ИТ-отдел', status: st,
      cores: pick(r, [8, 16, 24, 32]), ramGb: pick(r, [32, 64, 128, 256]), bootAt: now - Math.floor(between(r, 3, 120)) * 86400000,
      agent: '4.8.2', cpuModel: pick(r, cpus.slice(0, 3)),
      base: { cpu: between(r, 12, st === 'warning' ? 78 : 46), ram: between(r, 30, st === 'warning' ? 88 : 64), net: between(r, 20, 420), temp: between(r, 38, st === 'warning' ? 74 : 58) },
    })
  })
  for (let i = 0; i < 10; i++) {
    const [code, dept] = pick(r, wsDept)
    const st: Status = r() < 0.18 ? 'offline' : r() < 0.2 ? 'warning' : 'online'
    out.push({
      id: `${t.id}-ws-${i}`, tenantId: t.id, name: `WS-${code}-${100 + i}`, kind: 'workstation', role: dept,
      os: pick(r, ['Windows 11 Pro 24H2', 'Windows 11 Pro 23H2', 'Windows 10 Pro 22H2']), ip: `10.${hash(t.id) % 240}.20.${ipN++}`,
      site: pick(r, sites), owner: pick(r, people), status: st,
      cores: pick(r, [4, 6, 8]), ramGb: pick(r, [8, 16, 32]), bootAt: now - Math.floor(between(r, 0, 20)) * 86400000 - Math.floor(between(r, 0, 23)) * 3600000,
      agent: pick(r, ['4.8.2', '4.8.2', '4.7.9']), cpuModel: pick(r, cpus.slice(3)),
      base: st === 'offline' ? { cpu: 0, ram: 0, net: 0, temp: 0 } : { cpu: between(r, 3, st === 'warning' ? 72 : 40), ram: between(r, 35, st === 'warning' ? 90 : 70), net: between(r, 1, 80), temp: between(r, 40, st === 'warning' ? 82 : 62) },
    })
  }
  return out
})

export const machineById = (id: string) => machines.find((m) => m.id === id)

export type Sample = { cpu: number; ram: number; net: number; temp: number; disk: number }
const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
export function sampleFor(m: Machine, tick: number): Sample {
  if (m.status === 'offline') return { cpu: 0, ram: 0, net: 0, temp: 0, disk: 0 }
  const r = rng(hash(m.id) ^ tick)
  const wob = (base: number, amp: number) => clamp(base + Math.sin(tick / 3 + (hash(m.id) % 7)) * amp + (r() - 0.5) * amp)
  return {
    cpu: Math.round(wob(m.base.cpu, 14)),
    ram: Math.round(wob(m.base.ram, 5)),
    net: Math.round(clamp(m.base.net + (r() - 0.5) * 120, 0, 1000)),
    temp: Math.round(wob(m.base.temp, 3)),
    disk: Math.round(clamp(m.base.net / 10 + r() * 40, 0, 400)),
  }
}

export type HistPoint = { t: number; tick: number; cpu: number; ram: number; net: number; temp: number; disk: number }
export function seedHistory(m: Machine, points: number, startTick: number): HistPoint[] {
  const out: HistPoint[] = []
  for (let i = points; i > 0; i--) {
    const tick = startTick - i
    const s = sampleFor(m, tick)
    out.push({ t: now - i * 2000, tick, ...s })
  }
  return out
}

export type Volume = {
  id: string; mount: string; label: string; fs: string; type: 'SSD NVMe' | 'SSD SATA' | 'HDD'
  sizeGb: number; usedGb: number; readMb: number; writeMb: number
  smart: 'ok' | 'warn' | 'fail'; tempC: number; powerOnH: number; reallocated: number; model: string
}
const diskModels = ['Samsung PM9A3', 'Intel D3-S4610', 'Seagate Exos X18', 'WD Red Pro', 'Kingston DC500M', 'Micron 7450']
export function volumesFor(m: Machine): Volume[] {
  const r = rng(hash(m.id + 'disk'))
  const count = m.kind === 'server' ? 2 + Math.floor(r() * 3) : 1 + Math.floor(r() * 2)
  const mounts = m.os.startsWith('Windows') ? ['C:', 'D:', 'E:', 'F:', 'G:'] : ['/', '/var', '/data', '/backup', '/home']
  const labels = ['Система', 'Данные', 'Базы', 'Архив', 'Профили']
  return Array.from({ length: count }, (_, i) => {
    const type = i === 0 ? 'SSD NVMe' : pick(r, ['SSD SATA', 'HDD', 'SSD NVMe'] as const)
    const sizeGb = pick(r, type === 'HDD' ? [2048, 4096, 8192, 16384] : [256, 512, 1024, 2048])
    const usedFrac = between(r, 0.28, i === 0 ? 0.74 : 0.95)
    const smartRoll = r()
    const smart = smartRoll < 0.08 ? 'fail' : smartRoll < 0.22 ? 'warn' : 'ok'
    return {
      id: `${m.id}-vol-${i}`, mount: mounts[i], label: labels[i] ?? `Том ${i + 1}`,
      fs: m.os.startsWith('Windows') ? 'NTFS' : pick(r, ['ext4', 'xfs']), type,
      sizeGb, usedGb: Math.round(sizeGb * usedFrac),
      readMb: Math.round(between(r, 20, type === 'HDD' ? 180 : 2800)), writeMb: Math.round(between(r, 10, type === 'HDD' ? 120 : 1900)),
      smart, tempC: Math.round(between(r, 32, smart === 'ok' ? 46 : 58)),
      powerOnH: Math.round(between(r, 1200, 41000)), reallocated: smart === 'ok' ? 0 : Math.round(between(r, 1, smart === 'fail' ? 320 : 24)),
      model: pick(r, diskModels),
    }
  })
}

export type Proc = { pid: number; name: string; user: string; cpu: number; memMb: number; threads: number; status: 'running' | 'sleeping'; started: number; cmd: string }
const procDefs = [
  ['sqlservr.exe', 'MSSQL$PROD', 'ядро СУБД'], ['1cv8.exe', 'rphost', 'рабочий процесс 1С'], ['w3wp.exe', 'IIS AppPool', 'пул IIS'],
  ['chrome.exe', 'интранет', 'браузер'], ['Code.exe', 'редактор', 'VS Code'], ['explorer.exe', 'оболочка', 'проводник'],
  ['svchost.exe', 'NetworkService', 'системная служба'], ['MsMpEng.exe', 'Defender', 'антивирус'], ['outlook.exe', 'почта', 'Outlook'],
  ['Teams.exe', 'мессенджер', 'Teams'], ['backup-agent', 'служба', 'агент бэкапа'], ['node.exe', 'сборка', 'Node.js'],
  ['postgres', 'БД', 'PostgreSQL'], ['nginx', 'веб', 'reverse proxy'], ['python3', 'ETL', 'выгрузка данных'],
]
export function procsFor(m: Machine): Proc[] {
  const r = rng(hash(m.id + 'proc'))
  const n = 14 + Math.floor(r() * 10)
  return Array.from({ length: n }, (_, i) => {
    const [name, user, cmd] = pick(r, procDefs)
    return {
      pid: 600 + Math.floor(r() * 64000), name, user,
      cpu: Math.round(between(r, 0, i < 3 ? 46 : 8) * 10) / 10, memMb: Math.round(between(r, 24, 4200)),
      threads: 1 + Math.floor(r() * 48), status: (r() < 0.7 ? 'running' : 'sleeping') as Proc['status'],
      started: now - Math.floor(between(r, 0.1, 400)) * 3600000, cmd,
    }
  }).sort((a, b) => b.cpu - a.cpu)
}

export type Alert = { id: string; machineId: string; level: 'crit' | 'warn' | 'info'; title: string; at: number; acked: boolean }
const alertDefs: [Alert['level'], string][] = [
  ['crit', 'Диск C: заполнен на 94 %'], ['crit', 'S.M.A.R.T.: переназначенные секторы растут'], ['warn', 'Загрузка CPU выше 85 % 10 мин'],
  ['warn', 'Температура ядра 74 °C'], ['warn', 'Служба «Агент 1С» перезапущена'], ['info', 'Установлены обновления безопасности'],
  ['warn', 'Свободной ОЗУ меньше 8 %'], ['info', 'Резервная копия завершена'], ['crit', 'Нет связи с агентом 6 мин'],
]
export const alerts: Alert[] = machines.flatMap((m, i) => {
  const r = rng(hash(m.id + 'al'))
  const k = m.status === 'online' ? (r() < 0.3 ? 1 : 0) : 1 + Math.floor(r() * 2)
  return Array.from({ length: k }, (_, j) => {
    const [level, title] = alertDefs[Math.floor(r() * alertDefs.length)]
    return { id: `al-${i}-${j}`, machineId: m.id, level, title, at: now - Math.floor(between(r, 1, 2800)) * 60000, acked: r() < 0.3 }
  })
}).sort((a, b) => b.at - a.at)

export type Role = 'Владелец' | 'Администратор' | 'Оператор' | 'Наблюдатель'
export type User = { id: string; name: string; email: string; role: Role; tenants: string[]; mfa: boolean; lastSeen: number; status: 'активен' | 'приглашён' | 'отключён' }
export const roleScopes: Record<Role, string> = {
  'Владелец': 'Полный доступ, биллинг и управление организацией',
  'Администратор': 'Управление машинами, PowerShell, перезагрузка, пользователи',
  'Оператор': 'Просмотр экрана, процессы, снимок; без выполнения команд',
  'Наблюдатель': 'Только чтение дашбордов и отчётов',
}
export const users: User[] = people.slice(0, 9).map((name, i) => {
  const r = rng(hash(name))
  const role: Role = i === 0 ? 'Владелец' : i < 3 ? 'Администратор' : i < 6 ? 'Оператор' : 'Наблюдатель'
  const login = ['a.kovaleva', 'i.savin', 'm.lebedeva', 'd.orlov', 'o.nikitina', 'p.zuev', 'e.fomina', 'a.gusev', 's.belova'][i]
  return {
    id: `u-${i}`, name, email: `${login}@kedr.ru`, role,
    tenants: r() < 0.4 ? tenants.map((t) => t.id) : [tenants[i % tenants.length].id],
    mfa: role !== 'Наблюдатель' ? r() > 0.2 : r() > 0.6,
    lastSeen: now - Math.floor(between(r, 1, 4000)) * 60000, status: i === 8 ? 'приглашён' : r() < 0.1 ? 'отключён' : 'активен',
  }
})
