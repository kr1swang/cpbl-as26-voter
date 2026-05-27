import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../utils/token.js', () => ({
  isTokenStale: vi.fn(),
  readToken: vi.fn(),
}))

vi.mock('./refresh.js', () => ({
  silentRefresh: vi.fn(),
}))

import { AuthError } from '../types.js'
import { isTokenStale, readToken } from '../utils/token.js'
import { ensureValidToken, recoverFromAuthError } from './auth-manager.js'
import { silentRefresh } from './refresh.js'

const mockedIsTokenStale = vi.mocked(isTokenStale)
const mockedReadToken = vi.mocked(readToken)
const mockedSilentRefresh = vi.mocked(silentRefresh)

describe('ensureValidToken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns token directly when not stale', async () => {
    mockedIsTokenStale.mockReturnValue(false)
    mockedReadToken.mockReturnValue('valid-token')

    const token = await ensureValidToken()

    expect(token).toBe('valid-token')
    expect(mockedSilentRefresh).not.toHaveBeenCalled()
  })

  it('calls silentRefresh when token is stale and returns new token on success', async () => {
    mockedIsTokenStale.mockReturnValue(true)
    mockedSilentRefresh.mockResolvedValue(true)
    mockedReadToken.mockReturnValue('refreshed-token')

    const token = await ensureValidToken()

    expect(mockedSilentRefresh).toHaveBeenCalledOnce()
    expect(token).toBe('refreshed-token')
  })

  it('throws AuthError when silentRefresh fails', async () => {
    mockedIsTokenStale.mockReturnValue(true)
    mockedSilentRefresh.mockResolvedValue(false)

    await expect(ensureValidToken()).rejects.toThrow(AuthError)
  })
})

describe('recoverFromAuthError', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns token after successful silent refresh', async () => {
    mockedSilentRefresh.mockResolvedValue(true)
    mockedReadToken.mockReturnValue('recovered-token')

    const token = await recoverFromAuthError()

    expect(mockedSilentRefresh).toHaveBeenCalledOnce()
    expect(token).toBe('recovered-token')
  })

  it('throws AuthError when silent refresh fails', async () => {
    mockedSilentRefresh.mockResolvedValue(false)

    await expect(recoverFromAuthError()).rejects.toThrow(AuthError)
  })
})
