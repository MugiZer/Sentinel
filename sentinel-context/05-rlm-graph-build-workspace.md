# RLM Graph Build Workspace

## Purpose

Define the controlled RLM-like workspace used during policy graph construction.

Source sections: 8, 15, 16, 20.

This is not full arbitrary code execution or uncontrolled recursive agents. It is persistent compile-time state plus structured operations. The LLM is a proposer, not an authority.

## Builder ownership

**Primary owner:** Kaveh (Builder 2)

Kaveh owns implementation for this file because it belongs to the Sentinel backend / truth engine.

**Hamza dependency:** Hamza consumes the output through the shared API/UI contract but should not modify this backend logic directly during the hackathon unless both builders agree.

Hamza depends on this file only through API responses and canonical types. Do not require Hamza to understand internal reducer/validator implementation to build the UI/Botpress layer.

## Core safety philosophy

- LLM proposes operations; reducer mutates state.
- Candidate state and active state must be separate.
- No source quote -> no active constraint.
- Runtime verification only sees validated active checks.
- Graph generation may fail safely into cached demo graph/checks.

Agents may inspect bounded policy sections and propose `GraphOperation[]` batches, but they must never directly mutate graph state, compiled checks, active checks, or runtime state. Only reducer code can apply operations, and only validators can activate graph/check state.

## Why it matters for the demo

The workspace explains how Sentinel can process policy documents without stuffing the full document into every model call. Agents inspect bounded state, propose graph operations, and validators decide what becomes active.

## Scope

### In scope

- Persistent graph build state.
- Bounded section inspection.
- Strict operation schemas.
- Operation batch caps.
- Candidate graph/check state.
- Reducer-only mutation.
- Graph validation.
- Check validation.
- Source quote validation.
- Batch graph build loop.
- One repair pass maximum.
- Fallback to cached graph/checks.
- Compile-time only operation.

### Out of scope

- Arbitrary code execution.
- Runtime RLM execution.
- Unbounded recursive agents.
- Recursive autonomous agent swarms.
- Agents directly mutating app state.
- Runtime graph rebuilding.
- Graph database requirement.
- Production workflow engine.
- Production distributed workflow engine.
- Complex speculative graph generation.

## Inputs

- `PolicySection[]` from document indexing.
- Candidate `PolicyGraph`.
- Candidate compiled checks.
- Validation errors.
- Existing build events.

## Outputs

- Parsed and validated `GraphOperation[]` batches.
- Updated candidate `PolicyGraph`.
- Validated active `PolicyGraph`.
- Updated candidate `DeterministicCheck[]`.
- Validated active `DeterministicCheck[]`.
- Updated `processedSections`.
- `BuildEvent[]` trail.

## Data contracts

```ts
type GraphBuildState = {
  documentId: string
  rawText: string
  sections: PolicySection[]
  candidateGraph: PolicyGraph
  candidateChecks: DeterministicCheck[]
  activeGraph: PolicyGraph
  activeChecks: DeterministicCheck[]
  validationErrors: ValidationError[]
  processedSections: string[]
  buildEvents: BuildEvent[]
}

type GraphOperation =
  | { type: "ADD_NODE"; node: PolicyNode }
  | { type: "ADD_EDGE"; edge: PolicyEdge }
  | { type: "ADD_CHECK"; check: DeterministicCheck }
  | { type: "ATTACH_SOURCE"; targetId: string; source: SourceQuote }
  | { type: "MARK_SECTION_PROCESSED"; sectionId: string }
  | { type: "MERGE_NODES"; sourceNodeId: string; targetNodeId: string }
```

Canonical definitions live in `12-data-models.md`.

Recommended caps:

```ts
const MAX_OPS_PER_BATCH = 30
const MAX_NODES = 20
const MAX_EDGES = 30
const MAX_CHECKS = 10
```

## Candidate vs active state

`candidateGraph` and `candidateChecks` may contain untrusted LLM output after reducer application. They are useful for validation, repair, and build event display, but they are not runtime authority.

`activeGraph` and `activeChecks` are only updated after all validation gates pass. Runtime verification must read only `activeChecks`, never `candidateChecks`.

```ts
type GraphBuildState = {
  candidateGraph: PolicyGraph
  candidateChecks: DeterministicCheck[]
  activeGraph: PolicyGraph
  activeChecks: DeterministicCheck[]
}
```

Activation rule:

