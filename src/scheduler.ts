import { addDays, differenceInMilliseconds, format, getHours, set } from 'date-fns'

import { randomInt } from 'node:crypto'

import { formatStr, logger, targetHours } from './utils.js'
import { vote } from './vote.js'

function getNextSchedule(): Date {
  const now = new Date()
  const hour = targetHours.find((hour) => getHours(now) < hour)
  const base = hour !== undefined ? now : addDays(now, 1)

  return set(base, {
    hours: hour ?? targetHours[0],
    minutes: randomInt(0, 60),
    seconds: randomInt(0, 60),
  })
}

async function runVote(): Promise<void> {
  const target = getNextSchedule()
  logger(`Next vote is scheduled at ${format(target, formatStr)}`)

  const delay = differenceInMilliseconds(target, new Date())
  await new Promise((resolve) => setTimeout(resolve, delay))
  await vote()

  runVote()
}

async function start(): Promise<void> {
  logger('Try to run vote immediately for the first time')
  await vote()

  logger('Scheduler is starting...')
  runVote()
}

start()
