# Sentinel backend — API contract (Hamza → Kaveh handoff)

Practical contract reference so Botpress and the dashboard can integrate **without** calling `src/lib/sentinel/*` or other backend internals. Base URL for the Next.js API: **`http://localhost:3002`**.

### Implementation status (this repo slice)

| Endpoint | Status |
|----------|--------|
| `POST /api/verify` | Implemented — **only** runtime allow / warn / block authority. |
| `GET /api/audit` | Implemented — in-memory audit list. |
| `POST /api/policy/compile` | Implemented — parses policy text and/or validates Botpress candidate graph payloads; returns `documentId`, `sections`, `graph`, `checks`, `generatedBy`. |

**Integration rules (read me):**

- **Botpress/UI must not hardcode policy decisions** — no client-side allow/block based on heuristics or model guesswork for compliance outcomes.
- **`/api/verify` is the runtime authority** — always call verify before delivering a `proposedResponse` to the user; use the response `finalResponse` when blocked or warned.
- **Botpress agents propose; Sentinel validates** — compile proposes structure offline; verify enforces checks on each turn.

For copy-paste `curl` / PowerShell and expected fields for verify + audit + compile, see **`BACKEND_TESTS.md`**.

---

## 1. Verify API — `POST /api/verify`

**Role:** `/api/verify` is the **only** runtime allow / block / safe-response authority. Botpress and the UI must **not** hardcode final compliance decisions or duplicate policy logic in prompts.

**Flow:** The support agent should obtain a model draft as `proposedResponse`, call **`POST /api/verify`**, then send **`finalResponse`** from the response to the end user (not the raw draft when blocked).

### Request

```json
{
  "agentName": "string",
  "userMessage": "string",
  "proposedResponse": "string",
  "checks": "DeterministicCheck[] (optional)"
}
```

- If **`checks` is omitted**, the backend uses the **current active demo checks** (fixtures).
- If **`checks` is provided**, every item must include a valid **`source.quote`** (and other required fields); otherwise the API returns **400**.

### Response

```json
{
  "result": "allowed" | "warned" | "blocked" | "rewritten",
  "finalResponse": "string (optional)",
  "facts": { "fact_key": true | false },
  "violations": ["string"],
  "reason": "string",
  "failedChecks": [{ "checkId": "string", "reason": "string", "violation": "string (optional)" }] (optional, when one or more checks fail),
  "auditEvent": { }
}
```

- **`facts`:** keyword-derived runtime facts from `proposedResponse` for the active checks.
- **`auditEvent`:** canonical audit record for this verification (also appended server-side for listing via `GET /api/audit`).

**This demo slice** returns **`allowed`**, **`warned`**, or **`blocked`** from verify; the **`rewritten`** value exists in shared types for forward-compatible audits and tooling.

### PowerShell examples

**Blocked refund (demo policy):**

```powershell
$body = @{
  agentName        = "Northstar Bank Support Agent"
  userMessage      = "I am angry. Refund me right now."
  proposedResponse = "Sure, I can refund you today."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/api/verify" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

**Allowed neutral response:**

```powershell
$body = @{
  agentName        = "Northstar Bank Support Agent"
  userMessage      = "What are your hours?"
  proposedResponse = "Our branch is open from 9 AM to 5 PM."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/api/verify" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 8
```

---

## 2. Compile API — `POST /api/policy/compile`

**Role:** Compile-time pipeline: Botpress agents **propose** structure; Sentinel **validates** and **activates**. Treat any candidate payload as **non-authoritative** until the backend returns a successful compile response.

### Request

```json
{
  "documentName": "string",
  "text": "string (optional)",
  "candidateSections": "PolicySection[] (optional)",
  "candidateOperations": "GraphOperation[] (optional)",
  "generatedBy": "string (optional, ignored by server — response `generatedBy` is authoritative)",
  "strictQuotes": "boolean (optional)"
}
```

### Response

```json
{
  "documentId": "string",
  "sections": "PolicySection[]",
  "graph": "PolicyGraph",
  "checks": "DeterministicCheck[]",
  "generatedBy": "string",
  "compilationErrors": "string[] (optional)",
  "validationErrors": "string[] (optional)"
}
```

`generatedBy` is a **single** pipeline token (for example `sentinel-path:text-with-demo-graph`, `sentinel-path:minimal-body-demo`, `sentinel-path:validated-candidate-compile`, or a `sentinel-fallback:*` label). `validationErrors` / `compilationErrors` appear when `generatedBy` starts with `sentinel-fallback`, or when the request includes **`?debug=1`**.

**Integration rule:** Only **`sections`**, **`graph`**, **`checks`**, and metadata from this response (after success) define what downstream verify flows should rely on — not the raw candidate fields sent in.

---

## 3. Audit API — `GET /api/audit`

### Response

```json
{
  "events": "AuditEvent[]"
}
```

**Notes:**

- Audit storage is **in-memory** for the hackathon (resets with process restarts).
- Blocked / warned events include **`source`** with a **quote** from policy; the UI should surface **`auditEvent.source.quote`** prominently when present.

---

## 4. Kaveh integration checklist

### Botpress ADK

- **`verifyResponse` action** → `POST /api/verify` with `proposedResponse` before user delivery.
- **Support conversation** → send **`finalResponse`** from the verify response to the user.
- **Policy compile workflow** → `POST /api/policy/compile`; never call `src/lib/sentinel/*` or internal modules.

### UI

- **Policy panel** → consumes `POST /api/policy/compile`.
- **Botpress panel** → show **`proposedResponse`** vs **`finalResponse`** for transparency.
- **Audit log panel** → `GET /api/audit` and/or embed **`verifyResponse.auditEvent`** after each verify.
- **No client-side allow/block** — decisions come only from verify (and compiled checks server-side).

### Ports

| Service | URL |
|--------|-----|
| Sentinel backend | `http://localhost:3002` |
| Botpress bot | `http://localhost:3000` |
| Botpress Studio / control | `http://localhost:3001` |

---

## 5. Demo troubleshooting

- **Botpress cannot reach `localhost`** — expose the Next app with **ngrok**, **Cloudflare Tunnel**, or deploy (e.g. **Vercel**) and point actions at the public base URL.
- **`POST /api/verify` fails** (network, 5xx, timeouts) → Botpress should **fail closed**: do not send the unverified draft as final user-facing text; use a safe fallback or escalation path.
- **`POST /api/policy/compile` fails** — use a **cached last-good compile response** for demo continuity; do not invent checks client-side.
- **`GET /api/audit` is empty** — run **`POST /api/verify`** first; audit entries are created by verification (and lost on server restart in this slice).

---

## Type references

Shared TypeScript shapes (`DeterministicCheck`, `PolicySection`, `PolicyGraph`, `AuditEvent`, etc.) live in **`src/lib/sentinel/types.ts`** for reading only — integrators should depend on **HTTP contracts** above, not import server paths from Botpress or the browser bundle.
