import axios from 'axios'
import { formatDuration, intervalToDuration } from 'date-fns'

import type { VerifyResponse } from '../types.js'
import { logInfo } from '../utils/logger.js'

export async function verifyAccessToken(accessToken: string): Promise<void> {
  logInfo('Verifying access token')

  const { data } = await axios.get<VerifyResponse>(
    `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(accessToken)}`,
    { headers: { accept: 'application/json' } },
  )

  const duration = intervalToDuration({ start: 0, end: data.expires_in * 1000 })
  logInfo(`Token remains ${formatDuration(duration, { format: ['hours', 'minutes'] })}`)
}
