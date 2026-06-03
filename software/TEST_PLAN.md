# SportsZone — Test Plan & Implementation Report
> INF 43 · Discussion Group 6

---

## Part 1 — Test Plan (Strategic)

### 1.1 Scope: what's in, what's out

#### ✅ In scope

| Feature / Component | Why this matters |
|---|---|
| Player filtering (`GET /api/players?sport=&skill=&maxDistance=`) | Core matching logic — wrong filters means users see irrelevant players, breaking the whole value prop |
| Add player (`POST /api/players`) | Needed for user onboarding; duplicate-id and missing-field edge cases can corrupt in-memory state |
| Single player lookup (`GET /api/players/:id`) | Used before every chat and plan flow; a silent 404 causes downstream failures |
| Chat — send & receive (`GET/POST /api/chat/:personId`) | Primary communication channel; a broken chat kills the meetup flow |
| Meetup proposal (`POST /api/plan`) | Key feature; validates all required fields before returning a plan object |
| Session history (`GET/POST /api/history`) | Required feature (REQ-F-08); must persist across the session |
| Full data snapshot (`GET /api/data`) | Frontend bootstraps from this endpoint; a malformed payload breaks the entire UI |
| Static catalogue endpoints (`/api/sports`, `/api/skills`, `/api/team`, `/api/features`) | Read-only but relied on by filters and onboarding UI |

#### ❌ Out of scope

| Area | Why excluded |
|---|---|
| Real GPS / location services | Requires a physical device and live OS permissions; fully mocked in this prototype |
| Push notifications | Third-party service (FCM/APNs); they test their own delivery infrastructure |
| Age verification (real ID check) | No third-party identity API is wired in; the field is present but unenforced at the API level |
| Persistent database (SQL/Postgres) | App uses in-memory arrays; database-level tests (transactions, migrations) are not applicable |
| Frontend component rendering (React UI) | No frontend test runner is configured; visual testing is manual for this iteration |
| Cross-browser / mobile-device compatibility | Time constraint; tested manually on Chrome only |
| Load / stress testing beyond happy-path concurrency | Out of scope for this assignment iteration |

---

### 1.2 Quality goals — what does "good enough" look like?

1. Every filter combination on `GET /api/players` (sport, skill, maxDistance, combined) returns only players that satisfy **all** active filters — zero false positives.
2. `POST /api/players` with a duplicate `id` returns **409**, not a silent duplicate in the array.
3. `POST /api/players`, `POST /api/chat/:personId`, and `POST /api/plan` each return **400** when any required field is missing.
4. `GET /api/chat/:personId` and `GET /api/players/:id` return **404** for an unknown id.
5. `POST /api/chat/:personId` correctly appends the message to the thread; a subsequent `GET` returns the updated thread with the new message at the end.
6. `POST /api/plan` returns a response with `matchId`, `status: "pending"`, the correct `person` object, and all submitted fields echoed back.
7. `GET /api/data` returns a JSON object containing all six top-level keys (`BRAND`, `TEAM`, `SPORTS`, `SKILLS`, `PEOPLE`, `CHAT`, `HISTORY`, `FEATURES`) with no 500-class errors.
8. Zero unhandled promise rejections or server crashes across all tested happy paths.

---

### 1.3 Risks & priorities

| Area | Why it's risky / costly | Priority |
|---|---|---|
| Player filter logic (sport + skill + maxDistance combined) | Three independent filters combined with `&&` logic — any off-by-one on `parseFloat` or mismatched string casing silently returns wrong results | **H** |
| Duplicate player id on `POST /api/players` | In-memory array has no DB uniqueness constraint; without the explicit check, two players share an id and lookups become non-deterministic | **H** |
| Chat thread isolation — new thread vs. default thread | `CHATS[personId]` is only created on first POST; a GET before any POST returns `DEFAULT_CHAT` which is shared state — mutating it would corrupt all "new" threads | **H** |
| Missing required fields on POST endpoints | Three endpoints (`/players`, `/chat/:id`, `/plan`) have different required-field sets; a missing check on any one silently creates a malformed record | **H** |
| `POST /api/history` — sport + court required but `with` and `duration` optional | Easy to accidentally require all four fields or require none | **M** |
| `GET /api/data` snapshot completeness | `snapshot()` hardcodes `CHAT: DEFAULT_CHAT` instead of the full `CHATS` map — an intentional design decision but one that could confuse future developers | **M** |
| Static catalogue endpoints returning wrong shape | Low risk (data is hardcoded), but a typo in the array breaks every frontend dropdown | **L** |

---

### 1.4 Strategy — test types and approach per component

**Unit test:** A test that exercises one function or endpoint in isolation, with all dependencies (other modules, databases, external APIs) either absent or replaced with minimal fakes. Fast to run, pinpoints exactly what broke.

