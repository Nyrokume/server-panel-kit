import * as React from 'react'
import { cn } from './cn'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

/* Low-level table primitives (hairline rows, no boxed look). */
export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return <table className={cn('w-full border-collapse text-sm', className)}>{children}</table>
}
export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-surface/70 [&_th]:border-b [&_th]:border-line">{children}</thead>
}
export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="[&_tr]:border-b [&_tr]:border-line [&_tr:last-child]:border-0">{children}</tbody>
}
export function TR({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <tr className={cn(onClick && 'cursor-pointer transition-colors hover:bg-surface/70 active:bg-surface', className)} onClick={onClick}>{children}</tr>
}
export function TH({ children, className, align = 'left' }: { children?: React.ReactNode; className?: string; align?: 'left' | 'right' }) {
  return <th className={cn('px-3 py-2 text-[13px] font-semibold text-fg/80', align === 'right' ? 'text-right' : 'text-left', className)}>{children}</th>
}
export function TD({ children, className, align = 'left' }: { children?: React.ReactNode; className?: string; align?: 'left' | 'right' }) {
  return <td className={cn('px-3 py-2.5 align-middle', align === 'right' && 'text-right tnum', className)}>{children}</td>
}

export function SortHeader({ label, active, dir, onClick, align = 'left' }: { label: React.ReactNode; active?: boolean; dir?: 1 | -1; onClick?: () => void; align?: 'left' | 'right' }) {
  return (
    <button onClick={onClick} className={cn('group inline-flex items-center gap-1 whitespace-nowrap font-medium transition-colors hover:text-fg', active ? 'text-fg' : 'text-muted', align === 'right' && 'flex-row-reverse')}>
      {label}
      {active ? (dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ChevronsUpDown className="size-3 opacity-50" />}
    </button>
  )
}

/* ---------------------------------------------------------------- DataList
   Responsive data grid: real <table> at md+, stacked row-cards below.
   Give columns once; it renders both presentations from the same config. */
export type Column<T> = {
  key: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  align?: 'left' | 'right'
  sortable?: boolean
  primary?: boolean          // title line in the mobile card
  meta?: boolean             // secondary line under the title in mobile card
  tableOnly?: boolean        // show only in table (hidden in mobile card)
  hideBelow?: 'sm' | 'lg'    // hide this column in table on smaller widths
  wide?: boolean             // span both columns in the mobile card
  thClassName?: string
  tdClassName?: string
}

export function DataList<T>({ columns, rows, rowKey, onRowClick, sortKey, sortDir, onSort, empty, footer, rowActions }: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  sortKey?: string
  sortDir?: 1 | -1
  onSort?: (key: string) => void
  empty?: React.ReactNode
  footer?: React.ReactNode
  rowActions?: (row: T) => React.ReactNode
}) {
  const hideCls = (c: Column<T>) => (c.hideBelow === 'sm' ? 'hidden sm:table-cell' : c.hideBelow === 'lg' ? 'hidden lg:table-cell' : '')
  const primary = columns.find((c) => c.primary)
  const meta = columns.find((c) => c.meta)
  const cardCols = columns.filter((c) => !c.primary && !c.meta && !c.tableOnly)

  return (
    <div className="overflow-hidden rounded-[var(--radius-pk-lg)] border border-line bg-raised">
      {/* table view (md+) */}
      <div className="hidden overflow-x-auto pk-scroll md:block">
        <Table>
          <THead>
            <tr className="border-b border-line">
              {columns.map((c) => (
                <TH key={c.key} align={c.align} className={cn(hideCls(c), c.thClassName)}>
                  {c.sortable && onSort ? <SortHeader label={c.header} active={sortKey === c.key} dir={sortDir} align={c.align} onClick={() => onSort(c.key)} /> : c.header}
                </TH>
              ))}
              {rowActions && <TH align="right" />}
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined}>
                {columns.map((c) => (
                  <TD key={c.key} align={c.align} className={cn(hideCls(c), c.tdClassName)}>{c.cell(r)}</TD>
                ))}
                {rowActions && <TD align="right" className="whitespace-nowrap">{rowActions(r)}</TD>}
              </TR>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + (rowActions ? 1 : 0)} className="py-10 text-center text-muted">{empty ?? 'Ничего не найдено.'}</td></tr>
            )}
          </TBody>
        </Table>
      </div>

      {/* card view (mobile) */}
      <ul className="divide-y divide-line md:hidden">
        {rows.map((r) => (
          <li key={rowKey(r)} className={cn('flex flex-col gap-2 p-4', onRowClick && 'cursor-pointer transition-colors active:bg-surface hover:bg-surface/60')} onClick={onRowClick ? () => onRowClick(r) : undefined}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {primary && <div className="font-medium text-fg">{primary.cell(r)}</div>}
                {meta && <div className="mt-0.5 text-xs text-muted">{meta.cell(r)}</div>}
              </div>
              {rowActions && <div onClick={(e) => e.stopPropagation()} className="shrink-0">{rowActions(r)}</div>}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {cardCols.map((c) => (
                <div key={c.key} className={cn('flex min-w-0 flex-col gap-0.5', c.wide && 'col-span-2')}>
                  <dt className="text-xs text-muted">{c.header}</dt>
                  <dd className={cn('text-sm text-fg', c.align === 'right' && 'tnum')}>{c.cell(r)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
        {rows.length === 0 && <li className="py-10 text-center text-muted">{empty ?? 'Ничего не найдено.'}</li>}
      </ul>
      {footer && <div className="border-t border-line bg-surface/40 px-4 py-2.5 text-xs text-muted">{footer}</div>}
    </div>
  )
}
