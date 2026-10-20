# SENTRIX — Adaptive Cyber Deception Platform

SENTRIX is an educational security operations dashboard with simulated decoys and a separately hosted HTTP login honeypot. Simulated events and honeypot observations are clearly classified. The SQLite backend is local and intended for authorized demonstrations; this project is not a production security appliance.

## Requirements and fresh setup

- Node.js **22.13 or newer** (the backend uses `node:sqlite`; Vite 8 also requires a current Node release).
- npm 10 or newer and network access for the initial dependency installation.
- Windows PowerShell commands below also work with small path/shell adjustments on macOS or Linux.

```powershell
cd path\to\sentrix-fixed
npm ci
Copy-Item .env.example .env
```

Generate a private admin token and put it in `.env` as `ADMIN_TOKEN`. Keep `.env` private and never add the token to a `VITE_` variable. The example placeholder is intentionally rejected by the backend.

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Run the frontend and both backend listeners in one terminal:

```powershell
npm run dev:all
```

Open <http://127.0.0.1:3000>. The management health endpoint is <http://127.0.0.1:5000/api/v1/health>. Stop the processes with Ctrl+C. The local SQLite database is created at `backend/sentrix.sqlite` by default; back it up only while the service is stopped.

Individual commands are `npm run dev`, `npm run server`, `npm run build`, `npm run lint`, and `npm test`.

## Listener and network boundaries

The **management API** binds to `127.0.0.1:5000` by default. `API_HOST` is accepted only when it names localhost or a loopback address. Vite and its `/api` proxy also bind locally. The API checks `Origin` when supplied, validates JSON mutation content types, and requires a Bearer admin token for database reset and status PATCH operations. Missing/weak `ADMIN_TOKEN` disables these operations. The normal UI does not send or expose that token, and its reset controls are disabled in backend mode.

The **honeypot** is a different Express listener, on `127.0.0.1:5001` by default. A controlled test can make only this listener reachable from a test network by setting, for example, `HONEYPOT_HOST=0.0.0.0` and `HONEYPOT_PORT=5001`, then applying the host firewall rules for the authorized test. Do not change `API_HOST`, forward port 5000, or expose the Vite server. The host firewall and network should allow only the intended tester. Restore loopback binding after the exercise.

The supported bait routes are `POST /login`, `POST /auth/login`, and `POST /`. Send synthetic data only. For an authorized second-machine test, replace `HONEYPOT_IP` with the explicitly configured address of the test host:

```sh
curl -i -X POST "http://HONEYPOT_IP:5001/auth/login" \
  -H 'Content-Type: application/json' -H 'User-Agent: SENTRIX-authorized-test' \
  --data '{"username":"synthetic-user","password":"synthetic-password"}'
```

The listener returns a synthetic 401 and stores a honeypot-classified event. The source IP comes from the TCP peer address; forwarded proxy headers are ignored. Password, token, authorization, cookie, credential, and key values are redacted. Other submitted values are omitted; only bounded field names are retained. Event Logs refresh from SQLite every two seconds. Do not submit real credentials or personal data.

## Configuration

See [.env.example](.env.example). The main settings are:

| Setting | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Frontend API path through the local Vite proxy |
| `VITE_USE_REAL_BACKEND` | `true` in the example | Use local SQLite API; false/unset selects labelled in-memory demo data |
| `API_HOST`, `API_PORT` | `127.0.0.1`, `5000` | Loopback-only management listener |
| `ADMIN_TOKEN` | unset | Unique 32+ character bearer secret for reset/PATCH; absent or placeholder disables changes |
| `CORS_ORIGIN` | `http://127.0.0.1:3000` | The only accepted browser origin |
| `SENTRIX_DB_PATH` | `backend/sentrix.sqlite` | Local SQLite file path |
| `HONEYPOT_HOST`, `HONEYPOT_PORT` | `127.0.0.1`, `5001` | Separate, explicitly configurable honeypot bind address and port |
| `API_RATE_LIMIT`, `API_RATE_WINDOW_MS` | `120`, `60000` | Per-peer management API request limit and window |
| `HONEYPOT_RATE_LIMIT`, `HONEYPOT_RATE_WINDOW_MS` | `30`, `60000` | Per-peer honeypot request limit and window |

