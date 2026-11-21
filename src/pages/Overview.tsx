import { useEffect, useMemo, useState } from 'react'
import { FleetMap } from '@/components/app/fleet-map'
import { OverviewInspector } from '@/components/app/inspector'
import { InspectorSheet } from '@/components/app/workbench'
import { useAppState } from '@/lib/app-state'
import { useLive, fleetFor } from '@/lib/live'
import { alerts, machineById } from '@/lib/mock'
import { plural } from '@/lib/format'

export default function Overview() {
  const { tenant, setLastMachineId } = useAppState()
  const { samples, history } = useLive()
  const fleet = fleetFor(tenant)

  const stats = useMemo(() => {
    const online = fleet.filter((m) => m.status === 'online').length
    const warning = fleet.filter((m) => m.status === 'warning').length
    const live = fleet.filter((m) => m.status !== 'offline')
    const avg = (f: (id: string) => number) => (live.length ? live.reduce((s, m) => s + f(m.id), 0) / live.length : 0)
    return {
      online, warning, total: fleet.length,
      servers: fleet.filter((m) => m.kind === 'server').length,
      cpu: avg((id) => samples[id]?.cpu ?? 0),
      ram: avg((id) => samples[id]?.ram ?? 0),
      net: fleet.reduce((s, m) => s + (samples[m.id]?.net ?? 0), 0),
      leader: fleet.reduce((best, m) => (!best || m.bootAt < best.bootAt) ? m : best, fleet[0] ?? null),
      leaderUptime: fleet.length ? Math.max(...fleet.map((m) => (Date.now() - m.bootAt) / 1000)) : 0,
    }
  }, [fleet, samples])

  const series = useMemo(() => {
    const live = fleet.filter((m) => m.status !== 'offline')
    const len = live.reduce((n, m) => Math.max(n, (history[m.id] ?? []).length), 0)
    const avg = (key: 'cpu' | 'ram' | 'net') => Array.from({ length: len }, (_, i) => {
      let s = 0, c = 0
      for (const m of live) {
        const pt = history[m.id]?.[i]
        if (pt) { s += pt[key]; c++ }
      }
      return c ? s / c : 0
    })
    return { cpu: avg('cpu'), ram: avg('ram'), net: avg('net') }
  }, [fleet, history])

  const defaultId = useMemo(() => {
    const dc = fleet.find((m) => /контроллер домена/i.test(m.role))
    return dc?.id ?? fleet.find((m) => m.status !== 'offline')?.id ?? fleet[0]?.id ?? null
  }, [fleet])

  const [selectedId, setSelectedId] = useState<string | null>(defaultId)
  useEffect(() => {
    if (!selectedId || !fleet.some((m) => m.id === selectedId)) setSelectedId(defaultId)
  }, [defaultId, fleet, selectedId])
  const onSelect = (id: string | null) => {
    setSelectedId(id)
    if (id) setLastMachineId(id)
  }

  const selected = selectedId ? fleet.find((m) => m.id === selectedId) ?? machineById(selectedId) ?? null : null
  const openAlerts = alerts.filter((a) => !a.acked && (tenant === 'all' || machineById(a.machineId)?.tenantId === tenant))

  const inspector = (
    <OverviewInspector
      servers={stats.servers}
      stations={stats.total - stats.servers}
      leaderName={stats.leader?.name}
      leaderUptime={stats.leaderUptime}
      online={stats.online}
      total={stats.total}
      warning={stats.warning}
      cpu={stats.cpu}
      ram={stats.ram}
      net={stats.net}
      cpuSpark={series.cpu}
      ramSpark={series.ram}
      netSpark={series.net}
      openAlerts={openAlerts}
      selected={selected}
      sample={selected ? samples[selected.id] : undefined}
      machineName={(id) => machineById(id)?.name}
    />
  )

  return (
    <div className="relative flex min-h-0 flex-1">
      <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col pb-[calc(var(--pk-sheet-h,20rem)+var(--pk-tabbar))] lg:pb-0">
        <FleetMap fleet={fleet} selectedId={selectedId} onSelect={onSelect} className="min-h-0 flex-1" />
      </div>
      <div className="hidden w-[var(--pk-insp)] shrink-0 overflow-hidden border-l border-line lg:block">
        {inspector}
      </div>
      <InspectorSheet>{(open) => <OverviewInspector
        servers={stats.servers}
        stations={stats.total - stats.servers}
        leaderName={stats.leader?.name}
        leaderUptime={stats.leaderUptime}
        online={stats.online}
        total={stats.total}
        warning={stats.warning}
        cpu={stats.cpu}
        ram={stats.ram}
        net={stats.net}
        cpuSpark={series.cpu}
        ramSpark={series.ram}
        netSpark={series.net}
        openAlerts={openAlerts}
        selected={selected}
        sample={selected ? samples[selected.id] : undefined}
        machineName={(id) => machineById(id)?.name}
        compact={!open}
      />}</InspectorSheet>
      <span className="sr-only">{plural(stats.total, ['машина', 'машины', 'машин'])} на карте</span>
    </div>
  )
}
