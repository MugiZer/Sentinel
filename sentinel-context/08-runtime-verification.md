# Runtime Verification

## Purpose

Define how proposed Botpress responses are checked before users see them.

Source sections: 13, 16, 20.

## Builder ownership

**Primary owner:** Hamza (Builder 2)

Hamza owns implementation for this file because it belongs to the Sentinel backend / truth engine.

**Kaveh dependency:** Kaveh consumes the output through the shared API/UI contract but should not modify this backend logic directly during the hackathon unless both builders agree.

Kaveh depends on this file only through `/api/verify`, API responses, and canonical types. Do not require Kaveh to understand internal fact extraction/evaluator implementation to build the frontend.

## Why it matters for the demo

Runtime verification is the moment the audience sees Sentinel enforce policy. It must be fast, clear, and source-grounded.

## Scope

### In scope

- **Botpress Enterprise Procurement Agent** proposed-response verification pipeline.
- Strict LLM JSON extraction or keyword fallback for compact fact extraction.
- Known fact types from active checks.
- Deterministic check execution.
- Safe rewrite behavior.
- Audit event generation.
- 0.5-2 second runtime target.

### Out of scope

- Sending full policy document at runtime.
- Rebuilding graph during chat.
- Multi-turn legal reasoning at runtime.
- Complex rewrite personalization.

## Inputs

- `agentName`.
- `userMessage`.
- `proposedResponse`.
- Active `DeterministicCheck[]`.
- Known fact keys derived from checks.

Known demo fact keys (procurement primary):

- `action.commit_purchase`
- `condition.manager_approval`
- `condition.vendor_approved`
- `action.share_payment_credentials`

Known demo fact keys (fallback / extended):

- `action.promise_refund`
- `action.request_full_credit_card`
- `action.give_investment_advice`
- `action.discuss_competitor_pricing`
- `action.legal_threat_detected`

## Outputs

- `RuntimeFacts`.
- Verification decision.
- Optional safe final response.
- Violations.
- Audit event.

## Data contracts

```ts
type RuntimeFacts = Record<string, boolean>

type VerifyRequest = {
  agentName: string
  userMessage: string
  proposedResponse: string
  checks: DeterministicCheck[]
}

type VerifyResponse = {
  result: "allowed" | "warned" | "blocked" | "rewritten"
  finalResponse: string
  facts: RuntimeFacts
  violations: string[]
  reason: string
  auditEvent: AuditEvent
}
```

## Main flow

1. Botpress Enterprise Procurement Agent drafts a **proposed** response (`procurement.ts`).
2. Botpress `verifyResponse` Action sends it to Sentinel `POST /api/verify`.
3. Sentinel derives fact keys from active checks.
4. `factExtractor.ts` performs strict JSON extraction with the proposed response (and optionally user message hints), or uses keyword fallback in demo mode.
5. Fact extractor returns `RuntimeFacts`; malformed LLM JSON is retried once, then fallback-detected.
6. Missing facts default to false.
7. `checkEvaluator.ts` runs all active deterministic checks.
8. If any block check fails, the unsafe proposed response is blocked.
9. Return **`finalResponse`** from Sentinel (safe rewrite / escalation copy for demo).
10. `auditStore.ts` records the event with source quote(s).
11. Botpress sends **`finalResponse`**.

Procurement demo facts (example):

```json
{
  "action.commit_purchase": true,
  "condition.manager_approval": false,
  "condition.vendor_approved": false,
  "action.share_payment_credentials": true
}
```

Decision: **blocked** (multiple violations possible; surface primary + list).

Safe `finalResponse` (illustrative; **must** originate from verifier logic / templates in code, not the UI):

```txt
I can prepare a purchase request for review, but I can't approve an $80,000 order, commit to an unapproved vendor, or share payment details without the required approvals.
```

Refund fallback demo:

```json
{
  "action.promise_refund": true,
  "condition.manager_approval": false
}
```

Safe rewrite (refund path):

```txt
I can help submit a refund request, but manager approval is required before I can confirm it.
```

## Edge cases / fallbacks

- Fact extraction fails -> keyword fallback detector for demo phrases.
- Fact extractor returns invalid JSON -> retry once, then use fallback detector.
- Main demo must not depend on live LLM reliability.
- Keyword fallback may produce facts, but it must not directly produce allow/block decisions.
- Multiple block checks fail -> block and show primary reason plus count.
- No checks active -> allow, but show compile warning elsewhere.
- Rewrite generation fails -> use prewritten safe response for **procurement** primary path; keep **refund** prewritten copy for fallback tests.

## Validation rules

- Runtime must not reread the full policy document.
- Runtime LLM input should be proposed response plus compact fact keys.
- Check execution must be deterministic.
- Fact extraction can be LLM-based or keyword fallback, but decisions must come from deterministic checks.
- Blocked decisions must include reason and source quote.
- Fact extraction should return JSON only.

## Dependencies

- `02-botpress-adk-workflow.md`
- `07-deterministic-checks.md`
- `09-audit-log.md`
- `11-api-backend-contracts.md`
- `12-data-models.md`
- `14-fallbacks-and-demo-resilience.md`

## Definition of done

- Proposed response can be verified through `/api/verify`.
- **Procurement** demo facts are extracted and blocked deterministically with **source-grounded** audit.
- Deterministic check blocks unsafe response.
- Safe rewrite and audit event are returned.
- Main refund demo still works if the LLM fact extractor is unavailable.
