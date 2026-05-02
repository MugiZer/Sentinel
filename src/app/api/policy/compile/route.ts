import { NextResponse } from "next/server";

import { compileDeterministicChecksFromGraph } from "@/lib/sentinel/checkCompiler";
import {
  getDemoActiveChecks,
  northstarDemoGraph,
  NORTHSTAR_DOCUMENT_NAME,
} from "@/lib/sentinel/fixtures";
import { applyGraphOperations } from "@/lib/sentinel/graphReducer";
import { validatePolicyGraphAndSources } from "@/lib/sentinel/graphValidator";
import {
  getNorthstarCachedDemoSections,
  parsePolicy,
} from "@/lib/sentinel/policyParser";
import type {
  CompilePolicyRequest,
  CompilePolicyResponse,
  PolicyGraph,
  PolicySection,
} from "@/lib/sentinel/types";

/** Back-compat alias for consumers expecting the richer compile export name from this route module. */
export type CompileApiResponseBody = CompilePolicyResponse;

const EMPTY_GRAPH: PolicyGraph = { nodes: [], edges: [] };

function slugDocumentId(documentName: string): string {
  const slug =
    documentName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") || "document";

  return `doc.${slug}`;
}

/** Candidate overlays win when ids collide — Botpress drafts override parsed scaffolding. */
function mergeSectionsPreferCandidate(parsed: PolicySection[], candidate: PolicySection[]) {
  const map = new Map<string, PolicySection>();
  for (const s of parsed) map.set(s.id, { ...s });
  for (const s of candidate) map.set(s.id, { ...s });
  return [...map.values()];
}

function isProposalPayload(body: unknown): body is CompilePolicyRequest {
  return (
    typeof body === "object" &&
    body !== null &&
    ("candidateSections" in body || "candidateOperations" in body)
  );
}

function coerceSections(raw: unknown): PolicySection[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is PolicySection =>
      Boolean(item && typeof item === "object" && "id" in item && "text" in item),
  ) as PolicySection[];
}

function cachedCompileResponse(
  documentName: string,
  generatedBy: string,
): CompilePolicyResponse {
  return {
    documentId: slugDocumentId(documentName),
    sections: getNorthstarCachedDemoSections(),
    graph: northstarDemoGraph,
    checks: getDemoActiveChecks(),
    generatedBy,
  };
}

export async function POST(
  req: Request,
): Promise<NextResponse<CompileApiResponseBody | { error: string }>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const incoming = body as CompilePolicyRequest;

  const documentName =
    typeof incoming.documentName === "string" && incoming.documentName.trim()
      ? incoming.documentName.trim()
      : NORTHSTAR_DOCUMENT_NAME;

  const generatedStem =
    typeof incoming.generatedBy === "string" && incoming.generatedBy.trim()
      ? incoming.generatedBy.trim()
      : "sentinel-local";

  const parsedFromText =
    typeof incoming.text === "string" && incoming.text.trim().length > 0
      ? parsePolicy(documentName, incoming.text)
      : [];

  if (isProposalPayload(incoming)) {
    const operations = Array.isArray(incoming.candidateOperations)
      ? incoming.candidateOperations
      : [];

    const candidatePieces = coerceSections(incoming.candidateSections);

    const sections =
      incoming.candidateSections !== undefined || parsedFromText.length > 0
        ? mergeSectionsPreferCandidate(parsedFromText, candidatePieces)
        : candidatePieces.length > 0
          ? candidatePieces
          : [];

    const { candidateGraph, sections: reducedSections } = applyGraphOperations(
      EMPTY_GRAPH,
      sections,
      operations,
    );

    const validation = validatePolicyGraphAndSources(candidateGraph, reducedSections);

    if (!validation.ok) {
      return NextResponse.json(
        cachedCompileResponse(
          documentName,
          `${generatedStem} | sentinel-fallback:candidate-validation`,
        ),
      );
    }

    const compilation = compileDeterministicChecksFromGraph(candidateGraph);

    if (!compilation.ok || compilation.checks.length === 0) {
      return NextResponse.json(
        cachedCompileResponse(
          documentName,
          `${generatedStem} | sentinel-fallback:compile-errors`,
        ),
      );
    }

    const checks = compilation.checks.filter((c) => String(c.source?.quote ?? "").trim().length > 0);
    if (!checks.length) {
      return NextResponse.json(
        cachedCompileResponse(
          documentName,
          `${generatedStem} | sentinel-fallback:missing-quotes-after-compile`,
        ),
      );
    }

    return NextResponse.json({
      documentId: slugDocumentId(documentName),
      sections: reducedSections,
      graph: candidateGraph,
      checks,
      generatedBy: `${generatedStem} | sentinel-path:validated-candidate-compile`,
    });
  }

  if (parsedFromText.length > 0) {
    return NextResponse.json({
      documentId: slugDocumentId(documentName),
      sections: parsedFromText,
      graph: northstarDemoGraph,
      checks: getDemoActiveChecks(),
      generatedBy: `${generatedStem} | sentinel-path:text-with-demo-graph`,
    });
  }

  return NextResponse.json(
    cachedCompileResponse(
      documentName,
      `${generatedStem} | sentinel-path:minimal-body-demo`,
    ),
  );
}
