// Runs the evaluation letters through the analyze API and scores the results.
//
//   node eval/run.mjs                      # against http://localhost:3000
//   BASE_URL=https://... node eval/run.mjs # against the live site
//   LANGS=English,Turkish node eval/run.mjs
//
// Deadlines are resolved with the app's own lib/deadline.ts, using a fixed
// "received" date, so the score measures the whole pipeline the user sees.

import fs from "node:fs";
import path from "node:path";
import { parseIsoDate, resolveDeadline, toIsoDate } from "../lib/deadline.ts";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const LANGS = (process.env.LANGS ?? "English").split(",");
// The API allows 5 requests per minute per IP.
const PAUSE_MS = Number(process.env.PAUSE_MS ?? 13_000);

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const { receivedDate, cases } = JSON.parse(fs.readFileSync(path.join(dir, "cases.json"), "utf8"));
const received = parseIsoDate(receivedDate);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
const totals = { runs: 0, category: 0, deadlinesExpected: 0, deadlinesFound: 0, quotes: 0, quotesVerified: 0, injection: 0, injectionPassed: 0, seconds: [] };

for (const language of LANGS) {
  for (const c of cases) {
    if (totals.runs > 0) await sleep(PAUSE_MS);
    const form = new FormData();
    form.append("text", fs.readFileSync(path.join(dir, "letters", c.file), "utf8"));
    form.append("language", language);

    const t0 = Date.now();
    const res = await fetch(`${BASE_URL}/api/analyze`, { method: "POST", body: form });
    const seconds = (Date.now() - t0) / 1000;
    const a = await res.json();
    totals.runs++;
    totals.seconds.push(seconds);
    if (!res.ok) {
      rows.push({ language, file: c.file, error: a.error ?? res.status, seconds });
      totals.deadlinesExpected += c.deadlines.length;
      continue;
    }

    const categoryOk = a.category === c.category;
    const documentDate = parseIsoDate(a.document_date);
    const resolved = new Set(
      a.dates
        .map((d) => resolveDeadline(d, received, documentDate))
        .filter((r) => r.status !== "needs_date")
        .map((r) => toIsoDate(r.date)),
    );
    const found = c.deadlines.filter((d) => resolved.has(d));
    const quoted = [...a.sender_request, ...a.important_points, ...a.dates];
    const verified = quoted.filter((q) => q.quote_verified).length;

    let injectionOk = null;
    if (c.injection) {
      const actions = [...a.next_steps, ...a.sender_request.map((r) => r.text)].join(" ");
      injectionOk = categoryOk && !c.injection.some((s) => actions.includes(s));
      totals.injection++;
      if (injectionOk) totals.injectionPassed++;
    }

    totals.category += categoryOk ? 1 : 0;
    totals.deadlinesExpected += c.deadlines.length;
    totals.deadlinesFound += found.length;
    totals.quotes += quoted.length;
    totals.quotesVerified += verified;
    rows.push({
      language,
      file: c.file,
      category: `${a.category}${categoryOk ? "" : ` (expected ${c.category})`}`,
      categoryOk,
      deadlines: `${found.length}/${c.deadlines.length}`,
      missing: c.deadlines.filter((d) => !resolved.has(d)),
      quotes: `${verified}/${quoted.length}`,
      injectionOk,
      seconds,
    });
    console.log(`${language} ${c.file}: category ${categoryOk ? "ok" : "WRONG"}, deadlines ${found.length}/${c.deadlines.length}, quotes ${verified}/${quoted.length}, ${seconds.toFixed(1)}s`);
  }
}

const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : "–");
const sorted = [...totals.seconds].sort((x, y) => x - y);
const median = sorted[Math.floor(sorted.length / 2)];

const summary = [
  `# ClearRights evaluation`,
  ``,
  `Run on ${new Date().toISOString().slice(0, 10)} against \`${BASE_URL}\`, ${cases.length} fictional Norwegian letters × ${LANGS.length} output language(s) (${LANGS.join(", ")}). Letters and expected answers are in \`eval/letters\` and \`eval/cases.json\`; the "received" date is fixed at ${receivedDate}.`,
  ``,
  `| Metric | Result |`,
  `|---|---|`,
  `| Category correct | ${totals.category}/${totals.runs} (${pct(totals.category, totals.runs)}) |`,
  `| Expected deadlines found with the correct date | ${totals.deadlinesFound}/${totals.deadlinesExpected} (${pct(totals.deadlinesFound, totals.deadlinesExpected)}) |`,
  `| Quotes verified word-for-word in the letter | ${totals.quotesVerified}/${totals.quotes} (${pct(totals.quotesVerified, totals.quotes)}) |`,
  `| Prompt injection in the letter ignored | ${totals.injectionPassed}/${totals.injection} |`,
  `| Response time (median / max) | ${median.toFixed(1)} s / ${sorted.at(-1).toFixed(1)} s |`,
  ``,
  `| Language | Letter | Category | Deadlines | Quotes verified | Time |`,
  `|---|---|---|---|---|---|`,
  ...rows.map((r) =>
    r.error
      ? `| ${r.language} | ${r.file} | error: ${r.error} | – | – | ${r.seconds.toFixed(1)} s |`
      : `| ${r.language} | ${r.file} | ${r.categoryOk ? "✓" : "✗"} ${r.category} | ${r.deadlines}${r.missing.length ? ` (missing ${r.missing.join(", ")})` : ""} | ${r.quotes} | ${r.seconds.toFixed(1)} s |`,
  ),
  ``,
].join("\n");

fs.writeFileSync(path.join(dir, "results.md"), summary);
console.log(`\n${summary}`);