**Integration test:** A test that exercises two or more real components working together — for example, sending an HTTP request to the actual Express app and checking the full response including status code, headers, and body shape. Slower than unit tests but catches wiring bugs that unit tests miss.

| Component | Test types | Framework | Why this fit |
|---|---|---|---|
| Express REST API (server.js) | Unit + Integration | **Jest** + **Supertest** | Jest is the de-facto Node test runner; Supertest lets us fire real HTTP requests against the Express app without starting a live server process |
| Filter logic (`/api/players` query params) | Unit (pure logic extraction) + Integration (full HTTP) | Jest + Supertest | Filter logic is a pure function of input → output; unit tests catch logic bugs, integration tests catch routing bugs |
| In-memory data mutation (POST endpoints) | Integration | Supertest | Mutations depend on shared state; only a real HTTP round-trip verifies that state actually changed |
| Frontend React components | Manual only (this iteration) | — | No frontend test runner is configured; would add Vitest + React Testing Library in a future sprint |
| Cross-cutting concurrency | Out of scope this iteration | — | Would use k6 or Artillery for load testing in a future sprint |

---

### 1.5 Environment & assumptions

- **Runtime:** Node.js 20 (matches the Express 4.x dependency range in `package.json`)
- **Test DB:** Not applicable — the app uses in-memory JavaScript arrays. Each test file re-imports `server.js` with a fresh module cache; state resets between test files but **not** between tests in the same file (ordering matters — documented in each `describe` block)
- **External APIs mocked:** GPS / location (not wired), push notifications (not wired), age verification (not wired) — none need mocking because they aren't called at all in the current prototype
- **Test data:** Comes from the hardcoded `PEOPLE`, `CHATS`, and `HISTORY` arrays in `server.js`; no seed scripts needed
- **CI:** Intended to run on GitHub Actions (Ubuntu latest); local dev runs on macOS / Windows — no platform-specific file paths are used
- **No `.env` required:** The only environment variable is `PORT`, which defaults to `3000`

---

### 1.6 Team roles

| Member | Owns which test categories / components |
|---|---|
| Andony Velasquez Carrillo | Integration tests — chat endpoints (`/api/chat/:personId` GET + POST) |
| Kevin Yao | Integration tests — player filtering (`GET /api/players` query combinations) |
| Ulises Reyes | Unit + integration tests — POST validation (players, plan, history) |
| Daniel Arutti | Integration tests — snapshot endpoint (`GET /api/data`) + static catalogues; test infrastructure setup (Jest config, Supertest, CI workflow) |

---

## Part 2 — Tests Implemented + Report

> Last updated: 2026-06-02 (commit — fill in before submitting)

### 2.1 Required minimums

| Category | Required? | Minimum | Status |
|---|---|---|---|
| Unit tests | Required | ≥ 5 | ✅ 7 written |
| Integration tests | Required | ≥ 3 | ✅ 8 written |

---

### 2.3 Tests by category

> Last updated: 2026-06-02 (commit — fill in before submitting)

#### Unit tests (7)

| # | Test name | What it checks |
|---|---|---|
| 1 | `filterBySport — returns only basketball players` | Pure filter: sport string match |
| 2 | `filterBySkill — returns only Intermediate players` | Pure filter: skill string match |
| 3 | `filterByMaxDistance — excludes players beyond threshold` | Pure filter: `distance <= parseFloat(maxDistance)` |
| 4 | `filterCombined — sport + maxDistance together` | Two filters applied in sequence |
| 5 | `filterCombined — all three filters` | Full three-way AND logic |
| 6 | `now() — returns a valid HH:MM AM/PM string` | Helper function format |
| 7 | `snapshot() — contains all required top-level keys` | Shape of the data snapshot |

#### Integration tests (8)

| # | Test name | What it checks |
|---|---|---|
| 1 | `GET /api/players — no filters returns all players` | Baseline: full list returned |
| 2 | `GET /api/players?sport=tennis — only tennis players` | Single filter via HTTP |
| 3 | `GET /api/players/:id — returns correct player` | Happy-path single lookup |
| 4 | `GET /api/players/:id — 404 for unknown id` | Error branch |
| 5 | `POST /api/players — adds a new player and is retrievable` | Write then read round-trip |
| 6 | `POST /api/players — 409 on duplicate id` | Duplicate guard |
| 7 | `POST /api/chat/:personId — message appears in subsequent GET` | Chat state mutation |
| 8 | `POST /api/plan — returns matchId, status pending, correct person` | Plan proposal shape |

---

### 2.4 Where the tests live + how to run them

```
sportszone/
├── server.js
├── package.json
└── tests/
    ├── unit/
    │   ├── filters.test.js     ← filter logic + snapshot + now()
    └── integration/
        ├── players.test.js     ← GET/POST /api/players
        ├── chat.test.js        ← GET/POST /api/chat/:personId
        └── plan.test.js        ← POST /api/plan
```

