import type {
  DeterministicCheck,
  PolicyEdge,
  PolicyGraph,
  PolicyNode,
} from "./types";

import { normalizeText } from "./sourceQuoteValidator";

import {
  northstarRefundDeterministicCheck,
} from "./fixtures";

function nodeBy(graph: PolicyGraph, id: string): PolicyNode | undefined {
  return graph.nodes.find((n) => n.id === id);
}

function violationForRequires(graph: PolicyGraph, edge: PolicyEdge): string | undefined {
  const explicit = graph.edges.find(
    (e) =>
      e.from === edge.from &&
      e.type === "violates_if_missing" &&
      nodeBy(graph, e.to)?.type === "violation",
  );
  if (explicit?.to) return explicit.to;

  const anyV = graph.nodes.find((n) => n.type === "violation")?.id;
  return anyV;
}

function pickSeverity(edge: PolicyEdge): DeterministicCheck["severity"] {
  if (edge.type === "requires" || edge.type === "violates_if_missing") return "block";
  if (edge.type === "forbids") return "block";
  if (edge.type === "escalates_to") return "warn";
  if (edge.type === "except_when") return "allow";
  return "block";
}

function resolveSource(graph: PolicyGraph, edgeRow: PolicyEdge) {
  return (
    edgeRow.source ??
    nodeBy(graph, edgeRow.from)?.source ??
    nodeBy(graph, edgeRow.to)?.source
  );
}

function readableName(trigger: PolicyNode | undefined, other: PolicyNode | undefined): string {
  const a = normalizeText(trigger?.label ?? "").slice(0, 80);
  const b = normalizeText(other?.label ?? "").slice(0, 80);
  if (a && b) return `${a} -> ${b}`;
  return a || b || "Policy check";
}

export type CompileChecksResult =
  | { ok: true; checks: DeterministicCheck[] }
  | { ok: false; errors: string[] };

/**
 * Builds deterministic checks only from validated policy graphs — never activates untrusted payloads.
 *
 * Requires edges compile to trigger/required semantics (no reversing).
 */
export function compileDeterministicChecksFromGraph(
  graph: PolicyGraph,
): CompileChecksResult {
  const checks: DeterministicCheck[] = [];
  const errors: string[] = [];
  let sid = 0;

  const pushDuplicateGuard = (c: DeterministicCheck) => {
    if (checks.some((x) => x.id === c.id)) return;
    checks.push(c);
  };

  for (const e of graph.edges) {
    if (e.type === "except_when") {
      continue;
    }

    const trig = nodeBy(graph, e.from);
    const targ = nodeBy(graph, e.to);
    const source = resolveSource(graph, e);

    if (!source?.quote?.trim()) {
      errors.push(`Edge "${e.id}" missing resolvable quoted source.`);
      continue;
    }
    const baseSuffix = (++sid).toString().padStart(3, "0");

    switch (e.type) {
      case "requires":
      case "violates_if_missing":
      case "escalates_to": {
        const violation =
          violationForRequires(graph, e) ??
          (targ?.type === "violation" ? targ.id : undefined);
        if (!violation) {
          errors.push(`Edge "${e.id}" lacks a compilable violation target.`);
          break;
        }
        const chk: DeterministicCheck = {
          id: `check.compile.${e.type}_${baseSuffix}`,
          name: readableName(trig, targ),
          trigger: e.from,
          required: e.to,
          severity: pickSeverity(e),
          violation,
          reason:
            trig && targ
              ? `${normalizeText(trig.label)} requires ${normalizeText(targ.label)}.`
              : "Structured policy requirement enforced.",
          source,
        };
        pushDuplicateGuard(chk);
        break;
      }
      case "forbids": {
        const violation = targ?.id ?? `violation.forbid_${e.from}`;
        const chk: DeterministicCheck = {
          id: `check.compile.forbids_${baseSuffix}`,
          name: readableName(trig, targ),
          trigger: e.from,
          forbidden: true,
          severity: pickSeverity(e),
          violation,
          reason:
            trig && targ
              ? `${normalizeText(trig.label)} forbids ${normalizeText(targ.label)}.`
              : "Structured policy prohibition enforced.",
          source,
        };
        pushDuplicateGuard(chk);
        break;
      }
      default:
        break;
    }
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  if (checks.length === 0) {
    return { ok: false, errors: ["No compilable edges produced checks."] };
  }

  return { ok: true, checks };
}

export function refundCheckFallback(): DeterministicCheck[] {
  return [northstarRefundDeterministicCheck];
}
