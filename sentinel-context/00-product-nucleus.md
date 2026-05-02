# Product Nucleus

## Purpose

Preserve Sentinel's core product identity so every implementation agent stays aligned.

Source sections: 0, 1, 2, 3, final concise definition.

Sentinel is a Botpress-native policy verification layer for enterprise AI agents. It turns enterprise policy documents into executable policy graphs that verify Botpress agent responses in real time.

Core thesis: prompting is not proof. The agent can be prompted to follow policy, but Sentinel adds an external verification layer that checks proposed responses before users see them.

## Builder ownership

**Shared owner:** Kaveh (Builder 1) and Hamza (Builder 2)

This file defines shared product alignment. Kaveh is responsible for preserving the demo/presentation interpretation. Hamza is responsible for preserving the backend/trustworthiness interpretation.

Any scope change here must be agreed by both builders.

## Why it matters for the demo

The demo must communicate one sharp vertical slice: a bank policy document becomes source-grounded runtime enforcement for a Botpress support agent. Judges should understand that Sentinel is not another prompt, chatbot wrapper, or broad compliance platform.

## Scope

### In scope

- Product name: Sentinel.
- Botpress-native framing.
- Northstar Bank support-agent demo.
- Policy document -> document index -> policy graph -> deterministic checks -> Botpress proposed response -> runtime fact extraction -> check evaluation -> allow/warn/block/rewrite -> audit log.
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

1. A company uploads or selects a policy document.
2. Sentinel indexes policy sections.
3. Policy extraction agents build a source-grounded policy graph.
4. Graph relations compile into deterministic checks.
5. A Botpress support agent drafts a response.
6. Sentinel extracts compact runtime facts from the proposed response.
7. Deterministic checks evaluate those facts.
8. Sentinel allows, warns, blocks, or rewrites the response.
9. Sentinel records an audit event with the source quote.

## Edge cases / fallbacks

- If policy ingestion fails, use the preloaded Northstar Bank policy text.
- If graph generation fails, use cached graph JSON.
- If Botpress integration fails, use a Botpress-style staged proposed-response panel while clearly explaining the intended verifier workflow.

## Validation rules

- Botpress must be central, not incidental.
- No active constraint may exist without a source quote.
- Runtime verification must not send the full policy document to the LLM.
- Deterministic checks, not prompts alone, make the enforcement decision.
- The implementation must remain achievable in the 5-hour hackathon window.

## Dependencies

- `01-demo-story-and-judging-strategy.md`
- `02-botpress-adk-workflow.md`
- `12-data-models.md`
- `13-validation-and-trustworthiness.md`

## Definition of done

- All feature specs use the same product definition.
- Every downstream file preserves "Prompting is not proof."
- Every downstream file preserves the core vertical slice.
- No downstream file expands Sentinel into a broad compliance platform.
