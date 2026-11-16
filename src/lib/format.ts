/* Port of design-base snippet 44-chart-format.js: ru-RU numbers, signed deltas with real minus, nice ticks. */
const MINUS = '\u2212'
const NBSP = '\u00a0'
const fixMinus = (s: string) => s.replace(/-/g, MINUS)

export function fmtNumber(v: number | null | undefined, { compact = false, digits, context = 'table' }: { compact?: boolean; digits?: number; context?: 'table' | 'prose' } = {}) {
  if (v == null || Number.isNaN(v)) return '—'
  const o: Intl.NumberFormatOptions = { useGrouping: context === 'prose' ? 'min2' : true }
  if (compact) { o.notation = 'compact'; o.maximumFractionDigits = digits ?? 1 }
  else if (digits != null) { o.minimumFractionDigits = 0; o.maximumFractionDigits = digits }
  return fixMinus(new Intl.NumberFormat('ru-RU', o).format(v))
}

/** ratio 0.123 → «12,3 %» */
export function fmtPercent(ratio: number | null | undefined, { digits = 1, signed = false } = {}) {
  if (ratio == null || Number.isNaN(ratio)) return '—'
  return fixMinus(new Intl.NumberFormat('ru-RU', { style: 'percent', maximumFractionDigits: digits, signDisplay: signed ? 'exceptZero' : 'auto' }).format(ratio))
}

/** value already in percent units: 42.3 → «42,3 %» */
export const pct = (v: number, digits = 0) => fmtNumber(v, { digits }) + NBSP + '%'

export type Delta = { text: string; dir: 'up' | 'down' | 'flat'; tone: 'good' | 'bad' | 'neutral'; sr: string }

export function fmtDelta(cur: number, prev: number, { kind = 'percent', digits = 1, goodWhen = 'up', unit = '', period = 'за час' }: { kind?: 'percent' | 'abs' | 'pp'; digits?: number; goodWhen?: 'up' | 'down'; unit?: string; period?: string } = {}): Delta {
  let d: number
  let text: string
  if (kind === 'pp') {
    const r = Number((cur - prev).toFixed(digits))
    text = r === 0 ? `0${NBSP}п.${NBSP}п.` : (r > 0 ? '+' : MINUS) + fmtNumber(Math.abs(r), { digits }) + `${NBSP}п.${NBSP}п.`
    d = r
  } else if (kind === 'abs') {
    d = Number((cur - prev).toFixed(digits))
    text = d === 0 ? '0' : (d > 0 ? '+' : MINUS) + fmtNumber(Math.abs(d), { digits }) + (unit ? NBSP + unit : '')
  } else {
    if (prev === 0) return { text: 'новое', dir: cur > 0 ? 'up' : 'flat', tone: 'neutral', sr: 'раньше было ноль' }
    const r = Number(((cur - prev) / Math.abs(prev)).toFixed(digits + 2))
    text = r === 0 ? `0${NBSP}%` : fmtPercent(r, { digits, signed: true })
    d = r
  }
  const dir = d > 0 ? 'up' : d < 0 ? 'down' : 'flat'
  const tone = dir === 'flat' ? 'neutral' : dir === goodWhen ? 'good' : 'bad'
  const word = dir === 'up' ? 'рост' : 'снижение'
  const sr = dir === 'flat' ? `без изменений ${period}` : `${word} на ${text.replace(/^[+\u2212]/, '')} ${period}`
  return { text, dir, tone, sr }
}

/** 1-2-5 ticks; zero baseline included by default (bars/areas). */
export function niceTicks(min: number, max: number, { count = 4, zero = true } = {}) {
  if (zero) { min = Math.min(0, min); max = Math.max(0, max) }
  if (min === max) max = min + 1
  const raw = (max - min) / Math.max(1, count)
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const out: number[] = []
  for (let t = lo; t <= hi + step / 2; t += step) out.push(Number(t.toPrecision(12)))
  return out
}

export function fmtBytes(gb: number) {
  if (gb >= 1024) return fmtNumber(gb / 1024, { digits: 1 }) + NBSP + 'ТБ'
  return fmtNumber(gb, { digits: gb < 10 ? 1 : 0 }) + NBSP + 'ГБ'
}

export function fmtUptime(sec: number) {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return d > 0 ? `${d}${NBSP}д ${h}${NBSP}ч` : `${h}${NBSP}ч ${m}${NBSP}мин`
}

export const fmtTime = (t: number) => new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(t)
export const fmtHM = (t: number) => new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(t)
export const fmtDateTime = (t: number) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(t)

export function ago(t: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 60) return `${s}${NBSP}с назад`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}${NBSP}мин назад`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}${NBSP}ч назад`
  return `${Math.round(h / 24)}${NBSP}д назад`
}

/** Russian plural: plural(5, ['машина','машины','машин']) */
export function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  if (b === 1) return forms[0]
  return forms[2]
}
