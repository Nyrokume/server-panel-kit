import * as React from 'react'
import { Slot } from 'radix-ui'
import { cn } from './cn'

/* ---------------------------------------------------------------- Button */
type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'danger' | 'link'
type ButtonSize = 'sm' | 'md' | 'lg'

const btnBase =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pk)] font-medium ' +
  'transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out select-none ' +
  'focus-visible:outline-2 focus-visible:outline-[var(--pk-ring)] focus-visible:outline-offset-2 ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0'

const btnVariants: Record<ButtonVariant, string> = {
  solid: 'bg-fg text-bg hover:opacity-90',
  outline: 'border border-line-strong text-fg hover:bg-surface',
  ghost: 'text-fg hover:bg-surface',
  danger: 'bg-bad text-white hover:opacity-90',
  link: 'text-fg underline-offset-4 hover:underline px-0 h-auto',
}
const btnSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-[13px]',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-[15px]',
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'outline', size = 'md', asChild, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'button'
    return <Comp ref={ref} className={cn(btnBase, btnVariants[variant], variant !== 'link' && btnSizes[size], className)} {...props} />
  },
)
Button.displayName = 'Button'

/* ------------------------------------------------------------- IconButton */
export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  label: string
  asChild?: boolean
}
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', label, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'button'
    return (
      <Comp
        ref={ref} aria-label={label} title={label}
        className={cn(btnBase, btnVariants[variant], size === 'sm' ? 'size-8' : 'size-9', 'px-0', className)}
        {...props}
      />
    )
  },
)
IconButton.displayName = 'IconButton'

/* ------------------------------------------------------------------ Input */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full min-w-0 rounded-[var(--radius-pk)] border border-line bg-raised px-3 text-sm text-fg',
        'placeholder:text-faint transition-colors outline-none',
        'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-[var(--pk-ring)]',
        'aria-[invalid=true]:border-bad disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('min-h-20 w-full rounded-[var(--radius-pk)] border border-line bg-raised px-3 py-2 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-[var(--pk-ring)]', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'

/* --------------------------------------------------------------- Field */
export function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor?: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------- Kbd */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <kbd className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-surface px-1 font-mono text-[10px] text-muted', className)}>{children}</kbd>
}

/* ----------------------------------------------------------------- Chip/Badge */
type ChipTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'bad'
const chipTones: Record<ChipTone, string> = {
  neutral: 'text-muted border-line',
  accent: 'text-accent border-[color-mix(in_oklab,var(--pk-accent)_40%,transparent)]',
  ok: 'text-ok border-[color-mix(in_oklab,var(--pk-ok)_40%,transparent)]',
  warn: 'text-warn border-[color-mix(in_oklab,var(--pk-warn)_40%,transparent)]',
  bad: 'text-bad border-[color-mix(in_oklab,var(--pk-bad)_45%,transparent)]',
}
export function Chip({ children, tone = 'neutral', className }: { children: React.ReactNode; tone?: ChipTone; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap tnum', chipTones[tone], className)}>{children}</span>
}

/* --------------------------------------------------------------- StatusDot */
export type DotStatus = 'online' | 'warning' | 'offline'
const dotMeta: Record<DotStatus, { label: string; color: string; text: string }> = {
  online: { label: 'В сети', color: 'var(--pk-ok)', text: 'text-ok' },
  warning: { label: 'Внимание', color: 'var(--pk-warn)', text: 'text-warn' },
  offline: { label: 'Офлайн', color: 'var(--pk-off)', text: 'text-faint' },
}
export function StatusDot({ status, withLabel = true, className }: { status: DotStatus; withLabel?: boolean; className?: string }) {
  const m = dotMeta[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', className)}>
      <span className="size-2.5 shrink-0 rounded-full border-[2.5px]" style={{ borderColor: m.color }} aria-hidden />
      {withLabel && <span className={cn('text-sm', m.text)}>{m.label}</span>}
    </span>
  )
}

/* --------------------------------------------------------------- Divider */
export function Divider({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div role="separator" className={cn(vertical ? 'w-px self-stretch' : 'h-px w-full', 'bg-line', className)} />
}

/* ------------------------------------------------------------- Spinner */
export function Spinner({ className }: { className?: string }) {
  return <span className={cn('inline-block size-4 animate-spin rounded-full border-2 border-line border-t-accent', className)} aria-hidden />
}

/* --------------------------------------------------------- UsageBar (meter) */
export function UsageBar({ value, danger = 90, warn = 75, className, showValue = true }: { value: number; danger?: number; warn?: number; className?: string; showValue?: boolean }) {
  const color = value >= danger ? 'var(--pk-bad)' : value >= warn ? 'var(--pk-warn)' : 'var(--pk-c1)'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" role="meter" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
      {showValue && <span className="w-10 shrink-0 text-right text-xs text-muted tnum">{Math.round(value)} %</span>}
    </div>
  )
}
