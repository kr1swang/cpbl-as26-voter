import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockReadFileSync, mockGet } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(),
  mockGet: vi.fn(),
}))

vi.mock('node:fs', () => ({
  readFileSync: mockReadFileSync,
}))

vi.mock('axios', () => ({
  default: { get: mockGet },
}))

vi.spyOn(console, 'table').mockImplementation(() => {})

import { loadCandidates, validateCandidates } from './candidates.js'
import { expectedPositions } from './constants.js'

const valid16 = expectedPositions.map((_, i) => `cpbl_test_${i}`)

const apiResult = valid16.map((searchId, i) => ({
  searchId,
  name: `Player ${i}`,
  position: expectedPositions[i].code,
  team: 'team',
  no: i + 1,
  votes: 100,
}))

describe('loadCandidates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when file is not found', () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT')
    })
    expect(() => loadCandidates()).toThrow()
  })

  it('throws when JSON is invalid', () => {
    mockReadFileSync.mockReturnValue('not valid json')
    expect(() => loadCandidates()).toThrow()
  })

  it('throws when candidates is not an array', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ candidates: null, updatedAt: '' }))
    expect(() => loadCandidates()).toThrow('invalid')
  })

  it('throws when candidates length is not 16', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ candidates: ['a', 'b'], updatedAt: '' }))
    expect(() => loadCandidates()).toThrow('invalid')
  })

  it('returns candidates array when file is valid', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ candidates: valid16, updatedAt: '' }))
    expect(loadCandidates()).toEqual(valid16)
  })
})

describe('validateCandidates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws when candidates length is not 16', async () => {
    await expect(validateCandidates(['cpbl_1'])).rejects.toThrow('Candidates length must be 16')
  })

  it('throws when API returns non-200 code', async () => {
    mockGet.mockResolvedValue({ data: { code: 500, message: 'Server error', result: [] } })
    await expect(validateCandidates(valid16)).rejects.toThrow('Server error')
  })

  it('resolves when all candidates are valid', async () => {
    mockGet.mockResolvedValue({ data: { code: 200, message: 'ok', result: apiResult } })
    await expect(validateCandidates(valid16)).resolves.toBeUndefined()
  })

  it('throws when a candidate is not found in API response', async () => {
    const missing = [...valid16]
    missing[0] = 'cpbl_nonexistent'
    mockGet.mockResolvedValue({ data: { code: 200, message: 'ok', result: apiResult } })
    await expect(validateCandidates(missing)).rejects.toThrow('1 invalid candidates')
  })

  it('throws when a candidate has the wrong position', async () => {
    const wrongPos = apiResult.map((c, i) => (i === 0 ? { ...c, position: 'WRONG' } : c))
    mockGet.mockResolvedValue({ data: { code: 200, message: 'ok', result: wrongPos } })
    await expect(validateCandidates(valid16)).rejects.toThrow('1 invalid candidates')
  })

  it('throws when a candidate is duplicated', async () => {
    const dup = [...valid16]
    dup[1] = dup[0]
    mockGet.mockResolvedValue({ data: { code: 200, message: 'ok', result: apiResult } })
    await expect(validateCandidates(dup)).rejects.toThrow('1 invalid candidates')
  })
})
