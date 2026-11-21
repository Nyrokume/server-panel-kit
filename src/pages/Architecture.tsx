import { useEffect, useMemo, useState } from 'react'
import { PageHeader, Segmented, Select, SelectItem, Button, IconButton, Panel, SectionHeader, Chip, DataList, Section, Callout, Steps, Step as StepBlock, type Column } from '@/kit'
import { cn } from '@/kit/cn'
import { nodes, edges, scenarios, edgeBetween, type NodeId, type ScenarioId, type Step, type ArchEdge } from '@/lib/architecture'
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Shield } from 'lucide-react'

/* ------------------------------------------------------------ geometry */
const W = 182, H = 66
const pos: Record<NodeId, [number, number]> = {
  browser: [100, 250], gateway: [390, 250], audit: [390, 410],
  broker: [695, 100], agent: [995, 100], telemetry: [995, 410], notify: [695, 410],
}
type Geo = { p1: [number, number]; c: [number, number]; p2: [number, number]; mid: [number, number] }
function clip(from: [number, number], toward: [number, number]): [number, number] {
  const dx = toward[0] - from[0], dy = toward[1] - from[1]
  const t = Math.min(dx ? (W / 2 + 6) / Math.abs(dx) : Infinity, dy ? (H / 2 + 6) / Math.abs(dy) : Infinity)
  return [from[0] + dx * t, from[1] + dy * t]
}
function geo(e: ArchEdge): Geo {
  const a = pos[e.a], b = pos[e.b]
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const k = e.bend ?? 0
  const c: [number, number] = [mx - dy * k, my + dx * k]
  const p1 = clip(a, c), p2 = clip(b, c)
  const t = e.lt ?? 0.5, u = 1 - t
  const mid: [number, number] = [u * u * p1[0] + 2 * u * t * c[0] + t * t * p2[0], u * u * p1[1] + 2 * u * t * c[1] + t * t * p2[1]]
  return { p1, c, p2, mid }
}
const pathOf = (g: Geo, reverse = false) => {
  const [s, t] = reverse ? [g.p2, g.p1] : [g.p1, g.p2]
  return `M${s[0]},${s[1]} Q${g.c[0]},${g.c[1]} ${t[0]},${t[1]}`
}