Backend mode is never silently replaced by mock data when the API is down. The persistent banner reports backend status. The management API accepts at most 16 KiB JSON; honeypot request bodies are limited to 4 KiB. Events and alerts are capped at 10,000 rows each and sessions at 5,000. The backend validates event types, severity, identifiers, and statuses; SQL uses parameters; event/session/alert writes and resets are transactional with rollback.

## Risk and adaptive behavior

Risk is computed per session from event severity: `low +5`, `medium +12`, `high +22`, `critical +35`. Event frequency contributes because each event adds its severity weight to its own session. A session score is capped at 100; the application-wide score is the highest session score, also clamped to 0–100. Severity bands are low (0–29), medium (30–59), high (60–79), and critical (80–100). Scores only rise as events arrive and decrease on an authorized database reset. Backend mode uses the API's score as authoritative; local demo mode uses the same rules in `src/services/risk.ts`. The displayed risk factors are live counts grouped by severity; each factor's weight is the actual points added per such event. There are no separate hidden velocity or resource multipliers.

At a session score of **60**, adaptive state changes from `standard` to `enhanced`. This is a simulated response policy: the dashboard labels the state, and the event that crosses the threshold records the transition. It does not claim to isolate a host or alter a real network. For an HTTP-only demonstration, three high-severity login attempts from one client address produce scores 22, 44, then 66 and transition to enhanced mode.

## API summary

Management endpoints are prefixed with `http://127.0.0.1:5000/api/v1`:

- `GET /health`, `/assets`, `/assets/:id`, `/simulation/scenarios`, `/events`, `/alerts`, `/sessions`, `/risk/analysis`
- `POST /simulation/trigger-event` records a validated simulated event.
- `POST /simulation/reset` clears demo database data; requires `Authorization: Bearer <ADMIN_TOKEN>`.
- `PATCH /alerts/:id/status` and `PATCH /sessions/:id/status` require the same token and validated JSON.

Management mutations are not made available on the honeypot listener.

## Features retained

The existing SENTRIX dark SOC interface, navigation, charts, overview, asset/decoy registry, threat monitoring, interactive decoy screens, risk analysis, alerts, event logs, analytics, settings, and scenario player remain. Page components are loaded on demand to reduce the initial JavaScript payload. The browser polls backend events, alerts, sessions, and risk every two seconds and cleans up its timer on unmount.

## Automated verification and acceptance checklist

Run `npm test` for 27 repeatable Node tests using temporary SQLite databases. The latest local result is **27 passed, 0 failed**. `npm run lint` passed. `npm run build` passed.

