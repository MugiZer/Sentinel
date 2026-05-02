# Botpress Policy Agents And Prompts

## Purpose

Define how Sentinel uses Botpress ADK agents/workflows inside the policy compile pipeline.

Option A for Sentinel: Botpress ADK owns the compile-time policy agents. Sentinel backend code still owns reducer application, validation, check activation, runtime verification, and audit logging.

## Builder ownership

**Primary owner:** Whoever implements Botpress ADK for this build (not Kaveh).

Kaveh does not own Botpress ADK or compile-time agent wiring. Kaveh owns the Sentinel frontend and may display provenance labels that refer to Botpress policy agents when the API provides that metadata.

**Hamza dependency:** Hamza provides the backend API responses and canonical data contracts consumed here, but should not modify Botpress/UI flow directly during the hackathon unless both builders agree.

## Why it matters for the demo

This makes Sentinel genuinely Botpress-native beyond the customer support chat. Botpress agents help transform policy text into graph operations, while Sentinel code prevents hallucinated or invalid policy state from becoming active.

Core rule:

```txt
Botpress agents propose.
Sentinel reducer mutates candidate state.
Sentinel validators activate graph/check state.
```

## Backend dependency rules

Botpress calls Sentinel through public API endpoints only.

Runtime:

- Botpress support agent calls `/api/verify`.

Compile time:

- Botpress policy workflow may call `/api/policy/compile` with candidate sections/operations.

Botpress agents propose. Sentinel validates and enforces.

## Scope

### In scope

- Botpress Policy Compile Workflow.
- Botpress Policy Indexing Agent.
- Botpress Policy Graph Builder Agent.
- Optional Botpress Runtime Fact Extractor Agent if time allows.
- Explicit system prompts / instruction contracts.
- Structured JSON outputs only.
- Sentinel reducer/validator boundary.
- Fallback to Sentinel backend LLM functions with the same prompts if Botpress compile-agent wiring is too slow.

### Out of scope

- Arbitrary code execution.
- Recursive autonomous swarms.
- Botpress agents directly mutating graph/check/runtime state.
- Botpress tables as the canonical Sentinel database.
- Botpress knowledge bases as the policy source of truth.
- Runtime graph rebuilding.
- Production workflow engine.
- Letting an agent activate constraints.

## Inputs

- Plain policy text from ingestion.
- `PolicySection[]` or raw section candidates.
- Current candidate graph summary.
- Allowed `GraphOperation` schema.
- Validation errors from the last attempt.
- Active fact keys for runtime extraction.

## Outputs

- `PolicySection[]` candidates from the Policy Indexing Agent.
- `GraphOperation[]` batches from the Policy Graph Builder Agent.
- Optional `RuntimeFacts` from the Runtime Fact Extractor Agent.
- Build events showing which Botpress agent produced each proposal.

## Data contracts

Use canonical types from `12-data-models.md`:

- `PolicySection`
- `PolicyGraph`
- `GraphOperation`
- `RuntimeFacts`
- `ValidationError`
- `BuildEvent`

Recommended compile workflow request:

```ts
type PolicyCompileWorkflowInput = {
  documentId: string
  documentName: string
  text: string
}
```

Recommended policy-agent result envelope:

```ts
type AgentProposal<T> = {
  agentName: string
  kind: "sections" | "graph_operations" | "runtime_facts"
  payload: T
  notes?: string[]
}
```

## Main flow

1. `/api/policy/compile` receives document name and text.
2. Sentinel starts the Botpress Policy Compile Workflow.
3. Policy Indexing Agent proposes `PolicySection[]`.
4. Sentinel validates section shape and preserves section text.
5. For each policy section/batch, Policy Graph Builder Agent proposes `GraphOperation[]`.
6. Sentinel parses operations against strict schema.
7. Sentinel reducer applies valid operations to candidate graph only.
8. Sentinel validates source quotes, graph shape, references, caps, and allowed types.
9. If validation fails, Botpress Graph Builder gets one repair prompt with validation errors.
10. If repair fails, Sentinel falls back to cached graph/checks.
11. Sentinel code compiles deterministic checks from validated graph relations.
12. Sentinel validates checks.
13. Sentinel activates `activeGraph` and `activeChecks`.
14. Runtime `/api/verify` uses only `activeChecks`.

## Botpress ADK Shape

Recommended project layout:

```txt
botpress-agent/
  agent.config.ts
  src/conversations/support.ts
  src/actions/verifyResponse.ts
  src/workflows/policyCompile.ts
  src/actions/policyIndexingAgent.ts
  src/actions/policyGraphBuilderAgent.ts
  src/actions/runtimeFactExtractorAgent.ts
```

