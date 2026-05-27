import { addMinutes, addSeconds, subSeconds } from 'date-fns'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs', () => ({
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}))

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { isTokenStale, readToken, saveToken } from './token.js'

const mockedReadFileSync = vi.mocked(readFileSync)
const mockedWriteFileSync = vi.mocked(writeFileSync)
const mockedMkdirSync = vi.mocked(mkdirSync)

describe('saveToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => vi.useRealTimers())

  it('writes correct JSON structure with token, updatedAt, and expiresAt', () => {
    const now = new Date('2026-05-27T10:00:00.000Z')
    vi.setSystemTime(now)

    saveToken('test-token', 3600)

    expect(mockedMkdirSync).toHaveBeenCalledOnce()
    expect(mockedWriteFileSync).toHaveBeenCalledOnce()

    const [, content] = mockedWriteFileSync.mock.calls[0] as [unknown, string]
    const state = JSON.parse(content)

    expect(state.token).toBe('test-token')
    expect(state.updatedAt).toBe(now.toISOString())
    expect(state.expiresAt).toBe(addSeconds(now, 3600).toISOString())
  })
})

describe('readToken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns token from parsed JSON', () => {
    mockedReadFileSync.mockReturnValue(
      JSON.stringify({ token: 'my-token', updatedAt: '2026-01-01T00:00:00Z', expiresAt: '2026-01-01T01:00:00Z' }),
    )
    expect(readToken()).toBe('my-token')
  })
})

describe('isTokenStale', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns false when token expires more than 5 minutes from now', () => {
    const expiresAt = addMinutes(new Date(), 10).toISOString()
    mockedReadFileSync.mockReturnValue(JSON.stringify({ token: 't', updatedAt: '', expiresAt }))
    expect(isTokenStale()).toBe(false)
  })

  it('returns true when token expires within 5 minutes', () => {
    const expiresAt = addMinutes(new Date(), 2).toISOString()
    mockedReadFileSync.mockReturnValue(JSON.stringify({ token: 't', updatedAt: '', expiresAt }))
    expect(isTokenStale()).toBe(true)
  })

  it('returns true when token is already expired', () => {
    const expiresAt = subSeconds(new Date(), 1).toISOString()
    mockedReadFileSync.mockReturnValue(JSON.stringify({ token: 't', updatedAt: '', expiresAt }))
    expect(isTokenStale()).toBe(true)
  })

  it('returns true when token.json does not exist', () => {
    mockedReadFileSync.mockImplementation(() => {
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    expect(isTokenStale()).toBe(true)
  })

  it('returns true when expiresAt is missing', () => {
    mockedReadFileSync.mockReturnValue(JSON.stringify({ token: 't', updatedAt: '' }))
    expect(isTokenStale()).toBe(true)
  })
})
