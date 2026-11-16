import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command'
import { nav, navGroups } from '@/lib/nav'
import { machines } from '@/lib/mock'
import { useTheme } from '@/lib/theme'
import { MoonIcon, SunIcon, ServerIcon, MonitorIcon } from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((v) => !v) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const go = (to: string) => { setOpen(false); navigate(to) }

  return (
    <>
      <button
        type="button" onClick={() => setOpen(true)}
        className="inline-flex h-9 w-full min-w-0 max-w-64 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <span className="truncate">Поиск машин и разделов…</span>
        <kbd className="ml-auto hidden rounded border bg-background px-1.5 font-mono text-[10px] sm:inline">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Командная палитра" description="Переход и действия">
        <CommandInput placeholder="Раздел, машина или действие…" />
        <CommandList>
          <CommandEmpty>Ничего не найдено.</CommandEmpty>
          {navGroups.map((g) => (
            <CommandGroup key={g} heading={g}>
              {nav.filter((n) => n.group === g).map((n) => (
                <CommandItem key={n.to} value={`${n.label} ${n.hint ?? ''}`} onSelect={() => go(n.to)}>
                  <n.icon />
                  <span>{n.label}</span>
                  {n.hint && <span className="ml-auto text-xs text-muted-foreground">{n.hint}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Действия">
            <CommandItem value="тема светлая тёмная переключить" onSelect={() => { toggle(); setOpen(false) }}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
              <CommandShortcut>⌘J</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Машины">
            {machines.slice(0, 40).map((m) => (
              <CommandItem key={m.id} value={`${m.name} ${m.role} ${m.ip}`} onSelect={() => go(`/machines/${m.id}`)}>
                {m.kind === 'server' ? <ServerIcon /> : <MonitorIcon />}
                <span>{m.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{m.role}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
