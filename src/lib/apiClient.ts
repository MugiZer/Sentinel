import type {
  AuditListResponse,
  CompilePolicyRequest,
  CompilePolicyResponse,
  VerifyRequest,
  VerifyResponse,
} from "@/lib/sentinel/types";

/** Base URL for Sentinel API. Same-origin when empty in the browser. SSR falls back for server fetches. */
export function getSentinelApiBase(): string {
  const env = process.env.NEXT_PUBLIC_SENTINEL_API_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  if (typeof window !== "undefined") return "";
  return "http://localhost:3002";
}

function apiUrl(path: string): string {
  const base = getSentinelApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export async function compilePolicy(
  payload: CompilePolicyRequest,
): Promise<{ ok: true; data: CompilePolicyResponse } | { ok: false; error: string; status: number }> {
  try {
    const res = await fetch(apiUrl("/api/policy/compile"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data: unknown = await res.json();
    if (!res.ok) {
      const err = data as { error?: string };
      return { ok: false, error: err.error ?? res.statusText, status: res.status };
    }
    return { ok: true, data: data as CompilePolicyResponse };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: msg, status: 0 };
  }
}

export async function verifyResponse(
  payload: VerifyRequest,
): Promise<{ ok: true; data: VerifyResponse } | { ok: false; error: string; status: number }> {
  try {
    const res = await fetch(apiUrl("/api/verify"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data: unknown = await res.json();
    if (!res.ok) {
      const err = data as { error?: string };
      return { ok: false, error: err.error ?? res.statusText, status: res.status };
    }
    return { ok: true, data: data as VerifyResponse };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: msg, status: 0 };
  }
}

export async function getAuditEvents(): Promise<
  { ok: true; data: AuditListResponse } | { ok: false; error: string; status: number }
> {
  try {
    const res = await fetch(apiUrl("/api/audit"));
    const data: unknown = await res.json();
    if (!res.ok) {
      const err = data as { error?: string };
      return { ok: false, error: err.error ?? res.statusText, status: res.status };
    }
    return { ok: true, data: data as AuditListResponse };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: msg, status: 0 };
  }
}
