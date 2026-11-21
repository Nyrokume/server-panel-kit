import type { Machine } from './mock'

export type NodePos = { id: string; x: number; y: number }

const X = { dc: 220, mid: 500, app: 790, ws0: 1080, ws1: 1300 }
const ROW = 114
const TOP = 150
const TENANT_GAP = 120

function bucket(m: Machine): 'dc' | 'mid' | 'app' | 'ws' {
  if (m.kind === 'workstation') return 'ws'
  const r = m.role.toLowerCase()
  if (r.includes('контроллер') || r.includes('домена')) return 'dc'
  if (r.includes('файл') || r.includes('резерв') || r.includes('терминал') || r.includes('удалённ') || /rds/i.test(m.name)) return 'mid'
  return 'app'
}

function midRank(m: Machine) {
  const r = m.role.toLowerCase()
  if (r.includes('файл')) return 0
  if (r.includes('резерв')) return 1
  return 2
}

function appRank(m: Machine) {
  const r = m.role.toLowerCase()
  if (r.includes('приложен')) return 0
  if (r.includes('субд') || r.includes('sql')) return 1
  if (r.includes('iis') || r.includes('портал') || r.includes('web')) return 2
  return 3
}

/** Детерминированная раскладка: контроллеры слева, инфраструктура, приложения, станции в два столбца. */
export function layoutFleet(fleet: Machine[]): { nodes: NodePos[]; links: [string, string][]; width: number; height: number } {
  const byTenant = new Map<string, Machine[]>()
  for (const m of fleet) {
    const arr = byTenant.get(m.tenantId) ?? []
    arr.push(m)
    byTenant.set(m.tenantId, arr)
  }

  const nodes: NodePos[] = []
  let yOffset = 0

  const place = (items: Machine[], x: number, y0: number, rowCount: number, jitter = 0) => {
    const start = y0 + Math.max(0, ((rowCount - items.length) * ROW) / 2)
    items.forEach((m, i) => {
      nodes.push({ id: m.id, x: x + (i % 2 === 1 ? jitter : 0), y: start + i * ROW })
    })
  }

  for (const [, list] of byTenant) {
    const dc = list.filter((m) => bucket(m) === 'dc').sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    const mid = list.filter((m) => bucket(m) === 'mid').sort((a, b) => midRank(a) - midRank(b) || a.name.localeCompare(b.name, 'ru'))
    const app = list.filter((m) => bucket(m) === 'app').sort((a, b) => appRank(a) - appRank(b) || a.name.localeCompare(b.name, 'ru'))
    const ws = list.filter((m) => bucket(m) === 'ws').sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    const wsL = ws.filter((_, i) => i % 2 === 0)
    const wsR = ws.filter((_, i) => i % 2 === 1)
    const rows = Math.max(dc.length, mid.length, app.length, wsL.length, wsR.length, 1)
    const y0 = TOP + yOffset
    place(dc, X.dc, y0, rows)
    place(mid, X.mid, y0, rows)
    place(app, X.app, y0, rows)
    place(wsL, X.ws0, y0, Math.max(rows, wsL.length))
    place(wsR, X.ws1, y0 + ROW * 0.42, Math.max(rows, wsR.length))
    const height = (rows - 1) * ROW + ROW * 0.42 + 160
    yOffset += height + TENANT_GAP
  }

  const pos = new Set(nodes.map((n) => n.id))
  const links: [string, string][] = []
  const add = (a?: string, b?: string) => {
    if (!a || !b || a === b || !pos.has(a) || !pos.has(b)) return
    if (links.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return
    links.push([a, b])
  }

  for (const [, list] of byTenant) {
    const dc = list.filter((m) => bucket(m) === 'dc')
    const mid = list.filter((m) => bucket(m) === 'mid')
    const app = list.filter((m) => bucket(m) === 'app')
    const ws = list.filter((m) => bucket(m) === 'ws')
    const fs = mid.find((m) => /файл/i.test(m.role))
    const bkp = mid.find((m) => /резерв/i.test(m.role))
    const rds = mid.find((m) => /терминал|удалённ|rds/i.test(m.role) || /RDS/.test(m.name))
    const appSrv = app.find((m) => /приложен/i.test(m.role)) ?? app[0]
    const db = app.find((m) => /субд|sql/i.test(m.role))
    const web = app.find((m) => /iis|портал|web/i.test(m.role) || /WEB/.test(m.name))
    const mon = app.find((m) => /лог|монитор/i.test(m.role) || /MON/.test(m.name))
    const primary = dc[0]
    if (primary) for (const m of mid) add(primary.id, m.id)
    for (let i = 1; i < dc.length; i++) add(dc[0].id, dc[i].id)
    add(fs?.id, bkp?.id)
    add(db?.id, appSrv?.id)
    add(appSrv?.id, web?.id)
    add(web?.id, mon?.id)
    add(rds?.id, appSrv?.id)
    const it = ws.filter((w) => /ит-отдел|инженер/i.test(w.role))
    const rest = ws.filter((w) => !it.includes(w))
    if (rds) for (const w of rest) add(rds.id, w.id)
    if (appSrv) for (const w of (it.length ? it : rest.slice(0, 2))) add(appSrv.id, w.id)
  }

  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const pad = 200
  const width = (xs.length ? Math.max(...xs) : 0) + pad
  const height = (ys.length ? Math.max(...ys) : 0) + pad
  return { nodes, links, width: Math.max(width, 1100), height: Math.max(height, 640) }
}
