# Validation And Trustworthiness

## Purpose

Define the anti-hallucination rules, validation gates, and judge-facing trust story.

Source sections: 15, 21.

## Builder ownership

**Primary owner:** Hamza (Builder 2)

Hamza owns implementation for this file because it belongs to the Sentinel backend / truth engine.

**Kaveh dependency:** Kaveh consumes the output through the shared API/UI contract but should not modify this backend logic directly during the hackathon unless both builders agree.

Kaveh depends on this file only through API responses and canonical types. Do not require Kaveh to understand internal validation implementation to build the UI/Botpress layer.

## Why it matters for the demo

The strongest likely judge question is: "How do you know the extracted constraints are not hallucinated?" Sentinel needs a direct answer backed by implementation rules.

## Scope

### In scope

- Core invariant: no source quote -> no active constraint.
- Constraint lifecycle.
- Graph validation rules.
- Check validation rules.
- Activation validation rules.
- Judge answer for hallucination concerns.
- Production policy-owner approval note for the pitch only.

### Out of scope

- Formal verification.
- Legal guarantees.
- Full human approval workflow in the hackathon build.
- Enterprise access control for policy owners.

## Inputs

- Candidate graph operations.
- Candidate graph.
- Candidate deterministic checks.
- Source quotes.
- Validation errors.

## Outputs

- Validated graph.
- Active checks.
- Validation errors.
- Trust explanation for demo and pitch.

## Data contracts

Relevant contracts:

- `SourceQuote`
- `PolicyNode`
- `PolicyEdge`
- `PolicyGraph`
- `DeterministicCheck`
- `ValidationError`

Suggested validation result:

```ts
type ValidationResult = {
  valid: boolean
  errors: ValidationError[]
}
```

## Main flow

1. LLM proposes candidate graph operations from policy sections.
2. Each candidate node/edge/check must include a source quote.
3. Graph reducer applies only structured operations.
4. Graph validator checks schema, references, allowed types, and source quotes.
5. Check validator checks trigger, required, violation, reason, severity, and source.
6. Activation validator rejects unsourced or invalid checks.
7. Only active checks are available to runtime verification.

Constraint lifecycle:

```txt
Candidate constraint
-> source quote attached
-> graph schema validation
-> deterministic check compiled
-> activation
```

Judge answer:

```txt
We do not let the LLM invent active constraints. The RLM-style workspace helps because agents build constraints while inspecting the actual policy document and current graph state, instead of guessing from memory. But that alone is not the guarantee.

Every active constraint must be tied to an exact source quote and section/page from the policy document. If there is no source quote, it does not become active. Then we validate the graph structure before compiling deterministic checks.

In production, a policy owner would approve extracted constraints before activation. So the LLM proposes constraints, but the policy document is the authority.
```

Policy-owner approval is pitch-only / future production note, not a hackathon feature.

## Edge cases / fallbacks

- Source quote missing -> candidate may be shown as inactive, but no active check is created.
- Graph edge references unknown node -> validation error and one repair pass.
- Check references unknown trigger -> validation error and no activation.
- Production trust concern -> state that policy-owner approval would be added before activation.
- Do not build policy-owner approval UI/workflow during the hackathon.

## Validation rules

Graph validation:

- Every node has `id`, `type`, and `label`.
- Every edge has `id`, `from`, `to`, and `type`.
- Every edge references existing node IDs.
- Every source-bound node/edge has `source.quote`.
- Every violation node has severity or associated check severity.
- No unknown node types.
- No unknown edge types.

Check validation:

- Every check has `id`, `trigger`, `severity`, `violation`, `reason`, and `source`.
- Every trigger references an existing action node.
- Every required field references an existing condition node.
- Every violation references an existing violation node.
- Every source has a quote.

Activation validation:

- No active check without source quote.
- No active check without valid trigger.
- No active block without reason.

## Dependencies

- `04-document-indexing.md`
- `05-rlm-graph-build-workspace.md`
- `06-policy-knowledge-graph.md`
- `07-deterministic-checks.md`
- `09-audit-log.md`
- `12-data-models.md`

## Definition of done

- Unsourced constraints cannot become active.
- Graph and check validation rules are implementable.
- Demo can answer hallucination concerns clearly.
- Audit UI repeats source quotes for blocked decisions.
