# API Backend Contracts

## Purpose

Define the clean parallelization contract between frontend, backend, and Botpress for the hackathon build.

Source sections: 18, 19.

Keep exactly three real endpoints:

- `POST /api/policy/compile`
- `POST /api/verify`
- `GET /api/audit`

## Builder ownership

**Primary owner:** Kaveh (Builder 2)

Kaveh owns implementation for this file because it belongs to the Sentinel backend / truth engine.

**Hamza dependency:** Hamza consumes the output through the shared API/UI contract but should not modify this backend logic directly during the hackathon unless both builders agree.

## Why it matters for the demo

Stable API contracts let builders split work safely: the backend builder implements endpoint behavior, the frontend builder consumes response shapes, and the Botpress builder calls `/api/verify`.

## Builder interface contract

Kaveh owns the implementation of these endpoints. Hamza consumes these endpoints from the UI and Botpress ADK.

Hamza should not depend on internal backend modules. Kaveh should not depend on UI implementation details.

The only integration boundary is:

- `POST /api/policy/compile`
- `POST /api/verify`
- `GET /api/audit`

`/api/verify` is the only authority for runtime allow/block/rewrite. UI cannot hardcode policy decisions. Botpress must call `/api/verify`, not internal modules.

## Scope

### In scope

- Three endpoints only.
- Minimal modules:
- `policyParser.ts`
- `graphCompiler.ts`
- `graphValidator.ts`
- `checkCompiler.ts`
- `factExtractor.ts`
- `checkEvaluator.ts`
- `auditStore.ts`
- Optional Botpress Policy Compile Workflow calls for indexing/graph operation proposals.
- Shared canonical types from `12-data-models.md`.
- In-memory state for hackathon demo.
- Botpress calling `/api/verify` through the public contract.

### Out of scope

- Authentication.
- Database.
- Queues.
- Streaming.
- Multi-tenancy.
- Sessions.
- Production persistence.
- Complex job system.
- Advanced deployment concerns.

## Inputs

- Policy compile request with `documentName` and text or uploaded file-derived text.
- Verify request from UI or Botpress workflow.
- Audit query request.

## Outputs

- Compiled policy sections, graph, and active checks.
- Verification decision and audit event.
- In-memory audit event list.

## Data contracts

```ts
type CompilePolicyRequest = {
  documentName: string
  text?: string
}

type CompilePolicyResponse = {
  documentId: string
  sections: PolicySection[]
  graph: PolicyGraph
  checks: DeterministicCheck[]
}

type VerifyRequest = {
  agentName: string
  userMessage: string
  proposedResponse: string
  checks?: DeterministicCheck[]
}

type VerifyResponse = {
  result: "allowed" | "warned" | "blocked" | "rewritten"
  finalResponse?: string
  facts: RuntimeFacts
  violations: string[]
  auditEvent: AuditEvent
}

type AuditListResponse = {
  events: AuditEvent[]
}
```

## Main flow

Policy compile:

1. `POST /api/policy/compile` receives `documentName` and plain text from textarea/upload/PDF extraction.
2. If text is missing or invalid, use preloaded policy/cached graph fallback.
3. `policyParser.ts` creates real `PolicySection[]`.
4. Botpress Policy Indexing / Graph Builder agents may propose sections and `GraphOperation[]`.
5. `graphCompiler.ts` applies valid operations through reducer code or loads bounded fallback graph.
6. `graphValidator.ts` validates graph shape, references, caps, and source quotes.
7. `checkCompiler.ts` compiles checks from validated graph relations.
8. Checks are validated before activation.
9. Endpoint returns `documentId`, `sections`, active `graph`, and active `checks`.

Runtime verify:

1. `POST /api/verify` receives `agentName`, `userMessage`, `proposedResponse`, and optional checks.
2. Endpoint never receives or reads the full policy document.
3. If checks are omitted, use current active checks from memory.
4. `factExtractor.ts` extracts compact runtime facts.
5. `checkEvaluator.ts` evaluates deterministic checks.
6. Runtime verifier decides result and final response.
7. `auditStore.ts` writes audit event to in-memory store.
8. Endpoint returns result, final response, facts, violations, and audit event.

Audit:

1. `GET /api/audit` returns in-memory `AuditEvent[]`.

## Edge cases / fallbacks

- Compile fails -> cached `CompilePolicyResponse`.
- Graph validation fails -> one repair pass, then cached graph/checks.
- Fact extraction fails -> keyword fallback.
- Audit store unavailable -> process memory.
- No active checks -> allow with compile warning or use demo active checks, depending on demo mode.
- Verify endpoint receives no checks -> use current active checks from memory.

## Validation rules

- `/api/verify` must not read full policy text.
- `/api/policy/compile` must validate source quotes before activating checks.
- API responses must use canonical data models from `12-data-models.md`.
- Botpress workflow should call `/api/verify`, not internal modules.
- If checks are omitted from `/api/verify`, use current active checks from memory.
- Candidate graph/check state must not be passed to runtime.
- Only active checks may be evaluated by `checkEvaluator.ts`.
- Compile response checks must be source-grounded.

## Dependencies

- `02-botpress-adk-workflow.md`
- `03-policy-document-ingestion.md`
- `05-rlm-graph-build-workspace.md`
- `07-deterministic-checks.md`
- `08-runtime-verification.md`
- `09-audit-log.md`
- `12-data-models.md`
- `17-botpress-policy-agents-and-prompts.md`

## Definition of done

- Exactly three endpoints are defined and implementable.
- Module boundaries are clear.
- Botpress has a stable verify contract.
- Frontend can render compile and verify responses.
- Backend can run with in-memory state and cached fallbacks.
- Verification path remains real: compact fact extraction, deterministic check evaluation, and audit event generation.
