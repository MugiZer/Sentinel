import dagre from "dagre";
import type { Edge, Node } from "@xyflow/react";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 88;

export type LayoutDirection = "TB" | "LR";

/** Apply Dagre layout; returns nodes with `position` set for React Flow. */
export function layoutWithDagre(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = "TB",
): Node[] {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: 64,
    nodesep: 48,
    edgesep: 24,
    marginx: 24,
    marginy: 24,
  });

  nodes.forEach((n) => {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });
  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    const x = pos.x - NODE_WIDTH / 2;
    const y = pos.y - NODE_HEIGHT / 2;
    return { ...n, position: { x, y } };
  });
}

export const flowNodeDimensions = { width: NODE_WIDTH, height: NODE_HEIGHT };
