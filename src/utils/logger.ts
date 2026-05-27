import { format } from 'date-fns'
import { formatStr } from './constants.js'

export function logInfo(message: string): void {
  console.info(`[${format(new Date(), formatStr)}] ${message}`)
}

export function logError(message: string): void {
  console.error(`[${format(new Date(), formatStr)}] ${message}`)
}
