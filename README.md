# cpbl-as26-voter

An automated voting bot for the 2026 CPBL All-Star Game fan vote.

Votes immediately on startup, then schedules recurring votes at 01, 07, 13, and 19 o'clock with randomized minutes and seconds each day.

---

## Stack

- **Playwright** — opens a browser to complete LINE login and intercept the access token
- **axios** — calls the voting API
- **date-fns** — schedule time calculation
- **session/auth.json** — persists browser session (cookies / localStorage)
- **session/token.json** — stores the runtime access token
- **session/candidates.json** — stores the selected candidates for each position

---

## Getting Started

### Install dependencies

```bash
# npm
npm install
npx playwright install chromium

# yarn
yarn install
npx playwright install chromium
```

### Launch

```bash
# npm
npm start

# yarn
yarn start
```

This is the only entrypoint. It opens an interactive menu with three options:

| Option     | Description                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| **start**  | Votes immediately, then runs the recurring scheduler                                                            |
| **config** | Fetches the latest candidates and prompts to select players. Selections are saved to `session/candidates.json`. |

### Voting schedule

After the immediate startup vote, the scheduler picks the next upcoming hour from `[01, 07, 13, 19]` and fires at a random minute and second within that hour. If no upcoming hour exists in the current day, it schedules for 01:xx the next morning.

### Token refresh

When the LINE access token is missing or expired, the app automatically opens a non-headless Chromium window and navigates to the vote page. If the saved browser session is still valid, the token is captured automatically. Otherwise, complete the LINE login manually in the opened browser window — the script will resume once the token is intercepted.

---

## Session files

All session files are stored locally only and never leave your machine.

| File                      | Purpose                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| `session/candidates.json` | Selected candidate `searchId` list, run config script to overwrite it |
| `session/auth.json`       | Playwright browser storage state (cookies / localStorage)             |
| `session/token.json`      | LINE access token and capture timestamp                               |

---

## Disclaimer

This project is intended for personal learning and technical research purposes only. The author takes no responsibility for any account suspension, service interruption, or other damages resulting from the use of this software. Use at your own risk and ensure compliance with LINE's and CPBL's terms of service.

If you are an official representative of CPBL or LINE and believe this project infringes upon your rights, please contact the author via email. The project will be taken down promptly upon a valid request.