```txt
candidateGraph + candidateChecks
-> graph validation
-> source quote validation
-> check compilation
-> check validation
-> activeGraph + activeChecks
```

## Failure modes and prevention rules

### A. Malformed JSON

Prevention:

- LLM output must be parsed against a strict `GraphOperation[]` schema.
- Reject prose, markdown, and unknown fields.
- Retry once, then fallback to cached graph/checks.

### B. Hallucinated constraints

Prevention:

- Every active node, edge, and check must carry a `SourceQuote`.
- Source quote must be verified against the indexed `PolicySection` text.
- If quote validation fails, the operation can remain candidate/inactive but cannot activate.

### C. Unknown node references

Prevention:

- Validate every `edge.from` and `edge.to` against existing node IDs.
- Validate every `check.trigger`, `check.required`, and `check.violation` against the graph.

### D. Duplicate or inconsistent nodes

Prevention:

- Use stable IDs like `action.promise_refund`, `condition.manager_approval`, and `violation.refund_without_approval`.
- Duplicate IDs are rejected or ignored.
- Similar/duplicate concepts should be merged only through `MERGE_NODES`.

### E. Graph over-expansion

Prevention:

- Enforce hard caps:
  - `MAX_OPS_PER_BATCH = 30`
  - `MAX_NODES = 20`
  - `MAX_EDGES = 30`
  - `MAX_CHECKS = 10`
- Only enforceable policy constraints should become nodes/edges.
- Do not create generic background/legal/compliance explanation nodes.

### F. Source quote mismatch

Prevention:

- Exact or normalized substring match against the source section is required.
- Paraphrased quotes do not activate constraints.

### G. Bad check compilation

Prevention:

- Prefer compiling checks from graph edge patterns in code.
- The LLM may propose candidate checks, but final active checks must be validated.
- For a `requires` relation, `action -> condition` compiles into:
  - `trigger = action`
  - `required = condition`

### H. Infinite repair loops

Prevention:

- Allow one repair pass maximum.
- If repair fails, fallback to cached graph/checks.

## Main flow

1. Parse policy document.
2. Build section index.
3. Initialize `GraphBuildState`.
4. Send bounded policy sections plus current candidate graph to graph builder.
5. Graph builder returns `GraphOperation[]` only.
6. Parse operations against strict schema.
7. Apply valid operations through reducer code only.
8. Validate graph schema, node/edge references, allowed types, and source quotes.
9. Compile checks from validated graph relations.
10. Validate checks.
11. If validation fails, allow one repair pass.
12. If repair fails, fallback to cached graph/checks.
13. Activate graph/checks only after validation passes.

## Edge cases / fallbacks

- Malformed JSON -> reject batch, retry once, fallback to cached graph.
- Quote mismatch -> keep inactive/reject, do not activate.
- Over-expanded graph -> reject or trim to caps, prefer cached graph for demo.
- Repair pass fails -> cached graph/checks.
- LLM unavailable -> cached `GraphOperation[]` or cached `CompilePolicyResponse`.
- Operation references unknown node -> validation error, then one repair pass.
- Section has no enforceable policy -> mark processed with no operations.
- Source quote is missing -> operation may be stored as candidate but not activated.

## Validation rules

- Agents emit operations; they do not mutate state.
- Unknown operation types are rejected.
- Operation batches above max size are rejected.
- Every active node, edge, and check must have a valid source quote.
- Source quotes must match the indexed section text.
- Edge endpoints must reference existing node IDs.
- Checks must reference existing trigger/required/violation nodes.
- Candidate state must not be used at runtime.
- Only `activeChecks` may be passed to `/api/verify`.
- One repair pass maximum.
- No active constraint may be compiled from an unsupported operation.
- The workspace is compile-time only.
- Keep calls batched; avoid many tiny model calls.

## Dependencies

- `03-policy-document-ingestion.md`
- `04-document-indexing.md`
- `06-policy-knowledge-graph.md`
- `07-deterministic-checks.md`
- `12-data-models.md`
- `13-validation-and-trustworthiness.md`

## Definition of done

- The file clearly states that LLMs propose, reducers mutate, validators activate.
- Candidate and active state are separated.
- Runtime verification cannot consume unvalidated graph/check data.
- All major LLM failure modes have prevention rules.
- The workspace remains hackathon-buildable and compile-time only.
- Allowed operations and hard caps are explicit.
- Invalid or unsourced operations cannot become active checks.
