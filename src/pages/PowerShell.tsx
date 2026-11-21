import { useMemo, useState } from 'react'
import { PageHeader, Select, SelectItem, NoticeBar, Terminal, type TermLine } from '@/kit'
import { useAppState } from '@/lib/app-state'
import { fleetFor } from '@/lib/live'
import { runCommand, commandHints } from '@/lib/pwsh'
import { ShieldAlert } from 'lucide-react'

const PS = 'PS C:\\Windows\\system32>'

export default function PowerShell() {
  const { tenant } = useAppState()
  const fleet = fleetFor(tenant).filter((m) => m.status !== 'offline')
  const [id, setId] = useState(fleet[0]?.id)
  const machine = fleet.find((m) => m.id === id) ?? fleet[0]

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

  return (
    <>
      <PageHeader title="PowerShell" description="Веб-терминал удалённой сессии. История (↑/↓), автодополнение (Tab), вывод командлетов.">
        <Select value={machine?.id} onValueChange={setId} ariaLabel="Машина" className="w-60">
          {fleet.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
        </Select>
      </PageHeader>

      <NoticeBar icon={ShieldAlert} title="Демонстрационный режим" tone="warn">
        Терминал имитирует вывод. Ни одна команда не отправляется на реальную машину и ничего не меняет.
      </NoticeBar>

      <Terminal
        key={machine?.id}
        prompt={PS}
        seed={seed}
        hints={commandHints}
        quick={['Get-Process', 'Get-Service', 'Get-Disk', 'Get-ComputerInfo', 'Get-Uptime', 'Clear-Host']}
        run={(cmd) => { const r = machine ? runCommand(cmd, machine) : { out: '' }; return { out: r.out, tone: (r as { tone?: string }).tone === 'err' ? 'err' : (r as { tone?: string }).tone === 'ok' ? 'ok' : undefined } }}
      />
    </>
  )
}
