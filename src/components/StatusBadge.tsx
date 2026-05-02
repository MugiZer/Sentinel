"use client";

import { cn } from "@/lib/cn";

export type StatusBadgeTone =
  | "blocked"
  | "allowed"
  | "warned"
  | "rewritten"
  | "active"
  | "completed"
  | "pending"
  | "validated"
  | "activated"
  | "neutral";

const toneStyles: Record<StatusBadgeTone, string> = {
  blocked:
    "border-red-500/35 bg-red-500/10 text-red-300",
  allowed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warned:
    "border-amber-500/35 bg-amber-500/10 text-amber-200",
  rewritten:
    "border-sky-500/30 bg-sky-500/10 text-sky-200",
  active:
    "border-sky-500/35 bg-sky-500/10 text-sky-200",
  completed:
    "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  pending:
    "border-zinc-600/40 bg-zinc-900/80 text-zinc-400",
  validated:
    "border-emerald-500/25 bg-emerald-500/5 text-emerald-200",
  activated:
    "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  neutral:
    "border-white/10 bg-white/[0.04] text-zinc-400",
};

export type StatusBadgeProps = {
  tone: StatusBadgeTone;
  children: React.ReactNode;
  className?: string;
};

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
