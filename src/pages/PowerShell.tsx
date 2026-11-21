import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageHeader, Select, SelectItem, NoticeBar, Terminal, type TermLine } from '@/kit'
import { useAppState } from '@/lib/app-state'
import { fleetFor, preferredMachine, useLive } from '@/lib/live'
import { machines } from '@/lib/mock'
import { runCommand, commandHints } from '@/lib/pwsh'
import { ShieldAlert } from 'lucide-react'
import { Workbench } from '@/components/app/workbench'
import { InspectorShell, InspectorHead, SelectedMachineCard } from '@/components/app/inspector'

const PS = 'PS C:\\Windows\\system32>'

export default function PowerShell() {
  const { tenant, lastMachineId, setLastMachineId } = useAppState()
  const { samples } = useLive()
  const [params, setParams] = useSearchParams()
  const fleet = fleetFor(tenant).filter((m) => m.status !== 'offline')
  const requested = params.get('machine')
  const requestedMachine = requested ? machines.find((m) => m.id === requested) : undefined
  const options = requestedMachine && !fleet.some((m) => m.id === requestedMachine.id)
    ? [requestedMachine, ...fleet]
    : fleet
  const initial = preferredMachine(options, requested ?? lastMachineId)?.id
  const [id, setId] = useState(initial)
  const machine = options.find((m) => m.id === id) ?? options[0]

  useEffect(() => {
    if (machine) setLastMachineId(machine.id)
  }, [machine, setLastMachineId])

  const seed = useMemo<TermLine[]>(() => {
    const now = Date.now()
    const out: TermLine[] = [{ id: 0, text: `Windows PowerShell — удалённая сессия\nПодключено к ${machine?.name ?? '—'} (${machine?.ip ?? ''}).`, at: now }]
    if (machine) for (const c of ['Get-ComputerInfo', 'Get-Service']) {
      const r = runCommand(c, machine)
      out.push({ id: out.length, prompt: PS, text: c, tone: 'cmd', at: now })
      if (r.out) out.push({ id: out.length, text: r.out, tone: r.tone === 'err' ? 'err' : r.tone === 'ok' ? 'ok' : 'out', at: now })
    }
    return out
  }, [machine])

  const pick = (next: string) => {
    setId(next)
    setLastMachineId(next)
    setParams({ machine: next }, { replace: true })
  }

  const inspector = (
    <InspectorShell>
      <InspectorHead title={machine ? `PowerShell · ${machine.name}` : 'PowerShell'}
        lead={machine ? undefined : 'Выберите машину в сети, чтобы открыть сессию.'} />
      {machine && <SelectedMachineCard machine={machine} sample={samples[machine.id]} />}
    </InspectorShell>
  )

  return (
    <Workbench inspector={inspector}>
    <>
      <PageHeader title="Консоль">
        <Select value={machine?.id} onValueChange={pick} ariaLabel="Машина" className="w-60">
          {options.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
        </Select>
      </PageHeader>

      <NoticeBar icon={ShieldAlert} tone="warn">
        Вывод имитируется, команды не доходят до машин
      </NoticeBar>

      <Terminal
        key={machine?.id}
        prompt={PS}
        seed={seed}
        hints={commandHints}
        placeholder="↑ ↓ история, Tab дополняет команду"
        quick={['Get-Process', 'Get-Service', 'Get-Disk', 'Get-ComputerInfo', 'Get-Uptime', 'Clear-Host']}
        run={(cmd) => { const r = machine ? runCommand(cmd, machine) : { out: '' }; return { out: r.out, tone: (r as { tone?: string }).tone === 'err' ? 'err' : (r as { tone?: string }).tone === 'ok' ? 'ok' : undefined } }}
      />
    </>
    </Workbench>
  )
}
