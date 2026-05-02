# Presentation Script

## Purpose

Give the presenter a tight 3-minute pitch for Sentinel.

Source sections: 0, 1, 3, 5, 7, 15, final concise definition.

## Builder ownership

**Primary owner:** Kaveh (Builder 1)

Kaveh owns implementation for this file because it belongs to the Botpress ADK / UI / demo surface.

**Hamza dependency:** Hamza provides the backend API responses and canonical data contracts consumed here, but should not modify Botpress/UI flow directly during the hackathon unless both builders agree.

## Why it matters for the demo

The product is technical. The script keeps the explanation focused: prompting is not proof, Sentinel verifies before sending, and Botpress is central.

## Scope

### In scope

- 20-second problem.
- 20-second product thesis.
- 60-second live demo.
- 40-second technical architecture.
- 30-second trustworthiness answer.
- 20-second Botpress ADK emphasis.
- 10-second closing line.

### Out of scope

- Long market analysis.
- Detailed compliance claims.
- Deep implementation walkthrough.
- Multiple demo stories.

## Inputs

- Working dashboard.
- Northstar Bank policy fixture.
- Botpress support agent or staged proposed-response panel.
- Blocked refund audit event.

## Outputs

- Presenter-ready script.
- Timing structure.
- Closing line.

## Data contracts

This file does not define data contracts. It references the implementation concepts:

- `PolicyGraph`
- `DeterministicCheck`
- `RuntimeFacts`
- `AuditEvent`

## Main flow

20-second problem:

```txt
Enterprises want to deploy AI agents, but they cannot trust prompts alone for policy compliance. A prompt can say "follow the policy," but if the agent promises something it should not, there is no external proof or enforcement.
```

20-second product thesis:

```txt
Sentinel is a Botpress-native policy verification layer. It turns policy documents into source-grounded policy graphs, compiles deterministic checks, and verifies Botpress agent responses before users see them.
```

60-second live demo:

```txt
Here is Northstar Bank's AI Agent Compliance Manual. Sentinel extracts the rule that refund promises require manager approval, builds a small policy graph, and compiles a deterministic check.

Now the customer asks: "I'm angry. Refund me right now."

The Botpress support agent drafts: "Sure, I can refund you today."

Sentinel intercepts that proposed response, extracts the fact that this is a refund promise, sees that manager approval is missing, blocks the response, and returns a safer version.

The audit log shows exactly why: refund promise requires manager approval, with the source quote from the policy.
```

40-second technical architecture:

```txt
The expensive work happens once at policy compile time. Agents read bounded policy sections, build a policy graph, and attach source quotes. The graph compiles into deterministic checks.

At runtime, Sentinel does not reread the full document. It sends only the proposed response and compact fact keys to a verifier, then local deterministic code evaluates the active checks in milliseconds.
```

30-second trustworthiness answer:

```txt
The LLM does not get to invent active constraints. Every active rule needs an exact source quote. If there is no quote, it does not activate. Then graph and check validation run before runtime enforcement. In production, a policy owner would approve constraints before activation.
```

20-second Botpress ADK emphasis:

```txt
Botpress is central here. The customer-facing support agent drafts the response, the verifier workflow checks it before sending, and Sentinel returns the allowed, blocked, or rewritten response back into the Botpress flow.
```

10-second closing line:

```txt
Sentinel makes enterprise AI agents safer by turning policy from text into runtime enforcement. Prompting is not proof; verification is.
```

## Edge cases / fallbacks

- If Botpress integration is simulated, say: "This panel shows the same proposed-response step our Botpress verifier workflow calls."
- If graph generation is cached, say: "For demo reliability, this policy has been precompiled; the same compile endpoint produces this graph."
- If running locally, do not apologize; focus on the working vertical slice.

## Validation rules

- Mention Botpress by name.
- Mention source quotes.
- Mention deterministic checks.
- Do not claim full legal compliance.
- Keep the story centered on refund promise without manager approval.

## Dependencies

- `00-product-nucleus.md`
- `01-demo-story-and-judging-strategy.md`
- `02-botpress-adk-workflow.md`
- `09-audit-log.md`
- `10-ui-ux-demo-dashboard.md`
- `13-validation-and-trustworthiness.md`

## Definition of done

- Script fits in 3 minutes.
- Script explains the technical thesis clearly.
- Script handles the hallucination/trust concern.
- Script ends with the product thesis.
