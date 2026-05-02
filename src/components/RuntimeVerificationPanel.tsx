"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { VerificationResult } from "@/components/VerificationResult";
import {
  DEMO_BOTPRESS_PROPOSED_RESPONSE,
  DEMO_PROCUREMENT_AGENT_NAME,
  DEMO_RUNTIME_USER_MESSAGE,
  RUNTIME_PANEL_TITLE,
  VERIFY_BUTTON_LABEL,
} from "@/lib/demoContent";
import type { VerifyResponse } from "@/lib/sentinel/types";
import { cn } from "@/lib/cn";

export type RuntimeVerificationPanelProps = {
  agentName: string;
  onAgentNameChange: (v: string) => void;
  userMessage: string;
  proposedResponse: string;
  onUserMessageChange: (v: string) => void;
  onProposedResponseChange: (v: string) => void;
  onVerify: () => void;
  loading: boolean;
  verifyResponse: VerifyResponse | null;
  verifyError: string | null;
};

export function RuntimeVerificationPanel({
  agentName,
  onAgentNameChange,
  userMessage,
  proposedResponse,
  onUserMessageChange,
  onProposedResponseChange,
  onVerify,
  loading,
  verifyResponse,
  verifyError,
}: RuntimeVerificationPanelProps) {
  return (
    <GlassCard className="relative overflow-hidden" glow="blue">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="relative flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-300">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{RUNTIME_PANEL_TITLE}</h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-zinc-400">
              The agent drafts a reply in Botpress. Sentinel evaluates the draft against the activated checks before anything is
              sent.
            </p>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Agent name</label>
          <input
            value={agentName}
            onChange={(e) => onAgentNameChange(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 py-2.5 font-mono text-sm text-zinc-200 outline-none ring-sky-500/30 transition focus:border-sky-500/35 focus:ring-2"
            spellCheck={false}
          />
          <button
            type="button"
            className="mt-1.5 text-[11px] font-medium text-sky-400/90 underline-offset-4 hover:underline"
            onClick={() => onAgentNameChange(DEMO_PROCUREMENT_AGENT_NAME)}
          >
            Use procurement agent label
          </button>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Runtime request</label>
          <textarea
            value={userMessage}
            onChange={(e) => onUserMessageChange(e.target.value)}
            className="mt-2 min-h-[88px] w-full resize-y rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-sm leading-relaxed text-zinc-200 outline-none ring-sky-500/30 transition placeholder:text-zinc-600 focus:border-sky-500/35 focus:ring-2"
            spellCheck={false}
          />
          <button
            type="button"
            className="mt-2 text-[11px] font-medium text-sky-400/90 underline-offset-4 hover:underline"
            onClick={() => onUserMessageChange(DEMO_RUNTIME_USER_MESSAGE)}
          >
            Load procurement demo request
          </button>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Botpress draft</label>
          <textarea
            value={proposedResponse}
            onChange={(e) => onProposedResponseChange(e.target.value)}
            className="mt-2 min-h-[88px] w-full resize-y rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-sm leading-relaxed text-zinc-200 outline-none ring-sky-500/30 transition focus:border-sky-500/35 focus:ring-2"
            spellCheck={false}
          />
          <button
            type="button"
            className="mt-2 text-[11px] font-medium text-sky-400/90 underline-offset-4 hover:underline"
            onClick={() => onProposedResponseChange(DEMO_BOTPRESS_PROPOSED_RESPONSE)}
          >
            Load procurement proposed response
          </button>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => onVerify()}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3.5 text-sm font-semibold text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-45",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : (
            VERIFY_BUTTON_LABEL
          )}
        </button>

        <VerificationResult
          loading={loading}
          verifyError={verifyError}
          verifyResponse={verifyResponse}
          proposedResponse={proposedResponse}
        />
      </div>
    </GlassCard>
  );
}
