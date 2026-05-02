"use client";

import type { ChangeEvent, RefObject } from "react";
import { ArrowRight, FileText, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  COMPILE_PANEL_TITLE,
  DEMO_POLICY_DOCUMENT_NAME,
} from "@/lib/demoContent";
import type { CompilePolicyResponse } from "@/lib/sentinel/types";
import { cn } from "@/lib/cn";

const PIPELINE_STEPS = [
  "Policy Document",
  "Botpress Policy Indexing Agent",
  "Botpress Policy Graph Builder Agent",
  "Sentinel Reducer + Validator",
  "Deterministic Checks Activated",
] as const;

export type CompileWorkflowPanelProps = {
  compiling: boolean;
  compileError: string | null;
  compileResult: CompilePolicyResponse | null;
  documentTitle: string;
  policyFileName: string | null;
  policyUploadError: string | null;
  policyFileBusy: boolean;
  policyFileInputRef: RefObject<HTMLInputElement | null>;
  onPolicyFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onCompile: () => void;
};

export function CompileWorkflowPanel({
  compiling,
  compileError,
  compileResult,
  documentTitle,
  policyFileName,
  policyUploadError,
  policyFileBusy,
  policyFileInputRef,
  onPolicyFileChange,
  onCompile,
}: CompileWorkflowPanelProps) {
  const ready = compileResult !== null;

  return (
    <GlassCard className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-white/[0.06] pb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {COMPILE_PANEL_TITLE}
        </h2>
        <p className="text-sm text-zinc-400">
          Policy text flows through Botpress compile agents, then Sentinel materializes sections, the policy graph, and
          deterministic checks via{" "}
          <code className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-sky-200/90">
            POST /api/policy/compile
          </code>
          .
        </p>
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Pipeline</div>
        <ol className="mt-3 space-y-2.5">
          {PIPELINE_STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-2 text-sm">
              <span className="mt-1 font-mono text-[10px] text-zinc-600 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              {i > 0 ? (
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden />
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <span
                className={cn(
                  "leading-snug",
                  i >= PIPELINE_STEPS.length - 2 ? "font-medium text-sky-200/90" : "text-zinc-400",
                  ready ? "text-zinc-200" : undefined,
                )}
              >
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-black/25 p-4">
        <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
          Policy document (.pdf or .txt)
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            ref={policyFileInputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            disabled={compiling || policyFileBusy}
            onChange={onPolicyFileChange}
            className="block max-w-full text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-white/[0.05] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-200 hover:file:bg-white/[0.08]"
          />
          {policyFileBusy ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Extracting…
            </span>
          ) : null}
          {policyFileName ? <span className="text-xs text-zinc-500">{policyFileName}</span> : null}
        </div>
        {policyUploadError ? (
          <p className="mt-2 text-xs text-red-400/90">{policyUploadError}</p>
        ) : null}
        <p className="mt-2 text-xs text-zinc-500">
          Active document · <span className="text-zinc-200">{documentTitle || DEMO_POLICY_DOCUMENT_NAME}</span>
        </p>
      </div>

      <button
        type="button"
        disabled={compiling || policyFileBusy}
        onClick={() => onCompile()}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/35 bg-sky-500/15 py-3 text-sm font-semibold text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        {compiling ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Compiling…
          </>
        ) : (
          "Compile policy"
        )}
      </button>

      {compileError ? (
        <p className="text-sm text-red-400/90">{compileError}</p>
      ) : !ready ? (
        <p className="text-xs text-zinc-500">
          Run compile to load indexed sections, graph reducers, and activated checks. Empty backend renders graceful
          placeholders below.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="activated">Compiled</StatusBadge>
          <span className="text-xs text-zinc-500">
            {compileResult.checks.length} check(s) ·{" "}
            <span className="font-mono text-zinc-400">{compileResult.generatedBy}</span>
          </span>
        </div>
      )}

      {!ready ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Preview · Policy sections</div>
          <p className="mt-2 text-xs text-zinc-500">Sections from the compile response will appear here.</p>
        </div>
      ) : (
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {compileResult.sections.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/[0.06] bg-black/35 p-3">
              <div className="text-xs font-semibold text-zinc-200">
                {s.title}
                {s.page != null ? <span className="font-normal text-zinc-500"> · p.{s.page}</span> : null}
              </div>
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-zinc-500">{s.text}</p>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
