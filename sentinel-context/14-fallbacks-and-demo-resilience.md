# Fallbacks And Demo Resilience

## Purpose

Define fallback paths so the demo survives integration, parsing, model, deployment, or timing failures.

Source section: 22.

## Builder ownership

**Shared owner:** Kaveh (Builder 1) and Hamza (Builder 2)

This file defines shared product alignment. Kaveh owns demo surface + Botpress ADK wiring; Hamza owns backend truth.

Any scope change here must be agreed by both builders.

## Why it matters for the demo

A hackathon demo should not depend on every live integration working perfectly. The fallback plan preserves the same product story even if a component fails.

**Primary demo:** **Enterprise Procurement Agent** unsafe commitment + credentials scenario.

## Scope

### In scope

- PDF parsing fallback.
- Graph generation fallback.
- Botpress integration fallback.
- Fact extraction fallback.
- Deployment fallback.
- Cached demo fixtures.
- **Explicit fallback ordering** below.

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

## Fallback ladder (use in this order)

**Primary demo:** Enterprise procurement (`01-demo-story-and-judging-strategy.md`).

**Fallback 1 — Refund / customer-support path (simple test)**

- User: `"I'm angry. Refund me right now."`
- Botpress proposed: `"Sure, I can refund you today."`
- Still run **real** `/api/verify` and show audit quotes from the refund policy fixture if procurement policy is swapped—or keep procurement checks inactive and load refund checks only if you maintain separate demo modes (prefer **one active policy** per run to avoid confusion).

**Fallback 2 — Botpress live chat fails**

- Use the **Sentinel UI staged panel** showing “Botpress proposed response — not sent yet” + **real** `POST /api/verify`.
- Say explicitly: this panel mirrors the **same** step the Botpress Conversation + `verifyResponse` Action performs.
- **Do not remove Botpress visibility** (ADK primitives card + file names on screen).

**Fallback 3 — Compile workflow fails**

- Use **cached** `POST /api/policy/compile` response (preload JSON) to show sections/graph/checks.
- Still run **live runtime verification** against `/api/verify` for procurement (or refund path).
- Presenter line: “For reliability, compile output is cached here; the verify path is live against Sentinel.”

**Fallback 4 — Backend unreachable from Botpress (localhost/tunnel)**

- Expose Sentinel via **ngrok** or **Vercel** (or same-LAN URL).
- Update **`SENTINEL_API_URL`** (Botpress) and **`NEXT_PUBLIC_SENTINEL_API_URL`** (dashboard) to the reachable base URL (`11-api-backend-contracts.md`).
- **Do not** swap to fake verify results.

## Main flow

1. Start with live path (procurement).
2. If policy parsing fails, use preloaded **Enterprise Procurement Agent Policy** text.
3. If **compile** fails, use cached compile JSON but keep runtime verify **real**.
4. If Botpress integration fails, use staged proposed-response panel (**Fallback 2**).
5. If fact extraction fails, use keyword fallback detector that still feeds deterministic checks.
6. If deployment fails, run local demo or screen recording.

The fallback detector produces `RuntimeFacts` only. It must still feed the **real** deterministic check evaluator; it must not hardcode the final blocked/allowed decision.

Keyword fallback hints (extend beyond refunds):

- `refund`, `money back`, `reimburse` → `action.promise_refund`
- `$`, `order`, `purchase`, `approve`, `vendor`, `GPU`, `commit` → cues for `action.commit_purchase` (demo-tuned, not production-enforcement)
- `wire`, `routing`, `account number`, `IBAN`, `card number`, `CVV` → `action.share_payment_credentials`
- `approved vendor`, `on the vendor list` → might influence `condition.vendor_approved` if extractor supports it (default **false** when uncertain)

## Edge cases / fallbacks

This file is the fallback source. Keep fallbacks visible enough for the presenter but do not over-explain them in the UI.

## Validation rules

- Fallbacks must preserve the same vertical slice (**procurement primary**; refund as **simple** alternate).
- Fallback data must still include source quotes when claiming checks are active.
- Staged Botpress panel must stay labeled honestly.
- Fallback detector is demo-only and should not be presented as production enforcement.
- Fallback detector still feeds real deterministic checks.
- Do not bypass `/api/verify` with a hardcoded blocked result.
- **Never** remove Botpress from the story—show **ADK primitive names** even if chat is staged.

## Dependencies

- `01-demo-story-and-judging-strategy.md`
- `02-botpress-adk-workflow.md`
- `03-policy-document-ingestion.md`
- `07-deterministic-checks.md`
- `08-runtime-verification.md`
- `10-ui-ux-demo-dashboard.md`

## Definition of done

- Each likely failure mode has a fallback from the ladder above.
- Cached graph/check/audit fixtures exist for procurement (+ refund optional).
- Local demo remains possible.
- Presenter can continue the story if one live component fails without contradicting “**Botpress agents propose; Sentinel validates**.”
