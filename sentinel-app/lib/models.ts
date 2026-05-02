export type PolicySection = {
  id: string
  title: string
  page?: number
  text: string
  containsPolicyLogic: boolean
  processed: boolean
}

export type SourceQuote = {
  document: string
  section: string
  page?: number
  quote: string
}

export type PolicyNode = {
  id: string
  type: "action" | "condition" | "violation" | "exception" | "escalation"
  label: string
  description?: string
  source?: SourceQuote
}

export type PolicyEdge = {
  id: string
  from: string
  to: string
  type: "requires" | "forbids" | "violates_if_missing" | "escalates_to" | "except_when"
  source?: SourceQuote
}

export type PolicyGraph = {
  nodes: PolicyNode[]
  edges: PolicyEdge[]
}

export type DeterministicCheck = {
  id: string
  name: string
  trigger: string
  required?: string
  forbidden?: boolean
  severity: "allow" | "warn" | "block"
  violation: string
  reason: string
  source: SourceQuote
}

export type RuntimeFacts = Record<string, boolean>

export type AuditEvent = {
  id: string
  timestamp: string
  agentName: string
  userMessage: string
  proposedResponse: string
  finalResponse?: string
  result: "allowed" | "warned" | "blocked" | "rewritten"
  detectedFacts: string[]
  missingFacts?: string[]
  violations: string[]
  reason: string
  source?: SourceQuote
}

export type ValidationError = {
  id: string
  targetId?: string
  severity: "error" | "warning"
  message: string
}

export type BuildEvent = {
  id: string
  timestamp: string
  type: "section_processed" | "operation_applied" | "validation_failed" | "checks_compiled"
  message: string
}
