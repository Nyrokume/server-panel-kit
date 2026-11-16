import { Chip } from '@/kit'

export function SmartChip({ smart }: { smart: 'ok' | 'warn' | 'fail' }) {
  const m = { ok: ['ok', 'Исправен'], warn: ['warn', 'Износ'], fail: ['bad', 'Отказ'] } as const
  const [tone, label] = m[smart]
  return <Chip tone={tone}>{label}</Chip>
}

export function LevelChip({ level }: { level: 'crit' | 'warn' | 'info' }) {
  const m = { crit: ['bad', 'Критично'], warn: ['warn', 'Предупреждение'], info: ['neutral', 'Инфо'] } as const
  const [tone, label] = m[level]
  return <Chip tone={tone}>{label}</Chip>
}
