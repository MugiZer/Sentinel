# Sentinel backend — manual API tests

This project exposes **`POST /api/verify`** as the **only runtime authority** for allow/block/rewrite. Botpress and the dashboard (Hamza) should call this endpoint, not embed policy outcomes in prompts or UI.

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

## 2. Allowed neutral response

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

## 3. List audit events

```bash
curl http://localhost:3002/api/audit
```

### Expected

- JSON body `{ "events": [ ... ] }` with newest events first; each event matches the canonical `AuditEvent` shape from verification runs.

## Notes

- **`/api/policy/compile`** is not implemented in this vertical slice.
- Runtime verification does **not** read the full policy document; it uses keyword fact extraction from `proposedResponse` plus deterministic checks (from the request or demo fixtures).
- Optional `checks` on `POST /api/verify` must include a **source quote** on every check or validation returns `400`.
