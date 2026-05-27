import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import axios from 'axios'
import { formatDuration, intervalToDuration, parseISO } from 'date-fns'
import { chromium } from 'playwright'

import type { VerifyResponse } from '../types.js'
import { logError, logInfo } from './logger.js'
import { isTokenStale, readToken, saveToken } from './token.js'

const authPath = resolve('session/auth.json')
const targetUrl = 'https://linetoday-cpbl.landpress.line.me/'
const REFRESH_TIMEOUT_MS = 30_000

async function silentRefresh(): Promise<boolean> {
  if (!existsSync(authPath)) {
    logError('auth.json not found, cannot silent refresh')
    return false
  }

  logInfo('Attempting silent token refresh...')

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const context = await browser.newContext({ storageState: authPath })
  const page = await context.newPage()

  try {
    const tokenPromise = new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), REFRESH_TIMEOUT_MS)

      page.on('request', (request) => {
        if (request.url().includes('api/candidates') && !request.url().includes('submit')) {
          const token = request.headers()['x-line-accesstoken']
          if (token) {
            clearTimeout(timer)
            resolve(token)
          }
        }
      })
    })

    await page.goto(targetUrl)

    const token = await tokenPromise
    if (!token) {
      logError('Silent refresh timed out')
      return false
    }

    const { data } = await axios.get<VerifyResponse>(
      `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(token)}`,
      { headers: { accept: 'application/json' } },
    )

    saveToken(token, data.expires_in)
    await context.storageState({ path: authPath })

    logInfo('Silent refresh succeeded')
    return true
  } catch (error) {
    logError(`Silent refresh failed: ${error instanceof Error ? error.message : String(error)}`)
    return false
  } finally {
    await browser.close()
  }
}

function readAndLogToken(): string {
  const state = readToken()
  const duration = intervalToDuration({ start: new Date(), end: parseISO(state.expiresAt) })
  logInfo(`Token remains ${formatDuration(duration, { format: ['hours', 'minutes'] })}`)
  return state.token
}

export async function ensureValidToken(): Promise<string> {
  if (!isTokenStale()) return readAndLogToken()

  logInfo('Token is stale, attempting silent refresh...')
  const success = await silentRefresh()

  if (!success) {
    logError('TOKEN_EXPIRED — please run: yarn login')
    throw new Error('TOKEN_EXPIRED — please run: yarn login')
  }

  return readAndLogToken()
}
