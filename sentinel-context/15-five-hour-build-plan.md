# Four-Hour Concurrent Build Plan

## Purpose

Turn Sentinel into a realistic **4–5 hour** two-builder implementation plan with parallel work streams and clear integration boundaries.

## Builder ownership

**Builder 1 — Kaveh** owns:

- Sentinel **Next.js** dashboard UI (`10-ui-ux-demo-dashboard.md`)
- **Botpress ADK** project ( **`procurement.ts`**, **`verifyResponse`**, **`policyCompile`**, policy agents, `adk dev`, demo wiring)
- Demo flow + **`16-presentation-script.md`**

**Builder 2 — Hamza** owns:

- Sentinel **backend** + canonical types
- **`POST /api/verify`**, **`POST /api/policy/compile`**, **`GET /api/audit`**
- Deterministic evaluator + audit store + source quote validation

**Integration boundary:** Kaveh consumes Hamza **only** through the three HTTP APIs. **`/api/verify`** is runtime authority.

Any scope change here must be agreed by both builders.

## Why it matters for the demo

The team needs to finish the vertical slice, not chase infrastructure. This plan prioritizes the real verification spine first, then UI + Botpress integration around stable contracts.

## Botpress ADK lane (Kaveh)

- ADK project root: `C:\Users\moham\sentinel-botpress-agent` (`02-botpress-adk-workflow.md`).
- Runtime: `procurement.ts` + mandatory `verifyResponse` Action → `/api/verify`.
- Compile: `policyCompile` + `policyIndexingAgent` + `policyGraphBuilderAgent` + `activateCompiledPolicy` → `/api/policy/compile`.
- E2E: Botpress chat → `/api/verify` → verified message.
- Console visibility during the demo.

## Scope

### In scope

- Concurrent two-builder plan.
- Contract-first implementation.
- Real `/api/verify` path.
- Real deterministic evaluator.
- Real audit event generation.
- Fixture-backed compile outputs only when needed.
- Botpress runtime integration **or** honest staged UI fallback.
- Rehearsal and freeze point.

### Out of scope

- MCP server.
- Full RLM platform.
- Production sandboxing.
- Complex graph editor.
- Multi-policy workflows.
- Full compliance product.
- New features after freeze point.

## Inputs

- `masterspec.md`.
- Context files in `sentinel-context/`.
- Hackathon timebox.
- Team skill set and available integrations.

## Outputs

- A working **3–5 minute** demo (**procurement-first**).
- Stable shared contracts.
- Clear division of responsibility.
- Fallback-ready build.

## Data contracts

Use `12-data-models.md` as the shared type source from the start.

Shared integration boundary:

- `POST /api/policy/compile`
- `POST /api/verify`
- `GET /api/audit`
- Canonical types from `12-data-models.md`

## Non-interference rules

1. Hamza owns backend truth. Kaveh must not hardcode compliance decisions in the UI **or** Botpress.
2. Kaveh owns dashboard + Botpress ADK surface; Hamza must not block on UI polish.
3. Integrate only through the three public APIs + canonical types from `12-data-models.md`.
4. Contract changes start in `12-data-models.md`.
5. Candidate graph/check state must never be treated as active until Sentinel activates it.
6. UI fixtures allowed pre-backend; **final** demo uses real `/api/verify`.
7. Staged Botpress panel allowed only if live chat fails—Botpress remains **visible** in labels/story.
8. No new features after freeze.

## Main flow

### 0:00-0:20 — Contract freeze

Both agree:

- Sentinel backend: `http://localhost:3002`
- Botpress bot dev port per SDK (often `3000`); control UI per template (`3001` if applicable)
- **Primary** demo copy:
  - Procurement user message + proposed response (`01-demo-story-and-judging-strategy.md`)
  - Three audit quotes for procurement policy
- `VerifyRequest` / `VerifyResponse` / `CompilePolicyResponse` / `AuditEvent` shapes (`11-api-backend-contracts.md`)

Hamza: scaffold backend modules.

Kaveh: scaffold Next dashboard panels + ADK repo layout.

### 0:20-1:20 — First real vertical slice (procurement block)

Hamza:

- `/api/verify` + `checkEvaluator.ts`
- keyword / stub `factExtractor.ts` for procurement facts
- `auditStore.ts`
- fixture active checks for **procurement triad** (approval, vendor, credentials)

Kaveh:

- one-page shell + `RuntimeVerificationPanel` + `AuditTrailPanel` + `apiClient.ts`

Botpress (Kaveh):

- `verifyResponse.ts`
- `procurement.ts` with deterministic proposed text **or** model draft—**always** call verify before send

Integration checkpoint:

- `curl` / UI hits `/api/verify` → `blocked` + `finalResponse` + `auditEvent` for procurement scenario

### 1:20-2:20 — Compile path + source grounding

Hamza:

- `/api/policy/compile` accepts optional `candidateSections` / `candidateOperations` / `generatedBy`
- graph reducer/validator + check compiler
- return active graph/checks only

Kaveh:

- `CompileWorkflowPanel` + `PolicyGraphPanel` wired to API
- honest **candidate vs activated** labeling

Integration checkpoint:

- “Run compile” shows procurement sections + graph + checks (live or cached)

### 2:20-3:10 — Botpress runtime hardening

Hamza:

- CORS / tunnel docs as needed; stable `/api/verify` from Botpress host

Kaveh:

- `adk dev` path; `SENTINEL_API_URL=http://localhost:3002`
- chat test with procurement prompt

Integration checkpoint:

- live chat → verify → safe final message (or staged UI fallback ready **without** removing Botpress visibility)

### 3:10-3:35 — Botpress compile workflow

Kaveh:

- implement/film `policyCompile` orchestration calling `/api/policy/compile` via `activateCompiledPolicy`

Hamza:

- validate candidate payloads; fail gracefully to cached compile fixture

Integration checkpoint:

- compile either live or cached; **runtime verify remains real**

### 3:35-4:00 — Freeze, polish, rehearse

Both:

- fix only demo-breaking bugs
- full procurement walkthrough
- quotes visible inline
- rehearse **3–5** minute script (`16-presentation-script.md`)

## Edge cases / fallbacks

- Slip after hour 1: keep cached compile; prioritize real `/api/verify`, evaluator, audit, quotes.
- Botpress wiring slips: staged panel (`14-fallbacks-and-demo-resilience.md`).
- Model unreliable: cached graph + keyword facts **into** evaluator (never skip evaluator).

## Validation rules

- **Procurement** block path works before adding tertiary rules.
- Fixtures allowed for compile outputs, but verify/evaluator/audit must be **real** in final demo.
- No UI hardcoded block state.
- Stop at freeze.
- Botpress visibility preserved.

## Dependencies

- `00-product-nucleus.md`
- `01-demo-story-and-judging-strategy.md`
- `02-botpress-adk-workflow.md`
- `10-ui-ux-demo-dashboard.md`
- `11-api-backend-contracts.md`
- `12-data-models.md`
- `14-fallbacks-and-demo-resilience.md`
- `16-presentation-script.md`
- `17-botpress-policy-agents-and-prompts.md`

## Definition of done

- `/api/verify` blocks the **procurement** unsafe draft with real evaluator + audit quotes.
- `/api/policy/compile` returns sections + graph + checks (live or cached fallback).
- Dashboard tells **Hero/ADK → compile → graph → runtime verify → audit**.
- Botpress **`procurement.ts`** + **`verifyResponse`** calls `/api/verify` in the happy path.
- audit event comes from actual verification.
- no active constraint without source quote.
- final demo avoids hardcoded blocked UI.
