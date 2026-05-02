# UI UX Demo Dashboard

## Purpose

Define the one-page Sentinel hackathon demo UI optimized for judging at the Montreal Cursor Hackathon (Botpress). **Botpress ADK use (~25% of score) must be visible, obvious, and impressive.** Surface-only API reads score lower—the ADK workflow (compile-time policy agents + runtime support agent + verification action) stays **on-screen**, not implied.

Source sections: 5, 14, 17.

## Header copy

**Header:**

```txt
Sentinel: Botpress-native policy verification for enterprise agents
```

**Subtitle:**

```txt
Botpress agents propose policy structure and customer responses. Sentinel validates and enforces before anything reaches the user.
```

**Core thesis badge (visible on the page):**

```txt
Prompting is not proof. Verification is.
```

**Pipeline thesis (compile + runtime, exact string):**

```txt
Botpress agents propose. Sentinel validates. Botpress sends only verified output.
```

Do not present a generic compliance admin dashboard. Story the product as **Botpress-native multi-agent governance**: agents propose structure and drafts; Sentinel is the authority for activation and allow/block/rewrite.

## Builder ownership

**Primary owner:** Kaveh (Builder 1)

Kaveh owns implementation for this file because it belongs to the Botpress ADK / UI / demo surface.

**Hamza dependency:** Hamza provides the backend API responses and canonical data contracts consumed here, but should not modify Botpress/UI flow directly during the hackathon unless both builders agree.

## Why it matters for the demo

Judges must understand the **full ADK-mediated flow in under ~30 seconds** from one scrollable page:

```txt
Policy Document
→ Botpress Policy Indexing Agent
→ Botpress Policy Graph Builder Agent
→ Sentinel Reducer + Validator
→ Deterministic Checks Activated
→ Botpress Support Agent Drafts Response
→ Sentinel POST /api/verify
→ BLOCKED before sending
→ Safe final response sent by Botpress
→ Audit log with source quote visible
```

**Core UI thesis:** Botpress agents propose. Sentinel validates. Botpress sends only verified output.

## Backend dependency rules

The UI consumes:

- `POST /api/policy/compile`
- `POST /api/verify`
- `GET /api/audit`

The UI must not:

- compute allow/block/rewrite decisions itself
- fabricate source quotes
- mark a response **BLOCKED** (or equivalent) **without** a real `/api/verify` response driving that state
- treat Botpress candidate graph operations as **active** unless Sentinel has validated and activated them (UI reflects backend/Sentinel truth)

Temporary fixtures are allowed during development; **final demo mode** must call real backend endpoints.

The UI may display shapes from Hamza’s contracts (e.g. `CompilePolicyResponse`, `VerifyResponse`, `AuditEvent[]`) but must not invent compliance outcomes.

## Optimizing for Botpress ADK Judging

To score high on Botpress ADK use, the demo must **visibly** show:

1. **Botpress compile-time workflow:** `policyCompile`
2. **Botpress compile-time agents/actions:** `policyIndexingAgent`, `policyGraphBuilderAgent`, `activateCompiledPolicy`
3. **Botpress runtime agent:** `support.ts` Conversation (Northstar / support scenario)
4. **Botpress runtime verification action:** `verifyResponse`
5. **Sentinel as authority:** reducer/validator activates graph/checks; **`/api/verify`** decides allow/block/rewrite

Judges should not see “a generic chatbot.” Judges should see a **Botpress-native multi-agent governance workflow** with Sentinel as deterministic enforcement between proposal and send.

## Visual priorities

- Botpress ADK usage must be visible in the **first 30 seconds** (workflow names, conversation file, actions on-screen).
- The **blocked** result must be **visually obvious** (high-contrast badge/state before any “sent” message).
- The **source quote** must be visible **without** opening a modal or deep drill-down.
- The UI must show **both** compile-time and runtime Botpress agents—not one hidden “behind the scenes.”
- A judge should be able to point at the screen and say: “This part is Botpress.” “This part is Sentinel validation.” “This part is deterministic enforcement.”
- Avoid complex navigation; avoid an admin-dashboard feel; avoid burying the pipeline behind tabs.
- Prefer **one page**, **stage-based storytelling** (pipeline + audit + compact ADK sidebar).

## Layout: one-page dashboard with two Botpress zones

Structure the page around **two visible Botpress zones**:

1. **Compile-Time Botpress Policy Agents**
2. **Runtime Botpress Support Agent**

Plus **policy graph/checks**, **audit**, and a compact **ADK primitives** sidebar/card.

Suggested column plan: **main column** = Panels 1–4 in order (story top-to-bottom). **Sidebar (or anchored card)** = Panel 5. On narrow viewports stack Panel 5 under Panel 4 but keep it visible without a separate “integrations” submenu.

---

### Panel 1 — Compile-Time Botpress Agents

**Title:** `Compile-Time Botpress Policy Agents`

**Microcopy (compile panel):**

```txt
At compile time, Botpress policy agents inspect the document and propose structured policy operations.
```

