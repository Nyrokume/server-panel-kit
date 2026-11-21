import { useMemo, useState } from 'react'
import {
  PageHeader, Select, SelectItem, Callout, Terminal, type TermLine,
  DocPage, Section, CodeBlock, Button, Steps, Step, Panel, InfoRow,
} from '@/kit'
import { useAppState } from '@/lib/app-state'
import { fleetFor } from '@/lib/live'
import { runCommand, commandHints } from '@/lib/pwsh'
import { CornerDownLeft } from 'lucide-react'

const PS = 'PS C:\\Windows\\system32>'
const toc = [
  { id: 'session', label: 'Терминал' },
  { id: 'commands', label: 'Готовые команды' },
  { id: 'session-info', label: 'Параметры сессии' },
  { id: 'how', label: 'Работа с сессией' },
]
const cmds = [
  { label: 'Процессы', code: 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 10' },
  { label: 'Службы', code: 'Get-Service' },
  { label: 'Накопители', code: 'Get-Disk' },
  { label: 'Система', code: 'Get-ComputerInfo' },
  { label: 'Сеть', code: 'Get-NetIPAddress' },
]

export default function PowerShell() {
  const { tenant } = useAppState()
  const fleet = fleetFor(tenant).filter((m) => m.status !== 'offline')
  const [id, setId] = useState(fleet[0]?.id)
  const machine = fleet.find((m) => m.id === id) ?? fleet[0]
  const [inject, setInject] = useState<{ cmd: string; n: number }>()

  const seed = useMemo<TermLine[]>(() => {
    const now = Date.now()
    const out: TermLine[] = [{ id: 0, text: `Windows PowerShell — удалённая сессия (демо)\nПодключено к ${machine?.name ?? '—'} (${machine?.ip ?? ''}). Команды не выполняются на реальной машине.\nВведите Get-Help для списка командлетов.`, at: now }]
    if (machine) for (const c of ['Get-ComputerInfo', 'Get-Service']) {
      const r = runCommand(c, machine)
      out.push({ id: out.length, prompt: PS, text: c, tone: 'cmd', at: now })
      if (r.out) out.push({ id: out.length, text: r.out, tone: r.tone === 'err' ? 'err' : r.tone === 'ok' ? 'ok' : 'out', at: now })
    }
    return out
  }, [machine])

  const paste = (cmd: string) => {
    setInject((i) => ({ cmd, n: (i?.n ?? 0) + 1 }))
    document.getElementById('session')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return (
    <DocPage toc={toc} header={
      <PageHeader title="PowerShell" description="Удалённая сессия с выбранной машиной. История команд, автодополнение и вывод командлетов — в браузере.">
        <Select value={machine?.id} onValueChange={setId} ariaLabel="Машина" className="w-60 max-w-full">
          {fleet.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
        </Select>
      </PageHeader>
    }>
      <Callout tone="warn" title="Демонстрационный режим">Терминал имитирует вывод. Ни одна команда не отправляется на реальную машину и ничего не меняет.</Callout>

      <Section id="session" title="Терминал" description={`${machine?.name ?? 'Нет машины'} · ${machine?.ip ?? ''} · ${machine?.os ?? ''}`}>
        <Terminal key={machine?.id} prompt={PS} seed={seed} hints={commandHints} inject={inject} title={`PowerShell — ${machine?.name ?? 'сессия'}`}
          quick={['Get-Process', 'Get-Service', 'Get-Disk', 'Get-ComputerInfo', 'Get-Uptime', 'Clear-Host']}
          run={(cmd) => { const r = machine ? runCommand(cmd, machine) : { out: '' }; return { out: r.out, tone: (r as { tone?: string }).tone === 'err' ? 'err' : (r as { tone?: string }).tone === 'ok' ? 'ok' : undefined } }} />
      </Section>

      <Section id="commands" title="Готовые команды" description="Скопируйте команду или вставьте её в строку терминала. Вставка не запускает команду автоматически.">
        <CodeBlock tabs={cmds} actions={(code) => <Button variant="ghost" size="sm" onClick={() => paste(code)}><CornerDownLeft />В терминал</Button>} />
        <Callout tone="note">В демонстрации поддерживается ограниченный набор командлетов; полный список — <code className="font-mono text-xs">Get-Help</code>.</Callout>
      </Section>

      <Section id="session-info" title="Параметры сессии">
        <Panel className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <div><InfoRow k="Машина" v={machine?.name ?? '—'} /><InfoRow k="ОС" v={machine?.os ?? '—'} /><InfoRow k="Адрес" v={<code className="font-mono text-xs">{machine?.ip ?? '—'}</code>} /></div>
          <div><InfoRow k="PowerShell" v="7.4" /><InfoRow k="Агент" v={machine ? `v${machine.agent}` : '—'} /><InfoRow k="Режим" v="Локальная имитация" /></div>
        </Panel>
      </Section>

      <Section id="how" title="Работа с сессией">
        <Steps>
          <Step n={1} title="Выберите машину">В списке — только машины в сети. При переключении история терминала начинается заново.</Step>
          <Step n={2} title="Введите или вставьте команду">Enter выполняет команду. Tab дополняет название, ↑ и ↓ перемещают по истории.</Step>
          <Step n={3} title="Сохраните результат" last>Кнопка копирования в шапке терминала забирает весь вывод. «Очистить экран» удаляет его из текущей сессии.</Step>
        </Steps>
      </Section>
    </DocPage>
  )
}
