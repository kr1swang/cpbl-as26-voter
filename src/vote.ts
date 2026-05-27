import axios from 'axios'
import { ensureValidToken } from './auth/auth-manager.js'
import { verifyAccessToken } from './auth/verify.js'
import type { SubmitResponse } from './types.js'
import { AuthError } from './types.js'
import { loadCandidates, validateCandidates } from './utils/candidates.js'
import { logInfo } from './utils/logger.js'

export async function vote(): Promise<void> {
  logInfo('Vote is running')

  const candidates = loadCandidates()
  await validateCandidates(candidates)

  const accessToken = await ensureValidToken()
  await verifyAccessToken(accessToken)

  try {
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
      throw new AuthError('Token rejected by API')
    }
    throw error
  }
}
