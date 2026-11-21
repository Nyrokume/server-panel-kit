import * as React from 'react'
import { Select as S, Switch as SW, Tabs as TB, ToggleGroup as TG } from 'radix-ui'
import { cn } from './cn'
import { Check, ChevronDown } from 'lucide-react'

/* ---------------------------------------------------------------- Select */
export function Select({ value, onValueChange, children, className, ariaLabel }: {
  value?: string; onValueChange?: (v: string) => void; children: React.ReactNode; className?: string; ariaLabel?: string
}) {
  return (
    <S.Root value={value} onValueChange={onValueChange}>
      <S.Trigger aria-label={ariaLabel} className={cn('inline-flex h-9 min-w-0 items-center justify-between gap-2 rounded-[var(--radius-pk)] border border-line bg-raised px-3 text-sm text-fg outline-none transition-colors hover:bg-surface focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-[var(--pk-ring)] data-[placeholder]:text-faint', className)}>
        <span className="min-w-0 truncate"><S.Value /></span>
        <S.Icon className="shrink-0"><ChevronDown className="size-4 text-muted" /></S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content position="popper" sideOffset={6} className="pk-pop z-50 max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--radius-pk)] border border-line bg-raised p-1 shadow-lg">
          <S.Viewport className="pk-scroll">{children}</S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  )
}
export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <S.Item value={value} className="relative flex cursor-pointer select-none items-center rounded-md py-1.5 pl-2 pr-7 text-sm text-fg outline-none data-[highlighted]:bg-surface data-[state=checked]:text-accent">
      <S.ItemText>{children}</S.ItemText>
      <S.ItemIndicator className="absolute right-2"><Check className="size-4" /></S.ItemIndicator>
    </S.Item>
  )
}

/* ---------------------------------------------------------------- Switch */
export function Switch({ checked, defaultChecked, onCheckedChange, id, ariaLabel }: {
  checked?: boolean; defaultChecked?: boolean; onCheckedChange?: (v: boolean) => void; id?: string; ariaLabel?: string
}) {
  return (
    <SW.Root id={id} aria-label={ariaLabel} checked={checked} defaultChecked={defaultChecked} onCheckedChange={onCheckedChange}
      className="peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-line-strong transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-ring)] data-[state=checked]:bg-accent">
      <SW.Thumb className="pointer-events-none block size-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[18px]" />
    </SW.Root>
  )
}

/* ------------------------------------------------------------------ Tabs */
export function Tabs({ value, defaultValue, onValueChange, children, className }: {
  value?: string; defaultValue?: string; onValueChange?: (v: string) => void; children: React.ReactNode; className?: string
}) {
  return <TB.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} className={cn('flex flex-col gap-4', className)}>{children}</TB.Root>
}
export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  // keep the active tab visible when the list scrolls horizontally (mobile)
  React.useLayoutEffect(() => {
    const el = ref.current; const a = el?.querySelector<HTMLElement>('[data-state="active"]')
    if (!el || !a || el.scrollWidth <= el.clientWidth) return
    const l = a.offsetLeft - el.offsetLeft, r = l + a.offsetWidth
    if (l < el.scrollLeft || r > el.scrollLeft + el.clientWidth) el.scrollLeft = Math.max(0, l - 24)
  })
  return <TB.List ref={ref} className={cn('flex max-w-full items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-line pk-scroll', className)}>{children}</TB.List>
}
export function TabsTab({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TB.Trigger value={value} className="relative -mb-px min-h-11 shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm sm:min-h-9 text-muted outline-none transition-colors hover:text-fg focus-visible:text-fg data-[state=active]:border-accent data-[state=active]:text-fg">
      {children}
    </TB.Trigger>
  )
}
export function TabsPanel({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  return <TB.Content value={value} className={cn('outline-none', className)}>{children}</TB.Content>
}

/* -------------------------------------------------------- Segmented (filter) */
export function Segmented<T extends string>({ value, onValueChange, options, ariaLabel, className }: {
  value: T; onValueChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; ariaLabel?: string; className?: string
}) {
  return (
    <TG.Root type="single" value={value} aria-label={ariaLabel}
      onValueChange={(v) => { if (v) onValueChange(v as T) }}
      className={cn('inline-flex items-center gap-0.5 rounded-[var(--radius-pk)] border border-line bg-surface p-0.5', className)}>
      {options.map((o) => (
        <TG.Item key={o.value} value={o.value}
          className="inline-flex h-7 min-w-9 items-center justify-center whitespace-nowrap rounded-[5px] px-2.5 text-[13px] font-medium text-muted outline-none transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-[var(--pk-ring)] data-[state=on]:bg-raised data-[state=on]:text-fg data-[state=on]:shadow-sm">
          {o.label}
        </TG.Item>
      ))}
    </TG.Root>
  )
}
