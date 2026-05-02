# UI UX Demo Dashboard

## Purpose

Define the **one-page Sentinel hackathon demo UI**: a **premium, judge-ready enterprise control room** for **Botpress agent verification**. Botpress ADK use must be **visible in the first ~30 seconds** (workflow, conversations, actions). Surface-only API reads score lower—the ADK workflow (compile-time policy agents + runtime procurement agent + verification **Action**) stays **on-screen**, not implied.

**Core UI sentence:**

```txt
Botpress agents propose. Sentinel validates. Botpress sends only verified output.
```

**Header**

```txt
Sentinel
```

**Subtitle**

```txt
Policy firewall for Botpress enterprise agents.
```

**Supporting copy**

```txt
Botpress agents propose business actions. Sentinel verifies them before they are sent or executed.
```

**Badges (chip row):**

- Botpress ADK Workflow
- Runtime Verification
- Deterministic Checks
- Source-Grounded Audit

**Design goal:** Premium **dark** enterprise control room—**Linear**, **Raycast**, **Vercel dashboard**, and **security operations console** inspiration—not a generic admin template.

**Aesthetic guardrails:**

- Dark background
- Glassy cards, subtle translucent borders, soft shadows
- Strong typography hierarchy
- **Red** only for blocked / danger
- **Green / blue** only for success / active (sparingly)
- No rainbow accents; no cluttered chrome
- **No complex navigation**—single scroll story

Source sections: 5, 14, 17.

## Builder ownership

**Builder 1 — Kaveh** owns the Sentinel **Next.js** dashboard UI and demo composition.

**Builder 2 — Hamza** owns backend responses; must not own dashboard layout unless both agree.

## Why it matters for the demo

Judges must understand the **full ADK-mediated flow** quickly:

```txt
Enterprise Procurement Agent Policy
→ Botpress policyCompile (policyIndexingAgent → policyGraphBuilderAgent → activateCompiledPolicy → Sentinel /api/policy/compile)
→ Deterministic checks activated
→ Botpress procurement.ts drafts proposed response — NOT sent
→ verifyResponse → POST /api/verify
→ BLOCKED BEFORE EXECUTION (API-driven)
→ finalResponse from Sentinel; Botpress sends only verified output
→ Audit trail with source quotes visible (no extra click)
```

## Backend dependency rules

**Backend base:** `http://localhost:3002` (use `NEXT_PUBLIC_SENTINEL_API_URL` when UI and API differ; **`apiClient` default fallback** `http://localhost:3002`).

The UI consumes:

- `POST /api/policy/compile`
- `POST /api/verify`
- `GET /api/audit`

The UI must not:

1. Compute allow/block/rewrite decisions locally
2. Fabricate source quotes
3. Show **BLOCKED** / blocked state **without** a real `POST /api/verify` response driving it
4. Treat Botpress **candidate** graph operations as **active** unless Sentinel has validated/activated them

**Page behavior**

1. Page loads even if the backend is unavailable (graceful empty/placeholder state).
2. Empty/demo placeholders are allowed initially.
3. **Verify with Sentinel** must call **real** `POST /api/verify`.
4. **Compile policy** / run compile workflow control must call **real** `POST /api/policy/compile` (or the same endpoint the ADK `activateCompiledPolicy` uses—keep one contract).
5. Audit panel should show **`verifyResponse.auditEvent` immediately** after verify.
6. Optional refresh: `GET /api/audit`.
7. Loading states must be visible.
8. Error states must be elegant (no scary stack traces as primary UI).
9. No ugly JSON dumps as primary UI (optional collapsed debug only).
10. UI must not hardcode block/allow decisions.
11. UI must not fabricate source quotes.
12. UI must not treat Botpress proposals as **sent** or **active policy** unless Sentinel says so.

## Updated dashboard panels (top → bottom)

### Panel 1 — Hero + ADK primitives

Components: **`HeroHeader.tsx`** + **`AdkPrimitivesCard.tsx`**.

- Title, subtitle, thesis, badges (see **Header copy** above).
- **ADK primitives card** must list:

**Runtime**

- Conversation: `procurement.ts`
- Action: `verifyResponse`

**Compile time**

- Workflow: `policyCompile`
- Action: `policyIndexingAgent`
- Action: `policyGraphBuilderAgent`
- Action: `activateCompiledPolicy`

