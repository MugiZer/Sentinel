import type { PolicySection, SourceQuote } from "./types";

/** Collapse whitespace for tolerant matching (still substring-based). */
export function normalizeText(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

/** Match section reference by stable id first, then by title substring. */
export function findSectionForSource(
  sections: PolicySection[],
  source: SourceQuote,
): PolicySection | undefined {
  const byId = sections.find((s) => s.id === source.section);
  if (byId) return byId;

  const normSec = normalizeText(source.section).toLowerCase();
  return sections.find(
    (s) =>
      normalizeText(s.title).toLowerCase() === normSec ||
      normalizeText(`${s.title} ${s.text}`).toLowerCase().includes(normSec),
  );
}

export function sourceQuoteMatchesSection(section: PolicySection, quote: string): boolean {
  const raw = quote;
  const body = section.text;
  if (!raw || !body) return false;

  if (body.includes(raw)) return true;

  const nq = normalizeText(raw);
  const nb = normalizeText(body);
  if (!nq.length) return false;
  return nb.includes(nq);
}

export type SourceQuoteValidation = { ok: true } | { ok: false; reason: string };

/**
 * Validates that `quote` exists in the referenced section text (exact, then whitespace-normalized).
 */
export function validateSourceQuote(
  sections: PolicySection[],
  source: SourceQuote | undefined | null,
): SourceQuoteValidation {
  if (!source) {
    return { ok: false, reason: "Missing source quote object." };
  }
  if (!source.quote?.trim()) {
    return { ok: false, reason: "Source quote text is empty." };
  }

  const section = findSectionForSource(sections, source);
  if (!section) {
    return {
      ok: false,
      reason: `No policy section matched source.section "${source.section}".`,
    };
  }

  if (!sourceQuoteMatchesSection(section, source.quote.trim())) {
    return {
      ok: false,
      reason: `Quote not found in section "${section.title}".`,
    };
  }

  return { ok: true };
}
