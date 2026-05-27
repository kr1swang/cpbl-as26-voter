import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

type TokenState = {
  token: string
  updatedAt: string
}

const tokenPath = resolve('session/token.json')

export function saveToken(token: string): void {
  mkdirSync(dirname(tokenPath), { recursive: true })

  const state: TokenState = {
    token,
    updatedAt: new Date().toISOString(),
  }

  writeFileSync(tokenPath, JSON.stringify(state, null, 2))
}

export function readToken(): string {
  const raw = readFileSync(tokenPath, 'utf-8')
  const state: TokenState = JSON.parse(raw)
  return state.token
}
