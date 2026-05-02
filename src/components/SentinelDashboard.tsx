"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdkPrimitivesCard } from "@/components/AdkPrimitivesCard";
import { AuditTrailPanel } from "@/components/AuditTrailPanel";
import { CompileWorkflowPanel } from "@/components/CompileWorkflowPanel";
import { HeroHeader } from "@/components/HeroHeader";
import { PolicyGraphPanel } from "@/components/PolicyGraphPanel";
import { RuntimeVerificationPanel } from "@/components/RuntimeVerificationPanel";
import {
  compilePolicy as compilePolicyApi,
  getAuditEvents,
  verifyResponse as verifyResponseApi,
} from "@/lib/apiClient";
import {
  DEMO_BOTPRESS_PROPOSED_RESPONSE,
  DEMO_POLICY_DOCUMENT_NAME,
  DEMO_PROCUREMENT_AGENT_NAME,
  DEMO_RUNTIME_USER_MESSAGE,
} from "@/lib/demoContent";
import type {
  AuditEvent,
  CompilePolicyResponse,
  DeterministicCheck,
  VerifyRequest,
  VerifyResponse,
} from "@/lib/sentinel/types";

async function extractPdfTextPageByPage(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const parts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const chunk = content.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .join(" ");
    parts.push(chunk);
  }

  return parts.join("\n\n").replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").trim();
}

export function SentinelDashboard() {
  const [compileResult, setCompileResult] = useState<CompilePolicyResponse | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);

  const [agentName, setAgentName] = useState(DEMO_PROCUREMENT_AGENT_NAME);
  const [userMessage, setUserMessage] = useState(DEMO_RUNTIME_USER_MESSAGE);
  const [proposedResponse, setProposedResponse] = useState(DEMO_BOTPRESS_PROPOSED_RESPONSE);

  const [verifyResponse, setVerifyResponse] = useState<VerifyResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [highlightAuditId, setHighlightAuditId] = useState<string | null>(null);

  const [uploadedPolicyText, setUploadedPolicyText] = useState<string | null>(null);
  const [policyFileName, setPolicyFileName] = useState<string | null>(null);
  const [policyUploadError, setPolicyUploadError] = useState<string | null>(null);
  const [policyFileBusy, setPolicyFileBusy] = useState(false);
  const policyFileInputRef = useRef<HTMLInputElement>(null);

  const refreshAudit = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    const res = await getAuditEvents();
    setAuditLoading(false);
    if (!res.ok) {
      setAuditEvents([]);
      setAuditError(res.error);
      return;
    }
    setAuditEvents(res.data.events ?? []);
  }, []);

  useEffect(() => {
    void refreshAudit();
    const id = setInterval(() => void refreshAudit(), 5000);
    return () => clearInterval(id);
  }, [refreshAudit]);

  function checksForVerify(): DeterministicCheck[] | undefined {
    return compileResult?.checks.length ? compileResult.checks : undefined;
  }

  async function handleCompilePolicy() {
    setCompiling(true);
    setCompileError(null);
    setCompileResult(null);
    const payload = {
      documentName: DEMO_POLICY_DOCUMENT_NAME,
      generatedBy: "sentinel-dashboard",
      ...(uploadedPolicyText?.trim().length ? { text: uploadedPolicyText.trim() } : {}),
    };
    const res = await compilePolicyApi(payload);
    setCompiling(false);
    if (!res.ok) {
      setCompileError(res.error);
      return;
    }
    setCompileResult(res.data);
  }

  async function handleVerify() {
    setVerifying(true);
    setVerifyError(null);
    const effective = checksForVerify();
    const body: VerifyRequest = {
      agentName,
      userMessage,
      proposedResponse,
      ...(effective ? { checks: effective } : {}),
    };
    const res = await verifyResponseApi(body);
    setVerifying(false);
    if (!res.ok) {
      setVerifyResponse(null);
      setVerifyError(res.error);
      setHighlightAuditId(null);
      return;
    }
    setVerifyResponse(res.data);
    setHighlightAuditId(res.data.auditEvent?.id ?? null);
    await refreshAudit();
  }

  function handlePolicyFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPolicyUploadError(null);

    if (!file) {
      setPolicyFileName(null);
      setUploadedPolicyText(null);
      return;
    }

    setPolicyFileName(file.name);
    const lower = file.name.toLowerCase();

    if (!lower.endsWith(".txt") && !lower.endsWith(".pdf")) {
      setUploadedPolicyText(null);
      setPolicyUploadError("Choose a .txt or .pdf file.");
      return;
    }

    if (lower.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = typeof reader.result === "string" ? reader.result : "";
        const text = raw.replace(/^\ufeff/, "").trim();
        if (!text.length) {
          setUploadedPolicyText(null);
          setPolicyUploadError("Text file is empty. Compile will use the preloaded policy.");
          return;
        }
        setUploadedPolicyText(text);
      };
      reader.onerror = () => {
        setUploadedPolicyText(null);
        setPolicyUploadError("Could not read the file. Compile will use the preloaded policy.");
      };
      reader.readAsText(file, "UTF-8");
      return;
    }

    setPolicyFileBusy(true);
    setUploadedPolicyText(null);
    void extractPdfTextPageByPage(file)
      .then((text) => {
        if (!text.length) {
          setUploadedPolicyText(null);
          setPolicyUploadError("No text found in PDF (image-only?). Compile will use the preloaded policy.");
          return;
        }
        setUploadedPolicyText(text);
      })
      .catch(() => {
        setUploadedPolicyText(null);
        setPolicyUploadError("PDF text extraction failed. Compile will use the preloaded policy.");
      })
      .finally(() => {
        setPolicyFileBusy(false);
      });
  }

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(59,130,246,0.12),transparent)] text-zinc-100 antialiased">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-2 md:px-8">
        <HeroHeader className="mb-10" />

        <div className="flex flex-col gap-10">
          <AdkPrimitivesCard />

          <CompileWorkflowPanel
            compiling={compiling}
            compileError={compileError}
            compileResult={compileResult}
            documentTitle={DEMO_POLICY_DOCUMENT_NAME}
            policyFileName={policyFileName}
            policyUploadError={policyUploadError}
            policyFileBusy={policyFileBusy}
            policyFileInputRef={policyFileInputRef}
            onPolicyFileChange={handlePolicyFileChange}
            onCompile={() => void handleCompilePolicy()}
          />

          <PolicyGraphPanel compileResult={compileResult} />

          <RuntimeVerificationPanel
            agentName={agentName}
            onAgentNameChange={setAgentName}
            userMessage={userMessage}
            proposedResponse={proposedResponse}
            onUserMessageChange={setUserMessage}
            onProposedResponseChange={setProposedResponse}
            onVerify={() => void handleVerify()}
            loading={verifying}
            verifyResponse={verifyResponse}
            verifyError={verifyError}
          />

          <AuditTrailPanel
            events={auditEvents}
            loading={auditLoading}
            error={auditError}
            onRefresh={() => void refreshAudit()}
            highlightEventId={highlightAuditId}
          />
        </div>
      </div>
    </div>
  );
}
