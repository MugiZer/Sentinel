import { describe, expect, it } from "vitest";

import {
  northstarDemoGraph,
  northstarRefundPolicyQuote,
} from "./fixtures";
import { validatePolicyGraphAndSources } from "./graphValidator";
import { catalogDocumentKey, NORTHSTAR_DOCUMENT_NAME } from "./documentCatalog";
import type { PolicyGraph, PolicySection } from "./types";

const refundSection: PolicySection = {
  id: "refunds",
  title: "Refunds and Reimbursements",
  text: northstarRefundPolicyQuote.quote,
  containsPolicyLogic: true,
  processed: false,
};

describe("validatePolicyGraphAndSources", () => {
  it("accepts the fixture graph", () => {
    expect(validatePolicyGraphAndSources(northstarDemoGraph, [refundSection]).ok).toBe(true);
  });

  it("supports strict wired node quotes mode for the demo fixtures", () => {
    expect(
      validatePolicyGraphAndSources(northstarDemoGraph, [refundSection], {
        strictNodeQuotes: true,
      }).ok,
    ).toBe(true);
  });

  it("flags strict violations when wired nodes omit node-level citations", () => {
    const graph: PolicyGraph = {
      nodes: [
        { id: "action.fake", type: "action", label: "Act" },
        { id: "condition.fake", type: "condition", label: "Cond" },
        { id: "vio.fake", type: "violation", label: "Vio" },
      ],
      edges: [
        {
          id: "edge.fake",
          from: "action.fake",
          to: "condition.fake",
          type: "requires",
          source: northstarRefundPolicyQuote,
        },
      ],
    };

    expect(validatePolicyGraphAndSources(graph, [refundSection]).ok).toBe(true);
    const strict = validatePolicyGraphAndSources(graph, [refundSection], {
      strictNodeQuotes: true,
    });
    expect(strict.ok).toBe(false);
    expect(strict.ok ? [] : strict.errors.join(" ").toLowerCase()).toContain("strict quotes");
  });
});

describe("deterministic parser catalog alignment regression", () => {
  it("keeps catalog keys stable", () => {
    expect(catalogDocumentKey(NORTHSTAR_DOCUMENT_NAME)).toBeTruthy();
  });
});
