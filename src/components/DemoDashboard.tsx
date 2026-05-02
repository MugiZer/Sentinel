"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AuditEvent,
  BuildEvent,
  CompilePolicyResponse,
  DeterministicCheck,
  VerifyRequest,
  VerifyResponse,
} from "@/lib/sentinel/types";
import { NORTHSTAR_DOCUMENT_NAME, northstarPaymentCredentialsCheck } from "@/lib/sentinel/fixtures";

function compileTimelineRow(res: CompilePolicyResponse): BuildEvent[] {
  const ts = new Date().toISOString();
  return [
    {
      id: "compile.sections",
      timestamp: ts,
      type: "section_processed",
      message: `Indexed ${res.sections.length} section(s) · ${res.documentId}`,
    },
    {
      id: "compile.graph",
      timestamp: ts,
      type: "operation_applied",
      message: `Graph · ${res.graph.nodes.length} node(s), ${res.graph.edges.length} edge(s)`,
    },
    {
      id: "compile.checks",
      timestamp: ts,
      type: "checks_compiled",
      message: `Checks · ${res.checks.map((c) => c.id).join(", ") || "(none)"}`,
    },
    {
      id: "compile.meta",
      timestamp: ts,
      type: "operation_applied",
      message: res.generatedBy,
    },
  ];
}

const DEMO_USER_MESSAGE = "I'm angry. Refund me right now.";
const DEFAULT_AGENT = "NorthstarSupportBot";

async function extractPdfTextPageByPage(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const parts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const chunk = content.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .join(" ");
    parts.push(chunk);
  }

  return parts.join("\n\n").replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").trim();
}

