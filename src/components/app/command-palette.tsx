import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Dialog, DialogContent, Kbd } from '@/kit'
import { useTheme } from '@/lib/theme'
import { nav, adminTabs } from '@/lib/nav'
import { machines, tenants } from '@/lib/mock'
import { useAppState } from '@/lib/app-state'
import { preferredMachine, fleetFor } from '@/lib/live'
import { Search, Moon, Sun, Server, Monitor, CornerDownLeft } from 'lucide-react'

type Item = { id: string; label: string; hint?: string; group: string; icon: React.ComponentType<{ className?: string }>; run: () => void; search: string }

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const { tenant, lastMachineId } = useAppState()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => { onOpenChange(false); navigate(to) }
    const navItems: Item[] = nav.map((n) => ({
      id: n.to, label: n.label, group: 'Разделы', icon: n.icon, run: go(n.to), search: n.label,
    }))
    const actions: Item[] = [{
      id: 'theme', label: theme === 'dark' ? 'Светлая тема' : 'Тёмная тема', group: 'Действия',
      icon: theme === 'dark' ? Sun : Moon, run: () => { toggle(); onOpenChange(false) }, search: 'тема светлая тёмная переключить theme',
    }]
    const machineItems: Item[] = machines.slice(0, 60).map((m) => ({
      id: m.id, label: m.name, hint: `${m.role} · ${tenants.find((t) => t.id === m.tenantId)?.name ?? ''}`,
      group: 'Машины', icon: m.kind === 'server' ? Server : Monitor,
      run: go(`/machines/${m.id}`), search: `${m.name} ${m.role} ${m.ip}`,
    }))
    const srv = preferredMachine(fleetFor(tenant), lastMachineId) ?? machines[0]
    const adminItems: Item[] = adminTabs.filter(([k]) => k !== 'overview').map(([k, l]) => ({
      id: `adm-${k}`, label: l, group: 'Вкладки машины', icon: Server,
      run: go(`/machines/${srv.id}?tab=${k}`), search: `${l} ${srv.name}`,
    }))
    return [...navItems, ...actions, ...adminItems, ...machineItems]
  }, [navigate, onOpenChange, theme, toggle, tenant, lastMachineId])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    const r = s ? items.filter((i) => i.search.toLowerCase().includes(s) || (i.hint ?? '').toLowerCase().includes(s)) : items.filter((i) => i.group !== 'Машины').concat(items.filter((i) => i.group === 'Машины').slice(0, 6))
    return r.slice(0, 40)
  }, [q, items])

  useEffect(() => { setActive(0) }, [q])
  useEffect(() => { if (!open) setQ('') }, [open])

  const groups = useMemo(() => {
    const order = ['Разделы', 'Машины', 'Вкладки машины', 'Действия']
    const m = new Map<string, Item[]>()
    filtered.forEach((i) => { const a = m.get(i.group) ?? []; a.push(i); m.set(i.group, a) })
    return order.filter((g) => m.has(g)).map((g) => [g, m.get(g)!] as const)
  }, [filtered])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(filtered.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); filtered[active]?.run() }
  }

  let idx = -1
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Поиск по пульту" hideClose className="p-0" size="md">
        <div className="flex items-center gap-2 border-b border-line px-3.5">
          <Search className="size-4 shrink-0 text-muted" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Найти машину или раздел…" aria-label="Найти машину или раздел"
            className="h-12 w-full bg-transparent text-sm text-fg placeholder:text-faint outline-none" />
          <Kbd>Esc</Kbd>
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5 pk-scroll">
          {groups.map(([group, gItems]) => (
            <div key={group} className="mb-1">
              <div className="px-2 py-1 text-[11px] text-faint">{group}</div>
              {gItems.map((it) => {
                idx++
                const isActive = idx === active
                const Icon = it.icon
                return (
                  <button key={it.id} onMouseEnter={() => setActive(filtered.indexOf(it))} onClick={it.run}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors ${isActive ? 'bg-surface text-fg' : 'text-muted'}`}>
                    <Icon className="size-4 shrink-0 text-muted" />
                    <span className="truncate text-fg">{it.label}</span>
                    {it.hint && <span className="ml-auto truncate text-xs text-muted">{it.hint}</span>}
                    {isActive && !it.hint && <CornerDownLeft className="ml-auto size-3.5 text-faint" />}
                  </button>
                )
              })}
            </div>
          ))}
          {filtered.length === 0 && <div className="px-3 py-8 text-center text-sm text-muted">Ничего не найдено по «{q.trim()}»</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
