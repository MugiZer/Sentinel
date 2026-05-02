"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import {
  HERO_SUBTITLE,
  HERO_SUPPORTING,
  HERO_TITLE,
  THESIS_MICRO_BADGE,
} from "@/lib/demoContent";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/cn";

export function HeroHeader({ className }: { className?: string }) {
  return (
    <header className={cn("relative overflow-hidden", className)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% -10%, rgba(59,130,246,0.14), transparent 50%), radial-gradient(ellipse 60% 50% at 100% 0%, rgba(39,174,255,0.08), transparent 45%)",
        }}
      />
      <div className="relative flex flex-col gap-6 border-b border-white/[0.06] pb-10 pt-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-4">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sky-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <Shield className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <motion.h1
                className="text-3xl font-semibold tracking-tight text-white md:text-4xl"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.4 }}
              >
                {HERO_TITLE}
              </motion.h1>
              <motion.p
                className="text-sm font-medium text-zinc-400 md:text-base"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.4 }}
              >
                {HERO_SUBTITLE}
              </motion.p>
            </div>
          </motion.div>
          <motion.p
            className="max-w-xl text-sm leading-relaxed text-zinc-400"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
          >
            {HERO_SUPPORTING}
          </motion.p>
        </div>
        <motion.div
          className="shrink-0"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <StatusBadge tone="neutral" className="text-[11px] tracking-wide">
            {THESIS_MICRO_BADGE}
          </StatusBadge>
        </motion.div>
      </div>
    </header>
  );
}
