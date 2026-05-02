# Botpress ADK Workflow

## Purpose

Define exactly how Sentinel uses the Botpress Agent Development Kit (ADK) in the hackathon build.

Source sections: 6, 7, 13, 18.

Sentinel should not treat Botpress as a decorative chat panel. Botpress is the **enterprise agent runtime**. Sentinel is the **mandatory verification layer** that checks the agent’s **proposed response** before the user sees it or before commitments are implied in outbound messages.

**Core integration thesis:**

```txt
Botpress agents propose. Sentinel validates. Botpress sends only verified output.
```

## Botpress ADK framework (concise)

Botpress ADK is a **TypeScript framework and CLI** for building Botpress agents as code. An ADK project typically contains:

- `agent.config.ts`
- `agent.json`
- `package.json`
- `src/`

The ADK discovers exported primitives under `src/`:

- Conversations
- Actions
- Workflows
- Tools
- Tables
- Triggers
- Knowledge
- Evals

**For Sentinel:**

- **Conversation** implements the runtime **Enterprise Procurement Agent** (`procurement.ts`).
- **Actions** call Sentinel backend endpoints (`verifyResponse`, compile-time policy agents, `activateCompiledPolicy`).
- **Workflow** orchestrates compile-time policy agents (`policyCompile`).
- Zai structured extraction may produce `PolicySection[]` and `GraphOperation[]` (optional path; Sentinel still validates).
- Tables or structured logs may record provenance (optional).
- **Tools** are optional/model-called and **must not** implement mandatory verification.

**Mandatory verification rule:** Verification must **not** be an optional **Tool** (tools are model-callable). Sentinel verification must be **mandatory**, so implement it as an **Action** / direct code call after the model drafts.

## Two ADK integration surfaces

### 1) Compile time

```txt
Botpress Workflow: policyCompile
  -> Action: policyIndexingAgent
  -> Action: policyGraphBuilderAgent
  -> Action: activateCompiledPolicy  ->  POST /api/policy/compile  (Sentinel validates graph + checks; activates)
```

Botpress policy agents **propose** sections and graph operations. Sentinel **`/api/policy/compile`** is the authority that **validates**, **reduces**, and **activates** deterministic checks.

### 2) Runtime

```txt
Botpress Conversation: procurement.ts  ->  proposed response (not sent)
  -> Action: verifyResponse  ->  POST /api/verify
  -> Sentinel returns finalResponse (+ auditEvent)
  -> Botpress sends only verified finalResponse
```

## Builder ownership

**Builder 1 — Kaveh** owns the Botpress ADK project: conversations, workflows, actions, demo wiring, `adk dev`, and presentation alignment.

**Builder 2 — Hamza** owns Sentinel backend APIs and deterministic enforcement.

**Hamza dependency:** public contracts in `11-api-backend-contracts.md` / `12-data-models.md`.

**Integration boundary:** Botpress and the Next dashboard consume Hamza’s backend **only** via `POST /api/verify`, `POST /api/policy/compile`, `GET /api/audit`. **`/api/verify` is the runtime authority**—no hardcoded allow/block/rewrite in UI or agent.

## Required ADK primitives (hackathon)

**Runtime:**

- **Conversation:** `procurement.ts` (Enterprise Procurement Agent)
- **Action:** `verifyResponse` (mandatory; calls Sentinel)

**Compile time:**

- **Workflow:** `policyCompile`
- **Action:** `policyIndexingAgent`
- **Action:** `policyGraphBuilderAgent`
- **Action:** `activateCompiledPolicy` (calls Sentinel `/api/policy/compile` with candidate payload for validation + activation)

**Optional if time:**

- **Action:** `recordVerificationRun`, `recordCompileRun`
- Botpress Tables or structured logs for provenance
- ADK eval for procurement-block scenario

## ADK project runbook (terminal)

**ADK project root:**

```txt
C:\Users\moham\sentinel-botpress-agent
```

**PowerShell:**

```powershell
Set-Location "C:\Users\moham\sentinel-botpress-agent"
```

**Git Bash:**

```bash
cd /c/Users/moham/sentinel-botpress-agent
```

**Common commands:**

- `adk check`
- `adk status`
- `adk dev`
- `adk chat --single "..."` (or project-equivalent single-turn test)
- `adk workflows`
- `adk workflows inspect policyCompile`
- `adk workflows run policyCompile '<payload>' --wait --timeout 90s`

**Do not run `adk deploy` unless explicitly asked.**

**Warnings:**

- Do **not** run `adk` from `C:\Users\moham\OneDrive\Desktop\Sentinel`, the Sentinel backend repo root, Desktop, or a random CWD.
- Avoid full-disk search for `agent.json`—use the project root above.

## Why it matters for the demo

Botpress ADK use is a major judging requirement. The demo must show **both**:

1. **Compile-time** `policyCompile` with policy indexing + graph builder agents → Sentinel activation.
2. **Runtime** procurement agent that drafts a **proposed** reply → mandatory **`verifyResponse`** → **`/api/verify`**.

## ADK mental model (recap)

