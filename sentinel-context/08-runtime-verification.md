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

- Proposed-response verification pipeline.
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

Known demo fact keys:

- `action.promise_refund`
- `condition.manager_approval`
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
  finalResponse?: string
  facts: RuntimeFacts
  violations: string[]
  auditEvent: AuditEvent
}
```

## Main flow

1. Botpress support agent drafts a response.
2. Botpress verifier workflow sends proposed response to Sentinel.
3. Sentinel derives fact keys from active checks.
4. `factExtractor.ts` performs strict JSON extraction with the proposed response and fact keys, or uses keyword fallback in demo mode.
5. Fact extractor returns `RuntimeFacts`; malformed LLM JSON is retried once, then fallback-detected.
6. Missing facts default to false.
7. `checkEvaluator.ts` runs all active deterministic checks.
8. If any block check fails, original response is blocked.
9. If safe rewrite is needed, return prewritten or generated safe response.
10. `auditStore.ts` records the event with source quote.
11. Botpress sends final response.

Refund demo:

```json
{
  "action.promise_refund": true,
  "condition.manager_approval": false
}
```

Decision: blocked.

Safe rewrite:

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
- Rewrite generation fails -> use prewritten safe rewrite for the refund scenario.

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
- Refund demo facts are extracted.
- Deterministic check blocks unsafe response.
- Safe rewrite and audit event are returned.
- Main refund demo still works if the LLM fact extractor is unavailable.
