"use client";

import {
  ADK_ACTION_ACTIVATE_COMPILED,
  ADK_ACTION_GRAPH_BUILDER,
  ADK_ACTION_POLICY_INDEXING,
  ADK_WORKFLOW_COMPILE,
  DEMO_THESIS,
} from "@/lib/demoCopy";

export default function AdkPrimitivesPanel({ disabled }: { disabled?: boolean }) {
  return (
    <div
      className="sentinel-adk-block"
      style={{
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <div className="sentinel-panel-title" style={{ marginBottom: "0.5rem", color: "var(--muted)" }}>
        Compile workflow
      </div>
      <p className="sentinel-muted" style={{ margin: "0 0 0.5rem" }}>
        <strong style={{ color: "var(--text)" }}>{DEMO_THESIS}</strong>
      </p>
      <div className="sentinel-code" style={{ marginBottom: "0.35rem", fontSize: "0.72rem" }}>
        Workflow · <span style={{ color: "var(--accent)" }}>{ADK_WORKFLOW_COMPILE}</span>
      </div>
      <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.74rem", color: "var(--muted)" }}>
        <li>
          Action · <span className="sentinel-code">{ADK_ACTION_POLICY_INDEXING}</span>
        </li>
        <li>
          Action · <span className="sentinel-code">{ADK_ACTION_GRAPH_BUILDER}</span>
        </li>
        <li>
          Action · <span className="sentinel-code">{ADK_ACTION_ACTIVATE_COMPILED}</span>
        </li>
      </ul>
    </div>
  );
}
