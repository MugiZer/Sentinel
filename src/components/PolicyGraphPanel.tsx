"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GlassCard } from "@/components/GlassCard";
import { PolicyGraphLegend } from "@/components/PolicyGraphLegend";
import { DEMO_ACTIVE_CHECK_SUMMARIES, GRAPH_PANEL_MICROCOPY, GRAPH_PANEL_TITLE } from "@/lib/demoContent";
import { layoutWithDagre } from "@/lib/graphLayout";
import { cn } from "@/lib/cn";
import type { CompilePolicyResponse, PolicyNode as PolicyGraphNode } from "@/lib/sentinel/types";

const HIGHLIGHT_IDS = new Set([
  "action.commit_purchase",
  "condition.manager_approval",
  "condition.vendor_approved",
  "action.share_payment_credentials",
  "violation.purchase_without_approval",
  "violation.unapproved_vendor_commitment",
  "violation.payment_credentials_shared",
  "action.promise_refund",
  "violation.refund_without_approval",
]);

function accentForType(t: PolicyGraphNode["type"]) {
  switch (t) {
    case "action":
      return "border-sky-500/45 bg-sky-500/[0.07] shadow-[0_0_24px_-10px_rgba(56,189,248,0.4)]";
    case "condition":
      return "border-cyan-500/40 bg-cyan-500/[0.06]";
    case "violation":
      return "border-red-500/45 bg-red-500/[0.09]";
    case "exception":
    case "escalation":
      return "border-amber-500/40 bg-amber-500/[0.08]";
    default:
      return "border-white/10 bg-white/[0.03]";
  }
}

type PolicyFlowData = {
  label: string;
  nodeType: PolicyGraphNode["type"];
  section?: string;
  highlight: boolean;
};

function PolicyFlowNode({ id, data }: NodeProps) {
  const d = data as PolicyFlowData;
  return (
    <div
      className={cn(
        "min-w-[200px] max-w-[248px] rounded-xl border px-3 py-2 backdrop-blur-md",
        accentForType(d.nodeType),
        d.highlight && "ring-2 ring-sky-400/25",
      )}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-zinc-500" />
      <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{d.nodeType}</div>
      <div className="text-xs font-semibold leading-snug text-zinc-100">{d.label}</div>
      {d.section ? (
        <div className="mt-1 truncate font-mono text-[10px] text-zinc-500">{d.section}</div>
      ) : null}
      <div className="mt-1 font-mono text-[10px] text-zinc-600">{id}</div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-zinc-500" />
    </div>
  );
}

const nodeTypes = { policy: PolicyFlowNode };

function PolicyFlowCanvas({ compileResult }: { compileResult: CompilePolicyResponse }) {
  const { fitView } = useReactFlow();

  const { nodes, edges } = useMemo(() => {
    const rawNodes: Node[] = compileResult.graph.nodes.map((n) => ({
      id: n.id,
      type: "policy",
      data: {
        label: n.label,
        nodeType: n.type,
        section: n.source?.section,
        highlight: HIGHLIGHT_IDS.has(n.id),
      },
      position: { x: 0, y: 0 },
    }));

    const rawEdges: Edge[] = compileResult.graph.edges.map((e) => ({
      id: e.id,
      source: e.from,
      target: e.to,
      label: e.type,
      labelStyle: { fill: "#a1a1aa", fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: "rgba(9,9,11,0.92)" },
      labelBgPadding: [6, 4],
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: "#71717a",
      },
      style: { stroke: "#52525b", strokeWidth: 1.25 },
    }));

    const laidOut = layoutWithDagre(rawNodes, rawEdges, "TB");
    return { nodes: laidOut, edges: rawEdges };
  }, [compileResult]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      fitView({ padding: 0.22, duration: 320 });
    });
    return () => cancelAnimationFrame(id);
  }, [compileResult, fitView, nodes, edges]);

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950/50 [&_.react-flow\_\_attribution]:hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.4}
        maxZoom={1.25}
        panOnScroll
        zoomOnScroll
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={22} size={1} color="#3f3f46" className="opacity-[0.35]" />
        <Controls
          className="!m-2 overflow-hidden !rounded-lg !border !border-white/10 !bg-zinc-950/95 !shadow-none [&_button]:!h-7 [&_button]:!w-7 [&_button]:!border-white/10 [&_svg]:!fill-zinc-400"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}

export type PolicyGraphPanelProps = {
  compileResult: CompilePolicyResponse | null;
};

export function PolicyGraphPanel({ compileResult }: PolicyGraphPanelProps) {
  return (
    <GlassCard className="flex flex-col gap-4" glow="none">
      <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{GRAPH_PANEL_TITLE}</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">{GRAPH_PANEL_MICROCOPY}</p>
        </div>
        <PolicyGraphLegend />
      </div>

      {!compileResult ? (
        <div className="flex h-[400px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-black/25 px-6 text-center">
          <p className="text-sm text-zinc-400">
            Run compile to render the policy graph from the API response.
          </p>
          <p className="max-w-md text-xs text-zinc-600">
            Nodes and edges are read-only semantic proof — layout is auto-generated (Dagre) with labels like{" "}
            <span className="font-mono text-zinc-500">requires</span>,{" "}
            <span className="font-mono text-zinc-500">forbids</span>,{" "}
            <span className="font-mono text-zinc-500">violates_if_missing</span>.
          </p>
        </div>
      ) : (
        <ReactFlowProvider>
          <PolicyFlowCanvas compileResult={compileResult} />
        </ReactFlowProvider>
      )}

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Reference checks (demo copy)</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {DEMO_ACTIVE_CHECK_SUMMARIES.map((c) => (
            <div
              key={c}
              className="rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2 text-xs leading-snug text-zinc-400"
            >
              {c}
            </div>
          ))}
        </div>
      </div>

      {compileResult ? (
        <div className="space-y-2 border-t border-white/[0.06] pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Activated checks (server)</div>
            <span className="font-mono text-[10px] text-zinc-600">
              {compileResult.graph.nodes.length} nodes · {compileResult.graph.edges.length} edges · {compileResult.checks.length}{" "}
              checks
            </span>
          </div>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {compileResult.checks.map((c) => (
              <div key={c.id} className="rounded-lg border border-white/[0.06] bg-black/35 px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-zinc-200">{c.id}</span>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-px font-mono text-[10px] uppercase text-zinc-500">
                    {c.severity}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-400">{c.name}</div>
                <div className="mt-1 font-mono text-[10px] leading-relaxed text-zinc-600">
                  trigger {c.trigger}
                  {c.required ? ` · requires ${c.required}` : null}
                  {c.forbidden ? " · forbidden" : null} · violation {c.violation}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}
