# Data Models

## Purpose

Centralize the TypeScript-shaped contracts used across Sentinel.

Source sections: 8, 10, 11, 12, 14, 19.

## Builder ownership

**Primary owner:** Hamza (Builder 2)

Hamza owns implementation for this file because it belongs to the Sentinel backend / truth engine.

**Kaveh dependency:** Kaveh consumes the output through the shared API/UI contract but should not modify this backend logic directly during the hackathon unless both builders agree.

Any response shape change must be made here first, then both builders adapt.

## Why it matters for the demo

The implementation needs stable shared types so graph building, validation, checking, runtime verification, audit logging, and UI rendering agree.

## Scope

### In scope

- `PolicySection`
- `SourceQuote`
- `PolicyNode`
- `PolicyEdge`
- `PolicyGraph`
- `DeterministicCheck`
- `RuntimeFacts`
- `AuditEvent`
- `GraphBuildState`
- `GraphOperation`
- `ValidationError`
- `BuildEvent`

### Out of scope

- Database schemas.
- Auth/session models.
- Organization/team models.
- Large production observability models.

## Inputs

- Master spec data model summary.
- RLM workspace state requirements.
- API/backend contracts.

## Outputs

- Canonical type definitions for implementation agents.
- Shared vocabulary across all context files.

## Data contracts

```ts
export type PolicySection = {
  id: string
  title: string
  page?: number
  text: string
  containsPolicyLogic: boolean
  processed: boolean
}

export type SourceQuote = {
  document: string
  section: string
  page?: number
  quote: string
}

export type PolicyNode = {
  id: string
  type: "action" | "condition" | "violation" | "exception" | "escalation"
  label: string
  description?: string
  source?: SourceQuote
}

export type PolicyEdge = {
  id: string
  from: string
  to: string
  type: "requires" | "forbids" | "violates_if_missing" | "escalates_to" | "except_when"
  source?: SourceQuote
}

export type PolicyGraph = {
  nodes: PolicyNode[]
  edges: PolicyEdge[]
}

export type DeterministicCheck = {
  id: string
  name: string
  trigger: string
  required?: string
  forbidden?: boolean
  severity: "allow" | "warn" | "block"
  violation: string
  reason: string
  source: SourceQuote
}

export type RuntimeFacts = Record<string, boolean>

export type AuditEvent = {
  id: string
  timestamp: string
  agentName: string
  userMessage: string
  proposedResponse: string
  finalResponse?: string
  result: "allowed" | "warned" | "blocked" | "rewritten"
  detectedFacts: string[]
  missingFacts?: string[]
  violations: string[]
  reason: string
  source?: SourceQuote
}

export type GraphBuildState = {
  documentId: string
  rawText: string
  sections: PolicySection[]
  currentGraph: PolicyGraph
  compiledChecks: DeterministicCheck[]
  validationErrors: ValidationError[]
  processedSections: string[]
  buildEvents: BuildEvent[]
}

export type GraphOperation =
  | { type: "ADD_NODE"; node: PolicyNode }
  | { type: "ADD_EDGE"; edge: PolicyEdge }
  | { type: "ADD_CHECK"; check: DeterministicCheck }
  | { type: "ATTACH_SOURCE"; targetId: string; source: SourceQuote }
  | { type: "MARK_SECTION_PROCESSED"; sectionId: string }
  | { type: "MERGE_NODES"; sourceNodeId: string; targetNodeId: string }

export type ValidationError = {
  id: string
  targetId?: string
  severity: "error" | "warning"
  message: string
}

export type BuildEvent = {
  id: string
  timestamp: string
  type: "section_processed" | "operation_applied" | "validation_failed" | "checks_compiled"
  message: string
}
```

## Hackathon demo alignment (procurement primary)

**Runtime facts (primary demo keys)** should align with `06-policy-knowledge-graph.md` / `08-runtime-verification.md`:

- `action.commit_purchase`
- `condition.manager_approval`
- `condition.vendor_approved`
- `action.share_payment_credentials`

**HTTP verify shape** mirrors `11-api-backend-contracts.md`: responses include **`finalResponse: string`**, **`reason: string`**, **`violations`**, and **`auditEvent`**.

**Fallback facts** may include `action.promise_refund` for refund drills.

## Main flow

1. Policy ingestion creates `PolicySection[]`.
2. Graph workspace stores `GraphBuildState`.
3. Graph builder emits `GraphOperation[]`.
4. Graph compiler creates `PolicyGraph`.
5. Check compiler creates `DeterministicCheck[]`.
6. Runtime verifier creates `RuntimeFacts`.
7. Check evaluator creates decision data.
8. Audit logger creates `AuditEvent`.
9. UI renders these objects.

## Edge cases / fallbacks

- If page number is unavailable, omit `page` but keep section and quote.
- If source is missing, do not activate the constraint/check.
- If fact key is absent, treat it as false at runtime.
- If build event logging is skipped, demo can still run.

## Validation rules

- These types are canonical for all context files.
- Active checks require `source: SourceQuote`.
- Any file introducing a new type should justify it and keep scope small.
- No feature should depend on an undefined type.

## Dependencies

- `00-product-nucleus.md`
- `04-document-indexing.md`
- `05-rlm-graph-build-workspace.md`
- `06-policy-knowledge-graph.md`
- `07-deterministic-checks.md`
- `08-runtime-verification.md`
- `09-audit-log.md`
- `11-api-backend-contracts.md`

## Definition of done

- All context files refer to these canonical types.
- Core implementation can start from this file.
- No required type is missing for the hackathon vertical slice.
