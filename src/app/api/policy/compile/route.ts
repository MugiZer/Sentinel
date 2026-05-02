import { NextResponse } from "next/server";



import { compileDeterministicChecksFromGraph } from "@/lib/sentinel/checkCompiler";

import { apiDocumentIdFromName, NORTHSTAR_DOCUMENT_NAME } from "@/lib/sentinel/documentCatalog";

import { getDemoActiveChecks, northstarDemoGraph } from "@/lib/sentinel/fixtures";

import { applyGraphOperations } from "@/lib/sentinel/graphReducer";

import { validatePolicyGraphAndSources } from "@/lib/sentinel/graphValidator";

import { getNorthstarCachedDemoSections, parsePolicy } from "@/lib/sentinel/policyParser";

import type {

  CompilePolicyRequest,

  CompilePolicyResponse,

  PolicyGraph,

  PolicySection,

} from "@/lib/sentinel/types";



/** Back-compat alias for consumers expecting the richer compile export name from this route module. */

export type CompileApiResponseBody = CompilePolicyResponse;



const EMPTY_GRAPH: PolicyGraph = { nodes: [], edges: [] };



function readDebugFlag(req: Request): boolean {

  try {

    return new URL(req.url).searchParams.get("debug") === "1";

  } catch {

    return false;

  }

}



function shouldAttachCompileDiagnostics(generatedBy: string, debug: boolean): boolean {

  return debug || generatedBy.includes("sentinel-fallback");

}



function attachCompileDiagnostics(

  body: CompilePolicyResponse,

  diag: { validationErrors: string[]; compilationErrors: string[] },

  debug: boolean,

): CompilePolicyResponse {

  if (!shouldAttachCompileDiagnostics(body.generatedBy, debug)) {

    return body;

  }

  return {

    ...body,

    validationErrors: diag.validationErrors,

    compilationErrors: diag.compilationErrors,

  };

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

    documentId: apiDocumentIdFromName(documentName),

    sections: getNorthstarCachedDemoSections(),

    graph: northstarDemoGraph,

    checks: getDemoActiveChecks(),

    generatedBy,

  };

}



export async function POST(

  req: Request,

): Promise<NextResponse<CompileApiResponseBody | { error: string }>> {

  const debug = readDebugFlag(req);



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



  const strictQuotes = incoming.strictQuotes === true;



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



    const validation = validatePolicyGraphAndSources(candidateGraph, reducedSections, {

      strictNodeQuotes: strictQuotes,

    });



    if (!validation.ok) {

      const fallback = cachedCompileResponse(

        documentName,

        "sentinel-fallback:candidate-validation",

      );

      return NextResponse.json(

        attachCompileDiagnostics(

          fallback,

          { validationErrors: validation.errors, compilationErrors: [] },

          debug,

        ),

      );

    }



    const compilation = compileDeterministicChecksFromGraph(candidateGraph);



    if (!compilation.ok || compilation.checks.length === 0) {

      const fallback = cachedCompileResponse(

        documentName,

        "sentinel-fallback:compile-errors",

      );

      const compileErrs = !compilation.ok

        ? compilation.errors

        : ["Compiler produced zero active checks from the validated graph."];



      return NextResponse.json(

        attachCompileDiagnostics(

          fallback,

          { validationErrors: [], compilationErrors: compileErrs },

          debug,

        ),

      );

    }



    const checks = compilation.checks.filter((c) => String(c.source?.quote ?? "").trim().length > 0);

    if (!checks.length) {

      const fallback = cachedCompileResponse(

        documentName,

        "sentinel-fallback:missing-quotes-after-compile",

      );

      return NextResponse.json(

        attachCompileDiagnostics(

          fallback,

          {

            validationErrors: [],

            compilationErrors: [

              "Compiled checks were discarded because no entry retained a non-empty `source.quote` after filtering.",

            ],

          },

          debug,

        ),

      );

    }



    const successBody: CompilePolicyResponse = {

      documentId: apiDocumentIdFromName(documentName),

      sections: reducedSections,

      graph: candidateGraph,

      checks,

      generatedBy: "sentinel-path:validated-candidate-compile",

    };



    return NextResponse.json(

      attachCompileDiagnostics(successBody, { validationErrors: [], compilationErrors: [] }, debug),

    );

  }



  if (parsedFromText.length > 0) {

    const successBody: CompilePolicyResponse = {

      documentId: apiDocumentIdFromName(documentName),

      sections: parsedFromText,

      graph: northstarDemoGraph,

      checks: getDemoActiveChecks(),

      generatedBy: "sentinel-path:text-with-demo-graph",

    };

    return NextResponse.json(

      attachCompileDiagnostics(successBody, { validationErrors: [], compilationErrors: [] }, debug),

    );

  }



  const minimal = cachedCompileResponse(

    documentName,

    "sentinel-path:minimal-body-demo",

  );

  return NextResponse.json(

    attachCompileDiagnostics(minimal, { validationErrors: [], compilationErrors: [] }, debug),

  );

}