Show a **horizontal or vertical pipeline** with explicit stages:

```txt
Policy Document
→ Botpress Policy Indexing Agent
→ Botpress Policy Graph Builder Agent
→ Sentinel Reducer + Validator
→ Deterministic Checks Activated
```

**Status badges per stage:** `pending` | `running` | `completed` | `validated` | `activated` (map backend events to these; badges animate or update during “Run Botpress Policy Compile Workflow”).

**Visible ADK labels on this panel:**

- Workflow: `policyCompile`
- Action: `policyIndexingAgent`
- Action: `policyGraphBuilderAgent`
- Action: `activateCompiledPolicy`

**Example Botpress outputs (illustrative; live UI binds to `/api/policy/compile` stream or final payload):**

*Policy Indexing Agent output — `PolicySection[]`:*

- Refunds and Reimbursements
- Sensitive Payment Information
- Investment Advice
- Escalation Requirements

*Policy Graph Builder Agent output — `GraphOperation[]`:*

- `ADD_NODE` `action.promise_refund`
- `ADD_NODE` `condition.manager_approval`
- `ADD_NODE` `violation.refund_without_approval`
- `ADD_EDGE` `edge.refund_requires_approval`
- `MARK_SECTION_PROCESSED` `refunds`

**Sentinel validation row (after graph builder, still in this panel or directly under it):**

- source quote matched  
- edge references valid  
- check compiled  
- active check enabled  

**Validator microcopy:**

```txt
Sentinel does not trust agent output blindly. The reducer applies operations, validators check source quotes and graph references, and only valid checks become active.
```

**Exact UI copy (prominent in or under Panel 1):**

```txt
Botpress agents propose. Sentinel validates.
```

---

### Panel 2 — Policy Graph + Activated Checks

**Title:** `Policy Graph + Deterministic Checks`

**Copy:**

```txt
The graph is what the policy means. The checks are what runtime enforces.
```

Show:

- **Graph nodes** and **edges** (list or simple visualization).
- **Active checks** (post-Sentinel activation only).
- **Source quote badges** on nodes/checks where the contract provides them.

**Core graph elements (refund slice):**

- `action.promise_refund`
- `condition.manager_approval`
- `violation.refund_without_approval`
- `edge.refund_requires_approval`
- `check.refund_requires_approval`

Frame the graph as a **visible semantic proof layer** (grounded structure + enforcement), not decoration.

---

### Panel 3 — Runtime Botpress Support Agent

**Title:** `Runtime Botpress Support Agent`

**Runtime panel microcopy:**

```txt
The Botpress support agent drafts a response, but it is not sent until Sentinel verifies it.
```

Show the **actual runtime flow** with labels:

**Customer:**

```txt
I'm angry. Refund me right now.
```

**Botpress Support Agent proposed response:**

```txt
Sure, I can refund you today.
```

**Label on proposed text (required):**

```txt
Botpress proposed response — not sent yet
```

Then **Sentinel Verification:**

- State driven **only** by `/api/verify` (no UI-side hardcoded BLOCK for demo credibility).
- Display copy:

```txt
BLOCKED before sending
```

**Final Botpress response (after verifier):**

```txt
I can help submit a refund request, but manager approval is required before I can confirm it.
```

**Label on final text:**

```txt
Verified final response sent by Botpress
```

**ADK / API provenance (visible on this panel):**

- ADK Conversation: `support.ts`
- ADK Action: `verifyResponse`
- API called: `POST /api/verify`

**Important:** The UI must **not** hardcode the compliance decision. The **BLOCKED** (or `blocked`) state and `finalResponse` come from the real `/api/verify` response.

---

### Panel 4 — Source-Grounded Audit Log

**Title:** `Source-Grounded Audit Trail`

**Audit panel microcopy:**

```txt
Every blocked response is tied back to the exact policy quote that caused the decision.
```

Show a row (or top entry) with **no extra click** for the quote:

- **Result badge:** `BLOCKED`
- **Runtime agent:** Botpress Northstar Support Agent
- **Proposed response** (text)
- **Final response** (text)
- **Detected facts:** e.g. `action.promise_refund = true`, `condition.manager_approval = false`
- **Triggered check:** `check.refund_requires_approval`
- **Violation:** `violation.refund_without_approval`
- **Reason:** Refund promise requires manager approval.
- **Source section:** Refunds and Reimbursements
- **Source quote (full visibility, inline):**

```txt
Agents must not promise or guarantee refunds unless manager approval has been granted.
```

- **Decision engine:** Sentinel deterministic evaluator
- **ADK action used:** `verifyResponse`

Data source: **`GET /api/audit`** (and/or verification payload embedded in audit events per `12-data-models.md`). Do not fabricate quotes in production demo mode.

---

### Panel 5 — Botpress ADK Primitives Used (sidebar / compact card)

**Title:** `Botpress ADK Primitives Used`

**Sidebar copy:**

```txt
Botpress is not just the chat UI. Botpress ADK orchestrates the policy agents and the runtime support agent.
```

