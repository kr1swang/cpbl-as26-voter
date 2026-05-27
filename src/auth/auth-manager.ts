import { AuthError } from '../types.js'
import { logError, logInfo } from '../utils/logger.js'
import { isTokenStale, readToken } from '../utils/token.js'
import { silentRefresh } from './refresh.js'

export async function ensureValidToken(): Promise<string> {
  if (!isTokenStale()) return readToken()

  logInfo('Token is stale, attempting silent refresh...')
  const success = await silentRefresh()

  if (!success) {
    logError('TOKEN_EXPIRED — please run: yarn login')
    throw new AuthError('TOKEN_EXPIRED — please run: yarn login')
  }

  return readToken()
}

export async function recoverFromAuthError(): Promise<string> {
  logInfo('Attempting to recover from auth error...')
  const success = await silentRefresh()

  if (!success) {
    logError('TOKEN_EXPIRED — please run: yarn login')
    throw new AuthError('TOKEN_EXPIRED — please run: yarn login')
  }

  return readToken()
}
