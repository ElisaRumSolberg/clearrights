import type { ExtractedDate } from "./analysis";

// Deadline arithmetic happens here, in code, never in the model.

// basis and reason are codes; the interface translates them (lib/i18n.ts).
export type ResolvedDeadline =
  | { status: "fixed"; date: Date }
  | { status: "calculated"; date: Date; basis: "received" | "document_date" }
  | {
      status: "needs_date";
      reason: "unreadable" | "no_period" | "need_received" | "no_document_date" | "unknown_anchor";
    };

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function addPeriod(start: Date, amount: number, unit: "days" | "weeks" | "months"): Date {
  const result = new Date(start);
  if (unit === "days") result.setDate(result.getDate() + amount);
  if (unit === "weeks") result.setDate(result.getDate() + amount * 7);
  if (unit === "months") result.setMonth(result.getMonth() + amount);
  return result;
}

export function resolveDeadline(
  item: ExtractedDate,
  receivedDate: Date | null,
  documentDate: Date | null,
): ResolvedDeadline {
  if (!item.is_relative) {
    const date = parseIsoDate(item.absolute_date);
    return date ? { status: "fixed", date } : { status: "needs_date", reason: "unreadable" };
  }

  if (!item.amount || !item.unit) {
    return { status: "needs_date", reason: "no_period" };
  }

  if (item.anchor === "received") {
    if (!receivedDate) return { status: "needs_date", reason: "need_received" };
    return { status: "calculated", date: addPeriod(receivedDate, item.amount, item.unit), basis: "received" };
  }

  if (item.anchor === "document_date") {
    if (!documentDate) return { status: "needs_date", reason: "no_document_date" };
    return { status: "calculated", date: addPeriod(documentDate, item.amount, item.unit), basis: "document_date" };
  }

  return { status: "needs_date", reason: "unknown_anchor" };
}

export function daysUntil(date: Date, today = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((date.getTime() - start.getTime()) / 86_400_000);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
