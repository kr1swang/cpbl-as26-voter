import prompts from 'prompts'

import { configCommand } from './config.js'
import { startCommand } from './scheduler.js'
import { logError, logInfo } from './utils/logger.js'

type MenuAction = 'start' | 'config' | 'exit'

async function selectAction(): Promise<MenuAction | null> {
  const { action } = await prompts(
    {
      type: 'select',
      name: 'action',
      message: 'Choose an action',
      choices: [
        { title: 'start', value: 'start' },
        { title: 'config', value: 'config' },
        { title: 'exit', value: 'exit' },
      ],
      initial: 0,
    },
    {
      onCancel: () => true,
    },
  )

  if (typeof action !== 'string') return null

  return action as MenuAction
}

async function main(): Promise<void> {
  while (true) {
    const action = await selectAction()

    if (!action || action === 'exit') {
      logInfo('Exit.')
      return
    }

    if (action === 'config') {
      try {
        await configCommand()
      } catch (error) {
        logError(error instanceof Error ? error.message : String(error))
      }
      continue
    }

    logInfo('Starting scheduler. Press Ctrl+C to stop.')
    await startCommand()
    return
  }
}

main().catch((error) => {
  logError(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
