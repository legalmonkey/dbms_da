# API Contract — Diagnostic Lab LIMS

**Audience:** the backend team.
**Status:** frozen for Phases 1–12 of the frontend build. Changes here require a
conversation, because the frontend is written against these exact shapes.

The frontend calls these endpoints through `src/services/*.ts`. Today those
services run against an in-memory mock; switching `VITE_API_MODE=mock` to
`live` points the same code at your server with no UI changes. That only works
if the shapes below match on both sides.

---

## 1. Conventions

| Topic | Rule |
|---|---|
| Base URL | `VITE_API_BASE_URL`, default `http://localhost:8080/api` |
| Format | JSON request and response bodies, `Content-Type: application/json` |
| Timestamps | ISO 8601 **with offset** — `2026-03-14T09:42:00+05:30`. Never a bare local string. |
| IDs | Opaque strings. The frontend never parses or generates them. |
| Money | Integer rupees. No paise, no floats, no formatted strings. |
| Casing | `camelCase` in JSON, always. |
| Empty values | `null` for "no value". Never `""`, never omitted, never `0` as a stand-in. |

### Pagination

Every list endpoint accepts:

```
?page=1&pageSize=20&q=<search>&sort=<field>&order=asc|desc
```

`page` is 1-based. `pageSize` max 100. And returns:

```json
{ "data": [ ... ], "total": 348, "page": 1, "pageSize": 20 }
```

`total` is the count **after** filters, before pagination — the UI needs it to
render "348 patients" and the page count.

### Errors

