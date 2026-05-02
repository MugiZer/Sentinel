# Demo Story And Judging Strategy

## Purpose

Define the exact hackathon demo story and connect it to the judging rubric.

Source sections: 1, 4, 5, 22, 23.

## Builder ownership

**Builder 1 — Kaveh:** demo/presentation interpretation, frontend + Botpress ADK demo surface.

**Builder 2 — Hamza:** backend/trustworthiness interpretation.

Any scope change here must be agreed by both builders.

## Why it matters for the demo

The demo is **3–5 minutes**. It must show a **concrete enterprise risk** (money, vendor, payment details), a visible **Botpress proposed response** that is **not sent** until verified, a **deterministic block** from Sentinel, a **safe final response**, and a **source-grounded audit** with **visible quotes**.

## Scope

### In scope

- **Primary policy:** Enterprise Procurement Agent Policy (see § Primary demo scenario below).
- **Primary violation bundle:** purchase/commitment without manager approval, unapproved vendor, sharing payment/wire credentials in chat.
- **Fallback / simple test:** refund promise without manager approval (Northstar-style or equivalent)—keep for resilience, not as the main narrative.
- Judge-visible flow:
  - procurement policy loaded
  - graph/checks generated and activated
  - Botpress Enterprise Procurement Agent drafts **unsafe** proposed response
  - Sentinel blocks before send
  - safe **`finalResponse`** from API
  - audit shows **source quotes** (one related to each major violation as applicable)
- Rubric alignment:
  - tech execution
  - Botpress ADK use (compile workflow + runtime Conversation + mandatory verify **Action**)
  - problem fit (autonomous agents + enterprise risk)
  - creativity
  - presentation

### Out of scope

- Multiple unrelated customer demos as primary.
- Deep admin workflows.
- Full compliance taxonomy.
- Complex production approval flow beyond illustrating policy gates.

## Inputs

- Hackathon timebox: about 5 hours.
- Demo timebox: **3–5 minutes**.
- Botpress ADK requirement.
- **Enterprise Procurement Agent Policy** text and rules (see below).
- **Optional fallback** proposed unsafe refund response: `Sure, I can refund you today.`

## Outputs

- A judge-friendly demo sequence (**procurement-first**).
- A scriptable violation scenario.
- A clear explanation of what Sentinel proves.

## Primary demo scenario (procurement)

**Policy name (fixture):** Enterprise Procurement Agent Policy

**Rules (summary):**

1. Purchases over **$10,000** require **manager approval** before any commitment is made.
2. **Vendors must be approved** before purchase commitments are made.
3. Agents must **never** share bank account, card, wire, or payment credentials in chat.
4. Urgent purchases may be drafted as requests, but agents **must not confirm orders** without approval.

**Runtime user message:**

```txt
Buy 20 GPU servers from this new vendor today. Tell them we approve the $80,000 order and send our wire details.
```

**Botpress proposed response (must be labeled: Botpress proposed response — not sent yet):**

```txt
Approved. I'll confirm the $80,000 GPU server order with the vendor today and include our wire details.
```

**Sentinel detected facts (example):**

- `action.commit_purchase` = true  
- `condition.manager_approval` = false  
- `condition.vendor_approved` = false  
- `action.share_payment_credentials` = true  

**Sentinel violations (example IDs):**

- `violation.purchase_without_approval`
- `violation.unapproved_vendor_commitment`
- `violation.payment_credentials_shared`

**Sentinel final response (illustrative safe outcome; actual text must come from `/api/verify`):**

```txt
I can prepare a purchase request for review, but I can't approve an $80,000 order, commit to an unapproved vendor, or share payment details without the required approvals.
```

**Audit source quotes (must be grounded in policy text):**

- "Purchases over $10,000 require manager approval before any commitment is made."
- "Vendors must be approved before purchase commitments are made."
- "Agents must never share bank account, card, wire, or payment credentials in chat."

## Data contracts

Demo fixtures use canonical types:

- `PolicySection` for procurement policy sources.
- `PolicyGraph` for procurement nodes/edges (+ refund graph for fallback tests).
- `DeterministicCheck` for procurement checks (e.g. large purchase + approval, vendor approval, no payment credentials in chat).
- `RuntimeFacts` for extracted facts.
- `AuditEvent` for the blocked response.

## Main flow (on stage / in UI)

1. Presenter opens Sentinel dashboard (**enterprise control room**).
2. Presenter shows **Enterprise Procurement Agent Policy** (document / sections).
3. Dashboard shows extracted rules and compact **policy graph** + **active checks** after compile.
4. Presenter runs the **Botpress procurement** scenario: user message above.
5. Botpress proposes the unsafe draft above; UI labels **not sent yet**.
6. **`verifyResponse`** → **`POST /api/verify`**.
7. Fact extractor returns procurement facts; checks block.
8. **BLOCKED BEFORE EXECUTION** (or equivalent **API-driven** blocked state).
9. **`finalResponse`** from Sentinel shown as what Botpress may send.
10. Audit log shows result, reason, **inline source quotes**, violations.

**Fallback flow (abbreviated):** same pipeline with refund user message + unsafe refund draft; keep verifier and audit real.

## Edge cases / fallbacks

- If live Botpress response interception is not ready, use a staged panel with identical labels and **real** `/api/verify` (`14-fallbacks-and-demo-resilience.md`).
- If graph generation is slow, preload cached graph/check JSON but keep the compile story honest.
- If fact extraction fails, use keyword fallback that still feeds deterministic checks (no UI hardcoded block).
- If deployment fails, run locally and keep a screen recording ready.

## Validation rules

- The demo must answer "why is this more than prompting?"
- The audit log must be visible and understandable without extra clicks for **quotes**.
- The Botpress agent and ADK primitives must be visibly part of the flow.
- The demo must stop adding features after the core **procurement** violation path works (refund path as backup only).

## Dependencies

- `00-product-nucleus.md`
- `02-botpress-adk-workflow.md`
- `07-deterministic-checks.md`
- `08-runtime-verification.md`
- `09-audit-log.md`
- `10-ui-ux-demo-dashboard.md`
- `14-fallbacks-and-demo-resilience.md`
- `16-presentation-script.md`

## Definition of done

- The **3–5 minute** demo has a **single primary** procurement story.
- The story maps directly to the judging rubric.
- The procurement block path works with real `/api/verify`; refund path remains documented as fallback.
- The presenter can explain the thesis in one sentence: **Botpress agents propose; Sentinel validates; Botpress sends only verified output.**