function useReducedMotion() {
  const [r, setR] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setR(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return r
}

const byId = Object.fromEntries(nodes.map((n) => [n.id, n])) as Record<NodeId, (typeof nodes)[number]>
const stackOrder: NodeId[] = ['browser', 'gateway', 'broker', 'agent', 'telemetry', 'notify', 'audit']

/* ---------------------------------------------------------------- page */
export default function Architecture() {
  const reduced = useReducedMotion()
  const [scenario, setScenario] = useState<ScenarioId>('pwsh')
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [hover, setHover] = useState<NodeId | null>(null)
  const [selected, setSelected] = useState<NodeId>('gateway')
  const steps = scenarios[scenario].steps
  const cur: Step | undefined = steps[step]
  const curEdge = cur ? edgeBetween(cur.from, cur.to) : undefined
  const doneEdges = useMemo(() => new Set(steps.slice(0, Math.max(0, step)).map((s) => edgeBetween(s.from, s.to)?.id)), [steps, step])

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setStep((s) => {
      if (s >= steps.length - 1) { setPlaying(false); return s }
      return s + 1
    }), reduced ? 2600 : 1800)
    return () => clearInterval(t)
  }, [playing, steps.length, reduced])

  const pickScenario = (s: ScenarioId) => { setScenario(s); setStep(-1); setPlaying(false) }
  const play = () => { if (step >= steps.length - 1) setStep(0); else if (step < 0) setStep(0); setPlaying(true) }
  const focus = hover ?? null
  const related = (id: NodeId) => !focus || focus === id || !!edgeBetween(focus, id)
  const node = byId[selected]

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="hidden sm:block">
        <Segmented value={scenario} onValueChange={pickScenario} ariaLabel="Сценарий"
          options={(Object.keys(scenarios) as ScenarioId[]).map((k) => ({ value: k, label: scenarios[k].label }))} />
      </div>
      <Select value={scenario} onValueChange={(v) => pickScenario(v as ScenarioId)} ariaLabel="Сценарий" className="min-w-0 flex-1 sm:hidden">
        {(Object.keys(scenarios) as ScenarioId[]).map((k) => <SelectItem key={k} value={k}>{scenarios[k].label}</SelectItem>)}
      </Select>
      <div className="flex items-center gap-1">
        <IconButton label="Предыдущий шаг" onClick={() => { setPlaying(false); setStep((s) => Math.max(-1, s - 1)) }} disabled={step < 0}><SkipBack className="size-4" /></IconButton>
        {playing
          ? <Button variant="solid" size="sm" onClick={() => setPlaying(false)}><Pause className="size-4" /> Пауза</Button>
          : <Button variant="solid" size="sm" onClick={play}><Play className="size-4" /> {step < 0 ? 'Запустить' : step >= steps.length - 1 ? 'Ещё раз' : 'Продолжить'}</Button>}
        <IconButton label="Следующий шаг" onClick={() => { setPlaying(false); setStep((s) => Math.min(steps.length - 1, s + 1)) }} disabled={step >= steps.length - 1}><SkipForward className="size-4" /></IconButton>
        <IconButton label="Сбросить" onClick={() => { setPlaying(false); setStep(-1) }} disabled={step < 0}><RotateCcw className="size-4" /></IconButton>
      </div>
    </div>
  )
  const stepLine = (
    <p className="min-h-10 text-sm text-muted" aria-live="polite">
      {cur ? <><span className="tnum font-medium text-fg">Шаг {step + 1} из {steps.length}.</span> {byId[cur.from].title} → {byId[cur.to].title} · <span className="font-mono text-xs">{cur.proto}</span>. {cur.text}</>
        : `Выберите сценарий и нажмите «Запустить»: ${steps.length} шагов, можно идти по одному.`}
    </p>
  )

  const seqCols: Column<Step & { n: number }>[] = [
    { key: 'n', header: '№', tableOnly: true, cell: (s) => <span className="tnum text-muted">{s.n}</span> },
    { key: 'route', header: 'Откуда → куда', primary: true, cell: (s) => <span className="text-fg">{byId[s.from].title} → {byId[s.to].title}</span> },
    { key: 'proto', header: 'Протокол', meta: true, cell: (s) => <span className="font-mono text-xs text-muted">{s.proto}</span> },
    { key: 'text', header: 'Что происходит', wide: true, cell: (s) => <span className="text-muted">{s.text}</span> },
  ]

  return (
    <>
      <PageHeader title="Схема взаимодействия" description="Как команда оператора доходит до машины и возвращается: шлюз с SSO и ролями, брокер заданий, агент, телеметрия и аудит." />

      <Section id="flow" title="Путь команды" description="Выберите сценарий. Можно запустить последовательность или переходить по шагам вручную.">
      <div className="flex flex-col gap-2 rounded-[var(--radius-pk-lg)] border border-line bg-raised p-3 sm:p-4">
        {controls}
        {stepLine}
      </div>

      {/* desktop: SVG diagram */}
      <Panel flush className="hidden overflow-hidden xl:block">
        <svg viewBox="0 0 1100 500" className="block h-auto w-full select-none" role="group" aria-label="Схема взаимодействия компонентов">
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
            </marker>
          </defs>
          {edges.map((e) => {
            const g = geo(e)
            const active = curEdge?.id === e.id
            const done = doneEdges.has(e.id)
            const dim = !!focus && e.a !== focus && e.b !== focus
            const lit = !!focus && !dim
            const stroke = active ? 'var(--pk-accent)' : lit ? 'var(--pk-fg)' : done ? 'var(--pk-accent)' : 'var(--pk-line-strong)'
            const lw = Math.max(46, e.proto.length * 7.2 + 18)
            return (
              <g key={e.id} opacity={dim ? 0.25 : done && !active ? 0.7 : 1} style={{ transition: 'opacity .2s' }}>
                <path d={pathOf(g)} fill="none" stroke={stroke} strokeWidth={active ? 2.5 : 1.5} markerEnd="url(#arr)"
                  strokeDasharray={active && !reduced ? '6 6' : undefined} className={active && !reduced ? 'pk-flow' : undefined} />
                {active && !reduced && cur && (
                  <circle key={`${scenario}-${step}`} r="6" fill="var(--pk-accent)">
                    <animateMotion dur="1.3s" repeatCount="indefinite" path={pathOf(g, cur.from !== e.a)} />
                  </circle>
                )}
                <g transform={`translate(${g.mid[0]},${g.mid[1]})`}>
                  <rect x={-lw / 2} y={-11} width={lw} height={22} rx={11} fill="var(--pk-bg)" stroke={active ? 'var(--pk-accent)' : 'var(--pk-line)'} />
                  <text textAnchor="middle" dominantBaseline="central" fontSize="11.5" fill={active ? 'var(--pk-fg)' : 'var(--pk-muted)'} fontFamily="var(--font-mono)">{e.proto}</text>
                </g>
              </g>
            )
          })}
          {nodes.map((n) => {
            const [x, y] = pos[n.id]
            const inStep = !!cur && (cur.from === n.id || cur.to === n.id)
            const isSel = selected === n.id
            return (
              <g key={n.id} transform={`translate(${x - W / 2},${y - H / 2})`} role="button" tabIndex={0}
                aria-label={`${n.title}: ${n.sub}`} aria-pressed={isSel}
                opacity={related(n.id) ? 1 : 0.3} style={{ transition: 'opacity .2s', cursor: 'pointer', outline: 'none' }}
                onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(n.id)} onBlur={() => setHover(null)}
                onClick={() => setSelected(n.id)}
                onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setSelected(n.id) } }}
                className="group">
                <rect width={W} height={H} rx={9} fill={inStep ? 'var(--pk-accent-weak)' : 'var(--pk-raised)'}
                  stroke={inStep || isSel ? 'var(--pk-accent)' : 'var(--pk-line-strong)'} strokeWidth={inStep || isSel ? 2 : 1}
                  className="transition-[stroke] group-focus-visible:stroke-[var(--pk-accent)]" />
                <text x={12} y={27} fontSize="13.5" fontWeight={600} fill="var(--pk-fg)">{n.title}</text>
                <text x={12} y={47} fontSize="12" fill="var(--pk-muted)">{n.sub}</text>
              </g>
            )
          })}
        </svg>
      </Panel>

      {/* below xl: vertical stacked diagram */}
      <ol className="flex flex-col xl:hidden" aria-label="Схема взаимодействия, сверху вниз">
        {stackOrder.map((id, i) => {
          const n = byId[id]
          const next = stackOrder[i + 1]
          const link = next ? edgeBetween(id, next) : undefined
          const others = edges.filter((e) => (e.a === id || e.b === id) && e.id !== link?.id && e.id !== (i > 0 ? edgeBetween(stackOrder[i - 1], id)?.id : undefined))
          const inStep = !!cur && (cur.from === id || cur.to === id)
          const linkActive = !!link && curEdge?.id === link.id
          const down = linkActive && cur?.from === id
          const open = selected === id
          return (
            <li key={id} className="flex flex-col">
              <button onClick={() => setSelected(id)} aria-expanded={open}
                className={cn('flex min-h-14 flex-col gap-1 rounded-[var(--radius-pk)] border bg-raised px-4 py-3 text-left transition-colors active:bg-surface',
                  inStep ? 'border-accent bg-accent-weak' : open ? 'border-line-strong' : 'border-line')}>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-fg">{n.title}</span>
                  <span className="text-xs text-muted">{n.sub}</span>
                </span>
                {others.length > 0 && (
                  <span className="flex flex-wrap gap-1.5">
                    {others.map((e) => {
                      const peer = e.a === id ? e.b : e.a
                      const act = curEdge?.id === e.id
                      return <span key={e.id} className={cn('rounded-full border px-2 py-0.5 text-[11px]', act ? 'border-accent text-fg' : 'border-line text-muted')}>↔ {byId[peer].title} · {e.proto}</span>
                    })}
                  </span>
                )}
                {open && (
                  <span className="mt-1 flex flex-col gap-1.5 border-t border-line pt-2 text-xs text-muted">
                    <span>{n.role}</span>
                    <span className="text-fg">{n.parts.join(' · ')}</span>
                    <span className="flex gap-1.5"><Shield className="mt-px size-3.5 shrink-0 text-ok" />{n.security}</span>
                  </span>
                )}
              </button>
              {next && (
                <div className="flex h-11 items-center gap-3 pl-6" aria-hidden={!link}>
                  <span className={cn('relative h-full w-px', link ? (linkActive ? 'bg-accent' : 'bg-line-strong') : 'bg-transparent')}>
                    {linkActive && !reduced && <span className={cn('absolute left-1/2 size-2 -translate-x-1/2 rounded-full bg-accent', down ? 'pk-drop' : 'pk-rise')} />}
                  </span>
                  {link && <span className={cn('font-mono text-[11px]', linkActive ? 'text-fg' : 'text-muted')}>{linkActive ? (down ? '↓ ' : '↑ ') : ''}{link.proto}</span>}
                </div>
              )}
            </li>
          )
        })}
      </ol>
      </Section>

      <Section id="steps" title="Шаги и компоненты" description="Шаг выбирает поток на схеме. Узел на схеме открывает его описание.">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <Panel flush>
          <SectionHeader className="border-b border-line p-4" title={scenarios[scenario].label} description={`${steps.length} шагов от запроса до результата`} />
          <div className="p-4"><Steps>
            {steps.map((s, i) => (
              <StepBlock key={i} n={i + 1} title={<>{byId[s.from].title} → {byId[s.to].title}</>}
                state={i === step ? 'current' : i < step ? 'done' : 'todo'} last={i === steps.length - 1}
                onClick={() => { setPlaying(false); setStep(i) }}>
                <span className="mb-1 block font-mono text-xs text-fg/75">{s.proto}</span>{s.text}
              </StepBlock>
            ))}
          </Steps></div>
        </Panel>
        <Panel flush className="hidden h-fit xl:block">
          <SectionHeader className="border-b border-line p-4" title={node.title} description={node.sub}  />
          <div className="flex flex-col gap-3 p-4 text-sm">
            <p className="text-muted">{node.role}</p>
            <div>
              <div className="mb-1 text-xs text-faint">Компоненты</div>
              <ul className="flex flex-wrap gap-1.5">{node.parts.map((p) => <li key={p}><Chip tone="neutral">{p}</Chip></li>)}</ul>
            </div>
            <div>
              <div className="mb-1 text-xs text-faint">Связи</div>
              <ul className="flex flex-col">
                {edges.filter((e) => e.a === node.id || e.b === node.id).map((e) => {
                  const peer = e.a === node.id ? e.b : e.a
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-3 border-b border-dashed border-line py-1.5 last:border-0">
                      <button className="text-fg hover:underline" onClick={() => setSelected(peer)}>{byId[peer].title}</button>
                      <span className="text-right text-xs text-muted"><span className="font-mono">{e.proto}</span> · {e.note}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
            <p className="flex gap-2 text-xs text-muted"><Shield className="size-4 shrink-0 text-ok" />{node.security}</p>
          </div>
        </Panel>
      </div>

      </Section>
      <Section id="sequence" title="Последовательность" description="Те же шаги таблицей — для чтения с экранным диктором и печати.">
        <DataList columns={seqCols} rows={steps.map((s, i) => ({ ...s, n: i + 1 }))} rowKey={(s) => String(s.n)}
          footer="Демо-архитектура: ни один компонент не подключён к реальным машинам." />
      </Section>
      <Callout tone="note" title="Демонстрационная архитектура">Ни один компонент не подключён к реальным машинам. Схема показывает проектную последовательность команд, не состояние работающей инфраструктуры.</Callout>
    </>
  )
}
