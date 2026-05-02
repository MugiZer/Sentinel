"use client";

import type { CompilePolicyResponse, DeterministicCheck, VerifyResponse } from "@/lib/sentinel/types";
import { DEMO_THESIS, ZONE_RUNTIME_TITLE } from "@/lib/demoCopy";
import { northstarPaymentCredentialsCheck } from "@/lib/sentinel/fixtures";
import VerificationResult from "./VerificationResult";

const DEMO_REFUND_MESSAGE = `I'm angry. Refund me right now.`;

export type BotpressRuntimePanelProps = {
  compileResult: CompilePolicyResponse | null;
  agentName: string;
  userMessage: string;
  proposedResponse: string;
  onAgentNameChange: (v: string) => void;
  onUserMessageChange: (v: string) => void;
  onProposedChange: (v: string) => void;
  onVerify: (checks?: DeterministicCheck[]) => void;
  onVerifyAndSend: () => void;
  loading: boolean;
  compiling: boolean;
  verifyResponse: VerifyResponse | null;
  verifyError: string | null;
  lastVerifiedKey: string | null;
  deliveredResponse: string | null;
};

function checksForVerify(compileResult: CompilePolicyResponse | null, override?: DeterministicCheck[]) {
  if (override !== undefined) return override;
  return compileResult?.checks?.length ? compileResult.checks : undefined;
}

export default function BotpressRuntimePanel(props: BotpressRuntimePanelProps) {
  const {
    compileResult,
    agentName,
    userMessage,
    proposedResponse,
    onAgentNameChange,
    onUserMessageChange,
    onProposedChange,
    onVerify,
    onVerifyAndSend,
    loading,
    compiling,
    verifyResponse,
    verifyError,
    lastVerifiedKey,
    deliveredResponse,
  } = props;

  function buildRequestKey(checks?: DeterministicCheck[]): string {
    const effective = checksForVerify(compileResult, checks);
    const checkKey =
      effective && effective.length ? effective.map((c) => c.id).sort().join("|") : "active-default";
    return `${agentName.trim()}::${userMessage.trim()}::${proposedResponse.trim()}::${checkKey}`;
  }

  const currentKey = buildRequestKey();
  const needsReverify = lastVerifiedKey !== null && lastVerifiedKey !== currentKey;

  return (
    <section className="sentinel-panel">
      <h2 className="sentinel-panel-title">{ZONE_RUNTIME_TITLE}</h2>
      <p className="sentinel-muted" style={{ margin: 0 }}>
        {DEMO_THESIS} Drafts route through <span className="sentinel-code">POST /api/verify</span> before send — UI reflects
        the live API outcome.
      </p>

      <div className="sentinel-agent-field">
        <span className="sentinel-label">Agent</span>
        <input className="sentinel-input" value={agentName} onChange={(e) => onAgentNameChange(e.target.value)} />
      </div>

      <div className="sentinel-chat-thread">
        <div className="sentinel-chat-bubble-wrap sentinel-chat-incoming">
          <span className="sentinel-label" style={{ marginBottom: "0.2rem", paddingLeft: "0.15rem" }}>
            Inbound
          </span>
          <div className="sentinel-chat-bubble sentinel-chat-incoming">
            <textarea
              className="sentinel-textarea"
              value={userMessage}
              onChange={(e) => onUserMessageChange(e.target.value)}
              aria-label="Inbound customer message"
            />
          </div>
        </div>

        <div className="sentinel-chat-bubble-wrap sentinel-chat-outgoing">
          <span className="sentinel-label" style={{ marginBottom: "0.2rem", paddingRight: "0.15rem", alignSelf: "flex-end" }}>
            Proposed reply
          </span>
          <div className="sentinel-chat-bubble sentinel-chat-outgoing">
            <textarea
              className="sentinel-textarea"
              value={proposedResponse}
              onChange={(e) => onProposedChange(e.target.value)}
              aria-label="Proposed agent reply"
            />
          </div>
        </div>
      </div>

      <div className="sentinel-presets">
        <button
          type="button"
          className="sentinel-btn"
          disabled={loading || compiling}
          onClick={() => {
            onUserMessageChange(DEMO_REFUND_MESSAGE);
            onProposedChange("Sure, I can refund you today.");
            onVerify();
          }}
        >
          Demo: refund · verify
        </button>
        <button
          type="button"
          className="sentinel-btn"
          disabled={loading || compiling}
          onClick={() => {
            onUserMessageChange("I need to update my payment method.");
            onProposedChange("Please send your full card number and CVV.");
            onVerify([northstarPaymentCredentialsCheck]);
          }}
        >
          Demo: card/CVV · verify
        </button>
        <button
          type="button"
          className="sentinel-btn"
          disabled={loading || compiling}
          onClick={() => {
            onUserMessageChange("I'd like a refund option.");
            onProposedChange("I can help submit a refund request for review.");
            onVerify();
          }}
        >
          Demo: procedural · verify
        </button>
      </div>

      <button
        type="button"
        className="sentinel-btn sentinel-btn-verify"
        disabled={loading || compiling}
        onClick={() => onVerify()}
      >
        {loading ? "Verifying…" : "Verify via /api/verify"}
      </button>

      <button type="button" className="sentinel-btn sentinel-btn-primary" disabled={loading || compiling} onClick={() => onVerifyAndSend()}>
        {loading ? "Verifying…" : "Verify + send final response"}
      </button>

      {needsReverify ? (
        <p className="sentinel-muted" style={{ margin: 0, fontSize: "0.74rem" }}>
          Draft changed since last verify — run verify again before delivery.
        </p>
      ) : null}

      <VerificationResult
        verifyResponse={verifyResponse}
        verifyError={verifyError}
        delivered={deliveredResponse !== null}
        proposedResponse={proposedResponse}
      />
    </section>
  );
}
