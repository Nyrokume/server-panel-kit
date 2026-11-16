import { useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader, StatusDot } from '@/components/app/common'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAppState } from '@/lib/app-state'
import { fleetFor } from '@/lib/live'
import { runCommand, commandHints } from '@/lib/pwsh'
import { fmtTime } from '@/lib/format'
import { ShieldAlertIcon, CornerDownLeftIcon } from 'lucide-react'

type Line = { id: number; prompt?: string; text: string; tone?: 'ok' | 'err' | 'cmd'; at: number }

export default function PowerShell() {
  const { tenant } = useAppState()
  const fleet = fleetFor(tenant).filter((m) => m.status !== 'offline')
  const [id, setId] = useState(fleet[0]?.id)
  const machine = fleet.find((m) => m.id === id) ?? fleet[0]
  const ps = `PS C:\\Windows\\system32>`

  const [lines, setLines] = useState<Line[]>(() => {
    const now = Date.now()
    const seed: Line[] = [
      { id: 0, text: `Windows PowerShell — удалённая сессия (демо)\nПодключено к ${machine?.name ?? '—'} (${machine?.ip ?? ''}). Команды не выполняются на реальной машине.\nВведите Get-Help для списка командлетов.`, at: now - 40000 },
    ]
    if (machine) {
      for (const c of ['Get-ComputerInfo', 'Get-Service']) {
        const res = runCommand(c, machine)
        seed.push({ id: seed.length, prompt: ps, text: c, tone: 'cmd', at: now - 20000 })
        if (res.out) seed.push({ id: seed.length, text: res.out, tone: res.tone, at: now - 20000 })
      }
    }
    return seed
  })
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [, setHIdx] = useState(-1)
  const seq = useRef(100)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }) }, [lines])

  const hint = useMemo(() => {
    if (!input.trim()) return ''
    const m = commandHints.find((h) => h.toLowerCase().startsWith(input.toLowerCase()) && h.toLowerCase() !== input.toLowerCase())
    return m ? m.slice(input.length) : ''
  }, [input])

  const submit = (raw: string) => {
    const text = raw.trim()
    if (!text || !machine) return
    const res = runCommand(text, machine)
    if (res.out === '__CLEAR__') { setLines([]); setInput(''); return }
    const now = Date.now()
    setLines((prev) => [
      ...prev,
      { id: seq.current++, prompt: ps, text, tone: 'cmd', at: now },
      ...(res.out ? [{ id: seq.current++, text: res.out, tone: res.tone, at: now } as Line] : []),
    ])
    setHistory((h) => [text, ...h].slice(0, 50))
    setHIdx(-1)
    setInput('')
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(input) }
    else if ((e.key === 'Tab' || e.key === 'ArrowRight') && hint) {
      if (e.key === 'Tab') e.preventDefault()
      if (e.key === 'Tab' || input.length) setInput((v) => v + hint)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHIdx((i) => { const n = Math.min(history.length - 1, i + 1); setInput(history[n] ?? ''); return n })
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHIdx((i) => { const n = Math.max(-1, i - 1); setInput(n === -1 ? '' : history[n] ?? ''); return n })
    }
  }

  return (
    <>
      <PageHeader title="PowerShell" description="Веб-терминал удалённой сессии. Поддерживает историю (↑/↓), подсказки автодополнения (Tab) и вывод командлетов.">
        <Select value={machine?.id} onValueChange={setId}>
          <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
          <SelectContent>
            {fleet.map((m) => <SelectItem key={m.id} value={m.id}><span className="flex items-center gap-2"><StatusDot status={m.status} withLabel={false} />{m.name}</span></SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <Alert>
        <ShieldAlertIcon />
        <AlertTitle>Демонстрационный режим</AlertTitle>
        <AlertDescription>Терминал имитирует вывод. Ни одна команда не отправляется на реальную машину и ничего не меняет.</AlertDescription>
      </Alert>

      <Card className="overflow-hidden py-0">
        <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2 text-sm">
          <div className="flex items-center gap-2"><span className="size-3 rounded-full bg-[#ff5f57]" /><span className="size-3 rounded-full bg-[#febc2e]" /><span className="size-3 rounded-full bg-[#28c840]" /><span className="ml-2 font-mono text-xs text-muted-foreground">{machine?.name} — pwsh 7.4</span></div>
          <Badge variant="outline" className="gap-1.5"><StatusDot status="online" withLabel={false} /> сессия активна</Badge>
        </div>
        <div ref={scrollRef} className="h-[52vh] min-h-80 overflow-y-auto bg-[#0b0e14] px-4 py-3 font-mono text-[13px] leading-relaxed text-[#cdd6e4]" onClick={() => inputRef.current?.focus()}>
          {lines.map((l) => (
            <div key={l.id} className="whitespace-pre-wrap break-words">
              {l.tone === 'cmd' ? (
                <div><span className="text-[#7aa2f7]">{l.prompt} </span><span className="text-[#e5e9f0]">{l.text}</span></div>
              ) : (
                <span className={l.tone === 'err' ? 'text-[#f7768e]' : l.tone === 'ok' ? 'text-[#9ece6a]' : 'text-[#a9b1d6]'}>{l.text}</span>
              )}
              <span className="float-right select-none text-[10px] text-[#3b4261]">{fmtTime(l.at)}</span>
            </div>
          ))}
          <div className="relative flex items-center">
            <span className="text-[#7aa2f7]">{ps}&nbsp;</span>
            <span className="relative flex-1">
              <span className="whitespace-pre text-[#e5e9f0]">{input}</span>
              <span className="text-[#3b4261]">{hint}</span>
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-[#7aa2f7] align-middle" />
              <input
                ref={inputRef} autoFocus value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
                spellCheck={false} autoComplete="off" aria-label="Команда PowerShell"
                className="absolute inset-0 w-full bg-transparent text-transparent caret-transparent outline-none"
              />
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 border-t bg-muted/30 px-4 py-2">
          <span className="mr-1 text-xs text-muted-foreground"><CornerDownLeftIcon className="mr-1 inline size-3" />быстрые команды:</span>
          {['Get-Process', 'Get-Service', 'Get-Disk', 'Get-ComputerInfo', 'Get-Uptime', 'Clear-Host'].map((c) => (
            <Button key={c} variant="outline" size="sm" className="h-7 font-mono text-xs" onClick={() => submit(c)}>{c}</Button>
          ))}
        </div>
      </Card>
    </>
  )
}
