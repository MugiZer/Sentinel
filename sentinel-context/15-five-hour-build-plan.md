# Four-Hour Concurrent Build Plan

## Purpose

Turn Sentinel into a realistic 4-hour two-builder implementation plan with parallel work streams and clear integration boundaries.

## Builder ownership

**Shared owner:** Hamza (Builder 1) and Kaveh (Builder 2)

This file defines shared product alignment. Hamza is responsible for preserving the demo/presentation interpretation. Kaveh is responsible for preserving the backend/trustworthiness interpretation.

Any scope change here must be agreed by both builders.

## Why it matters for the demo

The team needs to finish the vertical slice, not chase infrastructure. This plan prioritizes the real verification spine first, then UI/Botpress integration around stable contracts.

## Builder roles

Hamza — Builder 1:

- Botpress ADK.
- UI dashboard.
- Demo flow.
- Integration test.
- Presentation.

Kaveh — Builder 2:

- Sentinel backend.
- Data models.
- Compile endpoint.
- Verifier endpoint.
- Deterministic checks.
- Audit store.
- Source quote validation.

## Scope

### In scope

- Concurrent two-builder plan.
- Contract-first implementation.
- Real `/api/verify` path.
- Real deterministic evaluator.
- Real audit event generation.
- Fixture-backed compile outputs only when needed.
- Botpress runtime integration or staged fallback.
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

- A working 3-minute demo.
- Stable shared contracts.
- A clear division of responsibility.
- Fallback-ready build.

## Data contracts

Use `12-data-models.md` as the shared type source from the start. Do not invent parallel shapes during the rush.

Shared integration boundary:

- `POST /api/policy/compile`
- `POST /api/verify`
- `GET /api/audit`
- Canonical types from `12-data-models.md`

## Non-interference rules

1. Kaveh owns backend truth. Hamza must not hardcode compliance decisions in the UI.
2. Hamza owns Botpress/UI. Kaveh must not block on UI polish.
3. Both builders integrate only through `/api/policy/compile`, `/api/verify`, `/api/audit`, and canonical types.
4. Any contract change must be made in `12-data-models.md` first.
5. Candidate graph/check state must never be consumed by Hamza's UI or Botpress runtime as active state.
6. UI fixtures are allowed only before backend is ready; final demo must use real `/api/verify`.
7. Botpress may use a staged panel only if live integration fails, but Botpress must remain visible.
8. No new features after the freeze point.

## Main flow

### 0:00-0:20 — Contract freeze

Both:

- agree on ports:
  - Sentinel app: `localhost:3002`
  - Botpress bot: `localhost:3000`
  - Botpress control panel: `localhost:3001`
- agree on source quote:
  - "Agents must not promise or guarantee refunds unless manager approval has been granted."
- agree on demo proposed response:
  - "Sure, I can refund you today."
- agree on `VerifyRequest`, `VerifyResponse`, `CompilePolicyResponse`, `AuditEvent`

Kaveh:

- creates/locks `12-data-models.md` implementation shape
- scaffolds backend files

Hamza:

- scaffolds UI panels and Botpress ADK files
- uses temporary fixture responses only until `/api/verify` is ready

### 0:20-1:20 — First real vertical slice

Kaveh:

- implements `/api/verify`
- implements `checkEvaluator.ts`
- implements keyword `factExtractor.ts`
- implements in-memory `auditStore.ts`
- hardcodes Northstar refund check first

Hamza:

- builds four-panel UI shell
- builds `BotpressPanel`
- builds `AuditLogPanel`
- creates Botpress `verifyResponse` Action
- creates Botpress `support.ts` Conversation with hardcoded proposed response

Integration checkpoint:

- curl to `/api/verify` returns `blocked`
- UI can display a mocked blocked event but is ready to swap to real API

### 1:20-2:20 — Compile path and source grounding

Kaveh:

- implements `/api/policy/compile`
- implements `policyParser.ts`
- implements simple `PolicySection[]` indexing
- implements graph fixture / graph reducer / graph validator
- implements check compiler
- enforces source quote validation
- returns active graph/checks only

Hamza:

- connects `PolicyPanel` to `/api/policy/compile`
- renders graph/checks in `GraphPanel`
- adds visible provenance labels:
  - "Policy sections proposed by Botpress Policy Indexing Agent"
  - "Checks activated by Sentinel Validator"
- keeps UI independent from backend internals

Integration checkpoint:

- clicking "Load/Compile Policy" shows sections, graph, and checks

### 2:20-3:10 — Botpress runtime integration

Kaveh:

- runs Sentinel app on port `3002` or exposes via ngrok/Vercel
- confirms `/api/verify` and `/api/policy/compile` are reachable
- fixes CORS/network issues if needed

Hamza:

- points Botpress `SENTINEL_API_URL` to Kaveh's backend
- runs `adk dev`
- tests Botpress chat: "I'm angry. Refund me right now."
- verifies Botpress sends Sentinel final response
- records fallback screen if needed

Integration checkpoint:

- Botpress support agent calls `/api/verify`
- Botpress sends safe final response
- Sentinel audit log receives blocked event

### 3:10-3:35 — Botpress compile-time agent workflow

Kaveh:

- updates `/api/policy/compile` to accept optional:
  - `candidateSections`
  - `candidateOperations`
  - `generatedBy: "botpress-policy-workflow"`
- validates candidates before activation

Hamza:

- implements or finalizes:
  - `policyIndexingAgent.ts`
  - `policyGraphBuilderAgent.ts`
  - `activateCompiledPolicy.ts`
  - `policyCompile.ts`
- runs workflow if possible
- if workflow fails, uses cached compile output but keeps provenance story honest

Integration checkpoint:

- Botpress compile workflow either works or is safely bypassed through cached compile data
- runtime Botpress verification remains the priority

### 3:35-4:00 — Freeze, polish, rehearse

Both:

- no new features
- fix only demo-breaking bugs
- run the full demo path
- verify source quote is visible
- verify Botpress is visible
- rehearse the 3-minute pitch

Hamza:

- presentation flow
- UI polish
- Botpress console visibility

Kaveh:

- backend stability
- evaluator/audit/source quote correctness

## Edge cases / fallbacks

- If behind schedule after hour 1, keep fixture-backed graph/checks and prioritize real `/api/verify`, deterministic evaluation, audit, and source quotes.
- If Botpress wiring is not done by the runtime integration checkpoint, use staged Botpress panel.
- If deployment blocks progress, demo locally.
- If model calls are unreliable, use cached graph and keyword fact fallback.
- If Botpress compile-time workflow slips, use cached compile output but keep runtime verification real.

## Validation rules

- The refund block path must work before adding secondary rules.
- Fixtures are allowed for compile-time outputs, but `/api/verify`, evaluator, audit event, and source quote path must be real.
- Do not hardcode the final blocked decision in the UI.
- Stop adding features at the freeze point.
- No file or module should expand scope beyond the hackathon slice.
- Botpress visibility must be preserved.

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

- `/api/verify` returns blocked for the refund promise.
- `/api/policy/compile` returns sections, graph, and checks.
- UI shows policy, graph, Botpress proposed response, final response, and audit source quote.
- Botpress ADK support conversation calls `/api/verify`.
- Audit event is generated from actual verification result.
- No active constraint exists without source quote.
- Final demo path does not rely on a hardcoded blocked UI state.
