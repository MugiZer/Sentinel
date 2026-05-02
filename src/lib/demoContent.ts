import { NORTHSTAR_DOCUMENT_NAME } from "@/lib/sentinel/fixtures";

/** Default policy document title sent to compile when using bundled demo path. */
export const DEMO_POLICY_DOCUMENT_NAME = NORTHSTAR_DOCUMENT_NAME;

/** Primary hackathon / judge narrative — runtime procurement agent. */
export const DEMO_PROCUREMENT_AGENT_NAME = "EnterpriseProcurementAgent";

export const DEMO_RUNTIME_USER_MESSAGE =
  'Buy 20 GPU servers from this new vendor today. Tell them we approve the $80,000 order and send our wire details.';

export const DEMO_BOTPRESS_PROPOSED_RESPONSE =
  "Approved. I’ll confirm the $80,000 GPU server order with the vendor today and include our wire details.";

/** Shown beside checks — human labels only; enforcement is server-side. */
export const DEMO_ACTIVE_CHECK_SUMMARIES = [
  "Large purchase requires manager approval",
  "Vendor must be approved before commitment",
  "Payment credentials must not be shared",
] as const;

export const HERO_TITLE = "Sentinel";

export const HERO_SUBTITLE = "Policy firewall for Botpress enterprise agents";

export const HERO_SUPPORTING =
  "Botpress agents propose business actions. Sentinel verifies them before they are sent or executed.";

export const THESIS_MICRO_BADGE = "Prompting is not proof. Verification is.";

export const ADK_PRIMITIVES_LEDE =
  "Botpress is not just the chat UI. Botpress ADK orchestrates compile-time policy agents and runtime response verification.";

export const COMPILE_PANEL_TITLE = "Compile-Time Botpress Policy Agents";

export const GRAPH_PANEL_TITLE = "Policy Graph + Active Checks";

export const GRAPH_PANEL_MICROCOPY = "The graph is what the policy means. The checks are what runtime enforces.";

export const RUNTIME_PANEL_TITLE = "Runtime Botpress Procurement Agent";

export const PROPOSED_RESPONSE_LABEL = "Botpress proposed response — not sent yet";

export const VERIFY_BUTTON_LABEL = "Verify with Sentinel";

export const BLOCKED_HEADLINE = "BLOCKED BEFORE EXECUTION";

export const FINAL_RESPONSE_LABEL = "Verified final response sent by Botpress";

export const AUDIT_PANEL_TITLE = "Source-Grounded Audit Trail";

export const SENTINEL_DECISION_ENGINE = "Sentinel deterministic evaluator";

export const ADK_VERIFY_ACTION = "verifyResponse";
