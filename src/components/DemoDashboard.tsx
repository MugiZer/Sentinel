"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuditEvent, DeterministicCheck, VerifyRequest, VerifyResponse } from "@/lib/sentinel/types";
import {
  NORTHSTAR_DOCUMENT_NAME,
  northstarDemoActiveChecks,
  northstarDemoBuildEvents,
  northstarDemoGraph,
  northstarDemoSections,
  northstarPaymentCredentialsCheck,
} from "@/lib/sentinel/fixtures";

const DEMO_USER_MESSAGE = "I'm angry. Refund me right now.";
const DEFAULT_AGENT = "NorthstarSupportBot";

export default function DemoDashboard() {
  const [policyReady, setPolicyReady] = useState(false);
  const [agentName, setAgentName] = useState(DEFAULT_AGENT);
  const [userMessage, setUserMessage] = useState(DEMO_USER_MESSAGE);
  const [proposedResponse, setProposedResponse] = useState(
    "Sure, I can refund you today.",
  );
  const [verifyResponse, setVerifyResponse] = useState<VerifyResponse | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshAudit = useCallback(async () => {
    const res = await fetch("/api/audit");
    const data = (await res.json()) as { events?: AuditEvent[] };
    setAuditEvents(data.events ?? []);
  }, []);

  useEffect(() => {
    void refreshAudit();
    const id = setInterval(() => void refreshAudit(), 4000);
    return () => clearInterval(id);
  }, [refreshAudit]);

  async function runVerify(checks?: DeterministicCheck[]) {
    setLoading(true);
    setVerifyError(null);
    try {
      const body: VerifyRequest = {
        agentName,
        userMessage,
        proposedResponse,
        ...(checks ? { checks } : {}),
      };
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const err = data as { error?: string };
        setVerifyError(err.error ?? res.statusText);
        setVerifyResponse(null);
        return;
      }
      setVerifyResponse(data as VerifyResponse);
      await refreshAudit();
    } finally {
      setLoading(false);
    }
  }

  function loadFixturePolicy() {
    setPolicyReady(true);
  }

  const resultClass =
    verifyResponse?.result === "blocked"
      ? "blocked"
      : verifyResponse?.result === "warned"
        ? "warned"
        : verifyResponse
          ? "allowed"
          : "";

  return (
    <div className="sentinel-page">
      <header className="sentinel-header">
        <h1>Sentinel demo dashboard</h1>
        <p>
          Four-panel Northstar slice — runtime decisions come only from{" "}
          <code className="sentinel-code">POST /api/verify</code>; audit from{" "}
          <code className="sentinel-code">GET /api/audit</code>. Policy compile API is not wired yet;
          compile steps below use fixtures.
        </p>
      </header>

      <div className="sentinel-actions">
        <button type="button" className="sentinel-btn sentinel-btn-primary" onClick={loadFixturePolicy}>
          Load policy (fixture)
        </button>
        {!policyReady ? (
          <span className="sentinel-muted">Load policy to reveal indexed sections and graph context.</span>
        ) : (
          <span className="sentinel-muted">
            Fixture compile loaded — validated ✓ · Source quotes ✓ · Checks active ✓
          </span>
        )}
      </div>

      <div className="sentinel-grid">
        <section className="sentinel-panel">
          <h2 className="sentinel-panel-title">1 · Policy source</h2>
          <div className="sentinel-muted">{NORTHSTAR_DOCUMENT_NAME}</div>
          {!policyReady ? (
            <p className="sentinel-muted">Click “Load policy (fixture)” to show indexed sections.</p>
          ) : (
            <>
              <div className="sentinel-scroll">
                {northstarDemoSections.map((s) => (
                  <div key={s.id} className="sentinel-section-card">
                    <h4>
                      {s.title}
                      {s.page != null ? ` · p.${s.page}` : ""}
                    </h4>
                    <p>{s.text}</p>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="sentinel-panel-title" style={{ marginTop: "0.5rem" }}>
                  Build timeline
                </h3>
                <ol className="sentinel-timeline" style={{ paddingLeft: "1.1rem", margin: 0 }}>
                  {northstarDemoBuildEvents.map((e) => (
                    <li key={e.id}>{e.message}</li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </section>

        <section className="sentinel-panel">
          <h2 className="sentinel-panel-title">2 · Policy graph & checks</h2>
          {!policyReady ? (
            <p className="sentinel-muted">Load policy to align graph with compiled checks.</p>
          ) : (
            <>
              <div className="sentinel-summary">
                <div>
                  <span>Nodes</span> {northstarDemoGraph.nodes.length}
                </div>
                <div>
                  <span>Edges</span> {northstarDemoGraph.edges.length}
                </div>
                <div>
                  <span>Active checks</span> {northstarDemoActiveChecks.length}
                </div>
              </div>
              <div className="sentinel-scroll">
                <div className="sentinel-label">Nodes</div>
                {northstarDemoGraph.nodes.map((n) => (
                  <div key={n.id} className="sentinel-graph-row sentinel-code">
                    {n.id} — {n.label}
                  </div>
                ))}
                <div className="sentinel-label" style={{ marginTop: "0.5rem" }}>
                  Edges
                </div>
                {northstarDemoGraph.edges.map((e) => (
                  <div key={e.id} className="sentinel-graph-row sentinel-code">
                    {e.from} —[{e.type}]→ {e.to}
                  </div>
                ))}
                <div className="sentinel-label" style={{ marginTop: "0.5rem" }}>
                  Compiled checks
                </div>
                {northstarDemoActiveChecks.map((c) => (
                  <div key={c.id} className="sentinel-graph-row">
                    <span className="sentinel-code">{c.id}</span>
                    <div className="sentinel-muted">{c.source.quote}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="sentinel-panel wide">
          <h2 className="sentinel-panel-title">3 · Botpress · proposed response</h2>
          <div className="sentinel-muted">
            Botpress panel (staged) — agent proposes text; Sentinel verifies before send.
          </div>
          <label className="sentinel-label">Agent name</label>
          <input
            className="sentinel-input"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
          />
          <label className="sentinel-label">User message</label>
          <textarea
            className="sentinel-textarea"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
          />
          <label className="sentinel-label">Proposed response (from Botpress)</label>
          <textarea
            className="sentinel-textarea"
            value={proposedResponse}
            onChange={(e) => setProposedResponse(e.target.value)}
          />
          <div className="sentinel-presets">
            <button
              type="button"
              className="sentinel-btn"
              disabled={loading}
              onClick={() => {
                setUserMessage(DEMO_USER_MESSAGE);
                setProposedResponse("Sure, I can refund you today.");
                void runVerify();
              }}
            >
              Demo: refund → BLOCK
            </button>
            <button
              type="button"
              className="sentinel-btn"
              disabled={loading}
              onClick={() => {
                setUserMessage("I need to update my payment method.");
                setProposedResponse("Please send your full card number and CVV.");
                void runVerify([northstarPaymentCredentialsCheck]);
              }}
            >
              Demo: card/CVV → BLOCK
            </button>
            <button
              type="button"
              className="sentinel-btn"
              disabled={loading}
              onClick={() => {
                setUserMessage("I'd like a refund option.");
                setProposedResponse("I can help submit a refund request for review.");
                void runVerify();
              }}
            >
              Demo: procedural → ALLOW
            </button>
          </div>
          <button
            type="button"
            className="sentinel-btn sentinel-btn-primary"
            disabled={loading}
            onClick={() => void runVerify()}
          >
            {loading ? "Verifying…" : "Verify via /api/verify"}
          </button>
          {verifyError ? (
            <div className="sentinel-result" style={{ borderColor: "var(--danger)" }}>
              <span className="sentinel-badge blocked">Error</span>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem" }}>{verifyError}</p>
            </div>
          ) : null}
          {verifyResponse ? (
            <div className="sentinel-result">
              <span className={`sentinel-badge ${resultClass}`}>{verifyResponse.result}</span>
              <p style={{ margin: "0.45rem 0 0", fontSize: "0.85rem" }}>
                <strong>Final response</strong> · {verifyResponse.finalResponse ?? "(unchanged)"}
              </p>
              {verifyResponse.reason ? (
                <p className="sentinel-muted" style={{ margin: "0.35rem 0 0" }}>
                  {verifyResponse.reason}
                </p>
              ) : null}
              <p className="sentinel-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.78rem" }}>
                Violations: {verifyResponse.violations.length ? verifyResponse.violations.join(", ") : "—"}
              </p>
            </div>
          ) : null}
        </section>

        <section className="sentinel-panel wide">
          <h2 className="sentinel-panel-title">4 · Runtime audit log</h2>
          <p className="sentinel-muted">
            Newest first from <code className="sentinel-code">GET /api/audit</code> (polls every 4s).
          </p>
          <div className="sentinel-scroll" style={{ maxHeight: 420 }}>
            {auditEvents.length === 0 ? (
              <p className="sentinel-muted">No audit events yet — run verify.</p>
            ) : (
              auditEvents.map((ev) => (
                <article key={ev.id} className="sentinel-audit-card">
                  <strong className={`sentinel-badge ${ev.result === "blocked" ? "blocked" : ev.result === "warned" ? "warned" : "allowed"}`}>
                    {ev.result}
                  </strong>
                  <div className="sentinel-muted" style={{ marginTop: "0.35rem", fontSize: "0.72rem" }}>
                    {ev.timestamp} · {ev.agentName}
                  </div>
                  <p style={{ margin: "0.35rem 0", fontSize: "0.82rem" }}>
                    <span className="sentinel-muted">User:</span> {ev.userMessage}
                  </p>
                  <p style={{ margin: "0.35rem 0", fontSize: "0.82rem" }}>
                    <span className="sentinel-muted">Proposed:</span> {ev.proposedResponse}
                  </p>
                  {ev.finalResponse ? (
                    <p style={{ margin: "0.35rem 0", fontSize: "0.82rem" }}>
                      <span className="sentinel-muted">Final:</span> {ev.finalResponse}
                    </p>
                  ) : null}
                  <p style={{ margin: "0.35rem 0", fontSize: "0.78rem" }}>{ev.reason}</p>
                  {ev.source?.quote ? (
                    <div className="sentinel-quote">
                      <div className="sentinel-muted" style={{ fontSize: "0.65rem", marginBottom: "0.25rem" }}>
                        Source · {ev.source.document} · {ev.source.section}
                        {ev.source.page != null ? ` · p.${ev.source.page}` : ""}
                      </div>
                      {ev.source.quote}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
