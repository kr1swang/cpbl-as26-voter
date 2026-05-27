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

---

## Getting Started

### Install dependencies

```bash
yarn install
npx playwright install chromium
```

### 1. Login (obtain token)

```bash
yarn login
```

A browser window will open. If the session has expired, log in to LINE manually.  
Once the page loads, the token is intercepted and saved to `session/` automatically, then the browser closes.

### 2. Configure candidates

```bash
yarn config
```

Fetches the latest candidates from the CPBL API and prompts you to interactively select one player per position. Selections are saved to `session/candidates.json`.

### 3. Start the scheduler

```bash
# Development (runs with tsx directly)
yarn dev

# Production (compile then run)
yarn start
```

### Handling token expiration

If you see `TOKEN_EXPIRED` in the logs, simply run `yarn login` again.

---

## Disclaimer

This project is intended for personal learning and technical research purposes only. The author takes no responsibility for any account suspension, service interruption, or other damages resulting from the use of this software. Use at your own risk and ensure compliance with LINE's and CPBL's terms of service.
