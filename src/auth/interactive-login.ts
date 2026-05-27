import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import axios from 'axios'
import { chromium } from 'playwright'

import type { VerifyResponse } from '../types.js'
import { logError, logInfo } from '../utils/logger.js'
import { saveToken } from '../utils/token.js'

const authPath = resolve('session/auth.json')
const targetUrl = 'https://linetoday-cpbl.landpress.line.me/'

export async function interactiveLogin(): Promise<void> {
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

  await page.goto(targetUrl)
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  interactiveLogin().catch((error) => {
    logError(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
