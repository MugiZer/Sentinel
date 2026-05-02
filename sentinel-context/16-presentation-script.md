# Presentation Script

## Purpose

Give the presenter a tight 3-minute pitch for Sentinel.

Source sections: 0, 1, 3, 5, 7, 15, final concise definition.

## Builder ownership

**Primary owner:** Kaveh (Builder 1)

Kaveh owns implementation for this file because it belongs to the demo / presentation surface (paired with the dashboard UI — not Botpress ADK code).

**Hamza dependency:** Hamza provides the backend API responses and canonical data contracts consumed here, but should not rewrite the presenter script unless both builders agree.

## Why it matters for the demo

The product is technical. The script keeps the explanation focused: prompting is not proof, Sentinel verifies before sending, and Botpress is central.

## Scope

### In scope

- 20-second problem.
- 20-second product thesis.
- 60-second live demo.
- 40-second technical architecture.
- 30-second trustworthiness answer.
- ~15-second Botpress ADK emphasis (compile workflow + Conversation + verify action).
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
Sentinel is Botpress-native policy verification. Compile-time Botpress ADK agents propose policy structure; Sentinel activates only validated checks. The runtime Botpress support agent proposes replies; Sentinel blocks or rewrites before anything is sent—all with policy source quotes on the audit trail.
```

60-second live demo (follow this order):

```txt
1. Prompting is not proof.
2. Here is Botpress workflow policyCompile: indexing and graph agents running against Northstar's policy via the ADK — policyIndexingAgent, then policyGraphBuilderAgent.
3. Policy Indexing Agent output: PolicySection[] including Refunds and Reimbursements.
4. Policy Graph Builder Agent output: GraphOperation[] — nodes, edges for refund approval.
5. Sentinel reducer and validator activated deterministic checks — Botpress agents propose; Sentinel validates.
6. Botpress Support Agent drafts: "Sure, I can refund you today," labeled not sent yet.
7. verifyResponse hits POST /api/verify — blocked before sending.
8. Verified final reply from Botpress: manager approval needed before confirming a refund.
9. Audit shows the triggering check, violation reason, and the exact policy sentence — visible without digging.
10. Botpress agents propose. Sentinel validates. Verification is the enforcement layer.
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

15-second Botpress ADK emphasis (compile + runtime):

```txt
ADK Workflow policyCompile orchestrates compile-time agents; Conversation support.ts and Action verifyResponse wire runtime. Judges should see Botpress proposing both policy structure and the chat draft—with Sentinel verifying both paths.
```

10-second closing line:

```txt
Sentinel turns policy text into deterministic enforcement against agent output. Prompting is not proof; verification is.
```

## Edge cases / fallbacks

- If Botpress integration is simulated, say: "This panel shows the same proposed-response step our Botpress verifier workflow calls."
- If graph generation is cached, say: "For demo reliability, this policy has been precompiled; the same compile endpoint produces this graph."
- If running locally, do not apologize; focus on the working vertical slice.

## Validation rules

- Mention compile-time **`policyCompile`** + indexing/graph builders and runtime **`support.ts`** / **`verifyResponse`** during the demo block (see `10-ui-ux-demo-dashboard.md`).
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
