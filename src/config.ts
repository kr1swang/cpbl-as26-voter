import prompts from 'prompts'

import type { Candidate, PositionGroup } from './types.js'
import { getCandidates, saveCandidates, validateCandidates } from './utils/candidates.js'
import { expectedPositions } from './utils/constants.js'
import { logError, logInfo } from './utils/logger.js'

function buildGroups(): PositionGroup[] {
  return [
    ...expectedPositions
      .reduce((map, { code, label }, i) => {
        const group = map.get(code) ?? { code, label, indices: [] }
        group.indices.push(i)
        return map.set(code, group)
      }, new Map<string, PositionGroup>())
      .values(),
  ]
}

async function promptSelections(groups: PositionGroup[], candidates: Candidate[]): Promise<string[] | null> {
  const selected = new Array<string>(expectedPositions.length)

  for (const { code, label, indices } of groups) {
    const pool = candidates.filter((c) => c.position === code).sort((a, b) => b.votes - a.votes)
    const count = indices.length

    const { value } = await prompts(
      {
        type: 'multiselect',
        name: 'value',
        message: `${label}(${code}) — select ${count}`,
        hint: `Space to select ${count} · Enter to confirm`,
        choices: pool.map((c) => ({
          title: c.name,
          description: `${c.team.toUpperCase()} #${c.no}`,
          value: c.searchId,
        })),
        min: count,
        max: count,
        instructions: false,
      },
      {
        onCancel: () => {
          return true
        },
      },
    )

    if (!Array.isArray(value)) {
      logInfo('Cancelled. Back to main menu.')
      return null
    }

    value.forEach((searchId, j) => {
      selected[indices[j]] = searchId
    })
  }

  return selected
}

export async function configCommand(): Promise<void> {
  try {
    logInfo('Fetching candidates list...')

    const groups = buildGroups()
    const candidates = await getCandidates()
    const selected = await promptSelections(groups, candidates)
    if (!selected) throw new Error('No candidates selected')

    await validateCandidates(selected)
    saveCandidates(selected)
    logInfo('Saved to session/candidates.json')
  } catch (error) {
    logError(`Config failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}
