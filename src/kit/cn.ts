import { clsx, type ClassValue } from 'clsx'
/** Panel-kit class combiner. Last-wins is the author's responsibility; kept tiny on purpose. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
