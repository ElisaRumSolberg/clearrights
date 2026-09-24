import type { ExtractedDate } from "./analysis";

// Deadline arithmetic happens here, in code, never in the model.

export type ResolvedDeadline =
  | { status: "fixed"; date: Date }
  | { status: "calculated"; date: Date; basis: string }
  | { status: "needs_date"; reason: string };

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
    return date
      ? { status: "fixed", date }
      : { status: "needs_date", reason: "The date in the document could not be read reliably." };
  }

  if (!item.amount || !item.unit) {
    return { status: "needs_date", reason: "The deadline wording could not be converted to a period." };
  }

  if (item.anchor === "received") {
    if (!receivedDate) return { status: "needs_date", reason: "Enter the date you received the letter." };
    return { status: "calculated", date: addPeriod(receivedDate, item.amount, item.unit), basis: "the date you received it" };
  }

  if (item.anchor === "document_date") {
    if (!documentDate) return { status: "needs_date", reason: "The letter's own date is missing." };
    return { status: "calculated", date: addPeriod(documentDate, item.amount, item.unit), basis: "the letter's date" };
  }

  return { status: "needs_date", reason: "Check the letter to see when this period starts." };
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