| Reviewer criterion | Implementation | Verification | Result |
|---|---|---|---|
| Incoming honeypot request logs without UI action | `backend/server.cjs`, `/login` and `/auth/login` on separate listener | Automated honeypot request test verifies an event appears through `GET /events` | PASS (local HTTP test) |
| Request metadata and secret redaction | `backend/server.cjs`, `backend/validation.cjs` | Automated test checks IP, user-agent, method, resource and absent synthetic password/token values | PASS |
| Reach honeypot from authorized second machine | `HONEYPOT_HOST` configuration and curl instructions above | No second authorized machine was available in this environment | NOT TESTED |
| Unauthenticated reset/PATCH rejected | Admin middleware on reset and both PATCH routes | Missing, invalid, and valid reset token tests; missing and authorized/invalid PATCH tests | PASS |
| Management API localhost-only by default | `backend/server.cjs`, `vite.config.ts`, `package.json` | Listener configuration and host guard inspected; cross-origin mutation test passes | PASS (binding/config); second-machine network probe NOT TESTED |
| Adaptive threshold transition and boundary | `backend/risk.cjs`, `src/services/risk.ts` | Unit checks at 59/60; HTTP events cross 44→66 and event records transition | PASS |
| Consistent risk scoring and caps | `backend/risk.cjs`, `src/services/risk.ts`, backend risk endpoint | Weights, bands, cap and backend response tested; TypeScript check passes | PASS (formula/API); full browser visual review NOT TESTED |
| Event, severity, identifier, and resource validation | `backend/validation.cjs`, management routes | Invalid type, severity, and unregistered resource tests | PASS |
| JSON content type, malformed data, and bounded request bodies | `backend/server.cjs` | Unsupported content type, malformed JSON, and 413 tests on both listeners | PASS |
| Retention limits and parameterized SQL | `backend/server.cjs` | SQL uses bound parameters; event, alert, and session caps are implemented; max-cap load test NOT RUN | PASS (code inspection); capacity test NOT RUN |
| Risk factors and session scores use live application data | `backend/server.cjs`, `src/services/risk.ts`, `src/pages/AnalyticsPage.tsx` | API score/factor test; demo counts and authoritative backend scores checked in source | PASS (API test and source check) |
| Refresh reflects new events and cleans up | `src/context/DeceptionContext.tsx` | Two-second non-overlapping polling loop with effect cleanup; local event appeared at API | PASS (code and HTTP smoke); browser re-render NOT TESTED |
| Demo status and environment documentation | `src/components/common/DemoNoticeBanner.tsx`, `.env.example`, `README.md` | Placeholder-only admin config; documented npm commands and ports reviewed | PASS (source check) |
| At least ten API/security tests | `backend/server.test.cjs` | `npm test` | PASS: 27 tests |
| Rate and body-size limits | `backend/server.cjs` | 429 and 413 API tests | PASS |
| Transaction rollback | `backend/risk.cjs` | Forced commit-failure rollback test | PASS |
| Application builds and starts | npm scripts and Vite config | `npm run lint`, `npm run build`, `npm run dev:all` on OS-assigned loopback ports; UI returned 200, API health returned ok | PASS (build, app launcher, and local HTTP smoke); interactive browser walkthrough NOT TESTED |
| Live honeypot to event log and adaptive response | Separate HTTP listener with SQLite persistence | Local launcher smoke sent synthetic requests: event visible at management API, three attempts advanced 22→44→66, response profile changed to enhanced, event recorded `adaptiveTransition=true` | PASS (same-machine end-to-end); second machine NOT TESTED |
| No administrative API exposed by honeypot | Separate app/listeners in `backend/server.cjs` | Code inspection and distinct listener route tests | PASS |

The source currently has no duplicate `RiskAnalysisPage`, `DeceptionContext`, or `api.ts` files and no `copy`-suffixed source files. `README_BACKEND_AR.md` was byte-identical to this project's original `README.md` and contained no unique material.

## Package changes

- Removed the duplicate nested `sentrix-fixed/sentrix-fixed` project copy from the output archive.
- Removed `bun.lock`; npm's `package-lock.json` is the single maintained lockfile.
- Removed duplicate `README_BACKEND_AR.md` after confirming byte-for-byte equality with the original README.
- Removed the local `.env` from the distributable; `.env.example` contains placeholders only.
- Removed unused `@google/genai` dependency and stale Gemini capability metadata after confirming no source imports.
- Removed unused `cors` dependency; origin handling is implemented explicitly in the management API.
- Unified frontend and backend asset/scenario definitions through `src/data/backendSeed.json`.
- Renamed the npm package to `sentrix-deception-platform` and reconciled its lockfile.

## Bundle measurement and limitations

Before route splitting, the local production build emitted a **777.58 kB** JavaScript entry chunk (217.45 kB gzip). After splitting, the entry chunk is **270.49 kB** (85.27 kB gzip), a 65.2% smaller entry; route and chart chunks load on demand. All 23 emitted JavaScript chunks total **789.79 kB**, 1.6% larger than the former single chunk; the largest deferred chart chunk is 338.93 kB (99.27 kB gzip). The change reduces the entry chunk, not the aggregate JavaScript payload.

The second-machine reachability check, host firewall behavior, visual browser walkthrough, and real-device LAN verification remain untested. These require a second authorized machine and a controlled network. This project is educational and should not be deployed as an internet-facing honeypot or management service.
