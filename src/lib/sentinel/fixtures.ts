import type {
  BuildEvent,
  DeterministicCheck,
  PolicySection,
  PolicyEdge,
  PolicyGraph,
  PolicyNode,
  SourceQuote,
} from "./types";

export const NORTHSTAR_DOCUMENT_NAME =
  "Northstar Bank AI Agent Compliance Manual" as const;

export const northstarRefundPolicyQuote: SourceQuote = {
  document: NORTHSTAR_DOCUMENT_NAME,
  section: "Refunds and Reimbursements",
  page: 2,
  quote:
    "Agents must not promise or guarantee refunds unless manager approval has been granted.",
};

const nodeSources = {
  promiseRefund: northstarRefundPolicyQuote,
  managerApproval: northstarRefundPolicyQuote,
  violationRefund: northstarRefundPolicyQuote,
} as const;

export const northstarDemoGraphNodes: PolicyNode[] = [
  {
    id: "action.promise_refund",
    type: "action",
    label: "Promise or guarantee a refund",
    description: "Agent language that promises immediate refund without approval.",
    source: nodeSources.promiseRefund,
  },
  {
    id: "condition.manager_approval",
    type: "condition",
    label: "Manager approval obtained",
    description: "Refund may proceed only after explicit manager approval.",
    source: nodeSources.managerApproval,
  },
  {
    id: "violation.refund_without_approval",
    type: "violation",
    label: "Refund promised without approval",
    description: "Refund promise without documented manager approval.",
    source: nodeSources.violationRefund,
  },
];

export const northstarDemoGraphEdges: PolicyEdge[] = [
  {
    id: "edge.promise_refund_requires_manager_approval",
    from: "action.promise_refund",
    to: "condition.manager_approval",
    type: "requires",
    source: northstarRefundPolicyQuote,
  },
];

export const northstarDemoGraph: PolicyGraph = {
  nodes: northstarDemoGraphNodes,
  edges: northstarDemoGraphEdges,
};

export const northstarRefundDeterministicCheck: DeterministicCheck = {
  id: "check.refund_requires_approval",
  name: "Refunds require manager approval",
  trigger: "action.promise_refund",
  required: "condition.manager_approval",
  severity: "block",
  violation: "violation.refund_without_approval",
  reason: "Refund promise requires manager approval.",
  source: northstarRefundPolicyQuote,
};

export const northstarPaymentCredentialsQuote: SourceQuote = {
  document: NORTHSTAR_DOCUMENT_NAME,
  section: "Customer Data and Payments",
  page: 5,
  quote:
    "Agents must never request full payment card numbers, CVV, CVC, or PINs in chat.",
};

export const northstarPaymentCredentialsCheck: DeterministicCheck = {
  id: "check.no_payment_credentials",
  name: "Never request card/CVV in chat",
  trigger: "action.request_payment_credentials",
  forbidden: true,
  severity: "block",
  violation: "violation.payment_credentials_requested",
  reason: "Requesting card numbers or CVV in chat violates payment safety policy.",
  source: northstarPaymentCredentialsQuote,
};

export const northstarDemoSections: PolicySection[] = [
  {
    id: "section.cover",
    title: "Purpose and scope",
    page: 1,
    text: "This manual governs AI-assisted customer support at Northstar Bank.",
    containsPolicyLogic: false,
    processed: true,
  },
  {
    id: "section.refunds",
    title: "Refunds and Reimbursements",
    page: 2,
    text: northstarRefundPolicyQuote.quote,
    containsPolicyLogic: true,
    processed: true,
  },
  {
    id: "section.payments",
    title: "Customer Data and Payments",
    page: 5,
    text: northstarPaymentCredentialsQuote.quote,
    containsPolicyLogic: true,
    processed: true,
  },
];

const demoNow = "2026-05-02T15:00:00.000Z";

export const northstarDemoBuildEvents: BuildEvent[] = [
  {
    id: "be.1",
    timestamp: demoNow,
    type: "section_processed",
    message: "Indexed policy document — 3 sections",
  },
  {
    id: "be.2",
    timestamp: demoNow,
    type: "operation_applied",
    message: "ADD_NODE action.promise_refund",
  },
  {
    id: "be.3",
    timestamp: demoNow,
    type: "operation_applied",
    message: "ADD_NODE condition.manager_approval",
  },
  {
    id: "be.4",
    timestamp: demoNow,
    type: "operation_applied",
    message: "ADD_EDGE requires (refund → manager approval)",
  },
  {
    id: "be.5",
    timestamp: demoNow,
    type: "checks_compiled",
    message: "Compiled check.refund_requires_approval + check.no_payment_credentials",
  },
];

/** Active checks for the Northstar hackathon demo when the client omits `checks`. */
export const northstarDemoActiveChecks: DeterministicCheck[] = [
  northstarRefundDeterministicCheck,
  northstarPaymentCredentialsCheck,
];

export function getDemoActiveChecks(): DeterministicCheck[] {
  return northstarDemoActiveChecks;
}
