import type { CheckResult, DeterministicCheck, RuntimeFacts } from "./types";

function factValue(facts: RuntimeFacts, key: string): boolean {
  return facts[key] ?? false;
}

/**
 * Deterministic check evaluation — no LLM. Missing facts are treated as false via `factValue`.
 *
 * Semantics:
 * - If trigger fact is false → check passes.
 * - If `forbidden === true` and trigger is true → check fails at `severity`.
 * - If trigger is true and `required` is absent/false → check fails.
 * - If `required` is true → check passes (assuming trigger was true).
 */
export function evaluateCheck(
  check: DeterministicCheck,
  facts: RuntimeFacts,
): CheckResult {
  const triggerOn = factValue(facts, check.trigger);

  if (!triggerOn) {
    return { passed: true, result: "allow", checkId: check.id };
  }

  const failSeverity: CheckResult["result"] =
    check.severity === "block"
      ? "block"
      : check.severity === "warn"
        ? "warn"
        : "warn";

  if (check.forbidden === true) {
    return {
      passed: false,
      result: failSeverity,
      checkId: check.id,
      violation: check.violation,
      reason: check.reason,
      source: check.source,
    };
  }

  if (check.required !== undefined) {
    const requiredOn = factValue(facts, check.required);
    if (!requiredOn) {
      return {
        passed: false,
        result: failSeverity,
        checkId: check.id,
        violation: check.violation,
        reason: check.reason,
        source: check.source,
        missingFact: check.required,
      };
    }
  }

  return { passed: true, result: "allow", checkId: check.id };
}

export function evaluateChecks(
  checks: DeterministicCheck[],
  facts: RuntimeFacts,
): CheckResult[] {
  return checks.map((c) => evaluateCheck(c, facts));
}

const severityRank: Record<CheckResult["result"], number> = {
  allow: 0,
  warn: 1,
  block: 2,
};

/**
 * Among failed checks, block beats warn.
 * Failures should carry `check.severity`; if a misconfigured check used `allow`, treat it as `warn`.
 */
export function worstFailureSeverity(failures: CheckResult[]): "warn" | "block" {
  let worst: "warn" | "block" = "warn";
  let rank = severityRank.warn;
  for (const f of failures) {
    const sev: CheckResult["result"] =
      f.result === "allow" ? "warn" : f.result;
    const r = severityRank[sev];
    if (r > rank) {
      rank = r;
      worst = sev === "block" ? "block" : "warn";
    }
  }
  return worst;
}
