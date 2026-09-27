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

/** Parses YYYY-MM-DD. Rejects dates that don't exist (e.g. 2026-02-31) instead of rolling them over. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (y < 1990 || y > 2100) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function addPeriod(start: Date, amount: number, unit: "days" | "weeks" | "months"): Date {
  if (unit === "days") return new Date(start.getFullYear(), start.getMonth(), start.getDate() + amount);
  if (unit === "weeks") return new Date(start.getFullYear(), start.getMonth(), start.getDate() + amount * 7);
  // Months: same day of the month, or the last day if that month is shorter
  // (31 January + 1 month = 28/29 February, not 3 March).
  const target = new Date(start.getFullYear(), start.getMonth() + amount, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(start.getDate(), lastDay));
}

const MAX_DAYS = { days: 3650, weeks: 520, months: 120 };

export function resolveDeadline(
  item: ExtractedDate,
  receivedDate: Date | null,
  documentDate: Date | null,
): ResolvedDeadline {
  if (!item.is_relative) {
    const date = parseIsoDate(item.absolute_date);
    return date ? { status: "fixed", date } : { status: "needs_date", reason: "unreadable" };
  }

  if (
    !item.unit ||
    !(item.unit in MAX_DAYS) ||
    !Number.isInteger(item.amount) ||
    !item.amount ||
    item.amount < 1 ||
    item.amount > MAX_DAYS[item.unit]
  ) {
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
