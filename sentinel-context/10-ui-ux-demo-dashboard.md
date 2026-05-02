# UI UX Demo Dashboard

## Purpose

Define the one-page Sentinel demo UI.

Source sections: 5, 14, 17.

## Builder ownership

**Primary owner:** Kaveh (Builder 1)

Kaveh owns implementation for this file because it belongs to the Botpress ADK / UI / demo surface.

**Hamza dependency:** Hamza provides the backend API responses and canonical data contracts consumed here, but should not modify Botpress/UI flow directly during the hackathon unless both builders agree.

## Why it matters for the demo

The dashboard must make the vertical slice visually obvious in under 3 minutes: policy source, graph, Botpress proposed response, and audit proof.

## Backend dependency rules

Kaveh may use fixtures while Hamza is still building the backend, but final demo mode must consume real API responses.

The UI may display:

- `CompilePolicyResponse`
- `VerifyResponse`
- `AuditEvent[]`

The UI must not:

- compute block/allow decisions itself
- fabricate source quotes
- mark a response blocked without `/api/verify`

## Scope

### In scope

- Single-page app.
- Four-panel layout:
  1. Policy document / extracted rules.
  2. Policy knowledge graph.
  3. Botpress chat / proposed response.
  4. Runtime audit log.
- Main state transitions:
  - policy selected/pasted
  - compile policy clicked
  - policy loaded
  - sections indexed
  - graph operations proposed
  - graph validated and activated
  - deterministic checks compiled
  - agent proposes unsafe response
  - Sentinel blocks
  - audit row appears
  - safe rewrite shown
- Build timeline / graph build state panel or drawer.
- Test buttons for 2-4 proposed responses.

### Out of scope

- Full admin dashboard.
- Complex navigation.
- User management.
- Deep graph editing UI.
- General policy authoring.

## Inputs

- Loaded policy document name.
- Extracted constraints.
- Policy graph nodes/edges.
- Graph build events.
- Compiled deterministic checks.
- User message.
- Proposed Botpress response.
- Verification result.
- Audit events.

## Outputs

- Visible policy source panel.
- Visible graph panel.
- Visible build timeline or graph build state summary.
- Visible compiled checks.
- Botpress chat/proposed-response panel.
- Audit log panel.
- Safe final response.

## Data contracts

UI consumes:

- `PolicySection[]`
- `PolicyGraph`
- `DeterministicCheck[]`
- `VerifyResponse`
- `AuditEvent[]`

Suggested UI state:

```ts
type DemoState = {
  policyLoaded: boolean
  graphGenerated: boolean
  buildEvents: BuildEvent[]
  checks: DeterministicCheck[]
  proposedResponse?: string
  verifyResponse?: VerifyResponse
  auditEvents: AuditEvent[]
}
```

## Main flow

1. User loads Northstar Bank policy.
2. User clicks Compile Policy.
3. Policy panel shows document name and indexed sections.
4. Build timeline shows:
   - policy loaded
   - 5 sections indexed
   - Refunds section processed
   - `ADD_NODE action.promise_refund`
   - `ADD_NODE condition.manager_approval`
   - `ADD_EDGE requires`
   - `Compiled check.refund_requires_approval`
   - `Activated policy`
5. Graph build state summary shows:
   - `candidateGraph`: node/edge counts
   - `validation`: passed/failed
   - `source quotes`: matched count
   - `activeChecks`: count
6. Graph panel shows:
   - `action.promise_refund`
   - `condition.manager_approval`
   - `violation.refund_without_approval`
7. Compiled checks panel/list shows active checks with source quotes.
8. Chat panel shows user message: `I'm angry. Refund me right now.`
9. Chat panel shows Botpress proposed response: `Sure, I can refund you today.`
10. User clicks verify, or verification runs automatically.
11. Sentinel result shows "Blocked before sending."
12. Safe response appears.
13. Audit log panel adds BLOCKED row with source quote.

Max-out demo test buttons:

- Refund promise -> BLOCK: `Sure, I can refund you today.`
- Credit card request -> BLOCK: `Please send your full card number and CVV.`
- Normal support response -> ALLOW: `I can help submit a refund request for review.`
- Legal threat -> ESCALATE/WARN if implemented: `I'll connect you with a manager for legal concerns.`

The test buttons must call the real `/api/verify` path. They may prefill proposed responses, but they must not hardcode decisions.

Optional generated-operations view:

```json
[
  { "type": "ADD_NODE", "node": { "id": "action.promise_refund" } },
  { "type": "ADD_EDGE", "edge": { "type": "requires" } }
]
```

Immediately show:

```txt
Validated ✓
Source quote matched ✓
Compiled check ✓
Activated ✓
```

## Edge cases / fallbacks

- Graph visualization fails -> show static node/edge list.
- Graph visualization may be a simple node/edge list if library wiring is slow.
- Botpress integration fails -> keep staged Botpress proposed-response panel.
- API call fails -> use fixture response for demo mode.
- Policy compile still running -> show cached graph/checks.
- Generated operations view is too slow -> show build timeline only.
- Multiple test buttons are too much -> keep refund BLOCK, card BLOCK, and normal ALLOW.

## Validation rules

- The audit log must be prominent.
- Audit log is higher priority than graph aesthetics.
- The build timeline must show that policy compile happened before runtime verification.
- Test buttons must exercise the real `/api/verify` endpoint.
- Fallback facts may be used, but final decisions must come from deterministic checks.
- The blocked result must be visually obvious.
- The source quote must be visible without drilling through multiple screens.
- The UI must not imply broad compliance coverage beyond the demo slice.
- Botpress must be labeled in the chat/proposed-response panel.

## Dependencies

- `01-demo-story-and-judging-strategy.md`
- `02-botpress-adk-workflow.md`
- `06-policy-knowledge-graph.md`
- `08-runtime-verification.md`
- `09-audit-log.md`
- `14-fallbacks-and-demo-resilience.md`

## Definition of done

- A judge can understand the full pipeline from one screen.
- Refund violation demo can be run live.
- Policy compile state is visible through sections, build events, graph/check counts, or generated operations.
- At least refund BLOCK and normal ALLOW scenarios run through `/api/verify`.
- Audit log shows source-grounded blocked event.
- Safe rewrite is visible.
- Graph panel is legible, even if implemented as a simple node/edge list.
