# Botpress ADK Workflow

## Purpose

Define exactly how Sentinel will use the Botpress Agent Development Kit (ADK) in the hackathon build.

Source sections: 6, 7, 13, 18.

Sentinel should not treat Botpress as a decorative chat panel. Botpress is the customer-facing agent runtime. Sentinel is the mandatory verification layer that checks the Botpress agent's proposed response before the user sees it.

Core integration thesis (aligned with `10-ui-ux-demo-dashboard.md`):

```txt
Botpress agents propose. Sentinel validates. Botpress sends only verified output.
```

Runtime support path:

```txt
Botpress drafts the proposed response.
Sentinel verifies via POST /api/verify.
Botpress sends only the verified final response.
```

Compile-time path:

```txt
Botpress Policy Indexing + Graph Builder agents propose sections and GraphOperation[].
Sentinel reducer + validator activates only validated graph/checks.
```

This preserves Sentinel's product thesis: prompting is not proof; verification is.

## Builder ownership

**Primary owner:** Whoever implements Botpress ADK for this build (not Kaveh).

Kaveh does not own Botpress ADK code. Kaveh owns the Sentinel frontend (`10-ui-ux-demo-dashboard.md`) and may align only on demo labels, staged panels, and how the story presents Botpress.

**Kaveh dependency:** Dashboard must reflect the verifier story and optional staged Botpress panel; no ADK implementation work in Kaveh's scope.

**Hamza dependency:** Hamza provides the backend API responses and canonical data contracts consumed here, but should not modify Botpress/UI flow directly during the hackathon unless both builders agree.

## Why it matters for the demo

Botpress ADK use is a major judging requirement. The demo must make Botpress visibly central without letting Botpress integration complexity consume the whole build.

The strongest demo story is:

1. A user messages the Northstar Bank Support Agent in Botpress.
2. The Botpress agent drafts an unsafe refund response.
3. Botpress does not send it immediately.
4. Botpress calls Sentinel's `/api/verify` endpoint.
5. Sentinel blocks or rewrites the response using deterministic checks.
6. Botpress sends the safe final response.
7. Sentinel's dashboard shows the audit event with the source quote.

## ADK mental model

Botpress ADK is a TypeScript framework for building Botpress agents as code.

Key concepts for Sentinel:

- **Conversation**: handles incoming user messages from a channel such as Webchat.
- **execute()**: runs the autonomous AI loop inside a conversation.
- **Exit**: lets `execute()` return structured output instead of directly sending a final user message.
- **Action**: reusable deterministic business logic callable from conversations, workflows, triggers, other actions, tools, or external systems.
- **Tool**: function the AI model may choose to call during `execute()`.
- **Workflow**: multi-step orchestration; use **`policyCompile`** for compile-time policy agents so judges see Botpress ADK (see `10-ui-ux-demo-dashboard.md`).
- **Trigger**: reacts to external/system events; optional for this demo.
- **Zai**: Botpress utility layer for structured LLM extraction/classification; optional because Sentinel's own backend can own fact extraction.

Important distinction:

```txt
Tool = model may choose to call it.
Action/direct code call = system definitely calls it.
```

Sentinel verification must be mandatory, so the verifier should be called by code through an Action or direct fetch, not left as an optional model-called Tool.

Hackathon judging (Montreal Cursor @ Botpress): **surface ADK visibly** — Workflow `policyCompile` with Actions `policyIndexingAgent`, `policyGraphBuilderAgent`, `activateCompiledPolicy` at compile time; Conversation `support.ts` and Action `verifyResponse` at runtime. Details and UI layout live in `10-ui-ux-demo-dashboard.md`.

## Scope

### In scope

- Botpress ADK project for the Northstar Bank Support Agent.
- Botpress Policy Compile Workflow for compile-time policy agents.
- One Conversation that handles support chat messages.
- `execute()` call that drafts a proposed response.
- Structured exit or equivalent pattern to capture the proposed response before sending.
- `verifyResponse` Action that calls Sentinel `/api/verify`.
- Fail-closed behavior if Sentinel verification is unavailable.
- Optional staged Botpress panel fallback in the Sentinel dashboard.
- Webchat/dev-console demo path.
- Clear logs/traces showing Botpress drafted and Sentinel verified.

### Out of scope

- Botpress as a decorative frontend only.
- Full production Botpress deployment complexity.
- Multi-agent Botpress orchestration.
- Botpress agents directly activating policy graph/check state.
- Botpress tables as the canonical Sentinel database.
- Botpress knowledge bases as the policy source of truth.
- HITL integration unless there is spare time.
- Complex workflows beyond the scoped **`policyCompile`** orchestration.
- Letting the support agent decide whether to call the verifier.
- Multi-tenant Botpress administration.

## Recommended architecture

```txt
sentinel-app/
  app/api/policy/compile/route.ts
  app/api/verify/route.ts
  app/api/audit/route.ts
  app/page.tsx

botpress-agent/
  agent.config.ts
  src/conversations/support.ts
  src/actions/verifyResponse.ts
```

