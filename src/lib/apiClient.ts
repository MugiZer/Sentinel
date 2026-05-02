import type {
  AuditListResponse,
  CompilePolicyRequest,
  CompilePolicyResponse,
  VerifyRequest,
  VerifyResponse,
} from "@/lib/sentinel/types";

/**
 * Resolved API origin for Sentinel REST routes.
 * - Default (unset): same-origin `/api/...` when UI and backend are one Next deployment.
 * - Split UI: set `NEXT_PUBLIC_SENTINEL_API_URL` (typical local demo: `http://localhost:3002`).
 */
export function getSentinelApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_SENTINEL_API_URL;
  if (typeof raw === "string") {
    const t = raw.trim().replace(/\/$/, "");
    return t === "" ? "" : t;
  }
  return "";
}

function apiUrl(path: string): string {
  const base = getSentinelApiBase();
  if (!base) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

async function parseJson<T>(res: Response): Promise<T | { error?: string }> {
  try {
    return (await res.json()) as T;
  } catch {
    return { error: res.statusText || "Invalid JSON" };
  }
}

export async function compilePolicy(
  payload: CompilePolicyRequest,
): Promise<CompilePolicyResponse> {
  const res = await fetch(apiUrl("/api/policy/compile"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<CompilePolicyResponse>(res);
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err.error ?? res.statusText);
  }
  return data as CompilePolicyResponse;
}

export async function verifyResponse(payload: VerifyRequest): Promise<VerifyResponse> {
  const res = await fetch(apiUrl("/api/verify"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson<VerifyResponse>(res);
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err.error ?? res.statusText);
  }
  return data as VerifyResponse;
}

export async function getAuditEvents(): Promise<AuditListResponse> {
  const res = await fetch(apiUrl("/api/audit"));
  const data = await parseJson<AuditListResponse>(res);
  if (!res.ok) {
    throw new Error(res.statusText);
  }
  return data as AuditListResponse;
}
