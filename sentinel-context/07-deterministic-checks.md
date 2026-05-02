# Deterministic Checks

## Purpose

Define the executable enforcement layer compiled from policy graph relationships.

Source sections: 12, 16, 19, 21.

Graph = what policy means. Checks = what runtime should enforce.

## Builder ownership

**Primary owner:** Hamza (Builder 2)

Hamza owns implementation for this file because it belongs to the Sentinel backend / truth engine.

**Kaveh dependency:** Kaveh consumes the output through the shared API/UI contract but should not modify this backend logic directly during the hackathon unless both builders agree.

Kaveh depends on this file only through API responses and canonical types. Do not require Kaveh to understand internal evaluator implementation to build the UI/Botpress layer.

## Why it matters for the demo

This is the core technical proof that Sentinel is not relying on prompts alone. The LLM extracts facts, but deterministic code decides whether to allow, warn, block, or rewrite.

## Scope

### In scope

- `DeterministicCheck` schema.
- Check compiler behavior.
- `evaluateCheck` logic.
- Block/warn/allow semantics.
- Refund check example.
- Under-50ms deterministic evaluation target.

### Out of scope

- Full policy engine DSL.
- Complex rule authoring UI.
- Probabilistic enforcement decisions.
- Runtime policy graph rebuilding.

## Inputs

- Validated `PolicyGraph`.
- Runtime facts extracted from proposed response.
- Active checks.

## Outputs

- Check evaluation result.
- Violation reason.
- Missing required facts.
- Source quote.
- Decision input for runtime verifier and audit log.

## Data contracts

```ts
type DeterministicCheck = {
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

type CheckResult = {
  passed: boolean
  result: "allow" | "warn" | "block"
  violation?: string
  reason?: string
  source?: SourceQuote
  missingFact?: string
}
```

## Main flow

1. Check compiler reads validated graph relations.
2. A `requires` or `violates_if_missing` relation becomes a required-fact check.
3. A `forbids` relation becomes a forbidden-trigger check.
4. Every check receives severity, violation ID, reason, and source quote.
5. Runtime verifier provides `RuntimeFacts`.
6. `evaluateCheck` detects whether the trigger is present.
7. If trigger is absent, the check passes.
8. If `forbidden === true`, the check fails with its severity.
9. If `required` exists and the required fact is not true, the check fails.
10. Otherwise the check passes.

Refund check:

```ts
{
  id: "check.refund_requires_approval",
  name: "Refunds require manager approval",
  trigger: "action.promise_refund",
  required: "condition.manager_approval",
  severity: "block",
  violation: "violation.refund_without_approval",
  reason: "Refund promise requires manager approval.",
  source: {
    document: "Northstar Bank AI Agent Compliance Manual",
    section: "Refunds and Reimbursements",
    page: 2,
    quote: "Agents must not promise or guarantee refunds unless manager approval has been granted."
  }
}
```

## Edge cases / fallbacks

- Multiple block failures -> return blocked and list all violations, but highlight the primary one in the UI.
- Warn and block both fire -> block wins.
- Check references missing node -> validation error; do not activate.
- Fact extractor omits a known key -> treat missing as false.

## Validation rules

- Every check has `id`, `trigger`, `severity`, `violation`, `reason`, and `source`.
- Every trigger references an existing action node.
- Every required field references an existing condition node.
- Every violation references an existing violation node.
- Every source has a quote.
- No active check without source quote.
- Deterministic evaluation target: under 50ms.

## Dependencies

- `06-policy-knowledge-graph.md`
- `08-runtime-verification.md`
- `12-data-models.md`
- `13-validation-and-trustworthiness.md`

## Definition of done

- Refund check can block an unsafe response.
- Check evaluator is deterministic and fast.
- Source quotes flow into failed check results.
- Invalid or unsourced checks cannot activate.
