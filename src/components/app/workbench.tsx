import { useState } from 'react'
import { cn } from '@/kit'
import { useMedia } from '@/hooks/use-media'

export function Workbench({
  children, inspector, className, flush,
}: {
  children: React.ReactNode
  inspector?: React.ReactNode
  className?: string
  flush?: boolean
}) {
  const wide = useMedia('(min-width: 1024px)')
  return (
    <div className={cn('flex min-h-0 flex-1', className)}>
      <div className={cn('min-w-0 flex-1 overflow-auto pk-scroll', flush ? '' : 'flex flex-col gap-5 p-4 pb-6 sm:p-6')}>
        {children}
        {!wide && inspector && (
          <div className="mt-4 overflow-hidden rounded-[var(--radius-pk)] border border-line lg:hidden">
            {inspector}
          </div>
        )}
      </div>
      {wide && inspector && (
        <div className="hidden w-[var(--pk-insp)] shrink-0 overflow-hidden border-l border-line lg:block">
          <div className="h-full overflow-y-auto pk-scroll">{inspector}</div>
        </div>
      )}
    </div>
  )
}

/** Нижняя шторка для обзора: короткий пик и разворот на таче. */
export function InspectorSheet({ children, label = 'Сводка парка' }: {
  children: React.ReactNode | ((open: boolean) => React.ReactNode)
  label?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-[var(--pk-tabbar)] z-20 flex flex-col overflow-hidden border-t border-line bg-bg/95 backdrop-blur lg:hidden',
        open ? 'max-h-[70dvh]' : 'h-auto max-h-[44dvh]',
      )}
      ref={(el) => {
        const host = el?.parentElement
        if (host && el) host.style.setProperty('--pk-sheet-h', `${el.offsetHeight}px`)
      }}
    >
      <button
        type="button"
        className="flex min-h-11 w-full flex-col items-center gap-1 px-3 pt-2 text-sm text-muted"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Свернуть сводку' : 'Развернуть сводку'}
      >
        <span className="h-1 w-10 rounded-full bg-line-strong" />
        <span className="sr-only">{label}</span>
      </button>
      <div className={cn('min-h-0', open && 'flex-1 overflow-y-auto pk-scroll')}>
        {typeof children === 'function' ? children(open) : children}
      </div>
    </div>
  )
}
