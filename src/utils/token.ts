import { addMinutes, addSeconds, formatDuration, intervalToDuration, isBefore, isValid, parseISO } from 'date-fns'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { chromium } from 'playwright'

import axios from 'axios'
import type { TokenState, VerifyResponse } from '../types.js'
import { logInfo } from './logger.js'

const tokenPath = resolve('session/token.json')
const authPath = resolve('session/auth.json')

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

export function readToken(): TokenState {
  const raw = readFileSync(tokenPath, 'utf-8')
  return JSON.parse(raw) as TokenState
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

export async function refreshToken(): Promise<string> {
  logInfo('Attempting refresh token...')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext(existsSync(authPath) ? { storageState: authPath } : {})
  const page = await context.newPage()

  let interceptedToken: string | null = null
  const tokenPromise = new Promise<string>((resolve) => {
    page.on('request', (request) => {
      if (request.url().includes('api/candidates') && !request.url().includes('submit')) {
        const token = request.headers()['x-line-accesstoken']
        if (token) {
          interceptedToken = token
          resolve(token)
        }
      }
    })
  })

  await page.goto('https://linetoday-cpbl.landpress.line.me/')
  logInfo('Waiting for token... (log in to LINE if prompted)')

  if (!interceptedToken) {
    await page.locator('span.btn.vote').first().click({ timeout: 0 })
    logInfo('Clicked vote button')

    await page.locator('div.login-button').first().click({ timeout: 0 })
    logInfo('Clicked login button')
  } else {
    logInfo('Token already intercepted; skipping interaction')
  }

  const token = await tokenPromise
  logInfo('Token captured!')

  if (!token) throw new Error('Token not found in request headers')

  const { data } = await axios.get<VerifyResponse>(
    `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(token)}`,
    { headers: { accept: 'application/json' } },
  )

  const duration = intervalToDuration({ start: 0, end: data.expires_in * 1000 })
  logInfo(`Token remains ${formatDuration(duration, { format: ['hours', 'minutes'] })}`)

  saveToken(token, data.expires_in)
  await context.storageState({ path: authPath })

  logInfo('refresh token succeeded')
  await browser.close()

  return token
}

export async function getToken(): Promise<string> {
  if (isTokenStale()) await refreshToken()
  const state = readToken()
  return state.token
}
