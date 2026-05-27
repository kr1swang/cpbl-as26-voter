import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { chromium } from 'playwright'

import { logInfo } from './utils/logger.js'
import { saveToken } from './utils/token.js'

const authPath = resolve('session/auth.json')
const targetUrl = 'https://linetoday-cpbl.landpress.line.me/'

async function login(): Promise<void> {
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

  saveToken(token)
  await context.storageState({ path: authPath })

  logInfo('Saved session/token.json and session/auth.json')

  await browser.close()
}

login().catch((error) => {
  console.error(error)
  process.exit(1)
})
