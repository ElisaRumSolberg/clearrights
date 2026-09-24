"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/analysis";
import { daysUntil, parseIsoDate, resolveDeadline, toIsoDate } from "@/lib/deadline";
import { FREE_LEGAL_AID, KNOWLEDGE } from "@/lib/knowledge";
import { Icon, type IconName } from "./Icon";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });
const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long" });

function Section({ title, icon, children, className = "" }: {
  title: string;
  icon: IconName;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-rule bg-card p-5 sm:p-6 ${className}`}>
      <h2 className="mb-4 flex items-center gap-2.5 font-serif text-lg font-semibold text-ink">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brass-soft text-brass">
          <Icon name={icon} className="h-4 w-4" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Citation({ quote, verified }: { quote: string; verified: boolean }) {
  return (
    <figure className="mt-2.5 border-l-2 border-brass/50 pl-4">
      <blockquote className="font-serif text-[15px] italic leading-relaxed text-ink-soft break-words">
        “{quote}”
      </blockquote>
      <figcaption
        className={`mt-1 flex items-center gap-1 text-xs font-medium ${verified ? "text-ok" : "text-urgent"}`}
      >
        <Icon name={verified ? "check" : "alert"} className="h-3.5 w-3.5" />
        {verified ? "Quoted from your letter" : "Could not find this in the letter — check the original"}
      </figcaption>
    </figure>
  );
}

function Countdown({ days }: { days: number }) {
  const label = days < 0 ? `${-days} days ago` : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days left`;
  const tone = days <= 7 ? "bg-urgent text-white" : "bg-ink text-white";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>;
}

export function Results({ analysis, onReset }: { analysis: Analysis; onReset: () => void }) {
  const [receivedDate, setReceivedDate] = useState(toIsoDate(new Date()));
  const [done, setDone] = useState<Set<number>>(new Set());
  const knowledge = KNOWLEDGE[analysis.category];
  const documentDate = parseIsoDate(analysis.document_date);

  // Soonest first; dates that still need input go last.
  const deadlines = analysis.dates
    .map((item) => ({ item, resolved: resolveDeadline(item, parseIsoDate(receivedDate), documentDate) }))
    .sort((a, b) => {
      const ta = a.resolved.status === "needs_date" ? Infinity : a.resolved.date.getTime();
      const tb = b.resolved.status === "needs_date" ? Infinity : b.resolved.date.getTime();
      return ta - tb;
    });
  const needsReceivedDate = analysis.dates.some((d) => d.is_relative && d.anchor === "received");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <button onClick={onReset} className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
            <Icon name="arrowLeft" className="h-4 w-4" />
            Analyse another letter
          </button>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Your letter, explained
          </h1>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-soft">Type</dt>
            <dd className="font-medium text-ink">{knowledge.label}</dd>
          </div>
          {analysis.sender && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-soft">From</dt>
              <dd className="font-medium text-ink">{analysis.sender}</dd>
            </div>
          )}
          {documentDate && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-soft">Dated</dt>
              <dd className="font-medium text-ink">{dateFormat.format(documentDate)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start">
        <Section title="What this letter means" icon="file" className="lg:col-start-1">
          <p className="text-[17px] leading-relaxed text-ink">{analysis.summary}</p>
        </Section>

        <aside className="space-y-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {deadlines.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-urgent/25 bg-card">
              <div className="flex items-center gap-2.5 bg-urgent-soft px-5 py-3.5">
                <Icon name="calendar" className="h-5 w-5 text-urgent" />
                <h2 className="font-serif text-lg font-semibold text-urgent">Important dates</h2>
              </div>
              <div className="p-5">
                {needsReceivedDate && (
                  <label className="mb-5 block rounded-lg bg-paper p-3 text-sm text-ink">
                    <span className="font-medium">When did you receive this letter?</span>
                    <input
                      type="date"
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      className="mt-1.5 block w-full rounded-md border border-rule bg-card px-2.5 py-1.5 focus:border-brass focus:outline-none"
                    />
                  </label>
                )}
                <ul className="divide-y divide-rule">
                  {deadlines.map(({ item, resolved }, i) => (
                    <li key={i} className="py-4 first:pt-0 last:pb-0">
                      <p className="text-sm font-semibold text-ink-soft">{item.description}</p>
                      {resolved.status === "needs_date" ? (
                        <p className="mt-1 font-medium text-urgent">{resolved.reason}</p>
                      ) : (
                        <>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="font-serif text-2xl font-semibold text-ink">
                              {dateFormat.format(resolved.date)}
                            </p>
                            <Countdown days={daysUntil(resolved.date)} />
                          </div>
                          <p className="text-sm text-ink-soft">
                            {weekdayFormat.format(resolved.date)}
                            {resolved.status === "calculated" && ` · counted from ${resolved.basis}`}
                          </p>
                        </>
                      )}
                      <Citation quote={item.source_quote} verified={item.quote_verified} />
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-ink-soft">
                  Calculated dates are estimates. If a deadline falls on a weekend or public holiday, check the rules
                  or ask for help.
                </p>
              </div>
            </section>
          )}

          <section className="overflow-hidden rounded-xl border border-ink/15 bg-card">
            <div className="flex items-center gap-2.5 bg-ink px-5 py-3.5 text-white">
              <Icon name="landmark" className="h-5 w-5 text-brass-soft" />
              <h2 className="font-serif text-lg font-semibold">Where to get help</h2>
            </div>
            <div className="p-5">
              {!knowledge.verified && (
                <p className="mb-4 rounded-md bg-brass-soft px-3 py-2 text-xs font-medium text-brass">
                  Demo data — these references have not been verified yet.
                </p>
              )}
              {knowledge.authority && (
                <a
                  href={knowledge.authority.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block rounded-lg border border-rule p-4 transition hover:border-brass hover:bg-paper"
                >
                  <p className="flex items-center justify-between font-semibold text-ink">
                    {knowledge.authority.name}
                    <Icon name="external" className="h-4 w-4 text-ink-soft group-hover:text-brass" />
                  </p>
                  <p className="mt-1 text-sm leading-snug text-ink-soft">{knowledge.authority.description}</p>
                </a>
              )}
              {knowledge.laws.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Relevant law</p>
                  <ul className="mt-2 space-y-2">
                    {knowledge.laws.map((law) => (
                      <li key={law.url}>
                        <a
                          href={law.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-baseline gap-2 hover:text-brass"
                        >
                          <span className="font-serif font-semibold text-ink">
                            {law.name} {law.section}
                          </span>
                          <span className="text-sm text-ink-soft">{law.topic}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-ink-soft">Opens on Lovdata, Norway&apos;s official law database.</p>
                </div>
              )}
              {knowledge.typical_deadline_note && (
                <p className="mt-4 rounded-md bg-paper px-3 py-2 text-sm text-ink">{knowledge.typical_deadline_note}</p>
              )}
              <details className="mt-5 border-t border-rule pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-ink">Free legal aid services</summary>
                <ul className="mt-3 space-y-3">
                  {FREE_LEGAL_AID.map((s) => (
                    <li key={s.url} className="text-sm">
                      <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-ink underline decoration-brass/50 underline-offset-2 hover:text-brass">
                        {s.name}
                      </a>
                      <p className="text-ink-soft">{s.description}</p>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </section>
        </aside>

        <div className="space-y-5 lg:col-start-1">
          {analysis.important_points.length > 0 && (
            <Section title="Pay attention to" icon="alert">
              <ul className="space-y-5">
                {analysis.important_points.map((p, i) => (
                  <li key={i}>
                    <p className="text-ink">{p.text}</p>
                    <Citation quote={p.source_quote} verified={p.quote_verified} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {analysis.sender_request.length > 0 && (
            <Section title="What they are asking you to do" icon="mail">
              <ul className="space-y-5">
                {analysis.sender_request.map((r, i) => (
                  <li key={i}>
                    <p className="text-ink">{r.text}</p>
                    <Citation quote={r.source_quote} verified={r.quote_verified} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {analysis.next_steps.length > 0 && (
            <Section title="What you can do now" icon="checklist">
              <p className="-mt-2 mb-4 text-sm text-ink-soft">
                {done.size} of {analysis.next_steps.length} done
              </p>
              <ul className="space-y-1">
                {analysis.next_steps.map((step, i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 -mx-2 hover:bg-paper">
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
                        className="mt-1 h-4 w-4 shrink-0 accent-[#13233f]"
                      />
                      <span className={done.has(i) ? "text-ink-soft line-through" : "text-ink"}>{step}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {analysis.terms.length > 0 && (
            <Section title="Words in the letter" icon="book">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {analysis.terms.map((t, i) => (
                  <div key={i}>
                    <dt className="font-serif font-semibold italic text-ink">{t.term}</dt>
                    <dd className="mt-0.5 text-sm leading-snug text-ink-soft">{t.explanation}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
