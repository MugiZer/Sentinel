# Policy Knowledge Graph

## Purpose

Define the bounded semantic graph representation of policy meaning.

Source sections: 11, 19.

Graph = what policy means. Checks = what runtime should enforce.

The graph is a visible semantic proof layer, not infrastructure-heavy graph tech.

## Builder ownership

**Primary owner:** Kaveh (Builder 2)

Kaveh owns implementation for this file because it belongs to the Sentinel backend / truth engine.

**Hamza dependency:** Hamza consumes the output through the shared API/UI contract but should not modify this backend logic directly during the hackathon unless both builders agree.

Hamza depends on this file only through API responses and canonical types. Do not require Hamza to understand internal graph compilation implementation to build the UI/Botpress layer.

## Why it matters for the demo

The graph shows that Sentinel converted policy text into structured, source-grounded constraints. It should feel real and useful without requiring a graph database, graph editor, or complex ontology engine.

## Scope

### In scope

- Bounded but decent policy graph.
- 3-5 enforceable policy constraints.
- Small ontology with existing node types:
  - `action`
  - `condition`
  - `violation`
  - `exception`
  - `escalation`
- Existing edge types:
  - `requires`
  - `forbids`
  - `violates_if_missing`
  - `escalates_to`
  - `except_when`
- Source quote attachment.
- Graph validation.
- Graph visualization.
- Graph-to-check compilation.
- No active node/edge/check without source quote.

### Out of scope

- Graph database.
- Complex ontology design.
- Graph algorithms.
- Graph editor.
- Multi-policy merge logic.
- General-purpose knowledge graph platform.

## Inputs

- `PolicySection[]`.
- Graph operations from the graph builder.
- Source quotes validated against indexed section text.

## Outputs

- `PolicyGraph` with nodes and edges.
- Source-grounded graph visualization data.
- Input to check compiler.
- A compact demo graph with approximately 8-15 nodes, 8-20 edges, and 3-5 deterministic checks.

## Data contracts

```ts
type PolicyNode = {
  id: string
  type: "action" | "condition" | "violation" | "exception" | "escalation"
  label: string
  description?: string
  source?: SourceQuote
}

type PolicyEdge = {
  id: string
  from: string
  to: string
  type: "requires" | "forbids" | "violates_if_missing" | "escalates_to" | "except_when"
  source?: SourceQuote
}

type SourceQuote = {
  document: string
  section: string
  page?: number
  quote: string
}

type PolicyGraph = {
  nodes: PolicyNode[]
  edges: PolicyEdge[]
}
```

Recommended caps:

```ts
const MAX_NODES = 20
const MAX_EDGES = 30
const MAX_CHECKS = 10
```

## Main flow

1. Graph builder receives a bounded policy section.
2. It identifies enforceable actions, conditions, violations, exceptions, or escalations.
3. It emits source-grounded node operations.
4. It emits source-grounded edge operations.
5. Graph reducer applies valid operations to candidate state.
6. Graph validator checks IDs, types, edge references, caps, and source quotes.
7. Check compiler turns enforceable graph relations into checks.
8. Active graph/checks are published only after validation passes.

Primary refund demo path:

- `action.promise_refund`
- `condition.manager_approval`
- `violation.refund_without_approval`
- `edge.refund_requires_approval`
- `edge.refund_violates_if_missing_approval`

Suggested compact policy constraints:

- Refund promises require manager approval.
- Requesting full credit card numbers or CVV codes is forbidden.
- Investment advice is forbidden or escalated.
- Legal threats require escalation to a human manager.
- Competitor pricing discussion warns or blocks depending on policy wording.

Anti-friction rules:

- Prefer stable IDs like `action.promise_refund`.
- Do not create generic legal/compliance/background nodes.
- Only enforceable policy concepts become nodes.
- Source quotes must attach to every active node, edge, and check.
- Graph can be cached for demo but must still validate before activation.

## Edge cases / fallbacks

- Missing condition node -> reject dependent edge until repaired.
- Duplicate action nodes -> reject duplicate ID or merge intentionally with `MERGE_NODES`.
- Unsourced node or edge -> keep inactive or reject.
- Over-expanded graph -> reject/trim to caps or use cached graph for demo.
- Graph visualization library fails -> render a simple static node/edge list.
- Graph generation fails -> use cached graph/checks that still pass validation.

## Validation rules

- Every node has `id`, `type`, and `label`.
- Every edge has `id`, `from`, `to`, and `type`.
- Every edge references existing node IDs.
- No unknown node or edge types.
- Every active node, edge, and check must have `source.quote`.
- Source quote must match indexed section text.
- Duplicate IDs are rejected or merged intentionally.
- Graph-to-check compilation must not reverse trigger/required logic.
- The graph must stay within the suggested caps for the hackathon demo.

## Dependencies

- `04-document-indexing.md`
- `05-rlm-graph-build-workspace.md`
- `07-deterministic-checks.md`
- `12-data-models.md`
- `13-validation-and-trustworthiness.md`

## Definition of done

- Refund policy graph can be represented as the primary demo path.
- Compact graph supports 3-5 enforceable constraints.
- Graph can be validated.
- Graph can be visualized in the demo.
- Graph can compile into deterministic checks.
- Cached graph fallback still validates before activation.
