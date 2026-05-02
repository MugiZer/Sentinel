import type { PolicySection } from "./types";

import {
  catalogDocumentKey,
  isNorthstarCatalogDocument,
  NORTHSTAR_DOCUMENT_NAME,
} from "./documentCatalog";

export { catalogDocumentKey } from "./documentCatalog";

/** Canonical Northstar headings → stable IDs (slice 2 contract). */
const NORTHSTAR_HEADINGS: { id: string; title: string }[] = [
  { id: "refunds", title: "Refunds and Reimbursements" },
  { id: "sensitive_payment_info", title: "Sensitive Payment Information" },
  { id: "investment_advice", title: "Investment Advice" },
  { id: "competitor_pricing", title: "Competitor Pricing" },
  { id: "escalation_requirements", title: "Escalation Requirements" },
];

export const NORTHSTAR_CANONICAL_POLICY_TEXT =
  [
    "Refunds and Reimbursements",
    "",
    'Agents must not promise or guarantee refunds unless manager approval has been granted.',
    "",
    "Sensitive Payment Information",
    "",
    "Agents must not collect, store, or repeat full payment card numbers, CVV codes, PINs, or online banking passwords.",
    "",
    "Investment Advice",
    "",
    "Agents must not provide personalized investment recommendations or suitability opinions.",
    "",
    "Competitor Pricing",
    "",
    "Agents must not speculate about or disclose non-public competitor pricing.",
    "",
    "Escalation Requirements",
    "",
    "Agents must escalate to a human supervisor when uncertain or when a customer expresses legal or regulatory complaints.",
    "",
  ].join("\n");

function sectionContainsEnforceableLogic(title: string, body: string): boolean {
  const t = `${title}\n${body}`.toLowerCase();
  if (t.includes("must not") || t.includes("must ") || t.includes("escalat")) {
    return true;
  }
  if (/\b(agent|customers?|approval|refund|password|pricing|invest)\b/i.test(body)) {
    return body.trim().length > 20;
  }
  return false;
}

type HeadingMatch = { id: string; title: string; start: number; end: number; bodyStart: number };

function findNorthstarHeadingMatches(rawFull: string): HeadingMatch[] {
  const matches: HeadingMatch[] = [];
  const seen = new Set<string>();

  for (const def of NORTHSTAR_HEADINGS) {
    const esc = def.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const variants = [
      new RegExp(`(?:^|\\n)\\s*(?:#{1,3}\\s*)?${esc}\\s*(?:\\n|$)`, "i"),
      new RegExp(`(?:^|\\n)\\s*${esc}\\s*:\\s*(?:\\n|$)`, "i"),
    ];
    for (const re of variants) {
      const m = rawFull.match(re);
      if (m?.index !== undefined && !seen.has(def.id)) {
        const absStart = m.index;
        const absEnd = m.index + m[0].length;
        matches.push({
          id: def.id,
          title: def.title,
          start: absStart,
          end: absEnd,
          bodyStart: absEnd,
        });
        seen.add(def.id);
        break;
      }
    }
  }

  matches.sort((a, b) => a.start - b.start);
  return dedupeOverlapping(matches);
}

function dedupeOverlapping(sorted: HeadingMatch[]): HeadingMatch[] {
  const out: HeadingMatch[] = [];
  for (const m of sorted) {
    if (out.length && m.start < out[out.length - 1].end) {
      continue;
    }
    out.push(m);
  }
  return out;
}

/**
 * Fallback: split on markdown headings (# …) or single-line plausible titles followed by blank line.
 * Section ids are namespaced with `docKey` so multi-document demos never collide.
 */
