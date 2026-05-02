"use client";

import type { CompilePolicyResponse } from "@/lib/sentinel/types";
import { DEMO_THESIS, ZONE_COMPILE_TITLE } from "@/lib/demoCopy";
import AdkPrimitivesPanel from "./AdkPrimitivesPanel";

export type PolicyCompilePanelProps = {
  compiling: boolean;
  compileError: string | null;
  compileResult: CompilePolicyResponse | null;
  onCompile: () => void;
  documentTitle: string;
};

function CompilePipelineRail({ active }: { active: boolean }) {
  const steps = [
    { label: "Policy document", sentinel: false },
    { label: "Botpress Policy Indexing Agent", sentinel: false, code: true },
    { label: "Botpress Policy Graph Builder Agent", sentinel: false, code: true },
    { label: "Sentinel reducer + validator", sentinel: true },
    { label: "Deterministic checks activated", sentinel: true },
  ];
  return (
    <div style={{ marginTop: "0.35rem" }}>
      <div className="sentinel-label">Pipeline</div>
      <ol style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.78rem" }}>
        {steps.map((s, i) => (
          <li
            key={s.label}
            style={{
              marginBottom: "0.35rem",
              color: s.sentinel ? "var(--accent)" : "var(--muted)",
              fontWeight: s.sentinel ? 600 : 400,
              opacity: active || i <= 4 ? 1 : 0.45,
            }}
          >
            {s.code ? (
              <span className="sentinel-code" style={{ color: "inherit" }}>
                {s.label}
              </span>
            ) : (
              s.label
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function PolicyCompilePanel({
  compiling,
  compileError,
  compileResult,
  onCompile,
  documentTitle,
}: PolicyCompilePanelProps) {
  const policyReady = compileResult !== null;

  return (
    <section className="sentinel-panel">
      <h2 className="sentinel-panel-title">{ZONE_COMPILE_TITLE}</h2>
      <p className="sentinel-muted" style={{ margin: 0 }}>
        {DEMO_THESIS} Load structured policy artifacts through{" "}
        <code className="sentinel-code">POST /api/policy/compile</code>.
      </p>

      <AdkPrimitivesPanel disabled={compiling && !policyReady} />

      <div className="sentinel-muted" style={{ fontSize: "0.78rem" }}>
        Active document · <strong style={{ color: "var(--text)" }}>{documentTitle}</strong>
      </div>

      <CompilePipelineRail active={policyReady} />

      <button
        type="button"
        className="sentinel-btn sentinel-btn-primary"
        disabled={compiling}
        onClick={() => onCompile()}
      >
        {compiling ? "Compiling…" : "Run compile (API)"}
      </button>

      {compileError ? (
        <span className="sentinel-muted" style={{ color: "var(--danger)" }}>
          {compileError}
        </span>
      ) : !policyReady ? (
        <span className="sentinel-muted">Compile to load Botpress-proposed sections, graph reducers output, and active checks.</span>
      ) : (
        <span className="sentinel-muted">
          Compiled ✓ · {compileResult!.checks.length} check(s) ·{" "}
          <span className="sentinel-code" style={{ fontSize: "0.78rem" }}>
            {compileResult!.generatedBy}
          </span>
        </span>
      )}

      {!policyReady ? (
        <p className="sentinel-muted" style={{ margin: 0 }}>
          After compile succeeds, Sentinel validation activates on the runtime panel.
        </p>
      ) : (
        <div className="sentinel-scroll" style={{ maxHeight: 200 }}>
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
      )}
    </section>
  );
}