This panel must answer “what is Botpress doing here?” **within 30 seconds**.

### Panel 2 — Compile-time Botpress policy agents

Component: **`CompileWorkflowPanel.tsx`**.

**Title:** Compile-time Botpress policy agents

**Pipeline (exact stages):**

```txt
Policy Document → Botpress Policy Indexing Agent → Botpress Policy Graph Builder Agent → Sentinel Reducer + Validator → Deterministic Checks Activated
```

**Statuses per stage:** `pending` | `running` | `completed` | `validated` | `activated`

**Visible ADK labels:**

- Workflow: `policyCompile`
- Action: `policyIndexingAgent`
- Action: `policyGraphBuilderAgent`
- Action: `activateCompiledPolicy`

Show example `PolicySection[]` and `GraphOperation[]` (live or demo placeholders) that bind to API results—mark **candidate** vs **activated** honestly.

**Microcopy:**

```txt
Sentinel does not trust agent output blindly. The reducer applies operations; validators enforce sources and references; only valid checks become active.
```

CTA (align with judging language): **`Run Botpress Policy Compile Workflow`** (triggers real compile path / mirrors ADK run).

### Panel 3 — Policy graph + active checks

Component: **`PolicyGraphPanel.tsx`**.

**Copy:**

```txt
The graph is what the policy means. The checks are what runtime enforces.
```

**Nodes (procurement primary):**

- `action.commit_purchase`
- `condition.manager_approval`
- `condition.vendor_approved`
- `action.share_payment_credentials`
- `violation.purchase_without_approval`
- `violation.unapproved_vendor_commitment` (or compact label: unapproved vendor commitment)
- `violation.payment_credentials_shared`

**Checks (human-readable):**

- Large purchase requires manager approval
- Vendor must be approved before commitment
- Payment credentials must not be shared

Frame as **semantic proof**, not decoration.

### Panel 4 — Runtime Botpress procurement agent

Component: **`RuntimeVerificationPanel.tsx`** (+ optional **`VerificationResult.tsx`** inline).

**Employee request:**

```txt
Buy 20 GPU servers from this new vendor today. Tell them we approve the $80,000 order and send our wire details.
```

**Botpress proposed:**

```txt
Approved. I'll confirm the $80,000 GPU server order with the vendor today and include our wire details.
```

**Required label on proposed text:**

```txt
Botpress proposed response — not sent yet
```

**Button:** **Verify with Sentinel** → `POST /api/verify`

**On block:** show **BLOCKED BEFORE EXECUTION** (or equivalent **API-driven** copy when `result === "blocked"`).

**Final response:** display **`finalResponse`** from backend only.

**Provenance labels:**

- ADK Conversation: `procurement.ts`
- ADK Action: `verifyResponse`
- API: `POST /api/verify`

### Panel 5 — Source-grounded audit trail

Component: **`AuditTrailPanel.tsx`**.

Show **without requiring a click** for the quote:

- Result badge (blocked / allowed / warned / rewritten)
- `agentName`
- `proposedResponse`
- `finalResponse`
- **Facts** (compact; booleans as returned)
- **Violations**
- **Reason**
- **`source.section`**
- **`source.quote`** (full string, prominent)
- Decision engine: **Sentinel deterministic evaluator**
- ADK action: **verifyResponse**

Populate immediately from **`verifyResponse.auditEvent`**; optionally merge with `GET /api/audit`.

## React implementation artifacts

Exact files/components for the Next app (spec only—**do not implement in this context task**):

