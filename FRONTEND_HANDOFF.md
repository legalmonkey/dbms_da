# Frontend Handoff — Meridian Diagnostics LIMS

Client-side frontend for the Diagnostic Lab Test & Report Management System.

**Read this section first.** This repository is a **completed foundation, not a
completed application.** Being precise about that is the whole point of a
handoff document, so:

| Layer | State |
|---|---|
| Design system, 21 UI primitives, app shell, navigation | **Built and working** |
| Role model, permissions, route guards, demo login | **Built and working** |
| Domain types + Zod schemas for every entity | **Built and working** |
| Reference-range resolution engine | **Built and working** |
| Routing — 24 routes, all reachable, all guarded | **Built and working** |
| Screen content for patients, catalogue, orders, samples, results, reports, analytics | **Placeholder pages** — each renders a "Scheduled for Phase N" panel |
| `src/services/` — the API abstraction layer | **Empty directory.** Designed and specified, not yet written |
| `src/mock/` — mock data | **Empty directory.** Not yet written |

So: no screen in this application currently fetches data, because there is no
data layer yet. What *is* finished is everything the data layer will plug into,
plus a frozen interface contract (`docs/api-contract.md`) that the backend can
be built against starting today. That contract is the most useful thing in this
repository for the backend team.

---

## 1. Install and run

Requires Node.js 20.19+ or 22.12+ (built on 22.20) and npm 10+.

```bash
npm install
npm run dev
```

Dev server: **http://localhost:5173**. If that port is taken:

```bash
npm run dev -- --port 5273
```

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | `tsc -b` typecheck, then production bundle into `dist/` |
| `npm run preview` | Serves the built `dist/` locally, closest thing to production |
| `npm run lint` | oxlint |

There is no test suite yet.

### Production hosting requirement

This is a single-page app using browser history routing. **The server must
rewrite unknown paths to `index.html`**, or every deep link (`/patients/123`)
returns 404 on refresh. `npm run preview` does this automatically; nginx,
Apache and Tomcat do not unless configured.

```nginx
location / { try_files $uri $uri/ /index.html; }
```

---

## 2. Project structure

```
lab-lims/
├── docs/api-contract.md      ← the interface spec. Backend team starts here
├── .env                      ← API mode + base URL (see §6)
└── src/
    ├── app/                  router, providers, guards, permission model
    ├── components/
    │   ├── ui/               21 primitives (Radix behaviour, our styling)
    │   ├── layout/           AppShell, Sidebar, Topbar, PageHeader
    │   ├── data/             EmptyState, ErrorState, StatCard
    │   └── domain/           StatusBadge, ResultFlagIndicator, ReferenceRangeBar
    ├── features/             EMPTY — one folder per workflow, added per phase
    ├── pages/                route components (currently mostly placeholders)
    ├── services/             EMPTY — the API abstraction layer (see §4)
    ├── mock/                 EMPTY — deterministic seed data (see §5)
    ├── types/                domain types + Zod schemas — the contract source
    ├── hooks/                useAuth, useTheme, useMediaQuery
    ├── lib/                  cn, en-IN formatters, reference range engine
    └── styles/               tokens.css, base.css, print.css
```

### Where the important logic lives

| Concern | File |
|---|---|
| Every domain type and validation rule | `src/types/*.ts` |
| Permission strings and role→permission map | `src/types/auth.ts` |
| Which nav item needs which permission | `src/app/navigation.ts` |
| Route table and guards | `src/app/router.tsx`, `src/app/guards.tsx` |
| Demo session handling | `src/app/AuthProvider.tsx` |
| Abnormal/critical result flagging | `src/lib/referenceRange.ts` |
| Currency, date, age formatting (`en-IN`) | `src/lib/format.ts` |
| Query retry/staleness policy | `src/app/queryClient.ts` |

---

## 3. Routes

`/login` is public. Everything else requires a demo session, and each route is
additionally gated on a **permission**, not a role.