- **Conversation**: handles incoming user messages (e.g. Webchat).
- **execute()**: runs the autonomous AI loop inside a conversation.
- **Exit**: structured capture of model draft **before** send (pattern as in templates).
- **Action**: deterministic / orchestration code—**use for mandatory verify**.
- **Tool**: model may skip—**do not use for mandatory verify**.
- **Workflow**: multi-step orchestration—**`policyCompile`** at compile time only.

## Scope

### In scope

- Botpress ADK project for **Enterprise Procurement Agent**.
- **`policyCompile`** workflow and compile-time policy actions.
- **`procurement.ts`** Conversation: drafts **proposed response**, never sends raw draft before verify.
- **`verifyResponse`** Action → `POST /api/verify`.
- Fail-closed behavior if Sentinel verification is unavailable.
- Optional staged panel in Sentinel dashboard (still real `/api/verify`).
- Clear traces: **proposed** vs **verified final**.

### Out of scope

- Botpress as decorative frontend only.
- Full production Botpress deployment complexity (unless required for judging).
- Botpress agents directly mutating **active** graph/check state (Sentinel activates).
- Using **Tools** for mandatory verification.

## Recommended architecture

```txt
sentinel-backend/
  app/api/policy/compile/route.ts
  app/api/verify/route.ts
  app/api/audit/route.ts

sentinel-dashboard/  (Next app — separate or monorepo)
  src/app/page.tsx
  src/lib/apiClient.ts

sentinel-botpress-agent/  (ADK project — Kaveh)
  agent.config.ts
  agent.json
  package.json
  src/conversations/procurement.ts
  src/actions/verifyResponse.ts
  src/workflows/policyCompile.ts
  src/actions/policyIndexingAgent.ts
  src/actions/policyGraphBuilderAgent.ts
  src/actions/activateCompiledPolicy.ts
```

Sentinel backend owns: ingestion, indexing validation path, reducer/validator, check compilation, fact extraction (preferred), deterministic evaluation, audit store.

Botpress ADK owns: user-facing conversation, draft proposal, **mandatory** verify call, compile-time policy proposals, sending **`finalResponse`**.

## Inputs

- User message from Botpress.
- Proposed response from the procurement agent.
- Active checks (from compile activation); optional explicit checks in request per API contract.
- `SENTINEL_API_URL` pointing at Hamza’s backend (e.g. `http://localhost:3002`).

## Outputs

- Verification decision: `allowed`, `warned`, `blocked`, or `rewritten`.
- **`finalResponse`** string from Sentinel for Botpress to send when provided.
- **`reason`**, **`facts`**, **`violations`**, **`auditEvent`** per `11-api-backend-contracts.md`.

## Data contracts

Botpress runtime calls:

```txt
POST /api/verify
```

Request (shape):

```ts
type VerifyRequest = {
  agentName: string
  userMessage: string
  proposedResponse: string
}
```

Response (shape):

```ts
type VerifyResponse = {
  result: "allowed" | "warned" | "blocked" | "rewritten"
  finalResponse: string
  facts: Record<string, boolean>
  violations: string[]
  reason: string
  auditEvent: AuditEvent
}
```

Canonical types: `12-data-models.md`. Botpress must not call internal Sentinel modules.

Compile-time `activateCompiledPolicy` (or equivalent) calls `POST /api/policy/compile` with document + text + optional `candidateSections`, `candidateOperations`, `generatedBy: "botpress-policy-workflow"`.

## Main flow (runtime)

```txt
User message
-> procurement.ts receives message
-> execute() drafts proposed response; capture before send
-> verifyResponse Action calls Sentinel POST /api/verify
-> Sentinel extracts facts + runs deterministic checks
-> Sentinel returns result, finalResponse, auditEvent
-> Botpress sends finalResponse (not the raw draft when blocked/rewritten)
-> Dashboard may show same audit via GET /api/audit or embedded auditEvent
```

## Botpress ADK files

### `src/conversations/procurement.ts`

Purpose: handle messages for the **Botpress Enterprise Procurement Agent**.

Responsibilities:

- Receive user message.
- Ask the model to draft a procurement-related reply.
- **Do not** send the draft directly—label internally as **proposed only**.
- Call **`verifyResponse`** with `agentName`, `userMessage`, `proposedResponse`.
- Send **`verification.finalResponse`** (or agreed fallback) to the user.

Implementation sketch (pattern only; adjust imports to template):

```ts
import { Autonomous, Conversation, actions, z } from "@botpress/runtime"

const proposedResponseExit = new Autonomous.Exit({
  name: "proposedResponse",
  description: "Return the procurement reply draft for Sentinel verification before sending.",
  schema: z.object({
    response: z.string(),
  }),
})

export default new Conversation({
  channel: "webchat.channel",

  handler: async ({ type, message, conversation, execute }) => {
    if (type !== "message") return

    const userMessage = message.payload.text ?? ""

    const draft = await execute({
      instructions: `
        You are the Botpress Enterprise Procurement Agent.
        Be concise. You may draft a reply, but the system will verify it before anything is sent.
        Return the draft only through the proposedResponse exit.
      `,
      exits: [proposedResponseExit],
      temperature: 0.2,
    })

    const proposedResponse =
      draft.exit?.name === "proposedResponse"
        ? draft.exit.value.response
        : "I can help with procurement, but I need to verify policy before confirming anything."

    const verification = await actions.verifyResponse({
      agentName: "Botpress Enterprise Procurement Agent",
      userMessage,
      proposedResponse,
    })

    await conversation.send({
      type: "text",
      payload: {
        text: verification.finalResponse,
      },
    })
  },
})
```

