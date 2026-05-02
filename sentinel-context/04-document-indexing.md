# Document Indexing

## Purpose

Define the bounded source-grounding index used to navigate policy text during graph construction.

Source sections: 10, 15.

This is not a search system. It is a practical `PolicySection[]` structure that preserves source text so constraints can be traced back to exact policy quotes.

## Builder ownership

**Primary owner:** Hamza (Builder 2)

Hamza owns implementation for this file because it belongs to the Sentinel backend / truth engine.

**Kaveh dependency:** Kaveh consumes the output through the shared API/UI contract but should not modify this backend logic directly during the hackathon unless both builders agree.

Kaveh depends on this file only through API responses and canonical types. Do not require Kaveh to understand internal indexing implementation to build the UI/Botpress layer.

## Why it matters for the demo

The document index lets Sentinel show that constraints came from concrete policy sections. It also keeps the graph builder from repeatedly processing the full document.

## Scope

### In scope

- `PolicySection[]` only.
- Known Northstar policy section headers.
- Simple heading detection.
- Stable section IDs.
- Section text preservation.
- Source quote navigation.
- `containsPolicyLogic` boolean.
- `processed` flags for graph build state.
- Exact quote preservation for later validation.

### Out of scope

- Vector database.
- Embeddings.
- Semantic search.
- Large-scale indexing.
- Multi-document indexing.
- Perfect page extraction.
- Production document retrieval system.

## Inputs

- Plain policy text from ingestion.
- Document name.
- Known Northstar section headers.
- Simple inferred section headings when known headers are unavailable.

## Outputs

- `PolicySection[]`.
- Section map for the graph builder.
- Source text for quote validation.
- Processed flags for graph build state.

## Data contracts

```ts
type PolicySection = {
  id: string
  title: string
  page?: number
  text: string
  containsPolicyLogic: boolean
  processed: boolean
}
```

Stable section IDs:

- `refunds`
- `sensitive_payment_info`
- `investment_advice`
- `competitor_pricing`
- `escalation_requirements`

## Main flow

1. Receive plain policy text.
2. Try known Northstar policy section headers first.
3. If known headers are not found, use simple heading splitting.
4. Normalize section IDs deterministically.
5. Preserve section text for source quote matching.
6. Mark sections with enforceable policy text as `containsPolicyLogic = true`.
7. Initialize `processed = false`.
8. Pass sections into `GraphBuildState`.

## Edge cases / fallbacks

- Missing headings -> fallback to known Northstar section map.
- Duplicate headings -> append stable suffix.
- Non-policy section -> `containsPolicyLogic = false`.
- Page missing -> omit `page` but preserve section and quote.
- Messy PDF text -> normalize whitespace but preserve enough text for quote matching.
- Bad heading detection -> use hardcoded Northstar section map.

## Validation rules

- Every section must have `id`, `title`, `text`, `containsPolicyLogic`, and `processed`.
- Section IDs must be stable and deterministic.
- Source quotes must be exact or normalized substrings of section text.
- Every active constraint must reference a section and source quote.
- No source quote means no active constraint.
- Processed flags must reflect graph build progress.

## Dependencies

- `03-policy-document-ingestion.md`
- `05-rlm-graph-build-workspace.md`
- `06-policy-knowledge-graph.md`
- `13-validation-and-trustworthiness.md`

## Definition of done

- Northstar policy sections are indexed into real `PolicySection[]` objects.
- Section IDs are stable and usable by graph operations.
- Policy-relevant sections are marked correctly.
- Source text is preserved for quote validation.
- Graph builder can inspect bounded sections instead of full policy text.