| Route | Permission | Status |
|---|---|---|
| `/login` | — | Built |
| `/` | — | Redirects by role |
| `/dashboard` | `order:read` | Placeholder (Phase 3) |
| `/patients` · `/patients/:id` | `patient:read` | Placeholder (Phase 4) |
| `/patients/new` · `/patients/:id/edit` | `patient:write` | Placeholder (Phase 4) |
| `/catalogue` · `/catalogue/:testId` | `catalogue:read` | Placeholder (Phase 5) |
| `/orders` · `/orders/:id` | `order:read` | Placeholder (Phase 6) |
| `/orders/new` | `order:create` | Placeholder (Phase 6) |
| `/samples` · `/samples/:id` | `sample:read` | Placeholder (Phase 7) |
| `/worklist` | `worklist:read` | Placeholder (Phase 8) |
| `/worklist/:orderTestId` | `result:write` | Placeholder (Phase 8) |
| `/reports` · `/reports/:id` | `report:read` | Placeholder (Phase 9) |
| `/reports/:id/print` | `report:read` | **Stub** — redirects to the report until Phase 9 |
| `/analytics` | `analytics:read` | Placeholder (Phase 10) |
| `/me` · `/me/reports` | `patient:read-own` · `report:read-own` | Placeholder |
| `/settings` | `settings:manage` | Placeholder (Phase 10) |
| `/design-system` | — | **Built** — every primitive, both themes |
| `/403`, `*` | — | Built |

`/design-system` is the fastest way to see what the foundation actually
provides.

---

## 4. The service layer — how backend integration is meant to work

**This is the part your teammate needs to understand, and the part that is not
written yet.** The design is fixed; only the code is missing.

### The intended shape

```
Component  →  useQuery hook  →  service function  →  http.ts  →  ┬─ mock handler
                                                                 └─ fetch()
```

No component ever touches mock data or calls `fetch` directly. Every screen goes
through a service, and every service goes through **one** file.

`src/services/http.ts` is the single seam:

```ts
export async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T>
```

In mock mode it routes to an in-memory handler map keyed by `METHOD /path`. In
live mode it is a `fetch` against `VITE_API_BASE_URL`. Services are written
**once**, against real REST paths, and are never rewritten:

```ts
export const getPatients = (p: ListParams) =>
  request<Paginated<Patient>>('GET', `/patients?${qs(p)}`)
```

### Planned service modules

| File | Functions |
|---|---|
| `patientService.ts` | `getPatients` · `getPatientById` · `createPatient` · `updatePatient` · `getPatientHistory` |
| `catalogueService.ts` | `getTests` · `getTestById` · `getCategories` |
| `orderService.ts` | `getOrders` · `getOrderById` · `createOrder` · `cancelOrder` · `estimateOrder` |
| `sampleService.ts` | `getSamples` · `getSampleById` · `updateSampleStatus` |
| `resultService.ts` | `getWorklist` · `getResultSheet` · `saveTestResults` · `verifyResults` |
| `reportService.ts` | `getReports` · `getReportById` |
| `analyticsService.ts` | `getVolumeSeries` · `getRevenueBreakdown` · `getPipelineBottlenecks` · `getTopTests` |
| `authService.ts` | `loginAs` · `getSession` · `logout` |

All return `Promise<T>` and reject with `ApiError` (`src/types/common.ts`),
which carries `status`, `code`, `message` and optional `fieldErrors`.

### What the backend teammate actually has to do

1. Implement the endpoints in **`docs/api-contract.md`**. That document is the
   agreement — paths, payloads, validation rules, error codes and the
   server-side rules the frontend depends on.
2. When ready, set `VITE_API_MODE=live` and `VITE_API_BASE_URL` in `.env`.
3. Nothing else. No component, hook or page changes.

They do **not** need to touch React, and should not need to read any file in
`src/components/` or `src/pages/`.

---

## 5. Mock data

`src/mock/` is empty. The plan, for whoever builds it:

- Seeded PRNG (fixed seed) so every reload produces identical data — important
  so demo screenshots match the live demo during evaluation.
- Roughly 120 patients, 28 tests across 5 categories, 400 orders spanning 180
  days, ~900 samples, ~2,400 result values.
- Mutable in-memory store mirrored to `sessionStorage`, so an order created
  mid-demo survives a refresh, plus a "Reset demo data" control.
- Simulated latency of 180–450 ms, with dev-only toggles to force slow responses
  and force errors so loading and error states are demonstrable on command.

Mock data must be reachable **only** through `services/http.ts`. If a component
ever imports from `src/mock/`, that is a bug — it breaks the switch in §4.

---

## 6. Environment variables

`.env` is committed deliberately: it holds no secrets, only build-time config.
Vite exposes anything prefixed `VITE_` to the browser bundle, so **never put a
password, API key or connection string in this file.**

| Variable | Current | Purpose |
|---|---|---|
| `VITE_API_MODE` | `mock` | `mock` or `live` — selects the adapter in `http.ts` |
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Backend origin in live mode |

> **Known gap:** both variables are declared but **nothing reads them yet**,
> because `http.ts` does not exist. They are the contract for when it does.

