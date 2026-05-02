"use client";

import { Workflow, Bot, Cpu } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { ADK_PRIMITIVES_LEDE } from "@/lib/demoContent";
import {
  ADK_ACTION_ACTIVATE_COMPILED,
  ADK_ACTION_GRAPH_BUILDER,
  ADK_ACTION_POLICY_INDEXING,
  ADK_WORKFLOW_COMPILE,
} from "@/lib/demoCopy";
import { cn } from "@/lib/cn";

const rows = [
  { icon: Workflow, label: "Workflow", value: ADK_WORKFLOW_COMPILE },
  { icon: Bot, label: "Action", value: ADK_ACTION_POLICY_INDEXING },
  { icon: Cpu, label: "Action", value: ADK_ACTION_GRAPH_BUILDER },
  { icon: Cpu, label: "Action", value: ADK_ACTION_ACTIVATE_COMPILED },
] as const;

export function AdkPrimitivesCard({ className }: { className?: string }) {
  return (
    <GlassCard className={cn("relative", className)} glow="blue">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Botpress ADK
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">{ADK_PRIMITIVES_LEDE}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map((r) => (
            <div
              key={r.value}
              className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2.5"
            >
              <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-sky-400/90" strokeWidth={1.75} />
              <div className="min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{r.label}</div>
                <div className="truncate font-mono text-xs text-zinc-200">{r.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
