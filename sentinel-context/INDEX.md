# Sentinel Context Index

## Purpose

This folder decomposes `masterspec.md` into implementation-ready context files for the Sentinel hackathon build.

Core vertical slice:

```txt
Policy document
-> document index
-> policy graph
-> deterministic checks
-> Botpress proposed response
-> runtime fact extraction
-> check evaluation
-> allow / warn / block / rewrite
-> audit log with source quote
```

Core thesis: prompting is not proof.

## Builder ownership

**Shared owner:** Kaveh (Builder 1) and Hamza (Builder 2)

This file defines shared product alignment. Kaveh is responsible for preserving the demo/presentation interpretation. Hamza is responsible for preserving the backend/trustworthiness interpretation.

Any scope change here must be agreed by both builders.

## Files

| File | Role |
| --- | --- |
| `00-product-nucleus.md` | Product identity, thesis, and scope guardrails. |
| `01-demo-story-and-judging-strategy.md` | Northstar Bank story, judging alignment, and demo flow. |
| `02-botpress-adk-workflow.md` | Botpress roles, proposed-response workflow, and verifier integration. |
| `03-policy-document-ingestion.md` | How policy text/PDF enters the compile-time pipeline. |
| `04-document-indexing.md` | Policy section index and source-grounding navigation. |
| `05-rlm-graph-build-workspace.md` | Controlled RLM-like graph build state and operation loop. |
| `06-policy-knowledge-graph.md` | Policy graph node/edge/source schema and refund example. |
| `07-deterministic-checks.md` | Check compiler and deterministic evaluator behavior. |
| `08-runtime-verification.md` | Proposed-response fact extraction, check execution, rewrite, and audit. |
| `09-audit-log.md` | Audit event schema and the visual proof panel. |
| `10-ui-ux-demo-dashboard.md` | One-page four-panel demo UI. |
| `11-api-backend-contracts.md` | API endpoints and backend module boundaries. |
| `12-data-models.md` | Canonical TypeScript-shaped data models. |
| `13-validation-and-trustworthiness.md` | Anti-hallucination rules and activation gates. |
| `14-fallbacks-and-demo-resilience.md` | Demo failure modes and fallback paths. |
| `15-five-hour-build-plan.md` | Four-hour concurrent Kaveh/Hamza implementation plan. |
| `16-presentation-script.md` | 3-minute presenter script. |
| `17-botpress-policy-agents-and-prompts.md` | Botpress compile-time policy agents, prompts, and spawn plan. |

## Dependency Graph

```txt
00-product-nucleus
  -> 01-demo-story-and-judging-strategy
  -> 02-botpress-adk-workflow
  -> 12-data-models
  -> 03-policy-document-ingestion
  -> 04-document-indexing
  -> 05-rlm-graph-build-workspace
  -> 06-policy-knowledge-graph
  -> 07-deterministic-checks
  -> 08-runtime-verification
  -> 09-audit-log
  -> 10-ui-ux-demo-dashboard
  -> 11-api-backend-contracts
  -> 13-validation-and-trustworthiness
  -> 14-fallbacks-and-demo-resilience
  -> 15-five-hour-build-plan
  -> 16-presentation-script
```

Practical parallel groups:

```txt
Foundation:
- 00-product-nucleus.md
- 01-demo-story-and-judging-strategy.md
- 12-data-models.md

Backend:
- 03-policy-document-ingestion.md
- 04-document-indexing.md
- 05-rlm-graph-build-workspace.md
- 06-policy-knowledge-graph.md
- 07-deterministic-checks.md
- 08-runtime-verification.md
- 11-api-backend-contracts.md
- 13-validation-and-trustworthiness.md

Frontend/demo:
- 09-audit-log.md
- 10-ui-ux-demo-dashboard.md
- 14-fallbacks-and-demo-resilience.md
- 16-presentation-script.md

Botpress:
- 02-botpress-adk-workflow.md
- 08-runtime-verification.md
- 11-api-backend-contracts.md
- 17-botpress-policy-agents-and-prompts.md
```

