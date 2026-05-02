import type { DeterministicCheck, RuntimeFacts } from "./types";

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Collect fact keys referenced by active checks (trigger, required, forbidden keys are encoded in trigger/required).
 */
export function factKeysFromChecks(checks: DeterministicCheck[]): string[] {
  const keys = new Set<string>();
  for (const c of checks) {
    keys.add(c.trigger);
    if (c.required) keys.add(c.required);
  }
  return [...keys];
}

/**
 * Keyword-based fact extraction from the proposed response only (hackathon-safe, no policy document read).
 */
export function extractRuntimeFacts(
  proposedResponse: string,
  factKeys: string[],
): RuntimeFacts {
  const text = normalize(proposedResponse);
  const facts: RuntimeFacts = {};

  const mentionsRefund =
    /\brefund\b/.test(text) ||
    /\bmoney\s*back\b/.test(text) ||
    /\breimburse\b/.test(text);

  const proceduralRefundLanguage =
    /\brefund\s+request\b/.test(text) ||
    /\bsubmit\b[\s\S]{0,60}\brefund\b/.test(text);

  const promiseRefund =
    mentionsRefund &&
    !proceduralRefundLanguage &&
    (/\b(can|will)\s+(refund|reimburse)\b/.test(text) ||
      /\brefund\s+you\b/.test(text) ||
      /\bguaranteed\b/.test(text) ||
      /\brefund\s+(today|now|right\s+away|immediately)\b/.test(text));

  const managerApproval =
    /\bmanager\s+approval\b/.test(text) ||
    /\bapproved\s+by\s+a\s+manager\b/.test(text) ||
    /\bmanager\s+approved\b/.test(text);

  const requestPaymentCredentials =
    /\bcvv\b/.test(text) ||
    /\bcvc\b/.test(text) ||
    /\bcard\s*number\b/.test(text) ||
    /\bfull\s+card\b/.test(text) ||
    /\bpayment\s+card\s+details\b/.test(text);

  for (const key of factKeys) {
    if (key === "action.promise_refund") {
      facts[key] = promiseRefund;
    } else if (key === "condition.manager_approval") {
      facts[key] = managerApproval;
    } else if (key === "action.request_payment_credentials") {
      facts[key] = requestPaymentCredentials;
    } else {
      facts[key] = false;
    }
  }

  return facts;
}
