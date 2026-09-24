import { toIsoDate } from "./deadline";

// Builds an all-day calendar event with reminders two days before and on the day.

function escape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);
}

// RFC 5545 limits lines to 75 octets; continuation lines start with a space.
// 60 characters keeps multi-byte text (Turkish, Norwegian) safely under that.
function fold(line: string): string {
  const chars = [...line];
  const parts = [];
  for (let i = 0; i < chars.length; i += 60) parts.push(chars.slice(i, i + 60).join(""));
  return parts.join("\r\n ");
}

export function deadlineIcs(date: Date, title: string, details: string): string {
  const day = toIsoDate(date).replace(/-/g, "");
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClearRights//Deadline//EN",
    "BEGIN:VEVENT",
    `UID:${day}-${Math.random().toString(36).slice(2)}@clearrights`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${toIsoDate(next).replace(/-/g, "")}`,
    `SUMMARY:${escape(title)}`,
    `DESCRIPTION:${escape(details)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(title)}`,
    "TRIGGER:-P2D",
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(title)}`,
    "TRIGGER:PT9H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n");
}

export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
