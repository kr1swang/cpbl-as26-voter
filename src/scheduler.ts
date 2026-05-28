import { addDays, differenceInMilliseconds, format, getHours, set } from 'date-fns'
import { randomInt } from 'node:crypto'

import { formatStr, targetHours } from './utils/constants.js'
import { logError, logInfo } from './utils/logger.js'
import { vote } from './vote.js'

function getNextSchedule(): Date {
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
      logError(`Vote failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

async function start(): Promise<void> {
  try {
    logInfo('Try to run vote immediately for the first time')
    await vote()
  } catch (error) {
    logError(`Initial vote failed: ${error instanceof Error ? error.message : String(error)}`)
  }

  logInfo('Scheduler is starting...')
  await runVote()
}

start().catch((error) => {
  logError(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
