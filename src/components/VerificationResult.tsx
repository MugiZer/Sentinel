"use client";

import type { VerifyResponse } from "@/lib/sentinel/types";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ADK_VERIFY_ACTION,
  BLOCKED_HEADLINE,
  FINAL_RESPONSE_LABEL,
  PROPOSED_RESPONSE_LABEL,
  SENTINEL_DECISION_ENGINE,
} from "@/lib/demoContent";
import { cn } from "@/lib/cn";

export type VerificationResultProps = {
  verifyResponse: VerifyResponse | null;
  verifyError: string | null;
  proposedResponse: string;
  loading?: boolean;
};

function badgeTone(r: VerifyResponse["result"]): "blocked" | "allowed" | "warned" | "rewritten" {
  if (r === "blocked") return "blocked";
  if (r === "warned" || r === "rewritten") return "warned";
  return "allowed";
}

function formatFacts(facts: Record<string, boolean>): string[] {
  return Object.entries(facts).map(([k, v]) => `${k}=${String(v)}`);
}

export function VerificationResult({
  verifyResponse,
  verifyError,
  proposedResponse,
  loading,
}: VerificationResultProps) {
  if (loading) {
    return (
      <GlassCard noMotion glow="none" className="border-dashed border-white/15 bg-black/20" padding="sm">
        <p className="text-xs text-zinc-500">Running Sentinel deterministic evaluator…</p>
      </GlassCard>
    );
  }

  if (verifyError) {
    return (
      <GlassCard noMotion className="border-red-500/25 bg-red-500/[0.04]" padding="sm">
        <StatusBadge tone="blocked">Request error</StatusBadge>
        <p className="mt-2 font-mono text-xs text-red-200/90">{verifyError}</p>
      </GlassCard>
    );
  }

  if (!verifyResponse) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-black/25 px-4 py-6 text-center text-sm text-zinc-500">
        Run verification to see a live allow / block verdict from the backend.
      </div>
    );
  }

  const blocked = verifyResponse.result === "blocked";
  const facts = formatFacts(verifyResponse.facts);

  return (
    <div className="flex flex-col gap-4">
      {blocked ? (
        <div
          className="rounded-xl border border-red-500/35 bg-gradient-to-b from-red-500/10 to-transparent px-5 py-4 shadow-[0_0_40px_-16px_rgba(239,68,68,0.45)]"
          role="status"
        >
          <p className="text-lg font-semibold tracking-tight text-red-200">{BLOCKED_HEADLINE}</p>
          <p className="mt-1 text-sm text-red-200/70">
            The proposed Botpress reply did not pass deterministic checks. Nothing is delivered until Sentinel authorizes the
            final text.
          </p>
        </div>
      ) : null}

      <GlassCard noMotion glow={blocked ? "none" : "subtle"} className={cn(blocked && "border-red-500/20")} padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={badgeTone(verifyResponse.result)}>{verifyResponse.result}</StatusBadge>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">{SENTINEL_DECISION_ENGINE}</span>
          <span className="text-[10px] font-mono text-zinc-500">·</span>
          <span className="text-[10px] font-mono text-sky-300/80">{ADK_VERIFY_ACTION}</span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{PROPOSED_RESPONSE_LABEL}</div>
            <p className="mt-1 text-sm leading-relaxed text-zinc-300">{proposedResponse}</p>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {FINAL_RESPONSE_LABEL}
            </div>
            <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-100">
              {verifyResponse.finalResponse ?? proposedResponse.trim()}
            </p>
          </div>
        </div>

        {facts.length > 0 ? (
          <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/35 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Facts (server)</div>
            <ul className="mt-2 space-y-1 font-mono text-[11px] text-zinc-400">
              {facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {verifyResponse.reason ? (
          <p className="mt-3 text-sm text-zinc-400">{verifyResponse.reason}</p>
        ) : null}

        {verifyResponse.violations.length > 0 ? (
          <div className="mt-3 rounded-lg border border-red-500/15 bg-red-500/[0.05] px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-red-300/80">Violations</div>
            <p className="mt-1 font-mono text-xs text-red-200/90">{verifyResponse.violations.join(", ")}</p>
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}
