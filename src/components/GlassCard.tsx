"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type GlassCardProps = {
  children: ReactNode;
  glow?: "none" | "blue" | "subtle";
  padding?: "sm" | "md" | "lg";
  noMotion?: boolean;
  className?: string;
  id?: string;
};

const paddingClass = {
  sm: "p-4",
  md: "p-5 md:p-6",
  lg: "p-6 md:p-8",
} as const;

const glowClass = {
  none: "",
  blue: "shadow-[0_0_0_1px_rgba(59,130,246,0.12),0_24px_80px_-24px_rgba(59,130,246,0.25)]",
  subtle: "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_50px_-20px_rgba(0,0,0,0.55)]",
} as const;

export function GlassCard({
  className,
  children,
  glow = "subtle",
  padding = "md",
  noMotion,
  id,
}: GlassCardProps) {
  const base = cn(
    "rounded-2xl border border-white/[0.08] bg-zinc-950/55 backdrop-blur-xl",
    glowClass[glow],
    paddingClass[padding],
    className,
  );

  if (noMotion) {
    return (
      <div className={base} id={id}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={base}
      id={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
