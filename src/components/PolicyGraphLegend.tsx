"use client";

import { cn } from "@/lib/cn";

const items = [
  { label: "Action", className: "border-sky-500/50 bg-sky-500/15" },
  { label: "Condition", className: "border-cyan-500/45 bg-cyan-500/10" },
  { label: "Violation", className: "border-red-500/45 bg-red-500/10" },
  { label: "Escalation / exception", className: "border-amber-500/45 bg-amber-500/10" },
] as const;

export function PolicyGraphLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((i) => (
        <span
          key={i.label}
          className={cn(
            "rounded-md border px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400",
            i.className,
          )}
        >
          {i.label}
        </span>
      ))}
    </div>
  );
}
