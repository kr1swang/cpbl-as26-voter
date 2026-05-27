import axios from 'axios'
import { formatDuration, intervalToDuration } from 'date-fns'
import type { CandidatesResponse, Item, SubmitResponse, VerifyResponse } from './types.js'
import { candidates, expectedPositions } from './utils/constants.js'
import { logError, logInfo } from './utils/logger.js'
import { readToken } from './utils/token.js'

async function verifyAccessToken(accessToken: string): Promise<void> {
  logInfo('Verifying access token')

  const { data } = await axios.get<VerifyResponse>(
    `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(accessToken)}`,
    { headers: { accept: 'application/json' } },
  )

  const duration = intervalToDuration({ start: 0, end: data.expires_in * 1000 })
  logInfo(`Token remains ${formatDuration(duration, { format: ['hours', 'minutes'] })}`)
}

async function validateCandidates(accessToken: string, candidates: string[]): Promise<void> {
  logInfo('Validating candidates')

  if (candidates.length !== 16) throw new Error('candidates length must be 16')

  const { data } = await axios.get<CandidatesResponse>('https://cpbl-server.line-apps.com/api/candidates', {
    headers: {
      accept: 'application/json, text/plain, */*',
      origin: 'https://linetoday-cpbl.landpress.line.me',
      referer: 'https://linetoday-cpbl.landpress.line.me/',
      'x-liff-client': 'false',
      'x-line-accesstoken': accessToken,
    },
  })
  if (data.code !== 200) throw new Error(data.message || 'unknown error')

  const candidateMap = new Map(data.result.map((c) => [c.searchId, c]))

  const list: Item[] = candidates.map((searchId, index) => {
    const expected = expectedPositions[index]
    const info = candidateMap.get(searchId)

    if (!info) {
      return {
        searchId,
        isValid: false,
        position: expected,
        name: '-',
        team: '-',
        no: NaN,
        votes: NaN,
        message: 'not found',
      }
    }

    const { name, team, no, position, votes } = info
    const isMatch = position === expected.code

    return {
      searchId,
      isValid: isMatch,
      position: expected,
      name,
      team: team.toUpperCase(),
      no,
      votes,
      message: isMatch ? null : `actual: ${position}`,
    }
  })

  const getRanking = (row: Item): string => {
    const list = data.result.filter((c) => c.position === row.position.code).sort((a, b) => b.votes - a.votes)
    const index = list.findIndex((c) => c.searchId === row.searchId)
    return `#${index + 1}`
  }

  console.table(
    list.map((row) => ({
      ...row,
      isValid: row.isValid ? '✓' : '✗',
      position: `${row.position.code} (${row.position.label})`,
      no: isNaN(row.no) ? '-' : `#${row.no}`,
      ranking: getRanking(row),
      votes: (isNaN(row.votes) ? '-' : `${row.votes}`).padStart(8, ' '),
      message: row.message ?? '-',
    })),
    ['isValid', 'position', 'name', 'team', 'no', 'ranking', 'votes', 'message'],
  )

  const rows = list.filter((row) => !row.isValid)
  if (rows.length > 0) throw new Error(`there are ${rows.length} invalid candidates`)
}

export async function vote(): Promise<void> {
  try {
    logInfo('Vote is running')

    const accessToken = readToken()

    await verifyAccessToken(accessToken)
    await validateCandidates(accessToken, candidates)

    const { data } = await axios.post<SubmitResponse>(
      'https://cpbl-server.line-apps.com/api/candidates/submit/pc',
      candidates,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          'content-type': 'application/json',
          origin: 'https://linetoday-cpbl.landpress.line.me',
          referer: 'https://linetoday-cpbl.landpress.line.me/',
          'x-liff-client': 'false',
          'x-line-accesstoken': accessToken,
        },
      },
    )
    if (data.code !== 200) throw new Error(data.message || 'Unknown error')

    logInfo(`Vote completed, ${data.message}`)
  } catch (error) {
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      logError('TOKEN_EXPIRED — please run: yarn login')
    } else {
      logError(`Vote failed, ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
