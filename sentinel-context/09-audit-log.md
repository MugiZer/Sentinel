# Audit Log

## Purpose

Define Sentinel's audit trail and the demo centerpiece.

Source sections: 14, 15, 17.

## Builder ownership

**Primary owner:** Kaveh (Builder 2)

Kaveh owns implementation for this file because it belongs to the Sentinel backend / truth engine.

**Hamza dependency:** Hamza consumes the output through the shared API/UI contract but should not modify this backend logic directly during the hackathon unless both builders agree.

Hamza depends on this file only through API responses and canonical types. Do not require Hamza to understand internal audit store implementation to build the UI/Botpress layer.

## Why it matters for the demo

The audit log is the "wow" panel. It proves that Sentinel blocked a response for a specific reason tied to a source quote from the policy document.

## Scope

### In scope

- `AuditEvent` schema.
- Blocked refund event.
- Result badge.
- Timestamp.
- Policy name.
- Agent response snippet.
- Reason.
- Source section/page.
- Source quote.

### Out of scope

- Full audit analytics.
- Export workflows.
- User access controls.
- Long-term database retention.
- Multi-tenant audit filtering.

## Inputs

- Verification decision.
- User message.
- Proposed response.
- Final response if rewritten.
- Detected facts.
- Missing facts.
- Violations.
- Failed check reason.
- Source quote.

## Outputs

- Stored `AuditEvent`.
- UI audit row.
- Source-grounded proof of enforcement.

## Data contracts

```ts
type AuditEvent = {
  id: string
  timestamp: string
  agentName: string
  userMessage: string
  proposedResponse: string
  finalResponse?: string
  result: "allowed" | "warned" | "blocked" | "rewritten"
  detectedFacts: string[]
  missingFacts?: string[]
  violations: string[]
  reason: string
  source?: SourceQuote
}
```

## Main flow

1. Runtime verifier evaluates proposed response.
2. If checks pass, create an allowed audit event.
3. If a check fails, create a blocked/warned/rewritten audit event.
4. Include detected facts and missing facts.
5. Include violation IDs and human-readable reason.
6. Attach source quote from failed check.
7. Store in `auditStore.ts`.
8. Return event from `/api/verify`.
9. UI prepends audit row to the audit panel.

Blocked refund example:

```json
{
  "id": "audit_001",
  "timestamp": "14:18:33",
  "agentName": "Northstar Bank Support Agent",
  "userMessage": "I'm angry. Refund me right now.",
  "proposedResponse": "Sure, I can refund you today.",
  "finalResponse": "I can help submit a refund request, but manager approval is required before I can confirm it.",
  "result": "blocked",
  "detectedFacts": ["action.promise_refund"],
  "missingFacts": ["condition.manager_approval"],
  "violations": ["violation.refund_without_approval"],
  "reason": "Refund promise requires manager approval."
}
```

## Edge cases / fallbacks

- Source quote missing -> do not activate the check; if somehow missing at runtime, show validation warning.
- Multiple violations -> show primary violation in row and expandable details if time allows.
- Audit store unavailable -> keep in memory for demo.
- Timestamp unavailable -> use current local time.

## Validation rules

- Blocked, warned, and rewritten events must include `reason`.
- Failed policy events should include `source.quote`.
- Audit row must clearly show result badge.
- The refund block row must be visually obvious.

## Dependencies

- `07-deterministic-checks.md`
- `08-runtime-verification.md`
- `10-ui-ux-demo-dashboard.md`
- `12-data-models.md`
- `13-validation-and-trustworthiness.md`

## Definition of done

- `/api/verify` returns an audit event.
- UI shows BLOCKED row for refund demo.
- Source section/page and quote are visible.
- Audit log makes the trust story obvious.
