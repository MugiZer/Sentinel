/**
 * Single source of truth for catalog titles and deterministic document keys used across
 * compile IDs, slugged API `documentId` values, and parser section namespaces.
 */

export const NORTHSTAR_DOCUMENT_NAME =
  "Northstar Bank AI Agent Compliance Manual" as const;

export function normalizeCatalogTitle(name: string): string {
  return name.replace(/\s+/g, " ").trim().toLowerCase();
}

export function isNorthstarCatalogDocument(documentName: string): boolean {
  return (
    normalizeCatalogTitle(documentName) ===
    normalizeCatalogTitle(NORTHSTAR_DOCUMENT_NAME)
  );
}

/** Underscore slug for embedding in section IDs (`acme_bank__refunds`). */
export function catalogDocumentKey(documentName: string): string {
  return (
    documentName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "document"
  );
}

/** Dotted slug for API `documentId` (`doc.northstar.bank...`). */
export function apiDocumentIdFromName(documentName: string): string {
  const slug =
    documentName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") || "document";

  return `doc.${slug}`;
}