Sentinel owns:

- policy ingestion
- document indexing
- reducer/validator state mutation
- policy graph activation
- deterministic checks
- runtime fact extraction
- audit log
- dashboard

Botpress owns:

- user-facing support conversation
- proposed response drafting
- mandatory call to Sentinel verifier
- sending final verified response
- compile-time policy-agent proposals through the Policy Compile Workflow

## Inputs

- User message from Botpress.
- Proposed response from the Botpress support agent.
- Active checks compiled from the policy graph.
- Compact fact keys from active checks.
- `SENTINEL_API_URL`.

## Outputs

- Verification decision: `allowed`, `warned`, `blocked`, or `rewritten`.
- Final response to send to the user.
- Audit event.
- Optional Botpress workflow/conversation state update.
- Logs/traces showing proposed response and Sentinel result.

## Data contracts

Botpress calls only one Sentinel endpoint during runtime:

```txt
POST /api/verify
```

Request:

```ts
type VerifyRequest = {
  agentName: string
  userMessage: string
  proposedResponse: string
}
```

Response:

```ts
type VerifyResponse = {
  result: "allowed" | "warned" | "blocked" | "rewritten"
  finalResponse?: string
  facts: RuntimeFacts
  violations: string[]
  auditEvent: AuditEvent
}
```

Canonical types live in `12-data-models.md`. Botpress should not call internal Sentinel modules. It should only call `/api/verify`.

## Main flow

```txt
User message
-> Botpress Conversation handler receives message
-> execute() drafts proposed response
-> proposed response is captured before sending
-> verifyResponse Action calls Sentinel /api/verify
-> Sentinel extracts runtime facts
-> Sentinel runs deterministic checks
-> Sentinel returns allowed / warned / blocked / rewritten
-> Botpress sends finalResponse if present, otherwise proposedResponse
-> Sentinel dashboard displays audit event
```

## Botpress ADK files

### `src/conversations/support.ts`

Purpose: handle customer messages for the Northstar Bank Support Agent.

Responsibilities:

- Receive user message.
- Ask the model to draft a support response.
- Prevent direct final sending before verification.
- Call `verifyResponse` action.
- Send only the verified final response.

Implementation sketch:

```ts
import { Autonomous, Conversation, actions, z } from "@botpress/runtime"

const proposedResponseExit = new Autonomous.Exit({
  name: "proposedResponse",
  description: "Return the support response draft for Sentinel verification before sending.",
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
        You are the Northstar Bank Support Agent.
        Be helpful and concise.
        Do not send the final response directly.
        Draft the response and return it through the proposedResponse exit.
      `,
      exits: [proposedResponseExit],
      temperature: 0.2,
    })

    const proposedResponse =
      draft.exit?.name === "proposedResponse"
        ? draft.exit.value.response
        : "I can help with that, but I need to verify policy before confirming anything."

    const verification = await actions.verifyResponse({
      agentName: "Northstar Bank Support Agent",
      userMessage,
      proposedResponse,
    })

    await conversation.send({
      type: "text",
      payload: {
        text: verification.finalResponse ?? proposedResponse,
      },
    })
  },
})
```

Notes:

- Exact ADK import names may need adjustment based on the generated ADK template.
- The architecture is more important than the exact import path.
- If structured exits are slow to wire, use a worker-style draft step or a controlled prompt that returns draft text to code, but still do not send before verification.

### `src/actions/verifyResponse.ts`

Purpose: bridge Botpress to Sentinel's runtime verifier.

Responsibilities:

- Accept `agentName`, `userMessage`, and `proposedResponse`.
- Call Sentinel `/api/verify`.
- Return the verification decision to the conversation handler.
- Fail closed if Sentinel is unavailable.

Implementation sketch:

```ts
import { Action, z } from "@botpress/runtime"

