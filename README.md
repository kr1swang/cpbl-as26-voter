# vote-cpbl-as-2026

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

### First-time login (obtain token)

```bash
yarn login
```

A browser window will open. If the session has expired, log in to LINE manually.  
Once the page loads, the token is intercepted and saved to `session/` automatically, then the browser closes.

### Start the scheduler

```bash
# Development (runs with tsx directly)
yarn dev

# Production (compile then run)
yarn start
```

### Handling token expiration

If you see `TOKEN_EXPIRED` in the logs, simply run `yarn login` again.

---

## Customizing Candidates

Edit `src/utils/constants.ts` to change who you vote for.

Each entry in `candidates` is a player's `searchId` and must correspond to the position defined at the same index in `expectedPositions`:

| Index | Position   | Code |
| ----- | ---------- | ---- |
| 0     | 先發投手   | P1   |
| 1     | 中繼投手   | P2   |
| 2     | 救援投手   | P3   |
| 3     | 捕手       | C    |
| 4     | 一壘手     | 1B   |
| 5     | 二壘手     | 2B   |
| 6     | 三壘手     | 3B   |
| 7     | 游擊手     | SS   |
| 8–10  | 外野手     | CF   |
| 11    | 指定打擊   | DH   |
| 12–15 | 全壘打大賽 | HR   |

To find a player's `searchId`, call the candidates API:

```
GET https://cpbl-server.line-apps.com/api/candidates
```

Each player in the response has a `searchId` field (e.g. `"cpbl_48"`).

---

## Disclaimer

This project is intended for personal learning and technical research purposes only. The author takes no responsibility for any account suspension, service interruption, or other damages resulting from the use of this software. Use at your own risk and ensure compliance with LINE's and CPBL's terms of service.