export default function DemoDashboard() {
  const [compileResult, setCompileResult] = useState<CompilePolicyResponse | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const policyReady = compileResult !== null;
  const [agentName, setAgentName] = useState(DEFAULT_AGENT);
  const [userMessage, setUserMessage] = useState(DEMO_USER_MESSAGE);
  const [proposedResponse, setProposedResponse] = useState(
    "Sure, I can refund you today.",
  );
  const [verifyResponse, setVerifyResponse] = useState<VerifyResponse | null>(null);
  const [lastVerifiedKey, setLastVerifiedKey] = useState<string | null>(null);
  const [deliveredResponse, setDeliveredResponse] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /** When set (non-null), POST /api/policy/compile includes `text`; on PDF parse failure cleared so backend uses preload. */
  const [uploadedPolicyText, setUploadedPolicyText] = useState<string | null>(null);
  const [policyFileName, setPolicyFileName] = useState<string | null>(null);
  const [policyUploadError, setPolicyUploadError] = useState<string | null>(null);
  const [policyFileBusy, setPolicyFileBusy] = useState(false);
  const policyFileInputRef = useRef<HTMLInputElement>(null);

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

  function buildRequestKey(checks?: DeterministicCheck[]): string {
    const checkKey =
      checks && checks.length
        ? checks.map((c) => c.id).sort().join("|")
        : "active-default";
    return `${agentName.trim()}::${userMessage.trim()}::${proposedResponse.trim()}::${checkKey}`;
  }

  /** Uses compile output when present so verify matches last successful compile. */
  function checksForVerify(override?: DeterministicCheck[]): DeterministicCheck[] | undefined {
    if (override !== undefined) {
      return override;
    }
    return compileResult?.checks.length ? compileResult.checks : undefined;
  }

  async function runVerify(checks?: DeterministicCheck[]): Promise<VerifyResponse | null> {
    setLoading(true);
    setVerifyError(null);
    setDeliveredResponse(null);
    const effective = checksForVerify(checks);
    const requestKey = buildRequestKey(effective);
    try {
      const body: VerifyRequest = {
        agentName,
        userMessage,
        proposedResponse,
        ...(effective ? { checks: effective } : {}),
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
        setLastVerifiedKey(null);
        return null;
      }
      const verified = data as VerifyResponse;
      setVerifyResponse(verified);
      setLastVerifiedKey(requestKey);
      await refreshAudit();
      return verified;
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndDeliver() {
    const verified = await runVerify();
    if (!verified) {
      return;
    }
    setDeliveredResponse(verified.finalResponse ?? proposedResponse.trim());
  }

  function handlePolicyFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPolicyUploadError(null);

    if (!file) {
      setPolicyFileName(null);
      setUploadedPolicyText(null);
      return;
    }

    setPolicyFileName(file.name);
    const lower = file.name.toLowerCase();

    if (!lower.endsWith(".txt") && !lower.endsWith(".pdf")) {
      setUploadedPolicyText(null);
      setPolicyUploadError("Choose a .txt or .pdf file.");
      return;
    }

    if (lower.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = typeof reader.result === "string" ? reader.result : "";
        const text = raw.replace(/^\ufeff/, "").trim();
        if (!text.length) {
          setUploadedPolicyText(null);
          setPolicyUploadError("Text file is empty. Compile will use the preloaded policy.");
          return;
        }
        setUploadedPolicyText(text);
      };
      reader.onerror = () => {
        setUploadedPolicyText(null);
        setPolicyUploadError("Could not read the file. Compile will use the preloaded policy.");
      };
      reader.readAsText(file, "UTF-8");
      return;
    }

    setPolicyFileBusy(true);
    setUploadedPolicyText(null);
    void extractPdfTextPageByPage(file)
      .then((text) => {
        if (!text.length) {
          setUploadedPolicyText(null);
          setPolicyUploadError(
            "No text found in PDF (image-only?). Compile will use the preloaded policy.",
          );
          return;
        }
        setUploadedPolicyText(text);
      })
      .catch(() => {
        setUploadedPolicyText(null);
        setPolicyUploadError(
          "PDF text extraction failed. Compile will use the preloaded Northstar policy.",
        );
      })
      .finally(() => {
        setPolicyFileBusy(false);
      });
  }

  async function compilePolicy() {
    setCompiling(true);
    setCompileError(null);
    setCompileResult(null);
    try {
      const payload = {
        documentName: NORTHSTAR_DOCUMENT_NAME,
        generatedBy: "demo-dashboard",
        ...(uploadedPolicyText?.trim().length
          ? { text: uploadedPolicyText.trim() }
          : {}),
      };
      const res = await fetch("/api/policy/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const err = data as { error?: string };
        setCompileError(err.error ?? res.statusText);
        return;
      }
      setCompileResult(data as CompilePolicyResponse);
    } finally {
      setCompiling(false);
    }
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
        <h1>SENTINEL</h1>
        <span className="sentinel-muted" style={{ fontSize: "12px" }}>Prompting is not proof.</span>
      </header>

      <div className="sentinel-grid">
        <div className="sentinel-col">
          <div className="sentinel-actions">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", width: "100%" }}>
              <label className="sentinel-label" htmlFor="sentinel-policy-file">
                Policy document (.pdf or .txt)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <input
                  id="sentinel-policy-file"
                  ref={policyFileInputRef}
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  className="sentinel-input"
                  style={{ maxWidth: "min(100%, 220px)" }}
                  disabled={compiling || policyFileBusy}
                  onChange={handlePolicyFileChange}
                />
                {policyFileName ? (
                  <span className="sentinel-muted" style={{ fontSize: "0.82rem" }}>
                    {policyFileName}
                  </span>
                ) : null}
              </div>
              {policyFileBusy ? (
                <span className="sentinel-muted" style={{ fontSize: "0.78rem" }}>
                  Extracting text from PDF…
                </span>
              ) : null}
              {policyUploadError ? (
                <p className="sentinel-muted" style={{ margin: 0, fontSize: "0.78rem", color: "var(--danger)" }}>
                  {policyUploadError}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="sentinel-btn sentinel-btn-primary"
              disabled={compiling || policyFileBusy}
              onClick={() => void compilePolicy()}
            >
              {compiling ? "Compiling…" : "Run compile (API)"}
            </button>
            {compileError ? (
              <span className="sentinel-muted" style={{ color: "var(--danger)" }}>
                {compileError}
              </span>
            ) : !policyReady ? (
              <span className="sentinel-muted">
                Run compile to load sections, graph, and checks (optional upload supplies policy{" "}
                <code style={{ fontSize: "inherit" }}>text</code>).
              </span>
            ) : (
              <span className="sentinel-muted">
                Compiled ✓ · {compileResult!.checks.length} check(s) ·{" "}
                <span className="sentinel-code" style={{ fontSize: "0.85em" }}>
                  {compileResult!.generatedBy}
                </span>
              </span>
            )}
          </div>

          <section className="sentinel-panel">
            <h2 className="sentinel-panel-title">1 · Policy source</h2>
            {!policyReady ? (
              <p className="sentinel-muted">
                Click “Run compile (API)” to load indexed sections from the compile response.
              </p>
            ) : (
              <>
                <div className="sentinel-scroll">
                  {compileResult!.sections.map((s) => (
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
                    {compileTimelineRow(compileResult!).map((e) => (
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
                    <span>Nodes</span> {compileResult!.graph.nodes.length}
                  </div>
                  <div>
                    <span>Edges</span> {compileResult!.graph.edges.length}
                  </div>
                  <div>
                    <span>Active checks</span> {compileResult!.checks.length}
                  </div>
                </div>
                <div className="sentinel-scroll">
                  <div className="sentinel-label">Nodes</div>
                  {compileResult!.graph.nodes.map((n) => (
                    <div key={n.id} className="sentinel-graph-row sentinel-code">
                      {n.id} — {n.label}
                    </div>
                  ))}
                  <div className="sentinel-label" style={{ marginTop: "0.5rem" }}>
                    Edges
                  </div>
                  {compileResult!.graph.edges.map((e) => (
                    <div key={e.id} className="sentinel-graph-row sentinel-code">
                      {e.from} —[{e.type}]→ {e.to}
                    </div>
                  ))}
                  <div className="sentinel-label" style={{ marginTop: "0.5rem" }}>
                    Compiled checks
                  </div>
                  {compileResult!.checks.map((c) => (
                    <div key={c.id} className="sentinel-graph-row">
                      <span className="sentinel-code">{c.id}</span>
                      <div className="sentinel-muted">{c.source.quote}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        <div className="sentinel-col">
          <section className="sentinel-panel">
            <h2 className="sentinel-panel-title">3 · Botpress · proposed response</h2>
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
                disabled={loading || compiling}
                onClick={() => {
                  setUserMessage(DEMO_USER_MESSAGE);
                  setProposedResponse("Sure, I can refund you today.");
                  setLastVerifiedKey(null);
                  void runVerify();
                }}
              >
                Demo: refund → BLOCK
              </button>
              <button
                type="button"
                className="sentinel-btn"
                disabled={loading || compiling}
                onClick={() => {
                  setUserMessage("I need to update my payment method.");
                  setProposedResponse("Please send your full card number and CVV.");
                  setLastVerifiedKey(null);
                  void runVerify([northstarPaymentCredentialsCheck]);
                }}
              >
                Demo: card/CVV → BLOCK
              </button>
              <button
                type="button"
                className="sentinel-btn"
                disabled={loading || compiling}
                onClick={() => {
                  setUserMessage("I'd like a refund option.");
                  setProposedResponse("I can help submit a refund request for review.");
                  setLastVerifiedKey(null);
                  void runVerify();
                }}
              >
                Demo: procedural → ALLOW
              </button>
            </div>
            <button
              type="button"
              className="sentinel-btn sentinel-btn-primary"
              disabled={loading || compiling}
              onClick={() => void runVerify()}
            >
              {loading ? "Verifying…" : "Verify via /api/verify"}
            </button>
            <button
              type="button"
              className="sentinel-btn"
              disabled={loading || compiling}
              onClick={() => void verifyAndDeliver()}
            >
              {loading ? "Verifying…" : "Verify + send final response"}
            </button>
            {lastVerifiedKey !== buildRequestKey(checksForVerify()) ? (
              <p className="sentinel-muted" style={{ marginTop: "0.45rem", fontSize: "0.78rem" }}>
                Response is not deliverable yet. Verify current draft first so send uses Sentinel
                final output.
              </p>
            ) : null}
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
                  Violations:{" "}
                  {verifyResponse.violations.length ? verifyResponse.violations.join(", ") : "—"}
                </p>
              </div>
            ) : null}
            {deliveredResponse ? (
              <div className="sentinel-result" style={{ borderColor: "var(--ok)" }}>
                <span className="sentinel-badge allowed">Delivered to user</span>
                <p style={{ margin: "0.45rem 0 0", fontSize: "0.85rem" }}>{deliveredResponse}</p>
                <p className="sentinel-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.78rem" }}>
                  Delivery path is verify-gated and uses Sentinel final response.
                </p>
              </div>
            ) : null}
          </section>

          <section className="sentinel-panel">
            <h2 className="sentinel-panel-title">4 · Runtime audit log</h2>
            <div className="sentinel-scroll" style={{ maxHeight: 420 }}>
              {auditEvents.length === 0 ? (
                <p className="sentinel-muted">No audit events yet — run verify.</p>
              ) : (
                auditEvents.map((ev) => (
                  <article key={ev.id} className="sentinel-audit-card">
                    <strong
                      className={`sentinel-badge ${ev.result === "blocked" ? "blocked" : ev.result === "warned" ? "warned" : "allowed"}`}
                    >
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
                        <div
                          className="sentinel-muted"
                          style={{ fontSize: "0.65rem", marginBottom: "0.25rem" }}
                        >
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
    </div>
  );
}
