import axios from 'axios'

import type { SubmitResponse } from './types.js'
import { readCandidates, validateCandidates } from './utils/candidates.js'
import { logInfo } from './utils/logger.js'
import { getToken } from './utils/token.js'

export async function vote(): Promise<void> {
  logInfo('Vote is running')

  const candidates = readCandidates()
  await validateCandidates(candidates)

  const accessToken = await getToken()

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
  if (data.code !== 200) throw new Error(data.message || 'Failed to submit vote')

  logInfo(`Vote completed, ${data.message}`)
}
