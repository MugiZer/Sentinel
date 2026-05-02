import type { DeterministicCheck, PolicyEdge, PolicyGraph, PolicyNode, SourceQuote } from "./types";

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

/** Active checks for the Northstar hackathon demo when the client omits `checks`. */
export const northstarDemoActiveChecks: DeterministicCheck[] = [
  northstarRefundDeterministicCheck,
];

export function getDemoActiveChecks(): DeterministicCheck[] {
  return northstarDemoActiveChecks;
}
