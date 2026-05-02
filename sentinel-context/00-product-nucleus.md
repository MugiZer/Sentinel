# Product Nucleus

## Purpose

Preserve Sentinel's core product identity so every implementation agent stays aligned.

Source sections: 0, 1, 2, 3, final concise definition.

Sentinel is a **policy firewall / verification layer** for **autonomous Botpress enterprise agents**. Botpress agents propose risky business actions and customer-facing text; Sentinel validates proposals **before** they are sent or executed, using policy documents compiled into deterministic checks and source-grounded audit evidence.

**Core thesis:** prompting is not proof. **Botpress agents propose. Sentinel validates. Botpress sends only verified output.**

Enterprise agents can accidentally commit money, approve the wrong vendors, or leak payment credentials—clear risks judges grasp quickly. The **primary hackathon demo** is an **Enterprise Procurement Agent**; a **refund / customer-support** path remains a **fallback / simple test** scenario (do not erase it from the build).

## Builder ownership

**Builder 1 — Kaveh:** frontend dashboard, Botpress ADK project, procurement runtime agent, compile-time policy workflow, demo surface, presentation.

**Builder 2 — Hamza:** Sentinel backend, canonical types, `/api/verify`, `/api/policy/compile`, `/api/audit`, deterministic evaluator, policy graph/checks, audit store, source quote validation, candidate vs active state.

**Integration:** Kaveh consumes Hamza’s backend only through those three HTTP APIs. **`/api/verify` is the runtime authority** for allow/block/rewrite; UI and Botpress must not hardcode final decisions.

Any scope change here must be agreed by both builders.

## Why it matters for the demo

The demo must communicate one sharp vertical slice: an **enterprise procurement policy** becomes **source-grounded runtime enforcement** for a **Botpress Enterprise Procurement Agent**. Judges should understand Sentinel is not another prompt, chatbot wrapper, or broad compliance platform—it is **mandatory verification between draft and send**.

## Scope

### In scope

- Product name: Sentinel.
- Category: policy firewall / verification layer for Botpress enterprise agents.
- **Primary:** Enterprise Procurement Agent demo (large purchase, approvals, vendor status, payment credential sharing).
- **Secondary / fallback:** customer-support refund promise scenario for resilience and quick tests.
- Policy document → document index → policy graph → deterministic checks → Botpress **proposed response** (candidate; not sent) → runtime fact extraction → check evaluation → allow/warn/block/rewrite → audit log.
- Source-grounded audit trail.
- Hackathon-safe scope.

### Out of scope

- Broad enterprise compliance management.
- Multi-policy approval workflows beyond the demo.
- Full production governance platform.
- Runtime rereading of the full policy document.
- Claims that LLM extraction alone guarantees compliance.

## Inputs

- `masterspec.md` sections 0, 1, 2, 3, and final concise definition.
- Product constraints from the hackathon.
- Botpress ADK requirement.

## Outputs

- A shared product thesis for all other context files.
- A clear vertical slice to implement.
- Scope guardrails for implementation agents.

## Data contracts

This file does not define runtime data contracts. It references the canonical types in `12-data-models.md`.

Core objects used by the product slice:

- `PolicySection`
- `PolicyGraph`
- `DeterministicCheck`
- `RuntimeFacts`
- `AuditEvent`

## Main flow

1. A company uploads or selects a policy document (e.g. **Enterprise Procurement Agent Policy**).
2. Sentinel indexes policy sections (with Botpress compile-time agents proposing structure; Sentinel validates and activates).
3. Policy extraction agents propose a source-grounded policy graph; Sentinel activates only validated graph/checks.
4. Graph relations compile into deterministic checks.
5. A **Botpress Enterprise Procurement Agent** drafts a **proposed response** (labeled **not sent yet**).
6. Sentinel extracts compact runtime facts from the proposed response (and context).
7. Deterministic checks evaluate those facts.
8. Sentinel allows, warns, blocks, or rewrites; **`/api/verify`** returns **`finalResponse`** for Botpress to send.
9. Sentinel records an audit event with the source quote.

## Edge cases / fallbacks

- If policy ingestion fails, use preloaded **Enterprise Procurement Agent Policy** text (and keep refund policy text available for fallback tests).
- If graph generation fails, use cached graph JSON.
- If Botpress integration fails, use a Botpress-style staged proposed-response panel while clearly explaining the intended verifier workflow. **Do not remove Botpress visibility.**

## Validation rules

- Botpress must be central, not incidental.
- No active constraint may exist without a source quote.
- Runtime verification must not send the full policy document to the LLM.
- Deterministic checks, not prompts alone, make the enforcement decision.
- The implementation must remain achievable in the 5-hour hackathon window.
- Frontend/Botpress must not treat candidate proposals as active until Sentinel validates activation; runtime decisions come from **`/api/verify`**.

## Dependencies

- `01-demo-story-and-judging-strategy.md`
- `02-botpress-adk-workflow.md`
- `12-data-models.md`
- `13-validation-and-trustworthiness.md`

## Definition of done

- All feature specs use the same product definition.
- Every downstream file preserves "Prompting is not proof" and **Botpress agents propose; Sentinel validates; Botpress sends only verified output.**
- Every downstream file preserves the core vertical slice (procurement primary).
- No downstream file expands Sentinel into a broad compliance platform.
