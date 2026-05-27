import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import axios from 'axios'
import { chromium } from 'playwright'

import type { VerifyResponse } from './types.js'
import { logInfo } from './utils/logger.js'
import { saveToken } from './utils/token.js'

const authPath = resolve('session/auth.json')

export async function login(): Promise<void> {
  logInfo('Opening browser...')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext(existsSync(authPath) ? { storageState: authPath } : {})
  const page = await context.newPage()

  const tokenPromise = new Promise<string>((resolve) => {
    page.on('request', (request) => {
      if (request.url().includes('api/candidates') && !request.url().includes('submit')) {
        const token = request.headers()['x-line-accesstoken']
        if (token) resolve(token)
      }
    })
  })

  await page.goto('https://linetoday-cpbl.landpress.line.me/')
  logInfo('Waiting for token... (log in to LINE if prompted)')

  const token = await tokenPromise
  logInfo('Token captured!')

  const { data } = await axios.get<VerifyResponse>(
    `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(token)}`,
    { headers: { accept: 'application/json' } },
  )

  saveToken(token, data.expires_in)
  await context.storageState({ path: authPath })

  logInfo('Saved session/token.json and session/auth.json')

  await browser.close()
}

login()
