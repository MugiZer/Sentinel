# Demo Story And Judging Strategy

## Purpose

Define the exact hackathon demo story and connect it to the judging rubric.

Source sections: 1, 4, 5, 22, 23.

## Builder ownership

**Shared owner:** Hamza (Builder 1) and Kaveh (Builder 2)

This file defines shared product alignment. Hamza is responsible for preserving the demo/presentation interpretation. Kaveh is responsible for preserving the backend/trustworthiness interpretation.

Any scope change here must be agreed by both builders.

## Why it matters for the demo

The demo is only 3 minutes. It must show a concrete policy violation, a visible Botpress response interception, a deterministic block decision, and a source-grounded audit log.

## Scope

### In scope

- Fictional customer: Northstar Bank.
- Policy: Northstar Bank AI Agent Compliance Manual.
- Main violation: a support agent promises a refund without manager approval.
- Judge-visible flow:
  - policy loaded
  - graph/checks generated
  - Botpress support agent drafts unsafe response
  - Sentinel blocks response
  - safe rewrite appears
  - audit log shows source quote
- Rubric alignment:
  - tech execution
  - Botpress ADK use
  - problem fit
  - creativity
  - presentation

### Out of scope

- Multiple customer demos.
- Deep admin workflows.
- Full compliance taxonomy.
- Complex production approval flow.
- More than one primary violation path.

## Inputs

- Hackathon timebox: about 5 hours.
- Demo timebox: 3 minutes.
- Botpress ADK requirement.
- Northstar Bank demo policy.
- Proposed unsafe response: `Sure, I can refund you today.`

## Outputs

- A judge-friendly demo sequence.
- A scriptable violation scenario.
- A clear explanation of what Sentinel proves.

## Data contracts

Demo fixtures should use canonical types:

- `PolicySection` for the refund policy source.
- `PolicyGraph` for the refund policy nodes/edges.
- `DeterministicCheck` for `check.refund_requires_approval`.
- `RuntimeFacts` for extracted facts.
- `AuditEvent` for the blocked response.

## Main flow

1. Presenter opens Sentinel dashboard.
2. Presenter selects the Northstar Bank policy document.
3. Dashboard shows extracted policy rule: refund promises require manager approval.
4. Dashboard shows a small policy graph with `action.promise_refund`, `condition.manager_approval`, and `violation.refund_without_approval`.
5. Presenter runs the Botpress support scenario: user asks for an immediate refund.
6. Botpress drafts: `Sure, I can refund you today.`
7. Sentinel verifies before sending.
8. Fact extractor returns `action.promise_refund = true` and `condition.manager_approval = false`.
9. Deterministic check blocks the response.
10. Safe rewrite appears.
11. Audit log shows result, reason, source section, and quote.

## Edge cases / fallbacks

- If live Botpress response interception is not ready, use a staged Botpress-style proposed-response panel.
- If graph generation is slow, preload cached graph/check JSON but keep the UI showing the compile step.
- If fact extraction fails, use keyword fallback detector for the refund demo.
- If deployment fails, run locally and keep a screen recording ready.

## Validation rules

- The demo must answer "why is this more than prompting?"
- The audit log must be visible and understandable without explanation.
- The Botpress agent must be visibly part of the flow.
- The demo must stop adding features after the core violation works.

## Dependencies

- `00-product-nucleus.md`
- `02-botpress-adk-workflow.md`
- `07-deterministic-checks.md`
- `08-runtime-verification.md`
- `09-audit-log.md`
- `10-ui-ux-demo-dashboard.md`
- `14-fallbacks-and-demo-resilience.md`
- `16-presentation-script.md`

## Definition of done

- The 3-minute demo has a single primary story.
- The story maps directly to the judging rubric.
- The blocked refund path works with fallback data.
- The presenter can explain the thesis in one sentence.