**Runtime:**

- Conversation: `support.ts`
- Action: `verifyResponse`

**Compile time:**

- Workflow: `policyCompile`
- Action: `policyIndexingAgent`
- Action: `policyGraphBuilderAgent`
- Action: `activateCompiledPolicy`

Keep this panel **visible throughout** initial load so judges hit ADK names immediately.

---

## Required demo state flow

1. **Initial state:** Northstar policy ready to load; ADK primitives panel visible; Botpress ↔ Sentinel architecture visible (subtitle + thesis).
2. **Load policy:** User clicks **`Run Botpress Policy Compile Workflow`**; compile panel shows `policyCompile` running (workflow + stages).
3. **Indexing complete:** Show Policy Indexing Agent produced `PolicySection[]` (with example headings above wired to API).
4. **Graph operations proposed:** Show Policy Graph Builder Agent produced `GraphOperation[]`.
5. **Sentinel validation:** Show reducer/validator activated graph/checks; show **“agents propose, code validates”** / **Botpress agents propose. Sentinel validates.**
6. **Runtime scenario:** Customer refund demand; Botpress Support Agent draft; draft clearly **not sent yet**.
7. **Verification:** Call `/api/verify`; show **BLOCKED before sending** and safe **final** response from API.
8. **Audit:** Prepend / highlight audit entry with **source quote** + **ADK provenance** inline.

Primary CTA wording for compile: **`Run Botpress Policy Compile Workflow`** (aligns judging language with Botpress).

## Inputs

- Policy document identifier / name
- Compile pipeline stages and agent outputs (`PolicySection[]`, `GraphOperation[]`, validation flags)
- Active `PolicyGraph`, `DeterministicCheck[]`
- User message + proposed response (from Botpress or mirrored panel calling same verifier)
- `VerifyResponse` from `/api/verify`
- `AuditEvent[]` from `/api/audit`

## Outputs

- One-scroll story: compile Botpress agents → Sentinel activation → runtime draft → verify → blocked/safe → audit with quote
- Visible compile pipeline with ADK names
- Visible runtime draft vs final labels
- Obvious BLOCKED state from API
- Source quote visible without modal

## Data contracts

UI consumes (shapes per `12-data-models.md` / `11-api-backend-contracts.md`):

- `PolicySection[]`
- `GraphOperation[]` (candidate; display as **proposed** until Sentinel activates)
- `PolicyGraph`
- `DeterministicCheck[]`
- `VerifyResponse`
- `AuditEvent[]`

Suggested UI state sketch:

```ts
type CompileStageStatus = "pending" | "running" | "completed" | "validated" | "activated"

type DemoState = {
  policyReady: boolean
  compileWorkflow: {
    workflowName: "policyCompile"
    stages: Record<string, CompileStageStatus>
  }
  policySections?: PolicySection[]
  proposedGraphOperations?: GraphOperation[]
  graph?: PolicyGraph
  checks: DeterministicCheck[]
  userMessage?: string
  proposedResponse?: string
  proposedResponseSent?: boolean // must stay false until after verify path
  verifyResponse?: VerifyResponse
  auditEvents: AuditEvent[]
}
```

## Max-out demo test buttons

Test buttons **prefill** messages/proposed text but **must** call **`POST /api/verify`** for outcomes:

- Refund promise → expect block path: proposed `Sure, I can refund you today.`
- Credit card → block: full card/CVV ask
- Normal support → allow path
- Legal threat → escalate/warn if implemented

No hardcoded block UI without verifier response.

## Edge cases / fallbacks

- Graph visualization fails → static node/edge list with same IDs as spec.
- Botpress runtime unavailable → staged panel with identical labels (`Botpress proposed response — not sent yet`) and **real** `/api/verify`.
- API errors → graceful error state; fixtures only outside “final demo mode.”
- Compile slow → show running badges; optionally cached compile with honest presenter note per `14-fallbacks-and-demo-resilience.md`.

## Validation rules

- Audit log remains high priority; **source quote inline** beats graph polish.
- Build/compile timeline must read **before** runtime verify in the story order.
- **Botpress labeled** on both compile pipeline and runtime panel.
- **BLOCKED** must be obvious and **API-driven**.
- Do not imply full enterprise compliance beyond the demo slice.

## Dependencies

- `01-demo-story-and-judging-strategy.md`
- `02-botpress-adk-workflow.md`
- `06-policy-knowledge-graph.md`
- `08-runtime-verification.md`
- `09-audit-log.md`
- `14-fallbacks-and-demo-resilience.md`
- `17-botpress-policy-agents-and-prompts.md`

## Definition of done

- One page tells compile-time Botpress agents → Sentinel → runtime Botpress → verify → audit.
- Judges see **workflow + action names** without digging.
- Refund BLOCK + safe final response run through **real** `/api/verify`; audit shows source-grounded quote without modal.
- `GET /api/audit` wired in demo mode alongside compile/verify.
- ADK primitives card always visible early in demo.
