import { NextResponse } from "next/server";
import { listAuditEvents } from "@/lib/sentinel/auditStore";

export async function GET(): Promise<NextResponse> {
  const events = listAuditEvents();
  return NextResponse.json({ events });
}
