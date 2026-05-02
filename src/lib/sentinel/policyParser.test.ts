import { describe, expect, it } from "vitest";

import {
  catalogDocumentKey,
  NORTHSTAR_DOCUMENT_NAME,
} from "./documentCatalog";
import {
  getNorthstarCachedDemoSections,
  parsePolicy,
} from "./policyParser";

describe("policyParser", () => {
  it("parses canonical Northstar manual with stable section ids", () => {
    const sections = parsePolicy(
      NORTHSTAR_DOCUMENT_NAME,
      "Refunds and Reimbursements\n\nPay attention.\n\nInvestment Advice\n\nNo tips.",
    );
    const ids = sections.map((s) => s.id);
    expect(ids).toContain("refunds");
    expect(ids).toContain("investment_advice");
  });

  it("namespaces ids for non-Northstar catalog titles", () => {
    const docKey = catalogDocumentKey("Riverdale Credit Handbook");
    const sections = parsePolicy(
      "Riverdale Credit Handbook",
      "Refunds and Reimbursements\n\nPay attention.\n\nInvestment Advice\n\nNo tips.",
    );
    expect(sections.map((s) => s.id)).toEqual(
      expect.arrayContaining([`${docKey}__refunds`, `${docKey}__investment_advice`]),
    );
  });

  it("produces five cached sections for the canonical demo bundle", () => {
    const sections = getNorthstarCachedDemoSections();
    expect(sections).toHaveLength(5);
    expect(sections[0]?.id).toBe("refunds");
  });
});
