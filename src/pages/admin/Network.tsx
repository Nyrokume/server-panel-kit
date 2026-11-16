import { useMemo, useState } from 'react'
import { Panel, SectionHeader, InfoRow, Chip, StatusDot, Switch, DataList, ConfirmDialog, Table, THead, TBody, TR, TH, TD, toast, type Column } from '@/kit'
import { networkFor, type FwRule } from '@/lib/admin-mock'
import type { Machine } from '@/lib/mock'
import { fmtNumber } from '@/lib/format'

/** Rules whose loss would cut the operator off from this machine. */
const lifeline = new Set(['winrm', 'agent'])

export function NetworkTab({ machine }: { machine: Machine }) {
  const net = useMemo(() => networkFor(machine), [machine])
  const [rules, setRules] = useState<FwRule[]>(net.rules)
  const [pending, setPending] = useState<FwRule | null>(null)
  const apply = (r: FwRule, v: boolean) => { setRules((l) => l.map((x) => (x.id === r.id ? { ...x, enabled: v } : x))); toast.info(`Правило «${r.name}» ${v ? 'включено' : 'отключено'}`, 'Демо: брандмауэр машины не изменён.') }

  const cols: Column<FwRule>[] = [
    { key: 'name', header: 'Правило', primary: true, cell: (r) => <span className="text-fg">{r.name}</span> },
    { key: 'dir', header: 'Направление', meta: true, cell: (r) => <span className="text-muted">{r.dir === 'in' ? 'Входящее' : 'Исходящее'} · порт {r.ports}</span> },
    { key: 'action', header: 'Действие', cell: (r) => (r.action === 'allow' ? <Chip tone="ok">разрешить</Chip> : <Chip tone="bad">блокировать</Chip>) },
    { key: 'enabled', header: 'Включено', cell: (r) => (
      <span onClick={(e) => e.stopPropagation()}>
        <Switch checked={r.enabled} ariaLabel={`Правило ${r.name}`} onCheckedChange={(v) => (!v && lifeline.has(r.id) ? setPending(r) : apply(r, v))} />
      </span>
    ) },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {net.adapters.map((a) => (
          <Panel key={a.name} flush className="p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="min-w-0"><div className="truncate text-sm font-semibold text-fg">{a.name}</div><div className="truncate text-xs text-muted">{a.kind}</div></div>
              <StatusDot status={a.up ? 'online' : 'offline'} />
            </div>
            <InfoRow k="IPv4" v={<span className="font-mono text-xs">{a.ip}</span>} />
            <InfoRow k="MAC" v={<span className="font-mono text-xs">{a.mac}</span>} />
            <InfoRow k="Скорость" v={a.speed} />
            <InfoRow k="Принято / отправлено" v={`${fmtNumber(a.rxMb)} / ${fmtNumber(a.txMb)} МБ`} />
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Panel flush>
          <SectionHeader className="border-b border-line p-4" title="Открытые порты" description="Прослушиваемые сокеты (netstat -ano)" />
          <div className="overflow-x-auto pk-scroll">
            <Table>
              <THead><tr className="border-b border-line"><TH className="pl-4">Порт</TH><TH>Процесс</TH><TH className="pr-4">Адрес</TH></tr></THead>
              <TBody>
                {net.ports.map((p) => (
                  <TR key={p.proto + p.port}>
                    <TD className="pl-4 font-mono text-xs">{p.proto} {p.port}</TD>
                    <TD className="text-muted">{p.process}</TD>
                    <TD className="pr-4 font-mono text-xs text-muted">{p.addr}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Panel>
        <section className="flex flex-col gap-3">
          <SectionHeader title="Правила брандмауэра" description="Отключение правил WinRM и агента отрежет машину от пульта — потребуется подтверждение." />
          <DataList columns={cols} rows={rules} rowKey={(r) => r.id} />
        </section>
      </div>

      <ConfirmDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}
        title={`Отключить «${pending?.name ?? ''}»?`} confirmLabel="Отключить правило" confirmText={machine.name}
        description="После отключения пульт может потерять связь с машиной, и вернуть правило удалённо будет нельзя. Введите имя машины для подтверждения. Демо: брандмауэр не изменяется."
        onConfirm={() => { if (pending) apply(pending, false); setPending(null) }} />
    </div>
  )
}
