/** Canonical Sentinel contracts — aligned with sentinel-context/12-data-models.md */

export type SourceQuote = {
  document: string;
  section: string;
  page?: number;
  quote: string;
};

export type PolicySection = {
  id: string;
  title: string;
  page?: number;
  text: string;
  containsPolicyLogic: boolean;
  processed: boolean;
};

export type PolicyNode = {
  id: string;
  type: "action" | "condition" | "violation" | "exception" | "escalation";
  label: string;
  description?: string;
  source?: SourceQuote;
};

export type PolicyEdge = {
  id: string;
  from: string;
  to: string;
  type: "requires" | "forbids" | "violates_if_missing" | "escalates_to" | "except_when";
  source?: SourceQuote;
};

export type PolicyGraph = {
  nodes: PolicyNode[];
  edges: PolicyEdge[];
};

/** Botpress-proposed graph deltas — Sentinel applies then validates/compiles downstream. */
export type GraphOperation =
  | { type: "ADD_NODE"; node: PolicyNode }
  | { type: "ADD_EDGE"; edge: PolicyEdge }
  | { type: "ATTACH_SOURCE"; targetKind: "node" | "edge"; targetId: string; source: SourceQuote }
  | { type: "MARK_SECTION_PROCESSED"; sectionId: string }
  | { type: "MERGE_NODES"; primaryId: string; mergeIds: string[] };

export type DeterministicCheck = {
  id: string;
  name: string;
  trigger: string;
  required?: string;
  forbidden?: boolean;
  severity: "allow" | "warn" | "block";
  violation: string;
  reason: string;
  source: SourceQuote;
};

export type RuntimeFacts = Record<string, boolean>;

export type CheckResult = {
  passed: boolean;
  result: "allow" | "warn" | "block";
  checkId: string;
  violation?: string;
  reason?: string;
  source?: SourceQuote;
  missingFact?: string;
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  agentName: string;
  userMessage: string;
  proposedResponse: string;
  finalResponse?: string;
  result: "allowed" | "warned" | "blocked" | "rewritten";
  detectedFacts: string[];
  missingFacts?: string[];
  violations: string[];
  reason: string;
  source?: SourceQuote;
};

export type VerifyRequest = {
  agentName: string;
  userMessage: string;
  proposedResponse: string;
  checks?: DeterministicCheck[];
};

/** API verify result — `reason` is populated when a check fails or for explicit audit clarity */
export type VerifyResponse = {
  result: "allowed" | "warned" | "blocked" | "rewritten";
  finalResponse?: string;
  facts: RuntimeFacts;
  violations: string[];
  /** Human-readable primary outcome; required when `result` is blocked/warned/rewritten for this slice */
  reason?: string;
  auditEvent: AuditEvent;
};

export type CompilePolicyRequest = {
  /** Defaults to Northstar handbook title when omitted on wire (hackathon ergonomics). */
  documentName?: string;
  text?: string;
  candidateSections?: PolicySection[];
  candidateOperations?: GraphOperation[];
  /** E.g. `botpress-policy-workflow` \| `sentinel-local` \| `cached-demo`. */
  generatedBy?: string;
};

export type CompilePolicyResponse = {
  documentId: string;
  sections: PolicySection[];
  graph: PolicyGraph;
  checks: DeterministicCheck[];
  /** Describes which pipeline produced the artifact (often includes Sentinel path hints). */
  generatedBy: string;
};

export type AuditListResponse = {
  events: AuditEvent[];
};

export type BuildEvent = {
  id: string;
  timestamp: string;
  type:
    | "section_processed"
    | "operation_applied"
    | "validation_failed"
    | "checks_compiled";
  message: string;
};
