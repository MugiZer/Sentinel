import { describe, expect, it } from "vitest";

import { applyGraphOperations } from "./graphReducer";
import { northstarDemoGraphNodes, northstarRefundPolicyQuote } from "./fixtures";
import type { PolicyEdge, PolicyGraph, PolicySection } from "./types";

const emptyGraph: PolicyGraph = { nodes: [], edges: [] };

describe("graphReducer", () => {
  it("applies sequential adds and rejects duplicate ids", () => {
    const node = northstarDemoGraphNodes[0]!;
    const { candidateGraph } = applyGraphOperations(emptyGraph, [], [
      { type: "ADD_NODE", node },
      { type: "ADD_NODE", node },
    ]);
    expect(candidateGraph.nodes).toHaveLength(1);
  });

  it("rewires edges during merges", () => {
    const a = { ...northstarDemoGraphNodes[0]!, id: "merge.a", source: northstarRefundPolicyQuote };
    const b = { ...northstarDemoGraphNodes[1]!, id: "merge.b", source: northstarRefundPolicyQuote };
    const edgeB: PolicyEdge = {
      id: "merge.edge",
      from: "external",
      to: "merge.b",
      type: "requires",
      source: northstarRefundPolicyQuote,
    };

    const { candidateGraph } = applyGraphOperations(
      emptyGraph,
      [],
      [
        { type: "ADD_NODE", node: a },
        { type: "ADD_NODE", node: b },
        { type: "ADD_EDGE", edge: edgeB },
        { type: "MERGE_NODES", primaryId: "merge.a", mergeIds: ["merge.b"] },
      ],
    );

    expect(candidateGraph.nodes.some((n) => n.id === "merge.b")).toBe(false);
    expect(candidateGraph.edges[0]?.to).toBe("merge.a");
  });

  it("ignores unknown operations", () => {
    const { ignored } = applyGraphOperations(emptyGraph, [], [{ type: "DELETE_UNIVERSE" }] as unknown[]);
    expect(ignored.length).toBe(1);
  });

  it("honors MARK_SECTION_PROCESSED", () => {
    const section: PolicySection = {
      id: "alpha",
      title: "Alpha",
      text: "Body",
      containsPolicyLogic: true,
      processed: false,
    };
    const { sections } = applyGraphOperations(emptyGraph, [section], [
      { type: "MARK_SECTION_PROCESSED", sectionId: "alpha" },
    ]);
    expect(sections[0]?.processed).toBe(true);
  });
});