## Builder ownership map

### Kaveh — Builder 1

Owns:

- Botpress ADK runtime support agent
- Botpress compile-time policy workflow
- Botpress actions/workflows/conversations
- dashboard UI
- demo flow and presentation
- integration testing from Botpress to Sentinel

Primary files:

- `02-botpress-adk-workflow.md`
- `10-ui-ux-demo-dashboard.md`
- `16-presentation-script.md`
- `17-botpress-policy-agents-and-prompts.md`

### Hamza — Builder 2

Owns:

- Sentinel backend
- canonical data contracts
- policy ingestion/indexing
- graph reducer/validator
- deterministic checks
- runtime verifier
- audit store
- source quote validation

Primary files:

- `03-policy-document-ingestion.md`
- `04-document-indexing.md`
- `05-rlm-graph-build-workspace.md`
- `06-policy-knowledge-graph.md`
- `07-deterministic-checks.md`
- `08-runtime-verification.md`
- `09-audit-log.md`
- `11-api-backend-contracts.md`
- `12-data-models.md`
- `13-validation-and-trustworthiness.md`

### Shared

Owns:

- product thesis
- demo story
- fallbacks
- implementation plan

Primary files:

- `00-product-nucleus.md`
- `01-demo-story-and-judging-strategy.md`
- `14-fallbacks-and-demo-resilience.md`
- `15-five-hour-build-plan.md`

## Optional Agent Assignment Map

If using coding agents, align them under the human owners above:

```txt
Product/Demo Agent under Kaveh + Hamza:
- 00-product-nucleus.md
- 01-demo-story-and-judging-strategy.md
- 16-presentation-script.md

Botpress Integration Agent under Kaveh:
- 02-botpress-adk-workflow.md
- Botpress portions of 08-runtime-verification.md
- Botpress portions of 11-api-backend-contracts.md
- 17-botpress-policy-agents-and-prompts.md

Policy Ingestion / Index Agent under Hamza:
- 03-policy-document-ingestion.md
- 04-document-indexing.md

RLM / Graph Build Agent under Hamza:
- 05-rlm-graph-build-workspace.md
- 06-policy-knowledge-graph.md

Check Engine Agent under Hamza:
- 07-deterministic-checks.md
- 13-validation-and-trustworthiness.md

Runtime Verification Agent under Hamza:
- 08-runtime-verification.md

UI / Audit Demo Agent under Kaveh, consuming Hamza's audit API:
- 09-audit-log.md
- 10-ui-ux-demo-dashboard.md

API / Data Contracts Agent under Hamza:
- 11-api-backend-contracts.md
- 12-data-models.md

Fallback / Build Plan Agent under Kaveh + Hamza:
- 14-fallbacks-and-demo-resilience.md
- 15-five-hour-build-plan.md
```

## Convergence Checks

- All files use the same product thesis: prompting is not proof.
- All files preserve the same vertical slice.
- Botpress is central, not incidental.
- Canonical data models are in `12-data-models.md`.
- No file requires an undefined type for the hackathon slice.
- No active constraint may exist without a source quote.
- Runtime never rereads the full policy document.
- Expensive LLM work happens at policy compile time.
- Runtime uses compact fact extraction plus deterministic checks.
- The audit log is the demo centerpiece.

## Implementation Order Recommendation

1. Implement `12-data-models.md` types plus fixture-backed active checks.
2. Implement `/api/verify` with deterministic `checkEvaluator.ts`.
3. Generate real audit events with source quotes through in-memory `auditStore.ts`.
4. Build the UI shell so it consumes the real `/api/verify` response.
5. Render audit log and safe rewrite.
6. Add policy compile path with preloaded Northstar policy and cached graph/check fallback.
7. Add graph visualization from cached/generated graph.
8. Wire Botpress proposed-response workflow or staged fallback.
9. Polish and rehearse using `16-presentation-script.md`.
