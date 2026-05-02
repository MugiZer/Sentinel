import type { PolicyEdge, PolicyGraph, PolicyNode, PolicySection } from "./types";

import {
  normalizeText,
  validateSourceQuote,
} from "./sourceQuoteValidator";

const NODE_TYPES = new Set<PolicyNode["type"]>([
  "action",
  "condition",
  "violation",
  "exception",
  "escalation",
]);

const EDGE_TYPES = new Set<PolicyEdge["type"]>([
  "requires",
  "forbids",
  "violates_if_missing",
  "escalates_to",
  "except_when",
]);

/** Nodes that participate in at least one edge (compile-relevant subgraph). */
function wiredNodeIds(graph: PolicyGraph): Set<string> {
  const ids = new Set<string>();
  for (const e of graph.edges) {
    ids.add(e.from);
    ids.add(e.to);
  }
  return ids;
}

export type GraphValidatorResult =
  | { ok: true; graph: PolicyGraph }
  | { ok: false; errors: string[] };

/**
 * Structural validation plus source-quote presence/substring validity for active graph elements.
 */
export function validatePolicyGraphAndSources(
  graph: PolicyGraph,
  sections: PolicySection[],
): GraphValidatorResult {
  const errors: string[] = [];

  const nodeIds = new Set<string>();

  if (!graph.nodes || !graph.edges) {
    return { ok: false, errors: ["Graph missing nodes or edges arrays."] };
  }

  const duplicateTuple = new Map<string, number>();
  for (const e of graph.edges) {
    const k = `${e.from}|${e.to}|${e.type}`;
    duplicateTuple.set(k, (duplicateTuple.get(k) ?? 0) + 1);
  }
  for (const [tuple, count] of duplicateTuple) {
    if (count > 1) errors.push(`Parallel duplicate edges for tuple "${tuple}".`);
  }

  for (let i = 0; i < graph.nodes.length; i++) {
    const n = graph.nodes[i];
    if (!n) {
      errors.push(`Node at index ${i} is nullish.`);
      continue;
    }
    if (!n.id?.trim()) errors.push(`Node[${i}] missing id.`);
    if (nodeIds.has(n.id)) {
      errors.push(`Duplicate node id: "${n.id}".`);
    } else if (n.id) {
      nodeIds.add(n.id);
    }
    if (!n.type) {
      errors.push(`Node "${n.id}" missing type.`);
    } else if (!NODE_TYPES.has(n.type)) {
      errors.push(`Node "${n.id}" has invalid type "${n.type}".`);
    }
    if (!n.label?.trim()) {
      errors.push(`Node "${n.id}" missing label.`);
    }
  }

  const edgeIds = new Set<string>();
  for (let i = 0; i < graph.edges.length; i++) {
    const e = graph.edges[i];
    if (!e) {
      errors.push(`Edge at index ${i} is nullish.`);
      continue;
    }
    if (!e.id?.trim()) errors.push(`Edge[${i}] missing id.`);
    if (edgeIds.has(e.id)) {
      errors.push(`Duplicate edge id: "${e.id}".`);
    } else if (e.id) {
      edgeIds.add(e.id);
    }

    if (!e.from?.trim()) errors.push(`Edge "${e.id}" missing from.`);
    if (!e.to?.trim()) errors.push(`Edge "${e.id}" missing to.`);

    if (!e.type) errors.push(`Edge "${e.id}" missing type.`);
    else if (!EDGE_TYPES.has(e.type)) {
      errors.push(`Edge "${e.id}" has invalid type "${e.type}".`);
    }

    if (e.from && nodeIds.has(e.from) === false && e.from.trim()) {
      errors.push(`Edge "${e.id}" references unknown from node "${e.from}".`);
    }
    if (e.to && nodeIds.has(e.to) === false && e.to.trim()) {
      errors.push(`Edge "${e.id}" references unknown to node "${e.to}".`);
    }
  }

  const wired = wiredNodeIds(graph);
  for (const nid of wired) {
    if (!nodeIds.has(nid)) {
      errors.push(`Edge endpoint references unknown node "${nid}".`);
    }
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  for (const e of graph.edges) {
    const src =
      e.source ??
      graph.nodes.find((n) => n.id === e.from)?.source ??
      graph.nodes.find((n) => n.id === e.to)?.source;
    if (!src?.quote?.trim()) {
      errors.push(`Edge "${e.id}" (${e.from}→${e.to}) has no usable source quote on edge or endpoints.`);
      continue;
    }

    const validated = validateSourceQuote(sections, src);
    if (!validated.ok) {
      errors.push(`Edge "${e.id}" quote invalid: ${validated.reason}`);
    }
  }

  for (const n of graph.nodes) {
    if (!wired.has(n.id) || !n.source) continue;
    const validated = validateSourceQuote(sections, n.source);
    if (!validated.ok) {
      const normQ = normalizeText(n.source.quote).slice(0, 120);
      errors.push(`Active node "${n.id}" quote invalid: ${validated.reason} (quote~"${normQ}")`);
    }
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  return { ok: true, graph };
}
