import { useEffect, useState } from 'react'

export function useMedia(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const on = () => setMatches(mql.matches)
    on()
    mql.addEventListener('change', on)
    return () => mql.removeEventListener('change', on)
  }, [query])
  return matches
}

export function usePrefersReducedMotion() {
  return useMedia('(prefers-reduced-motion: reduce)')
}

/** Keyboard shortcut hint: ⌘K on Apple, Ctrl K elsewhere. */
export function useShortcutHint() {
  const [hint, setHint] = useState('Ctrl K')
  useEffect(() => {
    const mac = /Mac|iPhone|iPad|iPod/.test(navigator.platform) || /Mac OS X|iPhone|iPad/.test(navigator.userAgent)
    setHint(mac ? '⌘K' : 'Ctrl K')
  }, [])
  return hint
}
