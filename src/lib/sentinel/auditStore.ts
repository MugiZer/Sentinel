import type { AuditEvent } from "./types";

const events: AuditEvent[] = [];

export function addAuditEvent(event: AuditEvent): void {
  events.unshift(event);
}

/** Newest events first (best for dashboard polling). */
export function listAuditEvents(): AuditEvent[] {
  return [...events];
}

/** Test / demo reset — clears process memory only */
export function clearAuditEvents(): void {
  events.length = 0;
}
