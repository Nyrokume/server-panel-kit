/* Mock PowerShell engine. Pure string in → string out. No real execution of any kind. */
import { machineById, procsFor, volumesFor, type Machine } from './mock'

const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n)
const rpad = (s: string, n: number) => (' '.repeat(n) + s).slice(-n)

export type CmdResult = { out: string; tone?: 'ok' | 'err' }

export const commandHints = [
  'Get-Process', 'Get-Service', 'Get-Disk', 'Get-Volume', 'Get-ComputerInfo', 'Get-NetIPAddress',
  'Get-CimInstance Win32_OperatingSystem', 'Get-Counter', 'Get-EventLog -LogName System -Newest 10',
  'Restart-Service', 'Stop-Process -Id', 'Test-Connection', 'Get-Uptime', 'Clear-Host', 'Get-Help',
]

export function runCommand(raw: string, machine: Machine): CmdResult {
  const line = raw.trim()
  const cmd = line.toLowerCase()
  if (!line) return { out: '' }

  if (cmd === 'clear-host' || cmd === 'cls' || cmd === 'clear') return { out: '__CLEAR__' }
  if (cmd === 'get-help' || cmd === 'help') {
    return { out: 'Доступные демо-командлеты:\n  ' + commandHints.join('\n  ') + '\n\nЭто имитация. Команды не выполняются на реальной машине.' }
  }
  if (cmd.startsWith('get-process') || cmd === 'ps' || cmd === 'gps') {
    const procs = procsFor(machine).slice(0, 12)
    const head = `${pad('Handles', 8)}${rpad('CPU(s)', 9)}  ${rpad('WS(MB)', 8)}  ${rpad('Id', 7)}  ProcessName`
    const sep = `${'-'.repeat(7)}  ${'-'.repeat(7)}  ${'-'.repeat(7)}  ${'-'.repeat(6)}  ${'-'.repeat(11)}`
    const body = procs.map((p) => `${pad(String(p.threads * 7), 8)}${rpad(p.cpu.toFixed(2), 9)}  ${rpad((p.memMb).toString(), 8)}  ${rpad(String(p.pid), 7)}  ${p.name.replace(/\.exe$/, '')}`).join('\n')
    return { out: `${head}\n${sep}\n${body}` }
  }
  if (cmd.startsWith('get-service')) {
    const svcs = [
      ['Running', 'MSSQLSERVER', 'SQL Server (MSSQLSERVER)'], ['Running', 'W32Time', 'Служба времени Windows'],
      ['Running', 'Dnscache', 'DNS-клиент'], ['Stopped', 'Spooler', 'Диспетчер печати'],
      ['Running', 'WinRM', 'Удалённое управление Windows'], ['Running', 'BITS', 'Фоновая передача'],
      ['Stopped', 'Fax', 'Факс'], ['Running', 'LanmanServer', 'Сервер'],
    ]
    const head = `${pad('Status', 9)}${pad('Name', 16)}DisplayName`
    const body = svcs.map(([s, n, d]) => `${pad(s, 9)}${pad(n, 16)}${d}`).join('\n')
    return { out: `${head}\n${'-'.repeat(9)}${'-'.repeat(16)}${'-'.repeat(11)}\n${body}` }
  }
  if (cmd.startsWith('get-disk') || cmd.startsWith('get-volume')) {
    const vols = volumesFor(machine)
    const head = `${pad('Mount', 8)}${pad('FS', 7)}${rpad('Size(GB)', 10)}${rpad('Free(GB)', 10)}  Health`
    const body = vols.map((v) => `${pad(v.mount, 8)}${pad(v.fs, 7)}${rpad(String(v.sizeGb), 10)}${rpad(String(v.sizeGb - v.usedGb), 10)}  ${v.smart === 'ok' ? 'Healthy' : v.smart === 'warn' ? 'Warning' : 'Unhealthy'}`).join('\n')
    return { out: `${head}\n${'-'.repeat(43)}\n${body}` }
  }
  if (cmd.startsWith('get-uptime')) {
    const sec = (Date.now() - machine.bootAt) / 1000
    const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60)
    return { out: `Days              : ${d}\nHours             : ${h}\nMinutes           : ${m}` }
  }
  if (cmd.startsWith('get-computerinfo') || cmd.includes('win32_operatingsystem')) {
    return { out: [
      `CsName                 : ${machine.name}`,
      `OsName                 : ${machine.os}`,
      `CsProcessors           : ${machine.cpuModel}`,
      `CsNumberOfLogicalProcessors : ${machine.cores}`,
      `OsTotalVisibleMemorySize    : ${machine.ramGb} GB`,
      `OsArchitecture         : 64-bit`,
    ].join('\n') }
  }
  if (cmd.startsWith('get-netipaddress') || cmd === 'ipconfig') {
    return { out: `InterfaceAlias : Ethernet0\nIPAddress      : ${machine.ip}\nPrefixLength   : 24\nAddressFamily  : IPv4` }
  }
  if (cmd.startsWith('test-connection') || cmd.startsWith('ping')) {
    const host = line.split(/\s+/)[1] || '10.0.0.1'
    return { out: [1, 2, 3, 4].map((i) => `Ответ от ${host}: байт=32 время=${(Math.random() * 3 + 1).toFixed(0)}мс TTL=128 (пакет ${i})`).join('\n') }
  }
  if (cmd.startsWith('restart-service') || cmd.startsWith('stop-process') || cmd.startsWith('stop-service')) {
    return { out: `Команда «${line}» принята. В демо-режиме действие не выполняется на реальной машине.`, tone: 'ok' }
  }
  if (cmd.startsWith('get-eventlog') || cmd.startsWith('get-winevent')) {
    const now = Date.now()
    const ev = [['Information', 'Service Control Manager', 'Служба «BITS» перешла в состояние «Выполняется».'],
      ['Warning', 'Disk', 'Операция ввода-вывода повторена (\\Device\\Harddisk1).'],
      ['Error', 'Application Error', 'Сбойное приложение w3wp.exe, версия 10.0.'],
      ['Information', 'Windows Update', 'Установлено обновление KB5041234.']]
    return { out: ev.map((e, i) => `${new Date(now - i * 360000).toLocaleString('ru-RU')}  ${pad(e[0], 12)}${pad(e[1], 26)}${e[2]}`).join('\n') }
  }
  return { out: `${line.split(/\s+/)[0]} : Командлет не распознан в демо-режиме. Введите Get-Help для списка.`, tone: 'err' }
}

export function resolveMachine(id: string): Machine {
  return machineById(id) ?? machineById('kedr-srv-db')!
}
