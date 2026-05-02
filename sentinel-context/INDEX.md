# Sentinel Context Index

## Purpose

This folder decomposes `masterspec.md` into implementation-ready context files for the Sentinel hackathon build.

Core vertical slice (demo/on-screen):

```txt
Enterprise Procurement Agent Policy (document)
-> Botpress policyCompile Workflow (policyIndexingAgent, policyGraphBuilderAgent, activateCompiledPolicy)
-> Sentinel POST /api/policy/compile (reducer + validator; graph/checks activated)
-> Botpress Enterprise Procurement Agent Conversation (procurement.ts) drafts proposed response (not sent)
-> verifyResponse Action -> POST /api/verify
-> blocked / rewritten / allowed (API-driven only)
-> Botpress sends verified finalResponse only
-> GET /api/audit: source quote visible
```

**Core sentence:** Botpress agents propose. Sentinel validates. Botpress sends only verified output.

**Product category:** Policy firewall / verification layer for autonomous Botpress enterprise agents.

**Primary demo:** Enterprise Procurement Agent (risky purchase, unapproved vendor, payment credentials). **Fallback/simple test path:** refund / customer-support scenario (keep in specs and fallbacks; not the main pitch).

## Builder ownership

**Builder 1 — Kaveh** owns:

- Frontend dashboard (Sentinel Next app)
- Botpress ADK project
- Botpress runtime **Enterprise Procurement Agent**
- Botpress compile-time **policyCompile** workflow
- Botpress actions, conversations, workflows (ADK primitives)
- Demo surface and presentation flow

**Builder 2 — Hamza** owns:

- Sentinel backend
- Canonical types
- `POST /api/verify`
- `POST /api/policy/compile`
- `GET /api/audit`
- Deterministic evaluator
- Policy graph and checks
- Audit store
- Source quote validation
- Candidate vs active state (backend authority)

**Integration boundary:** Kaveh consumes Hamza’s backend **only** through:

- `POST /api/verify`
- `POST /api/policy/compile`
- `GET /api/audit`

Frontend and Botpress **must not** hardcode final allow/block/rewrite decisions. **`/api/verify` is the runtime authority.**

## Files

| File | Role |
| --- | --- |
| `00-product-nucleus.md` | Product identity, thesis, and scope guardrails. |
| `01-demo-story-and-judging-strategy.md` | Procurement-first story, judging alignment, and demo flow. |
| `02-botpress-adk-workflow.md` | ADK usage (compile + runtime), primitives, verifier as mandatory Action. |
| `03-policy-document-ingestion.md` | How policy text/PDF enters the compile-time pipeline. |
| `04-document-indexing.md` | Policy section index and source-grounding navigation. |
| `05-rlm-graph-build-workspace.md` | Controlled RLM-like graph build state and operation loop. |
| `06-policy-knowledge-graph.md` | Policy graph schema and procurement-first example (+ refund fallback). |
| `07-deterministic-checks.md` | Check compiler and deterministic evaluator behavior. |
| `08-runtime-verification.md` | Proposed-response fact extraction, check execution, rewrite, and audit. |
| `09-audit-log.md` | Audit event schema and the visual proof panel. |
| `10-ui-ux-demo-dashboard.md` | One-page enterprise control room: compile pipeline, graph + checks, runtime procurement verify, audit, ADK primitives (judge-ready UI spec). |
| `11-api-backend-contracts.md` | API endpoints, request/response shapes, base URL for frontend. |
| `12-data-models.md` | Canonical TypeScript-shaped data models. |
| `13-validation-and-trustworthiness.md` | Anti-hallucination rules and activation gates. |
| `14-fallbacks-and-demo-resilience.md` | Demo failure modes and fallback paths (procurement primary). |
| `15-five-hour-build-plan.md` | Concurrent Kaveh/Hamza implementation plan. |
| `16-presentation-script.md` | 3–5 minute presenter script (procurement-first). |
| `17-botpress-policy-agents-and-prompts.md` | Compile-time policy agents, prompts, ADK project/runbook alignment. |

ADK framework explanation is covered in **`02-botpress-adk-workflow.md`** and **`17-botpress-policy-agents-and-prompts.md`** (there is no separate `17-botpress-adk-integration.md` in this pack).

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

Frontend/demo (Kaveh):
- 09-audit-log.md
- 10-ui-ux-demo-dashboard.md
- 14-fallbacks-and-demo-resilience.md
- 16-presentation-script.md

Botpress ADK (Kaveh):
- 02-botpress-adk-workflow.md
- 08-runtime-verification.md (integration contract)
- 11-api-backend-contracts.md
- 17-botpress-policy-agents-and-prompts.md
```

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

UI / Audit Demo Agent under Kaveh, consuming Hamza's APIs:
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

- All files use the same product thesis: prompting is not proof; **Botpress agents propose; Sentinel validates; Botpress sends only verified output.**
- All files preserve the same vertical slice (procurement primary, refund fallback where noted).
- Botpress is central, not incidental.
- Canonical data models are in `12-data-models.md`.
- No file requires an undefined type for the hackathon slice.
- No active constraint may exist without a source quote.
- Runtime never rereads the full policy document.
- Expensive LLM work happens at policy compile time.
- Runtime uses compact fact extraction plus deterministic checks.
- The hackathon dashboard surfaces Botpress ADK primitives and both compile/runtime paths (`10-ui-ux-demo-dashboard.md`).
- **`/api/verify` is the only runtime authority for allow/block/rewrite.**

## Implementation Order Recommendation

1. Implement `12-data-models.md` types plus fixture-backed active checks (procurement-first).
2. Implement `/api/verify` with deterministic `checkEvaluator.ts`.
3. Generate real audit events with source quotes through in-memory `auditStore.ts`.
4. Build the UI shell so it consumes the real `/api/verify` response (no UI-side compliance decisions).
5. Render audit log and safe `finalResponse` from the API.
6. Add policy compile path with preloaded **Enterprise Procurement Agent Policy** and cached graph/check fallback.
7. Add graph visualization from cached/generated graph (procurement nodes/checks).
8. Wire Botpress: `policyCompile` workflow + `procurement.ts` + mandatory `verifyResponse` Action, or staged fallback that still shows Botpress labels and real `/api/verify`.
9. Polish and rehearse using `16-presentation-script.md`.
