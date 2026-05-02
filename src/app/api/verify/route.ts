import { NextResponse } from "next/server";
import { addAuditEvent } from "@/lib/sentinel/auditStore";
import { evaluateChecks, worstFailureSeverity } from "@/lib/sentinel/checkEvaluator";
import {
  extractRuntimeFacts,
  factKeysFromChecks,
} from "@/lib/sentinel/factExtractor";
import { getDemoActiveChecks } from "@/lib/sentinel/fixtures";
import type {
  AuditEvent,
  DeterministicCheck,
  VerifyRequest,
  VerifyResponse,
} from "@/lib/sentinel/types";

const BLOCKED_REFUND_FINAL =
  "I can help submit a refund request, but manager approval is required before I can confirm it.";

const BLOCKED_PAYMENT_FINAL =
  "I cannot collect full card numbers, CVV/CVC codes, PINs, or similar payment secrets in chat. I can help you finish payment through our secure flows or escalate you to human support instead.";

const BLOCKED_PAYMENT_AND_REFUND_FINAL =
  "I cannot approve refunds outside the documented manager-review path, and I also cannot gather card-security details inside chat. I will route this to secure payment options and escalation so the right banker can finish this safely.";

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function blockedFallbackCopy(failures: { checkId: string; violation?: string }[]): string {
  const hitRefund = failures.some(
    (f) =>
      f.checkId === "check.refund_requires_approval" ||
      f.violation === "violation.refund_without_approval",
  );
  const hitPayment = failures.some(
    (f) =>
      f.checkId === "check.no_payment_credentials" ||
      f.violation === "violation.payment_credentials_requested",
  );

  if (hitRefund && hitPayment) {
    return BLOCKED_PAYMENT_AND_REFUND_FINAL;
  }
  if (hitPayment) {
    return BLOCKED_PAYMENT_FINAL;
  }
  return BLOCKED_REFUND_FINAL;
}

function validateChecksArray(
  raw: unknown,
): { ok: true; checks: DeterministicCheck[] } | { ok: false; message: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, message: "`checks` must be an array when provided." };
  }
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i] as Partial<DeterministicCheck>;
    if (!isNonEmptyString(c.id)) {
      return { ok: false, message: `checks[${i}].id is required.` };
    }
    if (!isNonEmptyString(c.trigger)) {
      return { ok: false, message: `checks[${i}].trigger is required.` };
    }
    if (!isNonEmptyString(c.violation)) {
      return { ok: false, message: `checks[${i}].violation is required.` };
    }
    if (!isNonEmptyString(c.reason)) {
      return { ok: false, message: `checks[${i}].reason is required.` };
    }
    if (!c.source || !isNonEmptyString(c.source.quote)) {
      return {
        ok: false,
        message: `checks[${i}].source.quote is required (no active check without source quote).`,
      };
    }
  }
  return { ok: true, checks: raw as DeterministicCheck[] };
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const b = body as Partial<VerifyRequest>;
  if (!isNonEmptyString(b.agentName)) {
    return NextResponse.json(
      { error: "`agentName` is required." },
      { status: 400 },
    );
  }
  if (!isNonEmptyString(b.userMessage)) {
    return NextResponse.json(
      { error: "`userMessage` is required." },
      { status: 400 },
    );
  }
  if (!isNonEmptyString(b.proposedResponse)) {
    return NextResponse.json(
      { error: "`proposedResponse` is required." },
      { status: 400 },
    );
  }

  let checks: DeterministicCheck[];
  if (b.checks !== undefined) {
    const validated = validateChecksArray(b.checks);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.message }, { status: 400 });
    }
    checks = validated.checks;
  } else {
    checks = getDemoActiveChecks();
  }

  const keys = factKeysFromChecks(checks);
  const facts = extractRuntimeFacts(b.proposedResponse!, keys);
  const checkResults = evaluateChecks(checks, facts);
  const failures = checkResults.filter((r) => !r.passed);

  const detectedFacts = Object.entries(facts)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const missingFacts = [
    ...new Set(
      failures.map((f) => f.missingFact).filter((m): m is string => !!m),
    ),
  ];

  const auditBase = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    agentName: b.agentName!.trim(),
    userMessage: b.userMessage!.trim(),
    proposedResponse: b.proposedResponse!.trim(),
  } satisfies Pick<
    AuditEvent,
    | "id"
    | "timestamp"
    | "agentName"
    | "userMessage"
    | "proposedResponse"
  >;

  if (failures.length === 0) {
    const auditEvent: AuditEvent = {
      ...auditBase,
      finalResponse: b.proposedResponse!.trim(),
      result: "allowed",
      detectedFacts,
      missingFacts: missingFacts.length ? missingFacts : undefined,
      violations: [],
      reason: "All active checks passed.",
    };
    addAuditEvent(auditEvent);

    const res: VerifyResponse = {
      result: "allowed",
      finalResponse: b.proposedResponse!.trim(),
      facts,
      violations: [],
      reason: "All active checks passed.",
      auditEvent,
    };
    return NextResponse.json(res);
  }

  const failedChecks = failures.map((f) => ({
    checkId: f.checkId,
    reason: f.reason ?? "",
    violation: f.violation,
  }));

  const worst = worstFailureSeverity(failures);
  const primaryBlock = failures.find((f) => f.result === "block");
  const primaryWarn = failures.find((f) => f.result === "warn");
  const primary = primaryBlock ?? primaryWarn ?? failures[0];

  const violations = [
    ...new Set(failures.map((f) => f.violation).filter((v): v is string => !!v)),
  ];

  const isBlocked = worst === "block";
  const result: VerifyResponse["result"] = isBlocked ? "blocked" : "warned";
  const finalResponse = isBlocked
    ? blockedFallbackCopy(failures.map((f) => ({ checkId: f.checkId, violation: f.violation })))
    : b.proposedResponse!.trim();

  const auditEvent: AuditEvent = {
    ...auditBase,
    finalResponse,
    result,
    detectedFacts,
    missingFacts: missingFacts.length ? missingFacts : undefined,
    violations,
    reason: primary.reason ?? "",
    source: primary.source,
  };
  addAuditEvent(auditEvent);

  const res: VerifyResponse = {
    result,
    finalResponse,
    facts,
    violations,
    reason: primary.reason,
    failedChecks,
    auditEvent,
  };
  return NextResponse.json(res);
}