Non-2xx responses use one shape:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Enter a valid 10-digit mobile number",
  "fieldErrors": { "phone": "Enter a valid 10-digit mobile number" }
}
```

`message` is shown to the user, so write it as a sentence a receptionist would
understand. `fieldErrors` maps a form field name to its message and is optional.
The frontend does not retry 4xx responses; it retries 5xx twice.

| Status | `code` | Frontend behaviour |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Attaches `fieldErrors` to the form |
| 401 | `UNAUTHENTICATED` | Redirects to `/login` |
| 403 | `FORBIDDEN` | Redirects to `/403` |
| 404 | `NOT_FOUND` | Shows a not-found state on the page |
| 409 | `CONFLICT` | Shows the message, does not retry (e.g. illegal status transition) |
| 422 | `UNPROCESSABLE` | Shows the message |
| 5xx | any | Shows the error state with a Retry button |

### Authentication

**Out of scope for the frontend.** The demo build has no tokens and no session
security. When you are ready, tell us the scheme (`Authorization: Bearer …` or a
cookie) and it is added in one place — `src/services/http.ts` — not across the
UI. Role and permission enforcement must be re-checked server-side on every
endpoint: the frontend's permission model is for navigation and affordances
only, and must not be treated as a security boundary.

---

## 2. Enumerations

These are closed sets. The frontend switches on them exhaustively, so an
unexpected value is a bug, not a pass-through.

| Enum | Values |
|---|---|
| `Role` | `admin` · `receptionist` · `technician` · `doctor` · `patient` |
| `Sex` | `male` · `female` · `other` |
| `BloodGroup` | `A+` `A-` `B+` `B-` `AB+` `AB-` `O+` `O-` |
| `TestCategory` | `hematology` · `biochemistry` · `thyroid` · `urinalysis` · `immunology` |
| `SampleType` | `blood_edta` · `blood_serum` · `blood_fluoride` · `urine` · `stool` · `swab` |
| `Priority` | `routine` · `urgent` · `stat` |
| `OrderStatus` | `placed` · `in_progress` · `partially_completed` · `completed` · `cancelled` |
| `OrderTestStatus` | `pending` · `in_progress` · `awaiting_verification` · `verified` · `cancelled` |
| `SampleStatus` | `pending` · `collected` · `received` · `processing` · `completed` · `rejected` |
| `ResultFlag` | `normal` · `low` · `high` · `critical_low` · `critical_high` · `abnormal` |
| `AnalyteResultType` | `numeric` · `qualitative` · `text` |

### Sample status transitions

The server must reject any transition not in this table with `409 CONFLICT`.
The UI only offers these moves, but a direct API call must not be able to skip a
step.

| From | Allowed next |
|---|---|
| `pending` | `collected`, `rejected` |
| `collected` | `received`, `rejected` |
| `received` | `processing`, `rejected` |
| `processing` | `completed`, `rejected` |
| `completed` | — terminal |
| `rejected` | — terminal |

---

## 3. Endpoints

### 3.1 Patients

| Method | Path | Notes |
|---|---|---|
| `GET` | `/patients` | Paginated. `q` searches name, MRN and phone. `sort`: `fullName`, `registeredAt`, `lastVisitAt` |
| `GET` | `/patients/:id` | |
| `POST` | `/patients` | Server assigns `id` and `mrn` |
| `PATCH` | `/patients/:id` | Partial update |
| `GET` | `/patients/:id/history` | Returns `PatientHistoryEvent[]`, newest first, not paginated |

**Patient**

```json
{
  "id": "pat-000001",
  "mrn": "PT-024188",
  "fullName": "Kavya Nair",
  "dateOfBirth": "1991-07-22",
  "sex": "female",
  "phone": "9876543210",
  "email": "kavya.nair@example.com",
  "bloodGroup": "O+",
  "addressLine": "14/3 Residency Road",
  "city": "Bengaluru",
  "pincode": "560025",
  "clinicalNotes": "Penicillin allergy.",
  "registeredAt": "2025-11-02T10:15:00+05:30",
  "updatedAt": "2026-02-18T16:40:00+05:30"
}
```

`dateOfBirth` is a **date only** (`YYYY-MM-DD`), not a timestamp — a birth date
has no time zone and must not shift across one.

The list endpoint returns `PatientListItem`, which is a `Patient` plus:

```json
{ "orderCount": 7, "lastVisitAt": "2026-02-18T09:05:00+05:30" }
```

**Validation** (mirror these server-side; the frontend enforces the same rules)

| Field | Rule |
|---|---|
| `fullName` | required, 2–80 chars |
| `dateOfBirth` | required, not in the future |
| `sex` | required, one of the enum |
| `phone` | required, `^[6-9]\d{9}$` |
| `email` | optional, valid email |
| `pincode` | optional, exactly 6 digits |
| `clinicalNotes` | optional, ≤ 500 chars |

**PatientHistoryEvent**

```json
{
  "id": "evt-0091",
  "type": "order_placed",
  "occurredAt": "2026-02-18T09:05:00+05:30",
  "title": "Order ORD-2026-04188 placed",
  "detail": "3 tests · Routine",
  "orderId": "ord-04188",
  "reportId": null,
  "actor": "Priya Sharma"
}
```

`type` is one of `registered` · `order_placed` · `sample_collected` ·
`result_entered` · `report_ready` · `order_cancelled`.

---

### 3.2 Test catalogue

| Method | Path | Notes |
|---|---|---|
| `GET` | `/tests` | Paginated. Filters: `category`, `sampleType`, `active`. `q` searches code and name |
| `GET` | `/tests/:id` | Includes the full `analytes` array |
| `GET` | `/test-categories` | Returns counts per category for the catalogue nav |

**LabTest**

```json
{
  "id": "tst-cbc",
  "code": "CBC",
  "name": "Complete Blood Count",
  "category": "hematology",
  "sampleType": "blood_edta",
  "turnaroundMinutes": 240,
  "price": 450,
  "fastingRequired": false,
  "description": "Screens for anaemia, infection and clotting disorders.",
  "preparation": "No special preparation required.",
  "active": true,
  "analytes": [ ... ]
}
```

**Analyte**

```json
{
  "id": "any-hgb",
  "name": "Haemoglobin",
  "unit": "g/dL",
  "resultType": "numeric",
  "decimals": 1,
  "options": null,
  "normalOption": null,
  "referenceRanges": [ ... ]
}
```

For `resultType: "qualitative"`, `options` lists the allowed values and
`normalOption` names the unremarkable one (used to flag `abnormal`).

**ReferenceRange** — the part most likely to be got wrong, so please read it

```json
{
  "sex": "male",
  "ageMinYears": 18,
  "ageMaxYears": null,
  "low": 13.0,
  "high": 17.0,
  "criticalLow": 7.0,
  "criticalHigh": 21.0,
  "note": null
}
```

An analyte carries an **array** of these. Ranges legitimately differ by sex and
age — haemoglobin, creatinine and alkaline phosphatase all do — so this is not
over-engineering, it is the actual domain.

- `sex` absent means "any sex".
- `ageMinYears` is **inclusive**, `ageMaxYears` is **exclusive**.
  A `0–18` variant covers a patient up to but not including their 18th birthday.
- A variant with no `sex` and no age bounds is the fallback for everyone.
  **Every analyte should have one**, or patients outside all variants get no range.
- `low` / `high` may be `null` for one-sided ranges (`< 200`, `> 40`).
- `criticalLow` / `criticalHigh` are optional. When present they outrank the
  ordinary bounds: a value below `criticalLow` flags `critical_low`, not `low`.
- Resolution: the **most specific matching variant wins** (a sex-and-age match
  beats sex-only, which beats the universal fallback). The frontend implements
  this in `src/lib/referenceRange.ts`; the server should apply the same rule
  when it stamps flags on stored results, so the two never disagree.

---

### 3.3 Orders

| Method | Path | Notes |
|---|---|---|
| `GET` | `/orders` | Paginated. Filters: `status`, `priority`, `patientId`, `from`, `to` |
| `GET` | `/orders/:id` | |
| `POST` | `/orders` | Creates the order **and** its samples (see below) |
| `POST` | `/orders/:id/cancel` | Body: `{ "reason": string }` |
| `POST` | `/orders/estimate` | Body: `{ "testIds": string[], "discountPercent": number }`. Read-only, creates nothing |
| `GET` | `/referring-doctors` | Not paginated; the list is small |

**Create order request**

```json
{
  "patientId": "pat-000001",
  "testIds": ["tst-cbc", "tst-tsh"],
  "priority": "routine",
  "referringDoctorId": "doc-004",
  "discountPercent": 0,
  "notes": null
}
```

**On create, the server must:**

1. Compute `subtotal` from current catalogue prices — never trust a client total.
2. Create one `Sample` per **distinct `sampleType`** across the ordered tests, at
   status `pending`. Two tests that both need serum share one tube; that is the
   whole point of grouping by sample type.
3. Set `estimatedTurnaroundMinutes` to the **maximum** turnaround among the
   ordered tests, not the sum — tests run in parallel.
4. Set `expectedReadyAt` from that.

`POST /orders/estimate` returns the same arithmetic without persisting, so the
ordering screen can price a basket live:

```json
{
  "lines": [{ "testId": "tst-cbc", "code": "CBC", "name": "Complete Blood Count", "price": 450 }],
  "subtotal": 1050,
  "discountPercent": 10,
  "discountAmount": 105,
  "total": 945,
  "estimatedTurnaroundMinutes": 240,
  "sampleTypes": ["blood_edta", "blood_serum"],
  "fastingRequired": true
}
```

**Order**

```json
{
  "id": "ord-04188",
  "orderNumber": "ORD-2026-04188",
  "patientId": "pat-000001",
  "patientName": "Kavya Nair",
  "patientMrn": "PT-024188",
  "status": "in_progress",
  "priority": "routine",
  "referringDoctor": { "id": "doc-004", "name": "Dr. Vikram Iyer", "specialty": "General Medicine", "hospital": null },
  "tests": [ ... ],
  "subtotal": 1050,
  "discountPercent": 0,
  "total": 1050,
  "estimatedTurnaroundMinutes": 240,
  "expectedReadyAt": "2026-02-18T13:05:00+05:30",
  "notes": null,
  "placedAt": "2026-02-18T09:05:00+05:30",
  "placedBy": "Priya Sharma",
  "completedAt": null,
  "cancelledAt": null,
  "cancellationReason": null
}
```

Denormalised `patientName` / `patientMrn` are included deliberately: order lists
show them on every row, and the frontend must not issue N+1 patient lookups.

**OrderTest** (inside `tests`)

```json
{
  "id": "ots-9901",
  "testId": "tst-cbc",
  "testCode": "CBC",
  "testName": "Complete Blood Count",
  "category": "hematology",
  "price": 450,
  "status": "pending",
  "sampleId": "smp-88214006",
  "resultEnteredAt": null,
  "verifiedAt": null,
  "verifiedBy": null
}
```

`id` here is the **`orderTestId`** used by the worklist and result endpoints. It
identifies one test on one order — not the catalogue test.

---

### 3.4 Samples

| Method | Path | Notes |
|---|---|---|
| `GET` | `/samples` | Paginated. Filters: `status`, `sampleType`, `priority`, `orderId`, `from`, `to` |
| `GET` | `/samples/:id` | Includes the full `events` chain |
| `PATCH` | `/samples/:id/status` | Body below. Rejects illegal transitions with `409` |

**Status update request**

```json
{ "status": "collected", "note": null, "rejectionReason": null }
```

`rejectionReason` is **required when `status` is `rejected`** and ignored
otherwise. Suggested values: `Haemolysed`, `Insufficient volume`, `Clotted
specimen`, `Incorrect container`, `Unlabelled or mislabelled`, `Contaminated`,
`Delayed transport`.

**Sample**

```json
{
  "id": "smp-88214006",
  "barcode": "SMP-88214006",
  "orderId": "ord-04188",
  "orderNumber": "ORD-2026-04188",
  "patientId": "pat-000001",
  "patientName": "Kavya Nair",
  "patientMrn": "PT-024188",
  "sampleType": "blood_edta",
  "status": "received",
  "priority": "routine",
  "testCodes": ["CBC"],
  "collectedAt": "2026-02-18T09:20:00+05:30",
  "receivedAt": "2026-02-18T09:48:00+05:30",
  "completedAt": null,
  "rejectionReason": null,
  "createdAt": "2026-02-18T09:05:00+05:30",
  "events": [
    { "status": "pending", "at": "2026-02-18T09:05:00+05:30", "by": "Priya Sharma", "note": null },
    { "status": "collected", "at": "2026-02-18T09:20:00+05:30", "by": "Rahul Menon", "note": null }
  ]
}
```

`events` is the chain of custody, **oldest first**, and is append-only. Every
status change adds an entry; entries are never edited or removed.

---

### 3.5 Results

| Method | Path | Notes |
|---|---|---|
| `GET` | `/worklist` | Paginated. Filters: `category`, `priority`, `status`, `overdue`. Default sort: priority then `minutesToDue` ascending |
| `GET` | `/order-tests/:orderTestId/result-sheet` | Everything the entry screen needs in one call |
| `PUT` | `/order-tests/:orderTestId/results` | Save draft or submit |
| `POST` | `/order-tests/:orderTestId/verify` | Doctor or admin only |

**WorklistItem**

```json
{
  "orderTestId": "ots-9901",
  "orderId": "ord-04188",
  "orderNumber": "ORD-2026-04188",
  "patientName": "Kavya Nair",
  "patientMrn": "PT-024188",
  "testCode": "CBC",
  "testName": "Complete Blood Count",
  "category": "hematology",
  "sampleBarcode": "SMP-88214006",
  "sampleStatus": "received",
  "priority": "routine",
  "status": "pending",
  "receivedAt": "2026-02-18T09:48:00+05:30",
  "minutesToDue": 132
}
```

`minutesToDue` is computed server-side against `expectedReadyAt`. **Negative
means overdue** — the UI renders that state differently, so please do not clamp
it at zero.

**ResultSheet** — one call, everything the screen needs

Returns the order-test context, the patient's `sex` and `ageYears` (needed to
resolve the right reference range variant), the test's `analytes` with their
full `referenceRanges`, and any previously saved `values`. The frontend must not
have to assemble this from four endpoints.

**Save results request** (`PUT`)

```json
{
  "orderTestId": "ots-9901",
  "values": [
    { "analyteId": "any-hgb", "value": "14.2", "note": null },
    { "analyteId": "any-wbc", "value": "7.8", "note": null }
  ],
  "technicianNote": null,
  "submit": false
}
```

- `value` is always a **string**, even for numeric analytes. This preserves
  `<0.01` and `>1000` entries, which are real lab results and which a float
  cannot represent. Parse defensively.
- An empty string means "not entered" — not zero.
- `submit: false` saves a draft and leaves the test at `in_progress`.
  `submit: true` moves it to `awaiting_verification`.
- **The server computes `flag`, not the client.** The frontend flags values
  live for immediate feedback during entry, but the stored flag must be the
  server's, using the same resolution rules in §3.2. If the two ever disagree,
  the server wins and that is a bug to fix.

**ResultValue** (in responses)

```json
{
  "analyteId": "any-hgb",
  "analyteName": "Haemoglobin",
  "unit": "g/dL",
  "value": "14.2",
  "numericValue": 14.2,
  "flag": "normal",
  "appliedRange": { "sex": "female", "ageMinYears": 18, "low": 12.0, "high": 15.5 },
  "note": null
}
```

`appliedRange` is the variant actually used after sex/age resolution. The report
prints it, so it must be the resolved one, not the whole array.

---

### 3.6 Reports

| Method | Path | Notes |
|---|---|---|
| `GET` | `/reports` | Paginated. Filters: `patientId`, `status`, `from`, `to` |
| `GET` | `/reports/:id` | Full document, all sections |

A report exists once **at least one** test on an order is verified.
`status` is `draft` (nothing verified), `partial` (some verified), or `final`
(all verified). `abnormalCount` and `criticalCount` are computed server-side so
the summary banner does not have to walk every section.

Each section carries `verifiedAt`, `verifiedBy` and `verifierDesignation` — all
three are printed in the signature block, so an unverified section must have all
three `null` rather than a placeholder string.

PDF generation is **not** a backend concern. The frontend renders a print
stylesheet and hands off to the browser's own print-to-PDF.

---

### 3.7 Analytics

| Method | Path | Returns |
|---|---|---|
| `GET` | `/analytics/volume?range=7d\|30d\|90d` | `{ points: [{ date, ordered, completed }] }` |
| `GET` | `/analytics/revenue?range=…` | `{ byCategory: [{ category, revenue, testCount }], total }` |
| `GET` | `/analytics/pipeline` | `{ byStatus: [{ status, count, avgAgeMinutes }] }` |
| `GET` | `/analytics/top-tests?range=…&limit=10` | `{ tests: [{ testId, code, name, count, revenue }] }` |

Aggregate server-side. The frontend will not be summing 400 orders in the
browser to draw a chart.

**Return dense series.** A day with zero orders must appear as a point with
`ordered: 0`, not be omitted — a chart with missing days draws a misleading
line.

---

## 4. What the frontend does not need

Please do not build these for us; they are not consumed anywhere:

- HTML or PDF rendering of reports (we print from the browser)
- Nested expansions such as a patient object embedded inside every order
  (the denormalised name and MRN fields are enough)
- Any endpoint returning more than 100 records in one response
- Server-side formatting of currency, dates or numbers — send raw values,
  the frontend formats for `en-IN`

---

## 5. Open questions for the backend team

1. **Barcode generation** — server-assigned, or does the lab's label printer own
   the numbering? Affects whether `POST /orders` can return final barcodes.
2. **Verification authority** — can a technician verify their own entered
   results, or must it always be a different user? The UI currently assumes a
   doctor or admin verifies.
3. **Result amendment** — after a report is `final`, can a value be corrected?
   If so we need an amendment trail and a "corrected report" state, which is not
   in this contract yet.
4. **Concurrency** — two technicians opening the same result sheet. Do you want
   optimistic locking (an `updatedAt` sent back on save, `409` on mismatch)? Say
   so and we will send it.
