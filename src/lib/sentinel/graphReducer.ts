import type {
  GraphOperation,
  PolicyEdge,
  PolicyGraph,
  PolicyNode,
  PolicySection,
} from "./types";

const ALLOWED = new Set<GraphOperation["type"]>([
  "ADD_NODE",
  "ADD_EDGE",
  "ATTACH_SOURCE",
  "MARK_SECTION_PROCESSED",
  "MERGE_NODES",
]);

function cloneGraph(g: PolicyGraph): PolicyGraph {
  return {
    nodes: g.nodes.map((n) => ({ ...n, source: n.source ? { ...n.source } : undefined })),
    edges: g.edges.map((e) => ({ ...e, source: e.source ? { ...e.source } : undefined })),
  };
}

function nodeIndex(nodes: PolicyNode[], id: string): number {
  return nodes.findIndex((n) => n.id === id);
}

function edgeIndex(edges: PolicyEdge[], id: string): number {
  return edges.findIndex((e) => e.id === id);
}

/**
 * Applies candidate graph operations deterministically without activation semantics.
 * Unknown operation types are ignored. Duplicate IDs are ignored safely.
 */
export function applyGraphOperations(
  baseGraph: PolicyGraph,
  sectionsInput: PolicySection[],
  rawOperations: unknown[],
): {
  candidateGraph: PolicyGraph;
  sections: PolicySection[];
  ignored: { index: number; reason: string }[];
} {
  const candidateGraph = cloneGraph(baseGraph);
  const sections = sectionsInput.map((s) => ({ ...s }));
  const ignored: { index: number; reason: string }[] = [];

  for (let idx = 0; idx < rawOperations.length; idx++) {
    const opUnknown = rawOperations[idx];

    if (!opUnknown || typeof opUnknown !== "object") {
      ignored.push({ index: idx, reason: "Operation is not an object." });
      continue;
    }

    const op = opUnknown as Partial<GraphOperation> & { type?: string };

    if (!op.type || !ALLOWED.has(op.type as GraphOperation["type"])) {
      ignored.push({ index: idx, reason: `Unknown or unsupported operation type: "${op.type ?? ""}".` });
      continue;
    }

    try {
      switch (op.type) {
        case "ADD_NODE": {
          const node = op.node as PolicyNode | undefined;
          if (!node?.id || !node.type || !node.label) {
            ignored.push({ index: idx, reason: "ADD_NODE missing id, type, or label." });
            break;
          }
          if (nodeIndex(candidateGraph.nodes, node.id) >= 0) {
            ignored.push({ index: idx, reason: `Duplicate node id ignored: "${node.id}".` });
            break;
          }
          candidateGraph.nodes.push({
            ...node,
            source: node.source ? { ...node.source } : undefined,
          });
          break;
        }
        case "ADD_EDGE": {
          const edge = op.edge as PolicyEdge | undefined;
          if (!edge?.id || !edge.from || !edge.to || !edge.type) {
            ignored.push({ index: idx, reason: "ADD_EDGE missing id, from, to, or type." });
            break;
          }
          if (edgeIndex(candidateGraph.edges, edge.id) >= 0) {
            ignored.push({ index: idx, reason: `Duplicate edge id ignored: "${edge.id}".` });
            break;
          }
          candidateGraph.edges.push({
            ...edge,
            source: edge.source ? { ...edge.source } : undefined,
          });
          break;
        }
        case "ATTACH_SOURCE": {
          const ok = op.targetKind === "node" || op.targetKind === "edge";
          if (!ok || !op.targetId || !op.source) {
            ignored.push({ index: idx, reason: "ATTACH_SOURCE missing fields." });
            break;
          }
          if (op.targetKind === "node") {
            const ni = nodeIndex(candidateGraph.nodes, op.targetId);
            if (ni < 0) {
              ignored.push({ index: idx, reason: `ATTACH_SOURCE node not found: "${op.targetId}".` });
              break;
            }
            candidateGraph.nodes[ni] = {
              ...candidateGraph.nodes[ni]!,
              source: { ...op.source },
            };
          } else {
            const ei = edgeIndex(candidateGraph.edges, op.targetId);
            if (ei < 0) {
              ignored.push({ index: idx, reason: `ATTACH_SOURCE edge not found: "${op.targetId}".` });
              break;
            }
            candidateGraph.edges[ei] = {
              ...candidateGraph.edges[ei]!,
              source: { ...op.source },
            };
          }
          break;
        }
        case "MARK_SECTION_PROCESSED": {
          const sid = op.sectionId;
          if (!sid || typeof sid !== "string") {
            ignored.push({ index: idx, reason: "MARK_SECTION_PROCESSED missing sectionId." });
            break;
          }
          const si = sections.findIndex((s) => s.id === sid);
          if (si < 0) {
            ignored.push({ index: idx, reason: `Section not found: "${sid}".` });
            break;
          }
          sections[si] = { ...sections[si]!, processed: true };
          break;
        }
        case "MERGE_NODES": {
          const primaryId = op.primaryId;
          const mergeIds = op.mergeIds;
          if (
            typeof primaryId !== "string" ||
            !primaryId.trim() ||
            !Array.isArray(mergeIds) ||
            mergeIds.length === 0
          ) {
            ignored.push({ index: idx, reason: "MERGE_NODES invalid primaryId or mergeIds." });
            break;
          }
          if (!mergeIds.every((m) => typeof m === "string")) {
            ignored.push({ index: idx, reason: "mergeIds must all be strings." });
            break;
          }
          if (nodeIndex(candidateGraph.nodes, primaryId) < 0) {
            ignored.push({ index: idx, reason: `MERGE_NODES primary "${primaryId}" not found.` });
            break;
          }

          const toRemove = [...new Set(mergeIds)].filter((id) => id && id !== primaryId);

          candidateGraph.edges = candidateGraph.edges.map((e) => {
            let from = e.from;
            let to = e.to;
            if (toRemove.includes(from)) from = primaryId;
            if (toRemove.includes(to)) to = primaryId;
            return { ...e, from, to };
          });

          candidateGraph.edges = candidateGraph.edges.filter((e) => e.from !== e.to);

          const byEdgeId = new Map<string, PolicyEdge>();
          for (const e of candidateGraph.edges) {
            if (!byEdgeId.has(e.id)) {
              byEdgeId.set(e.id, e);
            }
          }
          candidateGraph.edges = [...byEdgeId.values()];

          const seenTuple = new Set<string>();
          candidateGraph.edges = candidateGraph.edges.filter((e) => {
            const key = `${e.from}|${e.to}|${e.type}`;
            if (seenTuple.has(key)) return false;
            seenTuple.add(key);
            return true;
          });

          candidateGraph.nodes = candidateGraph.nodes.filter((n) => !toRemove.includes(n.id));

          break;
        }
        default:
          ignored.push({ index: idx, reason: "Unhandled operation branch." });
      }
    } catch (_e) {
      ignored.push({ index: idx, reason: "Operation threw during apply (ignored)." });
    }
  }

  return { candidateGraph, sections, ignored };
}
