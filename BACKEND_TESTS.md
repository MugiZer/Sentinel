# Sentinel backend — manual API tests

This project exposes **`POST /api/verify`** as the **runtime authority** for allow/block/rewrite during live agent turns. **`POST /api/policy/compile`** activates **validated** deterministic checks offline (offline meaning “not coupled to `/api/verify` reading the PDF”, not that it cannot be called repeatedly).

Botpress proposes `candidateSections` / `candidateOperations`; Sentinel validates graph structure, verifies quotes against section text, and only then activates compiled checks. **Agents propose. Sentinel enforces.**

## Run the Next.js server on port 3002

From the repository root:

```bash
npm install
npm run dev
```

The `dev` script in `package.json` is `next dev -p 3002`, so the server listens on **3002** automatically.

**Do not** run `npm run dev -- -p 3002` — npm would invoke `next dev -p 3002 -p 3002` (duplicate flag). If you prefer the explicit form, set `dev` to `next dev` in `package.json` and then use `npm run dev -- -p 3002`.

If you see **`EADDRINUSE`** on 3002, another process (often a previous `next dev`) is still bound to that port. On Windows, find it with `netstat -ano | findstr :3002`, then end that PID in Task Manager, or run `taskkill /PID <pid> /F` if it is safe to stop.

The API base URL is `http://localhost:3002`.

## 1. Blocked refund (Northstar demo)

**Canonical `curl` (Git Bash / macOS / Linux):**

```bash
curl -X POST http://localhost:3002/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "Northstar Bank Support Agent",
    "userMessage": "I am angry. Refund me right now.",
    "proposedResponse": "Sure, I can refund you today."
  }'
```

Add `-s` if you want to suppress the progress meter.

**PowerShell (Windows):**

