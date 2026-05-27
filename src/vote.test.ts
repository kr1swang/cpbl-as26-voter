import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGet, mockPost, mockIsAxiosError } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockIsAxiosError: vi.fn(),
}))

vi.mock('./auth/auth-manager.js', () => ({
  ensureValidToken: vi.fn(),
}))

vi.mock('./utils/candidates.js', () => ({
  loadCandidates: vi.fn(),
  validateCandidates: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    isAxiosError: mockIsAxiosError,
  },
}))

import { ensureValidToken } from './auth/auth-manager.js'
import { AuthError } from './types.js'
import { loadCandidates, validateCandidates } from './utils/candidates.js'
import { expectedPositions } from './utils/constants.js'
import { vote } from './vote.js'

const mockedEnsureValidToken = vi.mocked(ensureValidToken)
const mockedLoadCandidates = vi.mocked(loadCandidates)
const mockedValidateCandidates = vi.mocked(validateCandidates)

const testCandidates = expectedPositions.map((_, i) => `cpbl_test_${i}`)

function setupGetMocks() {
  mockGet.mockResolvedValueOnce({ data: { expires_in: 3600, client_id: 'xxx', scope: 'profile' } })
}

describe('vote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedEnsureValidToken.mockResolvedValue('test-token')
    mockedLoadCandidates.mockReturnValue(testCandidates)
    mockedValidateCandidates.mockResolvedValue(undefined)
    mockIsAxiosError.mockReturnValue(false)
  })

  it('calls POST with x-line-accesstoken header', async () => {
    setupGetMocks()
    mockPost.mockResolvedValue({ data: { code: 200, message: '投票成功' } })

    await vote()

    expect(mockPost).toHaveBeenCalledWith(
      'https://cpbl-server.line-apps.com/api/candidates/submit/pc',
      testCandidates,
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-line-accesstoken': 'test-token',
        }),
      }),
    )
  })

  it('throws AuthError on 401 response', async () => {
    setupGetMocks()
    const error = Object.assign(new Error('Unauthorized'), { response: { status: 401 } })
    mockPost.mockRejectedValue(error)
    mockIsAxiosError.mockReturnValue(true)

    await expect(vote()).rejects.toThrow(AuthError)
  })

  it('throws AuthError on 403 response', async () => {
    setupGetMocks()
    const error = Object.assign(new Error('Forbidden'), { response: { status: 403 } })
    mockPost.mockRejectedValue(error)
    mockIsAxiosError.mockReturnValue(true)

    await expect(vote()).rejects.toThrow(AuthError)
  })

  it('propagates non-auth errors as-is', async () => {
    setupGetMocks()
    const error = Object.assign(new Error('Network error'), { response: { status: 500 } })
    mockPost.mockRejectedValue(error)
    mockIsAxiosError.mockReturnValue(true)

    await expect(vote()).rejects.toThrow('Network error')
  })
})
