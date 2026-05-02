import { describe, expect, it } from "vitest";

import { compileDeterministicChecksFromGraph } from "./checkCompiler";
import { northstarDemoGraph } from "./fixtures";

describe("compileDeterministicChecksFromGraph", () => {
  it("emits requires checks for the fixture graph", () => {
    const compiled = compileDeterministicChecksFromGraph(northstarDemoGraph);
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;

    const ids = compiled.checks.map((c) => c.id);
    expect(ids.some((id) => id.startsWith("check.compile"))).toBe(true);

    const refundish = compiled.checks.find((c) =>
      c.reason.toLowerCase().includes("refund"),
    );
    expect(refundish?.trigger).toBe("action.promise_refund");
    expect(refundish?.required).toBe("condition.manager_approval");
  });
});
