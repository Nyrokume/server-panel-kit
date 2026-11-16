/* Procedurally generated fake desktop screenshots as inline SVG data URIs.
 * Nothing is captured from any real machine — these are drawn from a seed. */
import { rng, hash, type Machine } from './mock'

const wallpapers = [
  ['#0f2027', '#203a43', '#2c5364'], ['#1a1a2e', '#16213e', '#0f3460'],
  ['#232526', '#414345', '#232526'], ['#2b1055', '#7597de', '#2b1055'],
  ['#0b486b', '#f56217', '#0b486b'], ['#141e30', '#243b55', '#141e30'],
]
const apps = ['1С:Предприятие', 'Проводник', 'Outlook — Входящие', 'Chrome — Интранет', 'SQL Server Management Studio', 'Диспетчер задач', 'Блокнот', 'Excel — Отчёт.xlsx', 'Terminal', 'Параметры']

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function fakeScreen(machine: Machine, tick: number, w = 640, h = 400): string {
  const r = rng(hash(machine.id) ^ (tick * 2654435761))
  const wp = wallpapers[hash(machine.id) % wallpapers.length]
  const taskbar = h - 34
  const nWin = machine.kind === 'server' ? 1 + Math.floor(r() * 2) : 1 + Math.floor(r() * 3)
  const now = new Date(Date.now())
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  let wins = ''
  for (let i = 0; i < nWin; i++) {
    const wx = 30 + r() * (w * 0.4), wy = 20 + r() * (h * 0.3)
    const ww = w * (0.4 + r() * 0.25), wh = h * (0.4 + r() * 0.25)
    const title = apps[Math.floor(r() * apps.length)]
    const bars = Array.from({ length: 5 }, (_, k) => `<rect x="${wx + 14}" y="${wy + 44 + k * 18}" width="${ww * (0.3 + r() * 0.6)}" height="8" rx="4" fill="#ffffff" opacity="0.14"/>`).join('')
    const chartBars = Array.from({ length: 8 }, (_, k) => `<rect x="${wx + ww - 150 + k * 17}" y="${wy + wh - 20 - r() * 70}" width="11" height="${20 + r() * 70}" rx="2" fill="#5b9bd5" opacity="0.5"/>`).join('')
    wins += `<g>
      <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="8" fill="#1e2228" opacity="0.97" stroke="#000" stroke-opacity="0.3"/>
      <rect x="${wx}" y="${wy}" width="${ww}" height="30" rx="8" fill="#2a2f37"/>
      <rect x="${wx}" y="${wy + 22}" width="${ww}" height="10" fill="#2a2f37"/>
      <circle cx="${wx + ww - 18}" cy="${wy + 15}" r="5" fill="#ff5f57"/>
      <circle cx="${wx + ww - 36}" cy="${wy + 15}" r="5" fill="#febc2e"/>
      <circle cx="${wx + ww - 54}" cy="${wy + 15}" r="5" fill="#28c840"/>
      <text x="${wx + 14}" y="${wy + 20}" font-family="Segoe UI, sans-serif" font-size="13" fill="#e5e9f0">${esc(title)}</text>
      ${bars}${chartBars}
    </g>`
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${wp[0]}"/><stop offset="0.5" stop-color="${wp[1]}"/><stop offset="1" stop-color="${wp[2]}"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    ${Array.from({ length: 4 }, (_, i) => `<g transform="translate(${28 + (i % 2) * 70}, ${26 + Math.floor(i / 2) * 76})"><rect width="40" height="32" rx="5" fill="#ffffff" opacity="0.16"/><text x="20" y="48" font-family="Segoe UI" font-size="10" fill="#fff" opacity="0.8" text-anchor="middle">${['Папка', 'Корзина', 'Сеть', 'Этот ПК'][i]}</text></g>`).join('')}
    ${wins}
    <rect x="0" y="${taskbar}" width="${w}" height="34" fill="#15181d" opacity="0.92"/>
    <rect x="10" y="${taskbar + 7}" width="20" height="20" rx="4" fill="#5b9bd5"/>
    ${Array.from({ length: 5 }, (_, i) => `<rect x="${44 + i * 30}" y="${taskbar + 7}" width="20" height="20" rx="4" fill="#ffffff" opacity="0.18"/>`).join('')}
    <text x="${w - 16}" y="${taskbar + 16}" font-family="Segoe UI" font-size="12" fill="#e5e9f0" text-anchor="end">${clock}</text>
    <text x="${w - 16}" y="${taskbar + 29}" font-family="Segoe UI" font-size="9" fill="#9aa5b1" text-anchor="end">${esc(machine.name)}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
