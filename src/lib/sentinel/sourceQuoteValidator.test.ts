import { describe, expect, it } from "vitest";

import type { PolicySection, SourceQuote } from "./types";

import { validateSourceQuote } from "./sourceQuoteValidator";

const refundsSection: PolicySection = {
  id: "refunds",
  title: "Refunds and Reimbursements",
  text: "Refunds and Reimbursements\n\nAgents must not promise or guarantee refunds unless manager approval has been granted.",
  containsPolicyLogic: true,
  processed: false,
};

describe("sourceQuoteValidator", () => {
  it("accepts exact quotes", () => {
    const source: SourceQuote = {
      document: "Demo",
      section: "Refunds and Reimbursements",
      quote: "Agents must not promise or guarantee refunds unless manager approval has been granted.",
    };
    expect(validateSourceQuote([refundsSection], source)).toEqual({ ok: true });
  });

  it("matches via section id", () => {
    const source: SourceQuote = {
      document: "Demo",
      section: "refunds",
      quote: "Agents must not promise or guarantee refunds unless manager approval has been granted.",
    };
    expect(validateSourceQuote([refundsSection], source)).toEqual({ ok: true });
  });

  it("rejects hallucinated quotes", () => {
    const source: SourceQuote = {
      document: "Demo",
      section: "Refunds and Reimbursements",
      quote: "This sentence does not exist in the section body.",
    };
    const res = validateSourceQuote([refundsSection], source);
    expect(res.ok).toBe(false);
  });
});
