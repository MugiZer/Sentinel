# Presentation Script

## Purpose

Give the presenter a tight **3–5 minute** pitch for Sentinel (**procurement-first**).

Source sections: 0, 1, 3, 5, 7, 15, final concise definition.

## Builder ownership

**Builder 1 — Kaveh** owns presenter delivery + dashboard/demo surface.

**Builder 2 — Hamza** owns API truth; does not rewrite the script unless both agree.

## Why it matters for the demo

The product is technical. The script keeps the explanation focused: autonomous **enterprise** agents can commit real harm; **prompting is not proof**; Sentinel verifies **before** send/execute; Botpress stays central.

## Scope

### In scope

- **~20–30s** problem (business commitments / money / vendors / payment data).
- **~20–30s** product thesis + category (**policy firewall**).
- **~60–120s** live demo (procurement).
- **~30–40s** architecture (compile once, deterministic runtime).
- **~20–30s** trustworthiness answer (quotes + activation + deterministic code).
- **~15s** Botpress ADK emphasis (**`policyCompile`** + **`procurement.ts`** + **`verifyResponse` Action** — **not** an optional Tool).
- **~10s** closing line.

### Out of scope

- Long market analysis.
- Detailed compliance/legal guarantees.
- Deep implementation walkthrough.
- Multiple competing primary stories (refund is **fallback** only).

## Inputs

- Working dashboard (Hero + panels).
- **Enterprise Procurement Agent Policy** fixture.
- Botpress **procurement** agent **or** honest staged panel with same strings.
- Blocked procurement audit event with visible quotes.

## Outputs

- Presenter-ready script.
- Timing structure.
- Closing line.

## Main flow

**Open (5–10s):**

```txt
Botpress agents are becoming capable enough to make business commitments. Prompting alone is not proof.
```

**Product thesis (15–20s):**

```txt
Sentinel is a policy firewall for Botpress enterprise agents. Compile-time ADK workflows propose policy structure; Sentinel activates only validated checks. At runtime, agents propose replies and actions—we verify them before anything is sent or executed. Botpress agents propose. Sentinel validates. Botpress sends only verified output.
```

**Live demo (60–120s) — follow this order:**

```txt
1. Open with: Botpress agents are becoming capable enough to make business commitments. Prompting alone is not proof.
2. Show the Enterprise Procurement Agent policy (the rules judges should remember).
3. Show Botpress policyCompile: Policy Indexing Agent + Policy Graph Builder Agent (names on screen).
4. Show Sentinel validator activating deterministic checks (candidate vs active honestly).
5. Show the runtime procurement request: "Buy 20 GPU servers from this new vendor today… approve… wire details."
6. Show the Botpress proposed response: "Approved. I'll confirm the $80,000… include our wire details." — label: not sent yet.
7. Click Verify with Sentinel (or show Botpress calling verifyResponse): BLOCKED BEFORE EXECUTION.
8. Show the safe final response from Sentinel (finalResponse).
9. Show the audit panel with a visible source quote tied to the block.
10. Close with: Botpress agents propose. Sentinel validates. Verification is the enforcement layer.
```

**Architecture (30–40s):**

```txt
The expensive interpretation happens at compile time: bounded sections, graph proposals, source quotes, deterministic checks. At runtime Sentinel does not reread the whole policy. It extracts compact facts from the proposed response and runs deterministic checks in milliseconds, then returns finalResponse and audit evidence.
```

**Trustworthiness (20–30s):**

```txt
We don't let a benign-looking sentence bypass enforcement. Every active check is grounded in an exact quote from the policy text. No quote, no activation. Deterministic code decides block versus allow—not vibes, not the model self-policing.
```

**Botpress ADK (15s):**

```txt
ADK Workflow policyCompile drives compile-time policy agents. Conversation procurement.ts drafts the reply, but verifyResponse—implemented as an Action, not an optional Tool—always calls Sentinel /api/verify before send.
```

**Close (10s):**

```txt
Sentinel turns policy into enforceable gates on autonomous agent output. Prompting is not proof; verification is.
```

## Edge cases / fallbacks

- Staged panel: "This is the same proposed-response point our Botpress Action calls—here is the live /api/verify."
- Cached compile: "Compile output is cached for reliability; verification is live."
- Locally hosted: stay confident; focus on the vertical slice.

## Validation rules

- Mention **`policyCompile`**, **`procurement.ts`**, **`verifyResponse`** during the demo.
- Mention **source quotes** + **deterministic checks**.
- Do not claim full legal compliance.
- Keep the **primary** story on **procurement**, not refunds.

## Dependencies

- `00-product-nucleus.md`
- `01-demo-story-and-judging-strategy.md`
- `02-botpress-adk-workflow.md`
- `09-audit-log.md`
- `10-ui-ux-demo-dashboard.md`
- `13-validation-and-trustworthiness.md`

## Definition of done

- Script fits in **3–5 minutes** at rehearsal pace.
- Viewer understands **why procurement** makes the risk obvious.
- Script ends on the enforcement-layer thesis.