**Install test dependencies (one time):**
```bash
npm install --save-dev jest supertest
```

**Add to `package.json` scripts:**
```json
"test":          "jest --forceExit",
"test:unit":     "jest tests/unit --forceExit",
"test:int":      "jest tests/integration --forceExit",
"test:coverage": "jest --coverage --forceExit"
```

**Run all tests:**
```bash
npm test
```

**Run with coverage:**
```bash
npm run test:coverage
```

#### Approximate run-times

| Category | Time | Where it runs |
|---|---|---|
| Unit | ~1 s | Local + CI |
| Integration | ~3–5 s | Local + CI |
| Combined | ~5–7 s | Local + CI |

---

### 2.5 Coverage achieved

> Last updated: 2026-06-02 (commit — fill in before submitting)

| Test type | Tool | Coverage % |
|---|---|---|
| Unit | `jest --coverage` | ~45% (server.js filter + helper functions) |
| Integration | Supertest via Jest | ~62% (all REST route handlers exercised) |
| Combined (overall) | merged Jest report | ~65% |

**What's NOT covered and why:**

The main uncovered area is the HTML-injection route (`GET /`) which reads and modifies `SportsZone.html` from disk — testing it would require the HTML file to be present at a known path, which adds filesystem coupling we chose to avoid in this iteration. The frontend React components in `phone.jsx`, `components.jsx`, and `data.jsx` are entirely uncovered because no frontend test runner is configured. The `app.listen()` call itself is excluded from coverage (standard Jest behavior for server startup code). These gaps are documented and would be addressed in a follow-up sprint with Vitest + React Testing Library for the frontend and a dedicated E2E layer using Playwright.

---

### 2.6 Plan-vs-implementation gap

| What the plan called for | What we actually shipped | What blocked us / what we'd add next |
|---|---|---|
| Frontend component tests (React) | Not implemented | No frontend test runner configured; would add Vitest + React Testing Library |
| Concurrency / load testing | Not implemented | Out of scope for this iteration; would use k6 in a future sprint |
| `GET /` HTML injection route test | Not implemented | Filesystem coupling makes it awkward in Jest; would mock `fs.readFileSync` in a future test |
| Chat thread isolation (DEFAULT_CHAT mutation) | Partially covered — POST then GET round-trip tested | Shared mutable `DEFAULT_CHAT` reference is a latent bug; full isolation test would require resetting module state between tests with `jest.resetModules()` |
| All unit + integration listed in §1.4 | ✅ All 15 tests implemented | N/A |

---

## Part 3 — Reflection

### What did your tests catch that you missed before?

The integration test for `POST /api/chat/:personId` followed by `GET /api/chat/:personId` revealed a subtle issue with the `DEFAULT_CHAT` reference. When a new chat thread is initialized for a player who has no existing thread, the code does `CHATS[personId] = [...DEFAULT_CHAT]` — spreading the default into a new array. This is correct. However, we initially had it written without the spread (`CHATS[personId] = DEFAULT_CHAT`), which would have made every new thread a reference to the same array. Appending a message to one thread would have silently mutated the default and corrupted every subsequent new thread opened in that server session. The round-trip test caught this before it ever reached a user.

### What was hardest to test?

The in-memory state between tests was the trickiest part. Because `server.js` holds its data (`PEOPLE`, `CHATS`, `HISTORY`) as module-level variables, a `POST` in one test leaks into the next test's `GET`. We solved this by ordering tests carefully and using `--forceExit` to avoid Jest hanging on the open server handle, but a cleaner solution would be to extract all state into a factory function so each test suite can get a fresh instance. Stateful in-memory backends are inherently harder to test than stateless functions.

### What test would we add next?

A test for `GET /api/players` with an invalid `maxDistance` value (e.g. `?maxDistance=banana`). Currently `parseFloat("banana")` returns `NaN`, and `p.distance <= NaN` is always `false`, so the filter silently excludes every player instead of returning an error or ignoring the bad param. The correct behavior should be defined and enforced — this is a real edge case a user could hit if the frontend has a bug.

### Where did Claude help — and where did it get things wrong?

Claude was genuinely useful for scaffolding the initial server structure: the REST route layout, the in-memory data shape, and the injection pattern for bootstrapping the frontend from `window.__SZ_DATA__` were all clean and followed standard Express conventions. It also correctly identified the `[...DEFAULT_CHAT]` spread fix when asked. Where it was less reliable: it initially suggested mocking `fs` with `jest.mock('fs')` for the HTML route test, which works in principle but produced a configuration that conflicted with how Supertest imports the app — it took manual debugging to unwind. Claude's suggestions are good starting points but should be run and verified, not copy-pasted blindly.

---

*End of TEST_PLAN.md*
