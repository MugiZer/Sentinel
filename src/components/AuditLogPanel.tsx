"use client";

import type { AuditEvent } from "@/lib/sentinel/types";
import { ZONE_AUDIT_TITLE } from "@/lib/demoCopy";

export type AuditLogPanelProps = {
  events: AuditEvent[];
  highlightEventId: string | null;
};

function ResultBadge({ result }: { result: AuditEvent["result"] }) {
  const cls =
    result === "blocked" ? "blocked" : result === "warned" ? "warned" : result === "rewritten" ? "warned" : "allowed";
  const label = result === "rewritten" ? "rewritten" : result;
  return <span className={`sentinel-badge ${cls}`}>{label}</span>;
}

export default function AuditLogPanel({ events, highlightEventId }: AuditLogPanelProps) {
  return (
    <section className="sentinel-panel">
      <h2 className="sentinel-panel-title">{ZONE_AUDIT_TITLE}</h2>
      <p className="sentinel-muted" style={{ margin: 0 }}>
        Newest-first stream from <span className="sentinel-code">GET /api/audit</span> · polled every 4s.
      </p>

      <div className="sentinel-scroll" style={{ maxHeight: 460 }}>
        {events.length === 0 ? (
          <p className="sentinel-muted">No audit events yet — run verify.</p>
        ) : (
          events.map((ev) => {
            const highlight = highlightEventId === ev.id;
            return (
              <article
                key={ev.id}
                className={`sentinel-audit-card${highlight ? " sentinel-audit-card-highlight" : ""}`}
              >
                <div className="sentinel-audit-head">
                  <ResultBadge result={ev.result} />
                  <span className="sentinel-audit-agent">{ev.agentName}</span>
                  <span className="sentinel-audit-time">{ev.timestamp}</span>
                </div>

                <p className="sentinel-audit-reason">{ev.reason}</p>

                {ev.source?.quote ? (
                  <div className="sentinel-pull-quote" style={{ marginTop: 0 }}>
                    {ev.source.quote}
                  </div>
                ) : (
                  <p className="sentinel-muted" style={{ margin: "0 0 0.15rem", fontSize: "0.72rem" }}>
                    No policy quote on this entry.
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
