# cpbl-as26-voter

An automated voting bot for the 2026 CPBL All-Star Game fan vote.

Votes once per day at 01, 07, 13, and 19 o'clock with randomized minutes and seconds.

---

## Stack

- **Playwright** — opens a browser to complete LINE login and intercept the access token
- **axios** — calls the voting API
- **date-fns** — schedule time calculation
- **session/auth.json** — persists browser session (cookies / localStorage)
- **session/token.json** — stores the runtime access token
- **session/candidates.json** - stores the selected candidates for each position

---

## Getting Started

### Install dependencies

```bash
yarn install
npx playwright install chromium
```

### 1. Configure candidates

```bash
yarn config
```

Fetches the latest candidates from the CPBL API and prompts you to interactively select one player per position. Selections are saved to `session/candidates.json`.

Default settings are the developer's selections for each position. You can modify the candidates at any time by running the command again.

### 2. Start the scheduler

```bash
yarn start
```

`start` is the only runtime entrypoint.

When token/auth state is stale, the app first attempts silent refresh. If that fails, it automatically opens an interactive browser flow to complete authentication and then continues.

### Handling token expiration

If `TOKEN_EXPIRED` appears in the logs, automatic refresh and interactive authentication both failed. Re-run `yarn start` and complete LINE login when the browser opens.

---

## Disclaimer

This project is intended for personal learning and technical research purposes only. The author takes no responsibility for any account suspension, service interruption, or other damages resulting from the use of this software. Use at your own risk and ensure compliance with LINE's and CPBL's terms of service.

If you are an official representative of CPBL or LINE and believe this project infringes upon your rights, please contact the author via email. The project will be taken down promptly upon a valid request.
