import { useMemo, useRef, useState } from 'react'
import { Button, DataList, ConfirmDialog, toast, type Column } from '@/kit'
import { filesFor, type FsNode } from '@/lib/admin-mock'
import type { Machine } from '@/lib/mock'
import { fmtNumber, ago } from '@/lib/format'
import { Folder, File, Upload, Download, Trash2, ChevronRight, ArrowUp } from 'lucide-react'

const size = (kb?: number) => (kb == null ? '—' : kb > 1048576 ? `${fmtNumber(kb / 1048576, { digits: 1 })} ГБ` : kb > 1024 ? `${fmtNumber(kb / 1024, { digits: 1 })} МБ` : `${fmtNumber(kb)} КБ`)

export function FilesTab({ machine }: { machine: Machine }) {
  const [root, setRoot] = useState<FsNode>(() => filesFor(machine))
  const [path, setPath] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dir = useMemo(() => path.reduce<FsNode>((n, p) => n.children!.find((c) => c.name === p)!, root), [root, path])
  const entries = [...(dir.children ?? [])].sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'dir' ? -1 : 1))

  const mutate = (fn: (children: FsNode[]) => FsNode[]) => {
    const clone = structuredClone(root) as FsNode
    const target = path.reduce<FsNode>((n, p) => n.children!.find((c) => c.name === p)!, clone)
    target.children = fn(target.children ?? [])
    setRoot(clone)
  }
  const onUpload = (files: FileList | null) => {
    if (!files?.length) return
    const add = [...files].map((f) => ({ name: f.name, kind: 'file' as const, sizeKb: Math.max(1, Math.round(f.size / 1024)), modified: Date.now() }))
    mutate((c) => [...c.filter((x) => !add.some((a) => a.name === x.name)), ...add])
    toast.success(`Загружено файлов: ${add.length}`, 'Демо: файлы остались в браузере и никуда не отправлялись.')
  }

  const cols: Column<FsNode>[] = [
    { key: 'name', header: 'Имя', primary: true, cell: (n) => (
      <span className="flex min-w-0 items-center gap-2">
        {n.kind === 'dir' ? <Folder className="size-4 shrink-0 text-accent" /> : <File className="size-4 shrink-0 text-muted" />}
        <span className="truncate font-medium text-fg">{n.name}</span>
      </span>
    ) },
    { key: 'size', header: 'Размер', align: 'right', cell: (n) => (n.kind === 'dir' ? `${n.children?.length ?? 0} эл.` : size(n.sizeKb)) },
    { key: 'modified', header: 'Изменён', cell: (n) => <span className="text-muted">{ago(n.modified)}</span> },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Путь" className="flex min-w-0 flex-wrap items-center gap-1 font-mono text-sm">
          <button className="rounded px-1.5 py-1 text-muted hover:bg-surface hover:text-fg pointer-coarse:min-h-11" onClick={() => setPath([])}>C:</button>
          {path.map((p, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="size-3.5 text-faint" />
              <button className="rounded px-1.5 py-1 text-muted hover:bg-surface hover:text-fg pointer-coarse:min-h-11" onClick={() => setPath(path.slice(0, i + 1))}>{p}</button>
            </span>
          ))}
        </nav>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!path.length} onClick={() => setPath(path.slice(0, -1))}><ArrowUp className="size-4" /> Вверх</Button>
          <Button variant="solid" size="sm" onClick={() => inputRef.current?.click()}><Upload className="size-4" /> Загрузить</Button>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { onUpload(e.target.files); e.target.value = '' }} />
        </div>
      </div>
      <DataList columns={cols} rows={entries} rowKey={(n) => n.name} empty="Папка пуста."
        onRowClick={(n) => n.kind === 'dir' && setPath([...path, n.name])}
        rowActions={(n) => n.kind === 'file' ? (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => toast.info(`Скачивание ${n.name}`, `${size(n.sizeKb)} · демо: файл не передаётся.`)}><Download className="size-4" /> <span className="hidden xl:inline">Скачать</span></Button>
            <ConfirmDialog trigger={<Button variant="ghost" size="sm" className="text-bad" aria-label={`Удалить ${n.name}`}><Trash2 className="size-4" /></Button>}
              title={`Удалить ${n.name}?`} confirmLabel="Удалить"
              description="Файл будет удалён без корзины. Демо: на машине ничего не удаляется."
              onConfirm={() => { mutate((c) => c.filter((x) => x.name !== n.name)); toast.warning(`${n.name} удалён`) }} />
          </div>
        ) : <ChevronRight className="ml-auto size-4 text-faint" />}
        footer={`C:\\${path.join('\\')} · ${entries.length} эл. Передача файлов идёт через агент по mTLS (демо).`} />
    </div>
  )
}
