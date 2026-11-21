import * as React from 'react'
import { cn } from './cn'
import { Button, IconButton, StatusDot } from './primitives'
import { fmtTime } from '../lib/format'
import { Camera, Maximize2, SquareTerminal, Eraser } from 'lucide-react'
import { CopyButton } from './docs'

/* ----------------------------------------------------------- Terminal block
   Self-contained mock terminal: history (↑/↓), Tab autocomplete, quick commands.
   `run` returns the fake output; '__CLEAR__' clears the screen. No real execution. */
export type TermLine = { id: number; prompt?: string; text: string; tone?: 'ok' | 'err' | 'cmd' | 'out'; at: number }

export function Terminal({ prompt, run, hints, quick, seed, className, title, inject }: {
  prompt: string
  title?: string
  /** внешняя вставка команды (например, из блока кода): {cmd, n} — n меняется на каждую вставку */
  inject?: { cmd: string; n: number }
  run: (cmd: string) => { out: string; tone?: 'ok' | 'err' }
  hints: string[]
  quick: string[]
  seed?: TermLine[]
  className?: string
}) {
  const [lines, setLines] = React.useState<TermLine[]>(seed ?? [])
  const [input, setInput] = React.useState('')
  const [history, setHistory] = React.useState<string[]>([])
  const seq = React.useRef(1000)
  const hIdx = React.useRef(-1)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }) }, [lines])
  React.useEffect(() => { if (inject?.cmd) { setInput(inject.cmd); inputRef.current?.focus({ preventScroll: true }) } }, [inject?.n, inject?.cmd])

  const hint = React.useMemo(() => {
    if (!input.trim()) return ''
    const m = hints.find((h) => h.toLowerCase().startsWith(input.toLowerCase()) && h.toLowerCase() !== input.toLowerCase())
    return m ? m.slice(input.length) : ''
  }, [input, hints])

  const submit = (raw: string) => {
    const text = raw.trim()
    if (!text) return
    const res = run(text)
    if (res.out === '__CLEAR__') { setLines([]); setInput(''); return }
    const now = Date.now()
    setLines((prev) => [
      ...prev,
      { id: seq.current++, prompt, text, tone: 'cmd', at: now },
      ...(res.out ? [{ id: seq.current++, text: res.out, tone: res.tone ?? 'out', at: now } as TermLine] : []),
    ])
    setHistory((h) => [text, ...h].slice(0, 50))
    hIdx.current = -1
    setInput('')
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(input) }
    else if (e.key === 'Tab' && hint) { e.preventDefault(); setInput((v) => v + hint) }
    else if (e.key === 'ArrowRight' && hint && inputRef.current && inputRef.current.selectionStart === input.length) setInput((v) => v + hint)
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (history.length) { hIdx.current = Math.min(history.length - 1, hIdx.current + 1); setInput(history[hIdx.current]) } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hIdx.current = Math.max(-1, hIdx.current - 1); setInput(hIdx.current === -1 ? '' : history[hIdx.current]) }
  }

  return (
    <section className={cn('overflow-hidden rounded-[var(--radius-pk-lg)] border border-line bg-raised', className)}>
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-line pl-3.5 pr-1.5">
        <div className="flex min-w-0 items-center gap-2 text-[13px]">
          <SquareTerminal className="size-4 shrink-0 text-muted" />
          <span className="truncate font-medium text-fg">{title ?? 'PowerShell 7.4'}</span>
          <span className="hidden items-center gap-1.5 text-muted sm:inline-flex"><StatusDot status="online" withLabel={false} />сессия открыта</span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <CopyButton text={lines.map((l) => (l.tone === 'cmd' ? `${l.prompt} ${l.text}` : l.text)).join('\n')} label="Скопировать вывод" />
          <IconButton size="sm" label="Очистить экран" onClick={() => setLines([])}><Eraser className="size-4" /></IconButton>
        </div>
      </div>
      <div ref={scrollRef} className="h-[46vh] min-h-72 overflow-y-auto bg-[#0d0d10] px-3 py-3 font-mono text-[12.5px] leading-relaxed text-[#c3cbda] pk-scroll sm:px-4 sm:text-[13px]" onClick={() => inputRef.current?.focus()}>
        {lines.map((l) => (
          <div key={l.id} className="whitespace-pre-wrap break-words">
            {l.tone === 'cmd'
              ? <div><span className="text-[#7aa2f7]">{l.prompt} </span><span className="text-[#e5e9f0]">{l.text}</span></div>
              : <span className={l.tone === 'err' ? 'text-[#f7768e]' : l.tone === 'ok' ? 'text-[#9ece6a]' : 'text-[#a9b1d6]'}>{l.text}</span>}
          </div>
        ))}
        <div className="flex items-center">
          <span className="shrink-0 text-[#7aa2f7]">{prompt}&nbsp;</span>
          <span className="relative min-w-0 flex-1">
            <span className="whitespace-pre break-all text-[#e5e9f0]">{input}</span>
            <span className="text-[#3b4261]">{hint}</span>
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-[#7aa2f7] align-middle" />
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
              spellCheck={false} autoComplete="off" autoCapitalize="off" aria-label="Команда PowerShell"
              className="absolute inset-0 w-full bg-transparent text-transparent caret-transparent outline-none" />
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-3 py-2">
        <span className="mr-1 text-xs text-muted">Быстрые команды</span>
        {quick.map((c) => <Button key={c} variant="outline" size="sm" className="h-7 font-mono text-xs" onClick={() => submit(c)}>{c}</Button>)}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- ScreenTile */
export function ScreenTile({ name, meta, status, src, onOpen, onSnapshot }: {
  name: string; meta: string; status: 'online' | 'warning' | 'offline'; src: string; onOpen: () => void; onSnapshot: () => void
}) {
  return (
    <div className="group pk-tactile overflow-hidden rounded-[var(--radius-pk-lg)] border border-line bg-raised hover:border-line-strong hover:shadow-[var(--pk-shadow-card)]">
      <button className="relative block aspect-video w-full overflow-hidden bg-black text-left" onClick={onOpen} aria-label={`Открыть экран ${name}`}>
        <img src={src} alt={`Экран машины ${name}`} className="size-full object-cover" draggable={false} />
        <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[11px] text-white backdrop-blur">
          <StatusDot status={status} withLabel={false} />{fmtTime(Date.now())}
        </span>
        <span className="absolute right-2 top-2 rounded bg-black/55 p-1 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 pointer-coarse:hidden"><Maximize2 className="size-4" /></span>
      </button>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-fg">{name}</div>
          <div className="truncate text-xs text-muted">{meta}</div>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <IconButton size="sm" label="Снимок экрана" onClick={onSnapshot}><Camera className="size-4" /></IconButton>
          <IconButton size="sm" label="На весь экран" onClick={onOpen}><Maximize2 className="size-4" /></IconButton>
        </div>
      </div>
    </div>
  )
}
