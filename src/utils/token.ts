import { formatDuration, intervalToDuration } from 'date-fns'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { chromium } from 'playwright'

import axios from 'axios'
import type { TokenState, VerifyResponse } from '../types.js'
import { logInfo } from './logger.js'

const tokenPath = resolve('session/token.json')
const authPath = resolve('session/auth.json')

async function clickIfVisible(
  page: import('playwright').Page,
  selector: string,
  message: string,
  timeout = 3000,
): Promise<boolean> {
  try {
    const locator = page.locator(selector).first()
    await locator.waitFor({ state: 'visible', timeout })
    await locator.click({ timeout })
    logInfo(message)
    return true
  } catch {
    return false
  }
}

export function saveToken(token: string): void {
  mkdirSync(dirname(tokenPath), { recursive: true })

  const now = new Date()
  const state: TokenState = {
    token,
    updatedAt: now.toISOString(),
  }

  writeFileSync(tokenPath, JSON.stringify(state, null, 2))
}

export function readToken(): TokenState {
  const raw = readFileSync(tokenPath, 'utf-8')
  return JSON.parse(raw) as TokenState
}

export async function isTokenStale(): Promise<boolean> {
  try {
    const raw = readFileSync(tokenPath, 'utf-8')
    const state = JSON.parse(raw) as TokenState
    if (!state.token) throw new Error('token missing')

    const { data } = await axios.get<VerifyResponse>(
      `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(state.token)}`,
      { headers: { accept: 'application/json' } },
    )

    const duration = intervalToDuration({ start: 0, end: data.expires_in * 1000 })
    logInfo(`Token remains ${formatDuration(duration, { format: ['hours', 'minutes'] })}`)

    return false
  } catch {
    return true
  }
}

export async function refreshToken(): Promise<string> {
  logInfo('Attempting refresh token...')

  const browser = await chromium.launch({ headless: false })
  try {
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
      await clickIfVisible(page, 'span.btn.vote', 'Clicked vote button', 5000)
      await clickIfVisible(page, 'div.login-button', 'Clicked login button', 5000)

      while (!interceptedToken) {
        const clickedVote = await clickIfVisible(page, 'span.btn.vote', 'Clicked vote button after login', 1000)
        if (clickedVote) {
          await Promise.race([tokenPromise.then(() => undefined), page.waitForTimeout(1500)])
          continue
        }

        await page.waitForTimeout(1000)
      }
    } else {
      logInfo('Token already intercepted; skipping interaction')
    }

    const token = await tokenPromise
    logInfo('Token captured!')

    saveToken(token)
    await context.storageState({ path: authPath })

    logInfo('refresh token succeeded')
    return token
  } finally {
    await browser.close()
  }
}

export async function getToken(): Promise<string> {
  const isStale = await isTokenStale()
  if (isStale) await refreshToken()
  const state = readToken()
  return state.token
}
