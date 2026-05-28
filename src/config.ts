import prompts from 'prompts'

import type { Candidate, PositionGroup } from './types.js'
import { getCandidates, readCandidates, saveCandidates, validateCandidates } from './utils/candidates.js'
import { expectedPositions } from './utils/constants.js'
import { logInfo } from './utils/logger.js'

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

async function promptSelections(
  groups: PositionGroup[],
  candidates: Candidate[],
  currentCandidates: string[],
): Promise<string[] | null> {
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
          selected: indices.some((i) => currentCandidates[i] === c.searchId),
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

export async function configCommand(): Promise<boolean> {
  logInfo('Fetching candidates from CPBL API...')
  const groups = buildGroups()
  const candidates = await getCandidates()
  const currentCandidates = readCandidates()
  const selected = await promptSelections(groups, candidates, currentCandidates)

  if (!selected) {
    return false
  }

  await validateCandidates(selected)
  saveCandidates(selected)
  logInfo('Saved to session/candidates.json')
  return true
}
