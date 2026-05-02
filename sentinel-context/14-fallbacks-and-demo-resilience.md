# Fallbacks And Demo Resilience

## Purpose

Define fallback paths so the demo survives integration, parsing, model, deployment, or timing failures.

Source section: 22.

## Builder ownership

**Shared owner:** Hamza (Builder 1) and Kaveh (Builder 2)

This file defines shared product alignment. Hamza is responsible for preserving the demo/presentation interpretation. Kaveh is responsible for preserving the backend/trustworthiness interpretation.

Any scope change here must be agreed by both builders.

## Why it matters for the demo

A hackathon demo should not depend on every live integration working perfectly. The fallback plan preserves the same product story even if a component fails.

## Scope

### In scope

- PDF parsing fallback.
- Graph generation fallback.
- Botpress integration fallback.
- Fact extraction fallback.
- Deployment fallback.
- Cached demo fixtures.

### Out of scope

- Production disaster recovery.
- Multi-region redundancy.
- Sophisticated offline mode.
- Full observability stack.

## Inputs

- Policy upload/selection status.
- Compile status.
- Botpress integration status.
- Fact extraction status.
- Deployment status.

## Outputs

- Fallback path selection.
- Demo-safe data.
- Clear presenter language for degraded paths.

## Data contracts

Fallbacks should still return canonical data:

- Cached `CompilePolicyResponse`.
- Cached `PolicyGraph`.
- Cached `DeterministicCheck[]`.
- Fallback `RuntimeFacts`.
- Fallback `AuditEvent`.

Suggested flag:

```ts
type DemoMode = {
  usePreloadedPolicy: boolean
  useCachedGraph: boolean
  useSimulatedBotpressPanel: boolean
  useKeywordFactFallback: boolean
}
```

## Main flow

1. Start with live path.
2. If policy parsing fails, use preloaded policy text.
3. If graph generation fails, use cached graph JSON and checks.
4. If Botpress integration fails, use Botpress-style staged proposed-response panel.
5. If fact extraction fails, use keyword fallback detector.
6. If deployment fails, run local demo or screen recording.

The fallback detector produces `RuntimeFacts` only. It must still feed the real deterministic check evaluator; it must not hardcode the final blocked/allowed decision.

Keyword fallback detector:

- `refund`, `money back`, `reimburse` -> `action.promise_refund`
- `credit card`, `card number`, `CVV` -> `action.request_full_credit_card`
- `invest`, `buy`, `sell`, `stock` -> `action.give_investment_advice`

## Edge cases / fallbacks

This file is the fallback source. Keep fallbacks visible enough for the presenter but do not over-explain them in the UI.

## Validation rules

- Fallbacks must preserve the same vertical slice.
- Fallback data must still include source quotes.
- If using staged Botpress panel, clearly label it as the intended Botpress workflow.
- Fallback detector is demo-only and should not be presented as production enforcement.
- Fallback detector still feeds real deterministic checks.
- Do not bypass `/api/verify` with a hardcoded blocked result.

## Dependencies

- `01-demo-story-and-judging-strategy.md`
- `02-botpress-adk-workflow.md`
- `03-policy-document-ingestion.md`
- `07-deterministic-checks.md`
- `08-runtime-verification.md`
- `10-ui-ux-demo-dashboard.md`

## Definition of done

- Each likely failure mode has a fallback.
- Cached graph/check/audit fixtures exist.
- Local demo remains possible.
- Presenter can continue the story if one live component fails.