export default new Action({
  name: "verifyResponse",
  description: "Verify a proposed support-agent response against active Sentinel policy checks.",

  input: z.object({
    agentName: z.string(),
    userMessage: z.string(),
    proposedResponse: z.string(),
  }),

  output: z.object({
    result: z.enum(["allowed", "warned", "blocked", "rewritten"]),
    finalResponse: z.string().optional(),
    facts: z.record(z.boolean()).optional(),
    violations: z.array(z.string()),
    reason: z.string().optional(),
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

Tools are useful when the model needs optional abilities during `execute()`.

Sentinel verification is not optional.

Bad pattern:

```txt
Model decides whether to call verifyPolicy tool.
```

Better pattern:

```txt
Code always calls verifyResponse after the model drafts.
```

Reason:

- The support agent may forget to call a tool.
- The support agent may decide verification is unnecessary.
- The support agent may call the tool too late.
- Sentinel's thesis requires external mandatory verification.

Therefore:

```txt
Use Action/direct code call for mandatory verification.
Use Tool only for optional capabilities.
```

## Backend dependency rules

Botpress calls Sentinel through public API endpoints only.

Runtime:

- Botpress support agent calls `/api/verify`.

Compile time:

- Botpress policy workflow may call `/api/policy/compile` with candidate sections/operations.

Botpress agents propose. Sentinel validates and enforces.

## Optional use of Zai

Zai may be useful for structured fact extraction, but it is optional for the hackathon.

Preferred 4-hour architecture:

```txt
Botpress drafts response.
Sentinel backend extracts facts.
Sentinel backend evaluates checks.
```

Optional alternative:

```txt
Botpress drafts response.
Botpress Zai extracts facts.
Sentinel backend evaluates deterministic checks.
```

Do not split fact extraction across both systems unless needed. One owner is simpler.

Recommended owner:

```txt
Sentinel backend owns fact extraction.
```

## Workflows vs runtime path

Do not use Workflows for **runtime** verification in the hackathon. Runtime stays direct:

```txt
Conversation -> verifyResponse Action -> POST /api/verify -> Botpress sends final response
```

For **compile time**, expose a Botpress ADK Workflow **`policyCompile`** that orchestrates indexing and graph-builder actions (`policyIndexingAgent`, `policyGraphBuilderAgent`, `activateCompiledPolicy`). The dashboard should show this workflow explicitly (`10-ui-ux-demo-dashboard.md`). Sentinel owns **`POST /api/policy/compile`** as the authoritative apply/validate/activate boundary:

```txt
Botpress Workflow policyCompile + policy agents propose sections and GraphOperation[].
Sentinel reducer/validator applies, validates sources/edges, compiles checks, activates.
```

See `17-botpress-policy-agents-and-prompts.md` for the compile-time agent spawning/prompt plan.

## Edge cases / fallbacks

Preferred live path:

```txt
Real Botpress Webchat
-> real Conversation handler
-> real verifyResponse Action
-> real Sentinel /api/verify
-> real Botpress final response
```

Fallback path if Botpress integration is not stable by the cutoff:

```txt
Sentinel dashboard shows a staged Botpress proposed-response panel.
Panel uses the same proposedResponse string and calls the same /api/verify endpoint.
Presenter says: "This panel represents the proposed-response stage our Botpress verifier workflow calls."
```

Fallback is acceptable only if:

- Botpress remains visible in the UI/story.
- `/api/verify` remains real.
- Deterministic checks remain real.
- Audit log remains real.
- No hardcoded blocked result bypasses the verifier.

Cutoff rule:

```txt
If real Botpress integration is not working by T-minus 40 minutes, switch to staged Botpress panel.
```

Do not let Botpress wiring destroy the core Sentinel demo.

Environment variable:

```txt
SENTINEL_API_URL=https://your-sentinel-app-url
```

For local demo:

```txt
SENTINEL_API_URL=http://localhost:3000
```

If Botpress Cloud cannot reach localhost, use a tunnel or deploy Sentinel first. If that fails, use staged fallback panel.

## Validation rules

- Botpress must not send the raw proposed response until Sentinel verification returns.
- Verification must be called by deterministic code, not left to model discretion.
- `/api/verify` must not receive or read the full policy document.
- Botpress should send `finalResponse` if Sentinel returns one.
- If Sentinel returns `blocked` without `finalResponse`, Botpress should send a safe fallback escalation response.
- If Sentinel is unavailable, Botpress fails closed.
- The Sentinel dashboard must show the audit event produced by the same verification call.
- The demo must clearly label Botpress as the customer-facing agent runtime.
- The deterministic check engine remains code, not a Botpress agent.

## Dependencies

- `00-product-nucleus.md`
- `08-runtime-verification.md`
- `11-api-backend-contracts.md`
- `12-data-models.md`
- `14-fallbacks-and-demo-resilience.md`
- `17-botpress-policy-agents-and-prompts.md`

## Definition of done

- A Botpress ADK Conversation can receive a support message.
- The support agent can produce a proposed response.
- The proposed response is captured before final sending.
- Botpress calls Sentinel `/api/verify` through an Action or direct code call.
- Botpress sends only the verified final response.
- Sentinel dashboard shows the verification result and audit event.
- If live Botpress integration fails, the staged panel uses the same `/api/verify` path.
- The demo can explain the ADK architecture in one sentence:

```txt
Botpress is the customer-facing agent runtime; Sentinel is the mandatory policy verifier between the drafted response and the final message.
```

## Presenter explanation

```txt
We used Botpress ADK to build the Northstar Bank Support Agent as code. The agent drafts a response, but our conversation handler does not send it directly. Instead, it calls a Sentinel verification action, which sends the proposed response to /api/verify. Sentinel extracts facts, runs deterministic policy checks, and returns the allowed or rewritten response. So Botpress remains the agent runtime, while Sentinel is the mandatory policy enforcement layer.
```
