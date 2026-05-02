"use client";

import { Loader2, RefreshCw, ScrollText } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ADK_VERIFY_ACTION,
  AUDIT_PANEL_TITLE,
  SENTINEL_DECISION_ENGINE,
} from "@/lib/demoContent";
import type { AuditEvent } from "@/lib/sentinel/types";
import { cn } from "@/lib/cn";

function resultTone(r: AuditEvent["result"]): "blocked" | "allowed" | "warned" | "rewritten" {
  if (r === "blocked") return "blocked";
  if (r === "allowed") return "allowed";
  if (r === "warned") return "warned";
  return "rewritten";
}

export type AuditTrailPanelProps = {
  events: AuditEvent[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  /** When set, that card gets a subtle highlight ring. */
  highlightEventId?: string | null;
};

export function AuditTrailPanel({
  events,
  loading,
  error,
  onRefresh,
  highlightEventId,
}: AuditTrailPanelProps) {
  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300">
            <ScrollText className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{AUDIT_PANEL_TITLE}</h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Every verification emits a tamper-evident record with source-grounded quotes. Quotes are shown in full — no extra
              clicks required.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRefresh()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-white/15 hover:bg-black/45 disabled:opacity-45"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-400/90">{error}</p>
      ) : null}

      <div className="space-y-4">
        {events.length === 0 && !loading ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-black/25 px-4 py-8 text-center text-sm text-zinc-500">
            No audit rows yet. Run verify to log a source-grounded decision.
          </p>
        ) : null}

        {loading && events.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading audit history…
          </div>
        ) : null}

        {events.map((ev) => (
          <article
            key={ev.id}
            className={cn(
              "rounded-2xl border bg-black/40 p-5 transition",
              ev.result === "blocked"
                ? "border-red-500/25"
                : ev.result === "allowed"
                  ? "border-emerald-500/20"
                  : "border-white/[0.08]",
              highlightEventId === ev.id && "ring-2 ring-sky-500/25",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={resultTone(ev.result)}>{ev.result}</StatusBadge>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">{SENTINEL_DECISION_ENGINE}</span>
              <span className="text-[10px] text-zinc-600">·</span>
              <span className="text-[10px] font-mono text-sky-300/80">{ADK_VERIFY_ACTION}</span>
            </div>

            <div className="mt-3 grid gap-1 text-xs text-zinc-500">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">agentName</span>
                <p className="font-mono text-sm text-zinc-200">{ev.agentName}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">timestamp</span>
                <p className="font-mono text-[11px] text-zinc-400">{ev.timestamp}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">userMessage</div>
                <p className="mt-1 leading-relaxed text-zinc-300">{ev.userMessage}</p>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">proposedResponse</div>
                <p className="mt-1 leading-relaxed text-zinc-300">{ev.proposedResponse}</p>
              </div>
              {ev.finalResponse ? (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">finalResponse</div>
                  <p className="mt-1 font-medium leading-relaxed text-zinc-100">{ev.finalResponse}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-zinc-950/60 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">facts</div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-zinc-400">
                {ev.detectedFacts.length ? ev.detectedFacts.join(", ") : "—"}
              </p>
              {ev.missingFacts?.length ? (
                <p className="mt-2 font-mono text-[11px] text-amber-200/80">
                  missing · {ev.missingFacts.join(", ")}
                </p>
              ) : null}
            </div>

            {ev.violations.length > 0 ? (
              <div className="mt-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-red-300/80">violations</div>
                <p className="mt-1 font-mono text-xs text-red-200/90">{ev.violations.join(", ")}</p>
              </div>
            ) : null}

            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">reason</div>
              <p className="mt-1 text-sm text-zinc-300">{ev.reason}</p>
            </div>

            {ev.source?.quote ? (
              <div className="mt-5 rounded-xl border border-sky-500/20 bg-gradient-to-b from-sky-500/[0.07] to-transparent p-4">
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-wider text-sky-200/80">
                  <span>source.section</span>
                  <span className="font-mono text-[10px] font-normal normal-case tracking-normal text-zinc-500">
                    {ev.source.document} · {ev.source.section}
                    {ev.source.page != null ? ` · p.${ev.source.page}` : ""}
                  </span>
                </div>
                <blockquote className="mt-3 border-l-2 border-sky-400/50 pl-4 font-mono text-sm leading-relaxed text-zinc-100">
                  {ev.source.quote}
                </blockquote>
              </div>
            ) : (
              <p className="mt-4 text-xs text-zinc-600">No source quote on this event.</p>
            )}
          </article>
        ))}
      </div>
    </GlassCard>
  );
}
