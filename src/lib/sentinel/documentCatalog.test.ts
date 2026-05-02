import { describe, expect, it } from "vitest";

import {
  apiDocumentIdFromName,
  catalogDocumentKey,
  isNorthstarCatalogDocument,
  NORTHSTAR_DOCUMENT_NAME,
} from "./documentCatalog";

describe("documentCatalog", () => {
  it("exposes canonical Northstar title", () => {
    expect(NORTHSTAR_DOCUMENT_NAME.length).toBeGreaterThan(5);
    expect(isNorthstarCatalogDocument(NORTHSTAR_DOCUMENT_NAME)).toBe(true);
  });

  it("computes deterministic API document ids", () => {
    expect(apiDocumentIdFromName(" Hello   World Corp ")).toBe("doc.hello.world.corp");
  });

  it("computes deterministic underscore keys", () => {
    expect(catalogDocumentKey("Acme Banking Co")).toBe("acme_banking_co");
  });

  it("differentiates catalogs by title casing and spacing", () => {
    expect(
      isNorthstarCatalogDocument(`  ${NORTHSTAR_DOCUMENT_NAME.replace("AI", "ai").toUpperCase()} `),
    ).toBe(true);
    expect(isNorthstarCatalogDocument("Riverdale Credit Handbook")).toBe(false);
  });
});