Workflow:

```txt
policyCompile workflow
-> policyIndexingAgent action
-> policyGraphBuilderAgent action per section/batch
-> Sentinel reducer/validator API/action
-> check compiler in Sentinel code
-> activation in Sentinel code
```

Important implementation note:

Botpress ADK is code-first: you create agents/workflows/actions as TypeScript files in an ADK project and deploy/run them. Your application code generally should not “auto-create” arbitrary new Botpress agents at runtime for this demo. Instead, define the Sentinel policy agents ahead of time as ADK actions/workflows with fixed prompts and schemas, then invoke them during compile.

## Agent System Prompts

### Policy Indexing Agent

```txt
You are the Sentinel Policy Indexing Agent.

Your job is to split a policy document into PolicySection[].

Rules:
- Return JSON only.
- Do not infer graph rules yet.
- Preserve exact section text for source quote matching.
- Prefer known Northstar section headers when present.
- If headings are messy, use simple section boundaries.
- Every section must include id, title, text, containsPolicyLogic, and processed.
- processed must be false.
- containsPolicyLogic should be true only when the section includes enforceable policy logic.
```

Expected output:

```json
{
  "sections": []
}
```

### Policy Graph Builder Agent

```txt
You are the Sentinel Policy Graph Builder Agent.

You receive one bounded PolicySection and a summary of the current candidate graph.
Your job is to propose GraphOperation[] only.

Rules:
- Return JSON only.
- Use only allowed GraphOperation types.
- Every active node/edge proposal must include a SourceQuote copied from the section text.
- Do not paraphrase source quotes.
- Do not create generic background, legal, compliance, or explanation nodes.
- Only enforceable policy concepts become nodes/edges.
- Prefer stable IDs like action.promise_refund, condition.manager_approval, violation.refund_without_approval.
- Do not compile final active checks unless explicitly requested.
- Do not mutate state directly.
```

Expected output:

```json
{
  "operations": []
}
```

### Graph Repair Prompt

```txt
You are repairing a previous GraphOperation[] proposal.

You receive:
- the original PolicySection
- the rejected operations
- validation errors
- the current candidate graph summary

Return a corrected GraphOperation[] JSON object only.
One repair pass is allowed. If unsure, return an empty operations array.
```

### Runtime Fact Extractor Agent

```txt
You are the Sentinel Runtime Fact Extractor.

Given a proposed Botpress response and known fact keys, return RuntimeFacts JSON only.

Rules:
- Do not decide allow/block/warn.
- Only extract facts.
- Only use provided fact keys.
- Use false when absent.
- Return JSON only.
```

Expected output:

```json
{
  "facts": {}
}
```

## Edge cases / fallbacks

- Botpress compile workflow is slow to wire -> use Sentinel backend LLM functions with the same prompt contracts.
- Policy Indexing Agent returns invalid JSON -> retry once, then use known Northstar section splitter.
- Graph Builder Agent returns invalid JSON -> retry once, then cached `GraphOperation[]` or cached graph/checks.
- Source quote mismatch -> operation remains inactive/rejected.
- Repair pass fails -> cached graph/checks.
- Runtime Fact Extractor Agent is unavailable -> Sentinel backend keyword fallback produces `RuntimeFacts`.

Fallback is acceptable only if:

- `/api/verify` remains real.
- Deterministic checks remain real.
- Audit event generation remains real.
- Fallback facts do not hardcode final decisions.

## Validation rules

- Botpress policy agents may propose only structured outputs.
- Botpress policy agents must not directly mutate graph/check/runtime state.
- Sentinel reducer code is the only graph mutation path.
- Sentinel validators are the only activation path.
- Runtime verification must read only `activeChecks`.
- Every active node, edge, and check must have a valid source quote.
- One repair pass maximum.
- If Botpress compile-agent integration slips, fallback must use the same schemas/prompts so the architecture remains truthful.

## Dependencies

- `02-botpress-adk-workflow.md`
- `03-policy-document-ingestion.md`
- `04-document-indexing.md`
- `05-rlm-graph-build-workspace.md`
- `06-policy-knowledge-graph.md`
- `07-deterministic-checks.md`
- `08-runtime-verification.md`
- `11-api-backend-contracts.md`
- `12-data-models.md`

## Definition of done

- Compile-time Botpress policy agents are explicitly defined.
- Each policy agent has a prompt contract and JSON output contract.
- The compile workflow keeps Botpress agents as proposers only.
- Sentinel code remains responsible for reducer, validation, check compilation, activation, runtime verification, and audit.
- There is a clear fallback if Botpress compile-agent wiring is not ready.
