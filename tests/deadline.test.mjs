// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseIsoDate, resolveDeadline, toIsoDate } from "../lib/deadline.ts";

function resolve(amount, unit, anchor, received, documentDate = null) {
  const r = resolveDeadline(
    { is_relative: true, amount, unit, anchor, absolute_date: null },
    parseIsoDate(received),
    parseIsoDate(documentDate),
  );
  return r.status === "needs_date" ? r.reason : toIsoDate(r.date);
}

test("rejects dates that do not exist instead of rolling them over", () => {
  assert.equal(parseIsoDate("2026-02-31"), null);
  assert.equal(parseIsoDate("2026-13-01"), null);
  assert.equal(parseIsoDate("2026-00-10"), null);
  assert.equal(parseIsoDate("1850-01-01"), null);
  assert.equal(parseIsoDate("5. oktober 2026"), null);
  assert.notEqual(parseIsoDate("2028-02-29"), null);
});

test("adds days and weeks", () => {
  assert.equal(resolve(14, "days", "received", "2026-09-24"), "2026-10-08");
  assert.equal(resolve(6, "weeks", "received", "2026-09-24"), "2026-11-05");
  assert.equal(resolve(3, "weeks", "received", "2026-12-20"), "2027-01-10");
  // Across the end of daylight saving time.
  assert.equal(resolve(14, "days", "received", "2026-10-20"), "2026-11-03");
});

test("adds months without overflowing into the next month", () => {
  assert.equal(resolve(1, "months", "received", "2026-03-15"), "2026-04-15");
  assert.equal(resolve(1, "months", "received", "2026-01-31"), "2026-02-28");
  assert.equal(resolve(1, "months", "received", "2028-01-31"), "2028-02-29");
  assert.equal(resolve(1, "months", "received", "2026-08-31"), "2026-09-30");
});

test("counts from the letter's date when the letter says so", () => {
  assert.equal(resolve(14, "days", "document_date", null, "2026-09-21"), "2026-10-05");
  assert.equal(resolve(14, "days", "document_date", null, null), "no_document_date");
});

test("does not calculate a date without the information it needs", () => {
  assert.equal(resolve(14, "days", "received", null), "need_received");
  assert.equal(resolve(14, "days", "other", "2026-09-24"), "unknown_anchor");
});

test("rejects unusable periods", () => {
  for (const [amount, unit] of [[0, "days"], [-3, "days"], [1.5, "days"], [99999, "days"], [2, "years"], [null, "days"], [14, null]]) {
    assert.equal(resolve(amount, unit, "received", "2026-09-24"), "no_period", `${amount} ${unit}`);
  }
});

test("fixed dates are passed through only if valid", () => {
  const fixed = (d) => resolveDeadline({ is_relative: false, absolute_date: d }, null, null);
  assert.equal(toIsoDate(fixed("2026-10-05").date), "2026-10-05");
  assert.equal(fixed("2026-02-30").reason, "unreadable");
  assert.equal(fixed(null).reason, "unreadable");
});
