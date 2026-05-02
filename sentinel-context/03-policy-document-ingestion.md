# Policy Document Ingestion

## Purpose

Define how a policy document enters Sentinel and becomes plain text for compile-time processing.

Source sections: 9, 16, 22.

Sentinel is not a PDF parser. Sentinel is a policy verification layer. Ingestion should be real, boring, and hard to break.

## Builder ownership

**Primary owner:** Hamza (Builder 2)

Hamza owns implementation for this file because it belongs to the Sentinel backend / truth engine.

**Kaveh dependency:** Kaveh consumes the output through the shared API/UI contract but should not modify this backend logic directly during the hackathon unless both builders agree.

Kaveh depends on this file only through API responses and canonical types. Do not require Kaveh to understand internal ingestion implementation to build the frontend.

## Why it matters for the demo

The demo begins with a company policy document. The system must make that document feel real while avoiding fragile document-processing work that can consume the hackathon.

## Scope

### In scope

- Preloaded Northstar Bank policy fixture.
- Textarea/text upload path.
- Best-effort PDF text extraction using an existing package.
- Fallback to preloaded text.
- Compile-time extraction only.
- Preserving raw section text for source quotes.
- Policy document name and plain text passed into parsing/indexing.

### Out of scope

- OCR.
- Scanned PDF support.
- Page-perfect parsing.
- Production document storage.
- Multi-document management.
- Runtime PDF reads.
- Advanced document management.
- Production-grade PDF parser reliability.

## Inputs

- `documentName`: `Northstar Bank AI Agent Compliance Manual`.
- Preloaded policy text, pasted textarea text, uploaded `.txt` text, or best-effort PDF-derived text.
- Optional uploaded PDF file.

Recommended demo policy sections:

- Refunds and Reimbursements.
- Sensitive Payment Information.
- Investment Advice.
- Competitor Pricing.
- Escalation Requirements.

## Outputs

- Non-empty plain policy text for compile-time use.
- Parsed document metadata.
- Input to `policyParser.ts`.
- Input to document indexing.

## Data contracts

```ts
type CompilePolicyRequest = {
  documentName: string
  text?: string
}

type CompilePolicyResponse = {
  documentId: string
  sections: PolicySection[]
  graph: PolicyGraph
  checks: DeterministicCheck[]
}
```

If the UI supports file upload, file-derived text should be extracted before calling the compile pipeline or normalized into the same `text` field.

## Main flow

1. User selects preloaded Northstar Bank policy, pastes policy text into a textarea, or uploads a simple text/PDF file.
2. If text is provided, use it directly.
3. If a text file is uploaded, read it as plain text.
4. If a PDF is uploaded, use an existing library for best-effort text extraction.
5. If extraction fails or text is empty, fallback to preloaded Northstar Bank policy.
6. Normalize plain text lightly.
7. Pass plain text into policy parsing/document indexing.

## Edge cases / fallbacks

- PDF parsing fails -> preloaded policy.
- PDF is scanned/image-only -> preloaded policy; OCR is out of scope.
- Empty upload -> preloaded policy selector.
- Weird formatting -> simple text normalization and known section headers.
- Section detection is weak -> use known Northstar section headers.
- Compile step times out -> use cached compile output.

## Validation rules

- Runtime verification must never read the PDF.
- Extracted text must be non-empty before compile.
- If extraction fails, use preloaded policy text.
- Source quotes must come from the extracted/preloaded text.
- `documentName` must match source quotes and audit events.
- The ingestion path must preserve section text exactly enough for source quote matching.

## Dependencies

- `04-document-indexing.md`
- `05-rlm-graph-build-workspace.md`
- `13-validation-and-trustworthiness.md`
- `14-fallbacks-and-demo-resilience.md`

## Definition of done

- User can load policy text through preloaded fixture, textarea/text upload, or best-effort PDF extraction.
- Empty or failed extraction falls back to Northstar policy.
- Compile pipeline receives non-empty plain text.
- No runtime path reads the full policy document or PDF.
