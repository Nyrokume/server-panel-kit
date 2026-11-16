import { useState } from 'react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, type buttonVariants } from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'

type Variant = VariantProps<typeof buttonVariants>['variant']

export function ConfirmAction({
  trigger, title, description, confirmLabel = 'Подтвердить', variant = 'destructive', onConfirm, confirmText,
}: {
  trigger: React.ReactNode
  title: string
  description: React.ReactNode
  confirmLabel?: string
  variant?: Variant
  onConfirm: () => void
  confirmText?: string // require typing this to enable (e.g. machine name)
}) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const locked = confirmText != null && typed.trim() !== confirmText
  return (
    <AlertDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTyped('') }}>
      <div onClick={() => setOpen(true)} className="contents">{trigger}</div>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {confirmText != null && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-input" className="text-sm text-muted-foreground">
              Введите <span className="font-mono font-medium text-foreground">{confirmText}</span> для подтверждения
            </label>
            <input id="confirm-input" value={typed} onChange={(e) => setTyped(e.target.value)}
              className="h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" autoComplete="off" />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant={variant} disabled={locked} onClick={() => { setOpen(false); onConfirm() }}>{confirmLabel}</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
