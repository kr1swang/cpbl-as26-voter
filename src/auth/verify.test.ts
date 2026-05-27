import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}))

vi.mock('axios', () => ({
  default: { get: mockGet },
}))

import { verifyAccessToken } from './verify.js'

describe('verifyAccessToken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls the LINE verify endpoint with encoded token', async () => {
    mockGet.mockResolvedValue({ data: { expires_in: 3600, client_id: 'xxx', scope: 'profile' } })
    await verifyAccessToken('my token')
    expect(mockGet).toHaveBeenCalledWith(
      'https://api.line.me/oauth2/v2.1/verify?access_token=my%20token',
      expect.anything(),
    )
  })

  it('resolves without throwing on valid response', async () => {
    mockGet.mockResolvedValue({ data: { expires_in: 1800, client_id: 'xxx', scope: 'profile' } })
    await expect(verifyAccessToken('valid-token')).resolves.toBeUndefined()
  })

  it('propagates axios errors', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))
    await expect(verifyAccessToken('bad-token')).rejects.toThrow('Network error')
  })
})
