"use client";

import type { VerifyResponse } from "@/lib/sentinel/types";
import { VERIFIED_SENT_LABEL } from "@/lib/demoCopy";

export type VerificationResultProps = {
  verifyResponse: VerifyResponse | null;
  verifyError: string | null;
  delivered: boolean;
  proposedResponse: string;
};

function badgeClassForResult(result: VerifyResponse["result"]) {
  if (result === "blocked") return "blocked";
  if (result === "warned" || result === "rewritten") return "warned";
  return "allowed";
}

export default function VerificationResult({
  verifyResponse,
  verifyError,
  delivered,
  proposedResponse,
}: VerificationResultProps) {
  if (verifyError) {
    return (
      <div className="sentinel-result" style={{ borderColor: "rgba(255, 68, 68, 0.45)" }}>
        <span className="sentinel-badge blocked">Request error</span>
        <p style={{ margin: "0.45rem 0 0", fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>{verifyError}</p>
      </div>
    );
  }

  if (!verifyResponse) {
    return null;
  }

  const badgeClass = badgeClassForResult(verifyResponse.result);
  const isBlocked = verifyResponse.result === "blocked";
  const src = verifyResponse.auditEvent?.source;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {isBlocked ? (
        <div className="sentinel-verdict-alert" role="status">
          <div className="sentinel-verdict-alert-label">BLOCKED</div>
          <p className="sentinel-verdict-alert-caption">
            Proposed reply did not pass deterministic policy checks. Nothing is delivered until remediation or an allowed final
            path.
          </p>
        </div>
      ) : null}

      <div className="sentinel-result" style={{ borderColor: isBlocked ? "rgba(255, 68, 68, 0.35)" : "var(--border)" }}>
        {!isBlocked ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            <span className={`sentinel-badge ${badgeClass}`}>
              {verifyResponse.result === "rewritten"
                ? "rewritten"
                : verifyResponse.result === "allowed"
                  ? "allowed"
                  : verifyResponse.result}
            </span>
          </div>
        ) : null}

        <p style={{ margin: isBlocked ? "0" : "0.65rem 0 0", fontSize: "0.84rem", lineHeight: 1.5 }}>
          <span className="sentinel-muted" style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Final response
          </span>
          <br />
          <span>{verifyResponse.finalResponse ?? proposedResponse.trim()}</span>
        </p>

        {verifyResponse.reason ? (
          <p className="sentinel-muted" style={{ margin: "0.5rem 0 0", fontSize: "0.8rem" }}>
            {verifyResponse.reason}
          </p>
        ) : null}

        {verifyResponse.violations.length ? (
          <p className="sentinel-muted" style={{ margin: "0.45rem 0 0", fontSize: "0.74rem", fontFamily: "var(--font-mono)" }}>
            Violations: {verifyResponse.violations.join(", ")}
          </p>
        ) : null}

        {src?.quote ? (
          <div className="sentinel-pull-quote" style={{ marginTop: "0.65rem" }}>
            {src.quote}
          </div>
        ) : null}
      </div>

      {delivered ? (
        <div className="sentinel-result" style={{ borderColor: "rgba(34, 197, 94, 0.35)" }}>
          <span className="sentinel-badge allowed">{VERIFIED_SENT_LABEL}</span>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.82rem" }}>{verifyResponse.finalResponse ?? proposedResponse.trim()}</p>
        </div>
      ) : null}
    </div>
  );
}