---

## 7. Assumptions the frontend makes about API responses

Full detail is in `docs/api-contract.md`. The assumptions most likely to cause
an integration mismatch:

1. **Pagination envelope.** Every list returns
   `{ data, total, page, pageSize }`. `total` is the count *after* filters and
   *before* pagination.
2. **Timestamps carry an offset.** `2026-03-14T09:42:00+05:30`, never a bare
   local string. `dateOfBirth` is the exception: date-only `YYYY-MM-DD`, because
   a birth date must not shift across a time zone.
3. **Money is an integer number of rupees.** No paise, no floats, no
   pre-formatted strings. The frontend formats for `en-IN`.
4. **`null` means absent.** Never `""`, never an omitted key, never `0`.
5. **Result values are strings, not numbers** — including numeric analytes. This
   preserves `<0.01` and `>1000`, which are real results a float cannot hold.
6. **The server computes result flags.** The frontend flags live during entry for
   immediate feedback, but the stored flag is the server's. Both must use the
   most-specific-variant reference-range rule in `src/lib/referenceRange.ts`.
7. **Reference ranges are an array of sex/age variants**, with `ageMinYears`
   inclusive and `ageMaxYears` exclusive. Every analyte needs one unrestricted
   fallback variant or some patients resolve to no range at all.
8. **Orders and samples carry `patientName` and `patientMrn` inline.** This
   denormalisation is deliberate — list views must not trigger N+1 lookups.
9. **Analytics series are dense.** A day with zero orders is a point with
   `ordered: 0`, not an omitted entry.
10. **Sample status transitions are enforced server-side** and illegal ones
    return `409`. The UI only offers legal moves, but the API must not accept a
    jump from `pending` straight to `completed`.

---

## 8. Known integration points and likely mismatches

| # | Issue | Who decides |
|---|---|---|
| 1 | **Authentication is entirely absent.** No tokens, no password handling, no session security. `AuthProvider` stores a chosen role in `sessionStorage`. The real scheme drops into `http.ts` and `AuthProvider`. | Backend |
| 2 | **The frontend permission model is not a security boundary.** It drives navigation and affordances only. Every endpoint must re-check role *and ownership* server-side — a patient session must not read another patient's records by changing an ID in the URL. | Backend |
| 3 | **Barcode generation** — server-assigned, or does the label printer own the numbering? Decides whether `POST /orders` returns final barcodes. | Backend |
| 4 | **Verification authority** — may a technician verify results they entered? The UI assumes a doctor or admin verifies. | Both |
| 5 | **Result amendment** — can a value change after a report is `final`? If yes, we need an amendment trail and a "corrected report" state, neither of which is designed. | Both |
| 6 | **Concurrency** — two technicians on one result sheet. If you want optimistic locking, tell us and the frontend will echo `updatedAt` on save and handle `409`. | Backend |
| 7 | **Units** — one canonical unit per test, no SI/conventional conversion anywhere. | Agreed |
| 8 | **Locale** — INR currency and `en-IN` dates are hardcoded in `src/lib/format.ts`. | Agreed |

---

## 9. Scope boundary — what is deliberately absent

This repository contains **no** SQL, schema, migration, ORM, server, or backend
logic, and no server-side dependency in `package.json`. Verified by inspection
at handoff. That work belongs to the backend team, and nothing here should grow
into it.

The frontend also does not generate PDFs. `/reports/:id/print` renders a print
stylesheet and hands off to the browser's own print-to-PDF, so no PDF library or
server-side rendering is needed.

---

## 10. Current quality status

| Check | Result |
|---|---|
| `npm run build` | **Passes** — 609 kB JS (185 kB gzipped), 39 kB CSS |
| TypeScript (`tsc -b`, strict + `noUncheckedIndexedAccess`) | **0 errors** |
| `npm run lint` | 0 errors, 7 warnings — all hot-reload granularity hints, no correctness issues |
| Runtime console across all 24 routes | **0 errors, 0 warnings** |
| Broken imports / missing dependencies | None |
| Accessibility | Skip link, focus rings, `aria-live` regions, labelled controls, `aria-sort` ready. Full audit is Phase 12 |
| Known deferred work | Bundle is one 609 kB chunk — route-level code splitting is deliberately deferred to Phase 12, once all routes exist |

Three defects were found and fixed during the handoff audit; see the audit
report. Unused dependencies (`@tanstack/react-table`, `recharts`,
`react-hook-form`, `@hookform/resolvers`) are installed intentionally for
Phases 4–10 and should not be removed.
