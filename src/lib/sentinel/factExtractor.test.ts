import { describe, expect, it } from "vitest";

import { extractRuntimeFacts, factKeysFromChecks } from "./factExtractor";
import { northstarDemoActiveChecks } from "./fixtures";

function activeKeys() {
  return factKeysFromChecks(northstarDemoActiveChecks);
}

describe("extractRuntimeFacts calibration", () => {
  it("detects immediate refund promises without approval language", () => {
    const facts = extractRuntimeFacts("Sure, I can refund you today.", activeKeys());
    expect(facts["action.promise_refund"]).toBe(true);
    expect(facts["condition.manager_approval"]).toBe(false);
  });

  it("treats procedural refund handling as non-promissory", () => {
    const facts = extractRuntimeFacts(
      "I can help submit a refund request, but manager approval is required before confirmation.",
      activeKeys(),
    );
    expect(facts["action.promise_refund"]).toBe(false);
  });

  it("detects manager approval language", () => {
    const facts = extractRuntimeFacts(
      "Refund will be issued after manager approval is recorded.",
      activeKeys(),
    );
    expect(facts["condition.manager_approval"]).toBe(true);
  });

  it("flags payment credential solicitations", () => {
    const facts = extractRuntimeFacts(
      "Please send me the CVV code from the back of your card so we can finish this payment.",
      activeKeys(),
    );
    expect(facts["action.request_payment_credentials"]).toBe(true);
  });

  it("ignores educational reminders that mention CVV", () => {
    const facts = extractRuntimeFacts(
      "For your safety, never send your CVV in chat. Visit the secure portal instead.",
      activeKeys(),
    );
    expect(facts["action.request_payment_credentials"]).toBe(false);
  });
});
