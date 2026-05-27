import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { addMinutes, addSeconds, isBefore, isValid, parseISO } from 'date-fns'
import type { TokenState } from '../types.js'

const tokenPath = resolve('session/token.json')

export function saveToken(token: string, expiresIn: number): void {
  mkdirSync(dirname(tokenPath), { recursive: true })

  const now = new Date()
  const state: TokenState = {
    token,
    updatedAt: now.toISOString(),
    expiresAt: addSeconds(now, expiresIn).toISOString(),
  }

  writeFileSync(tokenPath, JSON.stringify(state, null, 2))
}

export function readToken(): string {
  const raw = readFileSync(tokenPath, 'utf-8')
  const state: TokenState = JSON.parse(raw)
  return state.token
}

export function isTokenStale(): boolean {
  try {
    const raw = readFileSync(tokenPath, 'utf-8')
    const state: TokenState = JSON.parse(raw)
    if (!state.expiresAt) throw new Error('expiresAt missing')
    const expiresAt = parseISO(state.expiresAt)
    if (!isValid(expiresAt)) throw new Error('Invalid expiresAt')
    return isBefore(expiresAt, addMinutes(new Date(), 5))
  } catch {
    return true
  }
}
