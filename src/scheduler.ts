import { addDays, differenceInMilliseconds, format, getHours, set } from 'date-fns'
import { randomInt } from 'node:crypto'
import { fileURLToPath } from 'node:url'

import { ensureValidToken, recoverFromAuthError } from './auth/auth-manager.js'
import { AuthError } from './types.js'
import { formatStr, targetHours } from './utils/constants.js'
import { logError, logInfo } from './utils/logger.js'
import { vote } from './vote.js'

export function getNextSchedule(): Date {
  const now = new Date()
  const hour = targetHours.find((h) => getHours(now) < h)
  const base = hour !== undefined ? now : addDays(now, 1)

  return set(base, {
    hours: hour ?? targetHours[0],
    minutes: randomInt(0, 60),
    seconds: randomInt(0, 60),
  })
}

async function runVote(): Promise<void> {
  while (true) {
    const target = getNextSchedule()
    logInfo(`Next vote is scheduled at ${format(target, formatStr)}`)

    const delay = differenceInMilliseconds(target, new Date())
    await new Promise<void>((resolve) => setTimeout(resolve, delay))

    try {
      await vote()
    } catch (error) {
      if (error instanceof AuthError) {
        logInfo('Auth error detected, attempting recovery...')
        try {
          await recoverFromAuthError()
          await vote()
        } catch {
          logError('Auth recovery failed, skipping this vote cycle')
        }
      } else {
        logError(`Vote failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }
}

async function start(): Promise<void> {
  logInfo('Ensuring valid token...')
  await ensureValidToken()

  logInfo('Try to run vote immediately for the first time')
  try {
    await vote()
  } catch (error) {
    if (error instanceof AuthError) {
      logInfo('Auth error on initial vote, attempting recovery...')
      await recoverFromAuthError()
      await vote()
    } else {
      logError(`Initial vote failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  logInfo('Scheduler is starting...')
  await runVote()
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  start()
}
