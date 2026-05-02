"use client";

import type { CompilePolicyResponse, DeterministicCheck, PolicyEdge, PolicyNode } from "@/lib/sentinel/types";
import { DEMO_THESIS, ZONE_GRAPH_TITLE } from "@/lib/demoCopy";

const HIGHLIGHT_IDS = new Set([
  "action.promise_refund",
  "condition.manager_approval",
  "violation.refund_without_approval",
  "check.refund_requires_approval",
]);

function SourceBadge({ quote, section }: { quote?: string; section?: string }) {
  if (!quote?.trim()) return null;
  return (
    <div
      className="sentinel-quote"
      style={{
        marginTop: "0.35rem",
        fontSize: "0.72rem",
        borderLeftColor: "var(--accent)",
      }}
    >
      {section ? (
        <div className="sentinel-muted" style={{ fontSize: "0.65rem", marginBottom: "0.2rem" }}>
          Source · {section}
        </div>
      ) : null}
      {quote}
    </div>
  );
}

function checksForNode(n: PolicyNode, all: DeterministicCheck[]): DeterministicCheck[] {
  if (n.id === "action.promise_refund" || n.id === "condition.manager_approval" || n.id === "violation.refund_without_approval") {
    return all.filter((c) => c.id === "check.refund_requires_approval");
  }
  return all.filter((c) => c.trigger === n.id || c.violation === n.id);
}

function NodeRow({ n, checks }: { n: PolicyNode; checks: DeterministicCheck[] }) {
  const emphasis = HIGHLIGHT_IDS.has(n.id);
  const linked = checksForNode(n, checks);
  return (
    <div
      key={n.id}
      className="sentinel-graph-row"
      style={{
        borderLeft: emphasis ? "3px solid var(--accent)" : undefined,
        paddingLeft: emphasis ? "0.4rem" : undefined,
      }}
    >
      <div className="sentinel-code" style={{ fontWeight: emphasis ? 700 : 500 }}>
        {n.id}
      </div>
      <div style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>{n.label}</div>
      {n.description ? (
        <div className="sentinel-muted" style={{ fontSize: "0.72rem" }}>
          {n.description}
        </div>
      ) : null}
      <SourceBadge quote={n.source?.quote} section={n.source?.section} />
      {linked.length > 0 ? (
        <div style={{ marginTop: "0.35rem", fontSize: "0.7rem", color: "var(--muted)" }}>
          Linked checks ·{" "}
          {linked.map((c) => (
            <span key={c.id} className="sentinel-code" style={{ marginRight: "0.35rem" }}>
              {c.id}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EdgeRow({ e, checks }: { e: PolicyEdge; checks: DeterministicCheck[] }) {
  const semantic =
    HIGHLIGHT_IDS.has(e.from) || HIGHLIGHT_IDS.has(e.to) || e.id.includes("promise_refund") || e.type === "requires";
  const relatedQuote = checks.find((c) => c.source.quote === e.source?.quote)?.source;
  return (
    <div
      key={e.id}
      className="sentinel-graph-row"
      style={{
        borderLeft: semantic ? "3px solid var(--accent)" : undefined,
        paddingLeft: semantic ? "0.4rem" : undefined,
      }}
    >
      <div className="sentinel-code" style={{ fontWeight: semantic ? 700 : 500 }}>
        {e.from} —[{e.type}]→ {e.to}
      </div>
      <div className="sentinel-muted" style={{ fontSize: "0.7rem", marginTop: "0.2rem" }}>
        {e.id}
      </div>
      <SourceBadge quote={e.source?.quote ?? relatedQuote?.quote} section={e.source?.section ?? relatedQuote?.section} />
    </div>
  );
}

export type PolicyGraphPanelProps = {
  compileResult: CompilePolicyResponse | null;
};

export default function PolicyGraphPanel({ compileResult }: PolicyGraphPanelProps) {
  const policyReady = compileResult !== null;

  return (
    <section className="sentinel-panel">
      <h2 className="sentinel-panel-title">{ZONE_GRAPH_TITLE}</h2>
      <p className="sentinel-muted" style={{ margin: 0 }}>
        {DEMO_THESIS} Graph + checks form the semantic proof layer — not decoration alone.
      </p>

      {!policyReady ? (
        <p className="sentinel-muted">Compile policy first to load graph nodes, edges, and active checks.</p>
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
            <div className="sentinel-label">Graph nodes · evidence ids</div>
            {compileResult!.graph.nodes.map((n) => (
              <NodeRow key={n.id} n={n} checks={compileResult!.checks} />
            ))}

            <div className="sentinel-label" style={{ marginTop: "0.6rem" }}>
              Graph edges
            </div>
            {compileResult!.graph.edges.map((e) => (
              <EdgeRow key={e.id} e={e} checks={compileResult!.checks} />
            ))}

            <div className="sentinel-label" style={{ marginTop: "0.6rem" }}>
              Deterministic checks + source quotes
            </div>
            {compileResult!.checks.map((c) => (
              <div key={c.id} className="sentinel-graph-row">
                <div className="sentinel-code" style={{ fontWeight: 700 }}>
                  {c.id}
                </div>
                <div style={{ fontSize: "0.78rem" }}>{c.name}</div>
                <div className="sentinel-muted" style={{ fontSize: "0.72rem", marginTop: "0.2rem" }}>
                  trigger <span className="sentinel-code">{c.trigger}</span>
                  {c.required ? (
                    <>
                      {" "}
                      · requires <span className="sentinel-code">{c.required}</span>
                    </>
                  ) : null}
                  {c.forbidden ? (
                    <>
                      {" "}
                      · <span className="sentinel-code">forbidden</span>
                    </>
                  ) : null}
                </div>
                <div className="sentinel-muted" style={{ fontSize: "0.72rem", marginTop: "0.2rem" }}>
                  violation <span className="sentinel-code">{c.violation}</span> · severity{" "}
                  <span className="sentinel-code">{c.severity}</span>
                </div>
                <SourceBadge quote={c.source.quote} section={c.source.section} />
              </div>
            ))}
          </div>

          <p className="sentinel-muted" style={{ margin: 0, fontSize: "0.72rem" }}>
            Demo trace ·{" "}
            <span className="sentinel-code">action.promise_refund</span> →{" "}
            <span className="sentinel-code">condition.manager_approval</span> →{" "}
            <span className="sentinel-code">violation.refund_without_approval</span> · check{" "}
            <span className="sentinel-code">check.refund_requires_approval</span>
          </p>
        </>
      )}
    </section>
  );
}