Notes:

- Exact ADK import names may follow the generated template.
- Prefer **Action** for `verifyResponse`, not a Tool.

### `src/actions/verifyResponse.ts`

Purpose: bridge Botpress to Sentinel’s runtime verifier.

Responsibilities:

- `POST` to `${SENTINEL_API_URL}/api/verify`.
- Return JSON to the conversation.
- Fail closed if Sentinel is unavailable.

Implementation sketch:

```ts
import { Action, z } from "@botpress/runtime"

export default new Action({
  name: "verifyResponse",
  description: "Verify a proposed agent response against active Sentinel policy checks.",

  input: z.object({
    agentName: z.string(),
    userMessage: z.string(),
    proposedResponse: z.string(),
  }),

  output: z.object({
    result: z.enum(["allowed", "warned", "blocked", "rewritten"]),
    finalResponse: z.string(),
    facts: z.record(z.boolean()),
    violations: z.array(z.string()),
    reason: z.string(),
    auditEvent: z.any(),
  }),

  handler: async ({ input }) => {
    try {
      const res = await fetch(`${process.env.SENTINEL_API_URL}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })

      if (!res.ok) {
        throw new Error(`Sentinel verifier returned ${res.status}`)
      }

      return await res.json()
    } catch {
      return {
        result: "blocked",
        finalResponse:
          "I can help with this request, but I need to escalate it before confirming anything.",
        facts: {},
        violations: ["sentinel_verifier_unavailable"],
        reason: "Sentinel verifier was unavailable, so the response failed closed.",
        auditEvent: null,
      }
    }
  },
})
```

Fail-closed rule:

```txt
If Sentinel cannot verify the proposed response, Botpress must not send the unsafe draft.
```

## Why the verifier should not be a model-called Tool

```txt
Use Action/direct code call for mandatory verification.
Use Tool only for optional capabilities.
```

## Backend dependency rules

- Runtime: **`POST /api/verify`** only (plus dashboard parity).
- Compile: **`POST /api/policy/compile`** from `activateCompiledPolicy` (or workflow final step).

## Optional use of Zai

Prefer **`Sentinel backend owns fact extraction`** for runtime unless you intentionally split. Do not duplicate extraction in two places without reason.

## Workflows vs runtime path

- **Runtime:** `Conversation -> verifyResponse Action -> POST /api/verify` (not a runtime Workflow for **verify**).
- **Compile:** `policyCompile` Workflow with policy actions → Sentinel compile endpoint.

## Edge cases / fallbacks

Preferred live path:

```txt
Botpress Webchat -> procurement.ts -> verifyResponse -> Sentinel /api/verify -> verified message
```

Staged UI path (`14-fallbacks-and-demo-resilience.md`): same `/api/verify`, clear **Botpress** labels.

Environment:

```txt
SENTINEL_API_URL=http://localhost:3002
```

If Botpress Cloud cannot reach localhost, use **ngrok** or deploy Sentinel; update **`SENTINEL_API_URL`** / **`NEXT_PUBLIC_SENTINEL_API_URL`** accordingly (`14-fallbacks-and-demo-resilience.md`).

## Validation rules

- Botpress must not send the raw proposed response until Sentinel verification returns (or fail-closed path).
- Verification must be **code-invoked** (`Action`), not model-discretionary (`Tool`).
- `/api/verify` must not receive the full policy document.
- **`/api/verify`** is the **runtime authority** for compliance outcomes.

## Dependencies

- `00-product-nucleus.md`
- `08-runtime-verification.md`
- `11-api-backend-contracts.md`
- `12-data-models.md`
- `14-fallbacks-and-demo-resilience.md`
- `17-botpress-policy-agents-and-prompts.md`

## Definition of done

- **`policyCompile`** + runtime **`procurement.ts`** + **`verifyResponse`** are demonstrable.
- Proposed response is captured **before** send; **`finalResponse`** comes from **`/api/verify`** when blocking/rewriting.
- Staged fallback still uses real `/api/verify` and keeps Botpress visible.
- Presenter one-liner:

```txt
Botpress is the enterprise agent runtime; Sentinel is the mandatory policy verifier between the drafted response and the final message.
```

## Presenter explanation

```txt
We use Botpress ADK to ship an Enterprise Procurement Agent as code. The agent drafts a reply, but our conversation handler does not send it directly. It always calls verifyResponse, which posts to Sentinel /api/verify. Sentinel extracts facts, runs deterministic checks, and returns the safe finalResponse and audit evidence. So Botpress proposes; Sentinel validates; only verified output is sent.
```
