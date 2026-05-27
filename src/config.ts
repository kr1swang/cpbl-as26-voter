import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import axios from 'axios'
import prompts from 'prompts'

import type { Candidate, CandidatesResponse } from './types.js'
import { candidatesPath, loadCandidates, validateCandidates } from './utils/candidates.js'
import { expectedPositions } from './utils/constants.js'
import { logError, logInfo } from './utils/logger.js'

const onCancel = () => {
  logInfo('Cancelled.')
  process.exit(0)
}

/** Returns the display column-width of a string (CJK chars count as 2). */
function cjkWidth(s: string): number {
  let w = 0
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0
    w +=
      (cp >= 0x1100 && cp <= 0x115f) ||
      (cp >= 0x2e80 && cp <= 0x303f) ||
      (cp >= 0x3040 && cp <= 0x33ff) ||
      (cp >= 0x3400 && cp <= 0x9fff) ||
      (cp >= 0xac00 && cp <= 0xd7af) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe10 && cp <= 0xfe6f) ||
      (cp >= 0xff01 && cp <= 0xff60)
        ? 2
        : 1
  }
  return w
}

function cjkPad(s: string, width: number): string {
  const pad = width - cjkWidth(s)
  return pad > 0 ? s + ' '.repeat(pad) : s
}

function makeTitle(c: Candidate, nameWidth: number, teamWidth: number): string {
  return `${cjkPad(c.name, nameWidth)} ${cjkPad(c.team.toUpperCase(), teamWidth)} #${String(c.no).padStart(2, '0')}  ${String(c.votes).padStart(6)} votes`
}

async function config(): Promise<void> {
  logInfo('Fetching candidates from CPBL API...')

  const { data } = await axios.get<CandidatesResponse>('https://cpbl-server.line-apps.com/api/candidates', {
    headers: { accept: 'application/json' },
  })
  if (data.code !== 200) throw new Error(data.message || 'Failed to fetch candidates')

  const currentCandidates = loadCandidates()
  const selected: string[] = new Array(expectedPositions.length)

  const seen = new Set<string>()
  const groups: Array<{ code: string; label: string; indices: number[] }> = []
  for (let i = 0; i < expectedPositions.length; i++) {
    const { code, label } = expectedPositions[i]
    if (!seen.has(code)) {
      seen.add(code)
      const indices = expectedPositions.reduce<number[]>((acc, p, j) => {
        if (p.code === code) acc.push(j)
        return acc
      }, [])
      groups.push({ code, label, indices })
    }
  }

  for (const { code, label, indices } of groups) {
    const pool = data.result.filter((c) => c.position === code).sort((a, b) => b.votes - a.votes)

    // Compute column widths from this pool for aligned display
    const nameWidth = Math.max(...pool.map((c) => cjkWidth(c.name)))
    const teamWidth = Math.max(...pool.map((c) => cjkWidth(c.team)))

    const count = indices.length
    const currentIds = indices.map((i) => currentCandidates[i]).filter(Boolean)
    const hint = `Space 選 ${count} 位 · Enter 確認`
    const message = `${label} (${code}) — 選 ${count} 位`

    const { value } = await prompts(
      {
        type: 'multiselect',
        name: 'value',
        message,
        choices: pool.map((c) => ({
          title: makeTitle(c, nameWidth, teamWidth),
          value: c.searchId,
          selected: currentIds.includes(c.searchId),
        })),
        min: count,
        max: count,
        hint,
      },
      { onCancel },
    )

    ;(value as string[]).forEach((searchId, j) => {
      selected[indices[j]] = searchId
    })
  }

  console.log()
  await validateCandidates(selected)

  mkdirSync(resolve('session'), { recursive: true })
  writeFileSync(candidatesPath, JSON.stringify({ candidates: selected, updatedAt: new Date().toISOString() }, null, 2))
  logInfo('Saved to session/candidates.json')
}

config().catch((error) => {
  logError(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