function parseBySimpleHeadings(full: string, docKey: string): PolicySection[] {
  const trimmed = full.trim();
  if (!trimmed) {
    return [];
  }

  const mdSplits = trimmed.split(/\n(?=#{1,3}\s+)/);
  if (mdSplits.length > 1) {
    const out: PolicySection[] = [];
    let idx = 0;
    for (const chunk of mdSplits) {
      const lines = chunk.trim().split("\n");
      const first = lines[0]?.replace(/^#+\s*/, "").trim() ?? "Section";
      const body = lines.slice(1).join("\n").trim();
      idx += 1;
      const id = `${docKey}__section_${slugify(first, idx)}`;
      const text = `${first}\n\n${body}`.trim();
      out.push({
        id,
        title: first,
        text,
        containsPolicyLogic: sectionContainsEnforceableLogic(first, body),
        processed: false,
      });
    }
    return out;
  }

  const blocks = trimmed.split(/\n\s*\n+/);
  const sections: PolicySection[] = [];
  let pendingTitle: string | null = null;
  let pendingBody: string[] = [];

  const flush = (titleFallback: string) => {
    const title = pendingTitle ?? titleFallback;
    const body = pendingBody.join("\n").trim();
    if (!title && !body) return;
    const sid = `${docKey}__section_${slugify(title || "block", sections.length + 1)}`;
    const textBlock = `${title}\n\n${body}`.trim();
    sections.push({
      id: sid,
      title: title || "Policy",
      text: textBlock || body,
      containsPolicyLogic: sectionContainsEnforceableLogic(title, body),
      processed: false,
    });
    pendingTitle = null;
    pendingBody = [];
  };

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim());
    const joined = lines.join("\n").trim();
    if (!joined) continue;

    const firstLine = lines[0];
    const rest = lines.slice(1).join("\n").trim();

    const looksLikeTitle =
      firstLine.length > 3 &&
      firstLine.length <= 120 &&
      !/[.!?]$/.test(firstLine) &&
      (rest.length > 0 || lines.length === 1);

    if (looksLikeTitle && !pendingTitle && rest.length > 0) {
      flush("Policy");
      pendingTitle = firstLine;
      pendingBody = rest ? [rest] : [];
      continue;
    }

    if (pendingTitle !== null) {
      pendingBody.push(joined);
    } else if (looksLikeTitle && rest.length === 0) {
      pendingTitle = firstLine;
    } else {
      pendingBody.push(joined);
    }
  }

  flush("Full document");
  return sections.filter((s) => s.text.trim().length > 0);
}

function slugify(raw: string, salt: number): string {
  const base = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
  return `${base || "anon"}_${salt}`;
}

/**
 * Primary entry: When `documentName` matches the Northstar catalog, stable slice ids apply.
 * For other documents, identical heading labels still parse but ids are namespaced with a doc key.
 */
export function parsePolicy(documentName: string, text: string): PolicySection[] {
  const full = text.replace(/\r\n/g, "\n").trim();

  const docKey = catalogDocumentKey(documentName);
  const northstarCatalog = isNorthstarCatalogDocument(documentName);

  const headingMatches = findNorthstarHeadingMatches(full);

  if (headingMatches.length > 0) {
    const sections: PolicySection[] = [];
    for (let i = 0; i < headingMatches.length; i++) {
      const hm = headingMatches[i]!;
      const next = headingMatches[i + 1];
      const sliceRaw = full.slice(hm.bodyStart, next?.start ?? full.length).trim();
      const sectionText = `${hm.title}\n\n${sliceRaw}`.trim();
      const stableId = northstarCatalog ? hm.id : `${docKey}__${hm.id}`;
      sections.push({
        id: stableId,
        title: hm.title,
        text: sectionText || hm.title,
        containsPolicyLogic: sectionContainsEnforceableLogic(hm.title, sliceRaw),
        processed: false,
      });
    }
    return sections;
  }

  return parseBySimpleHeadings(full, docKey);
}

/** Cached demo compile: canonical Northstar text under the canonical document name. */
export function getNorthstarCachedDemoSections(): PolicySection[] {
  return parsePolicy(NORTHSTAR_DOCUMENT_NAME, NORTHSTAR_CANONICAL_POLICY_TEXT);
}
