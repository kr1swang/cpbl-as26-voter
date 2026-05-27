import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./vote.js', () => ({ vote: vi.fn() }))
vi.mock('./auth/auth-manager.js', () => ({
  ensureValidToken: vi.fn(),
  recoverFromAuthError: vi.fn(),
}))

import { getNextSchedule } from './scheduler.js'
import { targetHours } from './utils/constants.js'

describe('getNextSchedule', () => {
  afterEach(() => vi.useRealTimers())

  it('returns a Date in the future', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 27, 12, 0, 0))

    const result = getNextSchedule()

    expect(result.getTime()).toBeGreaterThan(Date.now())
  })

  it('schedules within a target hour', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 27, 0, 0, 0))

    const result = getNextSchedule()

    expect(targetHours).toContain(result.getHours())
  })

  it('returns minutes in [0, 59] range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 27, 0, 0, 0))

    for (let i = 0; i < 50; i++) {
      const result = getNextSchedule()
      expect(result.getMinutes()).toBeGreaterThanOrEqual(0)
      expect(result.getMinutes()).toBeLessThanOrEqual(59)
    }
  })

  it('returns seconds in [0, 59] range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 27, 0, 0, 0))

    for (let i = 0; i < 50; i++) {
      const result = getNextSchedule()
      expect(result.getSeconds()).toBeGreaterThanOrEqual(0)
      expect(result.getSeconds()).toBeLessThanOrEqual(59)
    }
  })

  it('schedules for next day when all target hours have passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 27, 20, 0, 0))

    const result = getNextSchedule()

    expect(result.getDate()).toBe(28)
    expect(result.getHours()).toBe(targetHours[0])
  })
})
