"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/analysis";
import { daysUntil, parseIsoDate, resolveDeadline, toIsoDate } from "@/lib/deadline";
import { FREE_LEGAL_AID, KNOWLEDGE } from "@/lib/knowledge";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

function Card({ title, icon, children, tone = "default" }: {
  title: string;
  icon: string;
  children: React.ReactNode;
  tone?: "default" | "urgent";
}) {
  return (
    <section
      className={`rounded-2xl p-5 shadow-sm ring-1 sm:p-6 ${
        tone === "urgent" ? "bg-amber-50 ring-amber-200" : "bg-white ring-slate-200"
      }`}
    >
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <span aria-hidden>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SourceQuote({ quote, verified }: { quote: string; verified: boolean }) {
  return (
    <figure className="mt-2 rounded-lg border-l-4 border-slate-300 bg-slate-50 px-3 py-2">
      <blockquote className="text-sm italic text-slate-700 break-words">“{quote}”</blockquote>
      <figcaption className={`mt-1 text-xs font-medium ${verified ? "text-teal-700" : "text-amber-700"}`}>
        {verified ? "✓ Found in your document" : "⚠ Could not match this quote to the document — check the original"}
      </figcaption>
    </figure>
  );
}

export function Results({ analysis, onReset }: { analysis: Analysis; onReset: () => void }) {
  const [receivedDate, setReceivedDate] = useState(toIsoDate(new Date()));
  const [done, setDone] = useState<Set<number>>(new Set());
  const knowledge = KNOWLEDGE[analysis.category];
  const documentDate = parseIsoDate(analysis.document_date);

  const deadlines = analysis.dates.map((item) => ({
    item,
    resolved: resolveDeadline(item, parseIsoDate(receivedDate), documentDate),
  }));
  const needsReceivedDate = analysis.dates.some((d) => d.is_relative && d.anchor === "received");

  return (
    <div className="space-y-5">
      <Card title="What does this letter mean?" icon="📄">
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-teal-100 px-2.5 py-1 font-medium text-teal-800">{knowledge.label}</span>
          {analysis.sender && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">From: {analysis.sender}</span>
          )}
          {documentDate && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              Dated {dateFormat.format(documentDate)}
            </span>
          )}
        </div>
        <p className="leading-relaxed text-slate-800">{analysis.summary}</p>
      </Card>

      {deadlines.length > 0 && (
        <Card title="Important dates" icon="⏰" tone="urgent">
          {needsReceivedDate && (
            <label className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-700">
              When did you receive this letter?
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="rounded-md border border-amber-300 bg-white px-2 py-1"
              />
            </label>
          )}
          <ul className="space-y-4">
            {deadlines.map(({ item, resolved }, i) => (
              <li key={i} className="rounded-xl bg-white p-4 ring-1 ring-amber-200">
                <p className="text-sm font-semibold text-amber-800">{item.description}</p>
                {resolved.status === "needs_date" ? (
                  <p className="mt-1 font-semibold text-slate-900">{resolved.reason}</p>
                ) : (
                  <>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{dateFormat.format(resolved.date)}</p>
                    <p className="text-sm text-slate-600">
                      {(() => {
                        const days = daysUntil(resolved.date);
                        if (days < 0) return `${-days} days ago`;
                        if (days === 0) return "Today";
                        return `${days} days left`;
                      })()}
                      {resolved.status === "calculated" &&
                        ` · calculated from ${resolved.basis} (“${item.raw_expression}”)`}
                    </p>
                  </>
                )}
                <SourceQuote quote={item.source_quote} verified={item.quote_verified} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-600">
            Calculated dates are estimates. If a deadline falls on a weekend or holiday, check the rules or ask for help.
          </p>
        </Card>
      )}

      {analysis.sender_request.length > 0 && (
        <Card title="What do they want from you?" icon="✉️">
          <ul className="space-y-4">
            {analysis.sender_request.map((r, i) => (
              <li key={i}>
                <p className="text-slate-800">{r.text}</p>
                <SourceQuote quote={r.source_quote} verified={r.quote_verified} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {analysis.important_points.length > 0 && (
        <Card title="Pay attention to" icon="⚠️">
          <ul className="space-y-4">
            {analysis.important_points.map((p, i) => (
              <li key={i}>
                <p className="text-slate-800">{p.text}</p>
                <SourceQuote quote={p.source_quote} verified={p.quote_verified} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {analysis.next_steps.length > 0 && (
        <Card title="What should you do now?" icon="✅">
          <ul className="space-y-2">
            {analysis.next_steps.map((step, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={done.has(i)}
                    onChange={() =>
                      setDone((prev) => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        return next;
                      })
                    }
                    className="mt-1 h-4 w-4 accent-teal-700"
                  />
                  <span className={done.has(i) ? "text-slate-400 line-through" : "text-slate-800"}>{step}</span>
                </label>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Where can you get help?" icon="🧭">
        {!knowledge.verified && (
          <p className="mb-3 rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900">
            Demo data: these references have not been verified yet.
          </p>
        )}
        {knowledge.authority && (
          <a
            href={knowledge.authority.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl bg-teal-50 p-4 ring-1 ring-teal-200 hover:bg-teal-100"
          >
            <p className="font-semibold text-teal-900">{knowledge.authority.name} →</p>
            <p className="text-sm text-teal-800">{knowledge.authority.description}</p>
          </a>
        )}
        {knowledge.laws.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700">Relevant law</p>
            <ul className="mt-1 space-y-1">
              {knowledge.laws.map((law) => (
                <li key={law.url}>
                  <a href={law.url} target="_blank" rel="noreferrer" className="text-teal-800 underline">
                    {law.name} {law.section}
                  </a>{" "}
                  <span className="text-sm text-slate-600">— {law.topic}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {knowledge.typical_deadline_note && (
          <p className="mt-3 text-sm text-slate-700">{knowledge.typical_deadline_note}</p>
        )}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">Free legal aid services</summary>
          <ul className="mt-2 space-y-2">
            {FREE_LEGAL_AID.map((s) => (
              <li key={s.url} className="text-sm">
                <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-teal-800 underline">
                  {s.name}
                </a>
                <span className="text-slate-600"> — {s.description}</span>
              </li>
            ))}
          </ul>
        </details>
      </Card>

      {analysis.terms.length > 0 && (
        <Card title="Difficult words" icon="📖">
          <dl className="space-y-3">
            {analysis.terms.map((t, i) => (
              <div key={i}>
                <dt className="font-semibold text-slate-900">{t.term}</dt>
                <dd className="text-slate-700">{t.explanation}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      <button
        onClick={onReset}
        className="w-full rounded-xl bg-white px-5 py-3 font-semibold text-teal-800 ring-1 ring-teal-700 hover:bg-teal-50"
      >
        Analyze another letter
      </button>
    </div>
  );
}
