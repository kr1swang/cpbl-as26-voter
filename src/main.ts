import prompts from 'prompts'

import { configCommand } from './config.js'
import { startCommand } from './scheduler.js'
import { MenuAction } from './types.js'
import { logError, logInfo } from './utils/logger.js'

async function main(): Promise<void> {
  while (true) {
    const { action } = await prompts(
      {
        type: 'select',
        name: 'action',
        message: 'Choose an action',
        choices: [
          { title: 'start', value: MenuAction.Start },
          { title: 'config', value: MenuAction.Config },
          { title: 'exit', value: MenuAction.Exit },
        ],
        initial: 0,
      },
      {
        onCancel: () => true,
      },
    )

    switch (action) {
      case MenuAction.Start: {
        await startCommand()
        return
      }
      case MenuAction.Config: {
        await configCommand()
        break
      }
      case MenuAction.Exit:
      default: {
        logInfo('Exit.')
        return
      }
    }
  }
}

main().catch((error) => {
  logError(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
