import * as React from 'react'
import { Dialog as D, Tooltip as T, DropdownMenu as DM } from 'radix-ui'
import { cn } from './cn'
import { Button } from './primitives'
import { X } from 'lucide-react'

const overlayCls = 'pk-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]'

/* ---------------------------------------------------------------- Dialog */
export function Dialog({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (o: boolean) => void; children: React.ReactNode }) {
  return <D.Root open={open} onOpenChange={onOpenChange}>{children}</D.Root>
}
export const DialogTrigger = D.Trigger

export function DialogContent({ children, className, title, description, hideClose, size = 'md' }: {
  children: React.ReactNode; className?: string; title: string; description?: string; hideClose?: boolean; size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const w = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-5xl' }[size]
  return (
    <D.Portal>
      <D.Overlay className={overlayCls} />
      <D.Content
        className={cn(
          'fixed inset-0 z-50 m-auto h-fit w-[calc(100vw-2rem)]',
          'rounded-[var(--radius-pk)] border border-line bg-raised shadow-2xl shadow-black/20 outline-none',
          'max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col pk-pop', w, className,
        )}
      >
        <D.Title className="sr-only">{title}</D.Title>
        {description ? <D.Description className="sr-only">{description}</D.Description> : null}
        {children}
        {!hideClose && (
          <D.Close asChild>
            <button aria-label="Закрыть" className="absolute right-3 top-3 rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-fg"><X className="size-4" /></button>
          </D.Close>
        )}
      </D.Content>
    </D.Portal>
  )
}
export const DialogClose = D.Close

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5', className)}>{children}</div>
}
export function DialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto pk-scroll px-4 py-4 sm:px-5', className)}>{children}</div>
}
export function DialogTitleText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('text-base font-semibold text-fg', className)}>{children}</div>
}

/* --------------------------------------------------------- ConfirmDialog */
export function ConfirmDialog({ trigger, title, description, confirmLabel = 'Подтвердить', danger = true, onConfirm, confirmText }: {
  trigger: React.ReactNode; title: string; description: React.ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; confirmText?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [typed, setTyped] = React.useState('')
  const locked = confirmText != null && typed.trim() !== confirmText
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTyped('') }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={title} description={typeof description === 'string' ? description : title} size="sm" className="p-5">
        <div className="flex flex-col gap-3">
          <div className="text-base font-semibold text-fg">{title}</div>
          <div className="text-sm text-muted text-pretty">{description}</div>
          {confirmText != null && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pk-confirm" className="text-[13px] text-muted">
                Введите <span className="font-mono font-medium text-fg">{confirmText}</span> для подтверждения
              </label>
              <input id="pk-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off"
                className="h-9 rounded-[var(--radius-pk)] border border-line bg-bg px-3 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-[var(--pk-ring)]" />
            </div>
          )}
          <div className="mt-1 flex justify-end gap-2">
            <DialogClose asChild><Button variant="ghost">Отмена</Button></DialogClose>
            <Button variant={danger ? 'danger' : 'solid'} disabled={locked} onClick={() => { setOpen(false); onConfirm() }}>{confirmLabel}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ----------------------------------------------------------------- Sheet */
export function Sheet({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (o: boolean) => void; children: React.ReactNode }) {
  return <D.Root open={open} onOpenChange={onOpenChange}>{children}</D.Root>
}
export const SheetTrigger = D.Trigger
export function SheetContent({ children, side = 'left', title, description, className }: {
  children: React.ReactNode; side?: 'left' | 'right' | 'bottom'; title: string; description?: string; className?: string
}) {
  const pos = {
    left: 'left-0 top-0 h-dvh w-[min(84vw,20rem)] border-r',
    right: 'right-0 top-0 h-dvh w-[min(84vw,20rem)] border-l',
    bottom: 'inset-x-0 bottom-0 max-h-[85dvh] border-t rounded-t-xl',
  }[side]
  return (
    <D.Portal>
      <D.Overlay className={overlayCls} />
      <D.Content className={cn('fixed z-50 flex flex-col overflow-y-auto pk-scroll border-line bg-raised outline-none', pos, className)}>
        <D.Title className="sr-only">{title}</D.Title>
        {description ? <D.Description className="sr-only">{description}</D.Description> : null}
        {children}
      </D.Content>
    </D.Portal>
  )
}
export const SheetClose = D.Close

/* --------------------------------------------------------------- Tooltip */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <T.Provider delayDuration={200} skipDelayDuration={300}>{children}</T.Provider>
}
export function Tooltip({ content, children, side = 'bottom' }: { content: React.ReactNode; children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={side} sideOffset={6} className="pk-pop z-50 rounded-md border border-line bg-raised px-2 py-1 text-xs text-fg shadow-md">
          {content}
          <T.Arrow className="fill-[var(--pk-raised)]" />
        </T.Content>
      </T.Portal>
    </T.Root>
  )
}

/* ------------------------------------------------------------------ Menu */
export function Menu({ trigger, children, align = 'end', className }: { trigger: React.ReactNode; children: React.ReactNode; align?: 'start' | 'end'; className?: string }) {
  return (
    <DM.Root>
      <DM.Trigger asChild>{trigger}</DM.Trigger>
      <DM.Portal>
        <DM.Content align={align} sideOffset={6} className={cn('z-50 min-w-48 overflow-hidden rounded-[var(--radius-pk)] border border-line bg-raised p-1 shadow-lg', className)}>
          {children}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  )
}
export function MenuItem({ children, onSelect, danger, className }: { children: React.ReactNode; onSelect?: () => void; danger?: boolean; className?: string }) {
  return (
    <DM.Item onSelect={onSelect} className={cn('flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors focus:bg-surface data-[highlighted]:bg-surface', danger ? 'text-bad' : 'text-fg', className)}>
      {children}
    </DM.Item>
  )
}
export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <DM.Label className="px-2 py-1.5 text-xs text-muted">{children}</DM.Label>
}
export function MenuSeparator() { return <DM.Separator className="my-1 h-px bg-line" /> }
export function MenuRadioGroup({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  return <DM.RadioGroup value={value} onValueChange={onValueChange}>{children}</DM.RadioGroup>
}
export function MenuRadioItem({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <DM.RadioItem value={value} className="flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-surface data-[state=checked]:text-accent">
      {children}
    </DM.RadioItem>
  )
}