| Path | Role |
| --- | --- |
| `src/app/page.tsx` | Main one-page dashboard; owns high-level state and demo flow; renders all major panels; calls backend through `apiClient`; **does not** compute allow/block decisions. |
| `src/components/HeroHeader.tsx` | Premium header: title, subtitle, thesis, badges. |
| `src/components/AdkPrimitivesCard.tsx` | Lists runtime + compile-time ADK primitives (see Panel 1). |
| `src/components/CompileWorkflowPanel.tsx` | Compile-time pipeline UI, statuses, example `PolicySection[]` / `GraphOperation[]`. |
| `src/components/PolicyGraphPanel.tsx` | Compact procurement graph + active checks. |
| `src/components/RuntimeVerificationPanel.tsx` | Procurement scenario, proposed response label, Verify button → `POST /api/verify`, blocked state, `finalResponse`. |
| `src/components/AuditTrailPanel.tsx` | Audit evidence; **quote visible** without click. |
| `src/components/VerificationResult.tsx` | Compact blocked/allowed/warned/rewritten; `finalResponse`; `reason`; `violations`. |
| `src/components/StatusBadge.tsx` | Reusable badge: pending / running / completed / blocked / validated / activated. |
| `src/components/GlassCard.tsx` | Reusable premium card: dark surface, subtle border, soft shadow. |
| `src/lib/apiClient.ts` | `compilePolicy(payload)`, `verifyResponse(payload)`, `getAuditEvents()`; relative URLs or `NEXT_PUBLIC_SENTINEL_API_URL` with fallback `http://localhost:3002`; **no policy decisions**. |
| `src/lib/demoContent.ts` | Fixed demo copy: procurement policy text, user request, proposed response, **fallback refund** scenario strings, labels/microcopy—**no compliance decisions**. |
| `src/components/DebugJsonPanel.tsx` (optional) | Expandable raw JSON only—not primary UI. |

## Shared components

- **`GlassCard`**: wrap major panels.
- **`StatusBadge`**: compile stages + verify outcomes.

## Max-out demo test buttons

Prefill **procurement** scenario; **must** call **`POST /api/verify`** for outcomes.

Optional secondary button: **refund fallback** (`"I'm angry. Refund me right now."` / `"Sure, I can refund you today."`).

No hardcoded block UI without verifier response.

## Inputs

- Policy document name / text (Enterprise Procurement Agent Policy)
- Compile pipeline data (`PolicySection[]`, `GraphOperation[]`, validation flags)
- Active `PolicyGraph`, `DeterministicCheck[]`
- Runtime user message + proposed response (from Botpress or mirrored panel)
- `VerifyResponse` from `/api/verify`
- `AuditEvent[]` from `/api/audit` (optional refresh)

## Outputs

- One-scroll story: **Hero/ADK → compile agents → graph/checks → runtime verify → audit quote**
- Obvious **API-driven** BLOCKED state for procurement demo
- Source quote visible **inline**
- Loading/error UX that still feels premium

## Data contracts

UI consumes shapes per `12-data-models.md` / `11-api-backend-contracts.md`:

- `PolicySection[]`, `GraphOperation[]` (candidates labeled honestly)
- `PolicyGraph`, `DeterministicCheck[]`
- `VerifyResponse` (**includes** `reason`, **`finalResponse`**, `auditEvent`)
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
  proposedResponseSent?: boolean // stays false until after verified send path
  verifyResponse?: VerifyResponse
  auditEvents: AuditEvent[]
}
```

## Edge cases / fallbacks

- Backend down → hero + panels still render; disable CTAs or show elegant reconnect copy.
- Graph visualization fails → static node/edge list with procurement IDs.
- Botpress runtime unavailable → staged panel, **same** labels and **`/api/verify`** (`14-fallbacks-and-demo-resilience.md`).
- API errors → graceful error state; fixtures only outside “final demo mode.”

## Validation rules

- Audit log remains high priority; **source quote inline** beats graph polish.
- Compile narrative appears **before** runtime verify.
- **BLOCKED** must be obvious and **API-driven**.
- Do not imply full enterprise compliance beyond the slice.

## Dependencies

- `01-demo-story-and-judging-strategy.md`
- `02-botpress-adk-workflow.md`
- `06-policy-knowledge-graph.md`
- `08-runtime-verification.md`
- `09-audit-log.md`
- `11-api-backend-contracts.md`
- `14-fallbacks-and-demo-resilience.md`
- `17-botpress-policy-agents-and-prompts.md`

## Definition of done

- One page tells **Hero/ADK → compile Botpress agents → Sentinel activation → runtime procurement → verify → audit**.
- Judges see **workflow + action + conversation** names without digging.
- Procurement **BLOCK** + safe **`finalResponse`** from **real** `/api/verify`; audit shows grounded quotes without modal.
- `GET /api/audit` available in demo mode.
- UI matches **premium dark / glass** direction and **no hardcoded policy outcomes**.