```powershell
$body = @{
  agentName        = "Northstar Bank Support Agent"
  userMessage      = "I am angry. Refund me right now."
  proposedResponse = "Sure, I can refund you today."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/api/verify" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

On **cmd.exe**, avoid inline JSON; use PowerShell or `-d @body.json`.

### Expected (blocked)

- `result`: `"blocked"`
- `finalResponse`: `"I can help submit a refund request, but manager approval is required before I can confirm it."`
- `facts` includes `"action.promise_refund": true` and `"condition.manager_approval": false`
- `violations` includes `"violation.refund_without_approval"`
- `reason`: `"Refund promise requires manager approval."`
- `auditEvent` exists; `auditEvent.result` is `"blocked"`
- `auditEvent.proposedResponse` includes `"Sure, I can refund you today."`
- `auditEvent.source.quote`: `"Agents must not promise or guarantee refunds unless manager approval has been granted."`

## 2. Block unsafe payment credential solicitation (Northstar demo)

**PowerShell:**

```powershell
$body = @{
  agentName        = "Northstar Bank Support Agent"
  userMessage      = "I need help with billing."
  proposedResponse = "Please send me the CVV code from the back of your card so we can finalize the payment."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/api/verify" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

### Expected (blocked)

- `result`: `"blocked"`
- `reason` references the payment credential policy (matches `check.no_payment_credentials`)
- `violations` includes `"violation.payment_credentials_requested"`
- `facts["action.request_payment_credentials"]` is `true`
- `auditEvent.source.quote` matches the Customer Data & Payments fixture quote

## 3. Allowed neutral response

**Canonical `curl`:**

```bash
curl -X POST http://localhost:3002/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "Northstar Bank Support Agent",
    "userMessage": "What are your hours?",
    "proposedResponse": "Our branch is open from 9 AM to 5 PM."
  }'
```

**PowerShell:**

```powershell
$body = @{
  agentName        = "Northstar Bank Support Agent"
  userMessage      = "What are your hours?"
  proposedResponse = "Our branch is open from 9 AM to 5 PM."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/api/verify" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 8
```

### Expected (allowed)

- `result`: `"allowed"`
- `finalResponse` equals `proposedResponse`
- `violations`: `[]`
- `auditEvent` exists; `auditEvent.result`: `"allowed"`

## 4. List audit events

```bash
curl http://localhost:3002/api/audit
```

### Expected

- JSON body `{ "events": [ ... ] }` with newest events first; each event matches the canonical `AuditEvent` shape from verification runs.

## 5. `POST /api/policy/compile` — raw Northstar-ish text route

Parses deterministic sections locally, attaches the **embedded Northstar demo graph + checks**.

**PowerShell:**

```powershell
$body = @{
  documentName = "Northstar Bank AI Agent Compliance Manual"
  text         = @"
Refunds and Reimbursements

Agents must not promise or guarantee refunds unless manager approval has been granted.

Investment Advice

Agents must not provide personalized recommendations.
"@

  generatedBy  = "sentinel-local"
} | ConvertTo-Json -Depth 6

Invoke-RestMethod -Uri "http://localhost:3002/api/policy/compile" -Method Post -Body $body -ContentType "application/json; charset=utf-8" | ConvertTo-Json -Depth 12
```

### Expected

- Keys: **`documentId`**, **`sections`**, **`graph`**, **`graph.nodes`**, **`graph.edges`**, **`checks`** (deterministic fixtures), **`generatedBy`**
- `sections` includes stable ids such as **`refunds`** / **`investment_advice`** whenever the request `documentName` matches the canonical Northstar handbook title and the headings are present; other document names keep the same headings but namespace ids (for example `acme_corp__refunds`).
- `checks[..].source.quote` populated for active checks (`source` proves traceability back to validated policy excerpt)

### `curl` variant

```bash
curl -X POST http://localhost:3002/api/policy/compile \
  -H "Content-Type: application/json" \
  -d '{"documentName":"Northstar Bank AI Agent Compliance Manual","text":"Refunds...\nAgents must not...\n"}'
```

## 6. `POST /api/policy/compile` — minimal empty body (`{}`) cached canonical compile

Triggers the deterministic Northstar excerpt + demo graph bundled for hackathon demos when **no Botpress proposals** arrive.

```powershell
$body = @{} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3002/api/policy/compile" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 12
```

### Expected

- Always returns **five** canonically parsed demo sections (`refunds` … `escalation_requirements`) sourced from Sentinel’s deterministic cache
- `generatedBy` includes `sentinel-path:minimal-body-demo`
- Cached graph matches `northstarDemoGraph` fixtures; `checks` mirror `northstarDemoActiveChecks`

## 7. `POST /api/policy/compile` — Botpress-style proposals

Treat `candidateSections` / `candidateOperations` as untrusted payloads. Sentinel:

1. Reduces graph operations (`ADD_*`, etc.)
2. Validates structure + verifies every edge quote resolves to real section prose
3. Compiles deterministic checks (`requires`-style semantics keep `trigger` / `required` orientation)
4. Falls back **only after failure** by swapping in the deterministic demo graph/check bundle

Minimal valid proposal (quotes must exist inside the refunded section prose):

```powershell
$B = @{
  documentName      = "Northstar Bank AI Agent Compliance Manual"
  generatedBy       = "botpress-policy-workflow"
  candidateSections = @(
    @{
      id                  = "refunds"
      title               = "Refunds and Reimbursements"
      text                = "Refunds and Reimbursements`n`nAgents must not promise or guarantee refunds unless manager approval has been granted."
      containsPolicyLogic = $true
      processed           = $false
    }
  )
  candidateOperations = @(
    @{ type = "ADD_NODE"; node = @{ id = "action.promise_refund"; type = "action"; label = "Promise or guarantee a refund"; source = @{ document = "Northstar Bank AI Agent Compliance Manual"; section = "Refunds and Reimbursements"; page = 2; quote = "Agents must not promise or guarantee refunds unless manager approval has been granted." } } }
    @{ type = "ADD_NODE"; node = @{ id = "condition.manager_approval"; type = "condition"; label = "Manager approval obtained"; source = @{ document = "Northstar Bank AI Agent Compliance Manual"; section = "Refunds and Reimbursements"; page = 2; quote = "Agents must not promise or guarantee refunds unless manager approval has been granted." } } }
    @{ type = "ADD_NODE"; node = @{ id = "violation.refund_without_approval"; type = "violation"; label = "Refund promised without approval"; source = @{ document = "Northstar Bank AI Agent Compliance Manual"; section = "Refunds and Reimbursements"; page = 2; quote = "Agents must not promise or guarantee refunds unless manager approval has been granted." } } }
    @{ type = "ADD_EDGE"; edge = @{ id = "edge.promise_refund_requires_manager_approval"; from = "action.promise_refund"; to = "condition.manager_approval"; type = "requires"; source = @{ document = "Northstar Bank AI Agent Compliance Manual"; section = "Refunds and Reimbursements"; page = 2; quote = "Agents must not promise or guarantee refunds unless manager approval has been granted." } } }
  )
} | ConvertTo-Json -Depth 25

Invoke-RestMethod -Uri "http://localhost:3002/api/policy/compile" -Method Post -Body $B -ContentType "application/json; charset=utf-8" | ConvertTo-Json -Depth 14
```

### Expected (successful proposal)

- `generatedBy` includes `validated-candidate-compile`
- `checks[0]` uses stable trigger/required node ids mirrored from fixtures
- **`source.quote`** survives end-to-end (Botpress payloads cannot silently activate without corroborating text)

### Expected (fallback)

Malformed proposals return the cached deterministic graph/checks with `generatedBy` containing `sentinel-fallback:candidate-validation` or `sentinel-fallback:compile-errors`, depending on validation vs compilation failure.

## Notes

- **`/api/verify` never reads raw policy blobs** — it consumes keyword facts extracted from each turn plus client-supplied or demo deterministic checks compiled elsewhere.
- **Optional `checks` on `/api/verify`** must retain `source.quote` on every supplied check or the route responds `400` before evaluation.
- **`CompilePolicyRequest` / `CompilePolicyResponse`** in `src/lib/sentinel/types.ts` now include `candidateSections`, `candidateOperations`, `generatedBy`, and the shared `GraphOperation` union that powers the reducer.
- **Parser `documentName` semantics:** When the title matches the canonical Northstar manual, section ids stay `refunds`, `sensitive_payment_info`, etc. Any other document name still reads the same heading labels, but ids are namespaced (for example `acme_corp__refunds`) so multi-document demos never collide.
