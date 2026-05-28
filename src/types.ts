export enum MenuAction {
  Start = 'start',
  Config = 'config',
}

export type VerifyResponse = {
  client_id: string
  expires_in: number
  scope: string
}

export type CandidatesResponse = {
  code: number
  message: string
  result: Candidate[]
}

export type SubmitResponse = {
  code: number
  message: string
  result: unknown
}

export type Candidate = {
  searchId: string
  name: string
  position: string
  team: string
  no: number
  votes: number
}

export type Item = {
  searchId: string
  isValid: boolean
  position: Record<'code' | 'label', string>
  name: string
  team: string
  no: number
  votes: number
  message: string | null
}

export type PositionGroup = Item['position'] & {
  indices: number[]
}

export type TokenState = {
  token: string
  updatedAt: string
}
