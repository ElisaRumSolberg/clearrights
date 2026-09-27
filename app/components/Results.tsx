"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/analysis";
import { daysUntil, parseIsoDate, resolveDeadline, toIsoDate } from "@/lib/deadline";
import { DICT, LOCALE, type Dict, type Lang } from "@/lib/i18n";
import { deadlineIcs, downloadFile } from "@/lib/ics";
import { FREE_LEGAL_AID, KNOWLEDGE } from "@/lib/knowledge";
import { DraftPanel } from "./DraftPanel";
import { Icon, type IconName } from "./Icon";

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

function Citation({ quote, verified, t }: { quote: string; verified: boolean; t: Dict }) {
  return (
    <figure className="mt-2.5 border-l-2 border-brass/50 pl-4">
      <blockquote className="font-serif text-[15px] italic leading-relaxed text-ink-soft break-words">
        “{quote}”
      </blockquote>
      <figcaption
        className={`mt-1 flex items-center gap-1 text-xs font-medium ${verified ? "text-ok" : "text-urgent"}`}
      >
        <Icon name={verified ? "check" : "alert"} className="h-3.5 w-3.5" />
        {verified ? t.quoteVerified : t.quoteUnverified}
      </figcaption>
    </figure>
  );
}

// Shows which parts come from the AI, which from code and which from checked sources.
function TrustCard({ analysis, verified, t }: { analysis: Analysis; verified: boolean; t: Dict }) {
  const quoted = [...analysis.sender_request, ...analysis.important_points, ...analysis.dates];
  const ok = quoted.filter((q) => q.quote_verified).length;
  const allOk = ok === quoted.length;
  const lines: { icon: IconName; text: string; tone?: "ok" | "warn" }[] = [
    { icon: "file", text: t.trustAi },
    ...(quoted.length > 0
      ? [{ icon: allOk ? "check" : "alert", text: allOk ? t.trustQuotes(ok, quoted.length) : `${t.trustQuotes(ok, quoted.length)} ${t.trustQuotesMissing}`, tone: allOk ? "ok" : "warn" } as const]
      : []),
    { icon: "calendar", text: t.trustDeadlines },
    { icon: "landmark", text: verified ? t.trustSourcesVerified : t.trustSourcesUnverified },
    { icon: "shield", text: t.trustInjection },
  ];
  return (
    <section className="rounded-xl border border-rule bg-card p-5">
      <h2 className="mb-3 flex items-center gap-2.5 font-serif text-lg font-semibold text-ink">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brass-soft text-brass">
          <Icon name="shield" className="h-4 w-4" />
        </span>
        {t.secTrust}
      </h2>
      <ul className="space-y-2.5">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-snug">
            <Icon
              name={line.icon}
              className={`mt-0.5 h-4 w-4 shrink-0 ${line.tone === "ok" ? "text-ok" : line.tone === "warn" ? "text-urgent" : "text-brass"}`}
            />
            <span className={line.tone === "ok" ? "font-medium text-ok" : line.tone === "warn" ? "font-medium text-urgent" : "text-ink-soft"}>
              {line.text}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Countdown({ days, t }: { days: number; t: Dict }) {
  const label = days < 0 ? t.daysAgo(-days) : days === 0 ? t.today : days === 1 ? t.tomorrow : t.daysLeft(days);
  const tone = days <= 7 ? "bg-urgent text-white" : "bg-ink text-white";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>;
}

export function Results({ analysis, lang, language, onReset }: {
  analysis: Analysis;
  lang: Lang;
  language: string;
  onReset: () => void;
}) {
  // Empty until the user enters it: defaulting to today would show a wrong
  // deadline for a letter that arrived earlier.
  const [receivedDate, setReceivedDate] = useState("");
  const [done, setDone] = useState<Set<number>>(new Set());
  const t = DICT[lang];
  const dateFormat = new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "long", year: "numeric" });
  const weekdayFormat = new Intl.DateTimeFormat(LOCALE[lang], { weekday: "long" });
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
  // The reply must meet the response/appeal deadline, not e.g. a payout date.
  const known = deadlines.filter((d) => d.resolved.status !== "needs_date");
  const firstDeadline = (
    known.find((d) => d.item.kind === "response" || d.item.kind === "appeal") ??
    known.find((d) => d.item.kind === "payment") ??
    known[0]
  )?.resolved;
  const draftDeadline = firstDeadline && firstDeadline.status !== "needs_date" ? toIsoDate(firstDeadline.date) : null;

  return (
    <div>
      <div className="mb-6 hidden border-b border-ink pb-4 print:block">
        <p className="font-serif text-2xl font-semibold text-ink">ClearRights — {t.printTitle}</p>
        <p className="mt-1 text-sm text-ink-soft">
          {t.printMeta(dateFormat.format(new Date()))}
          {needsReceivedDate && parseIsoDate(receivedDate) && ` ${t.receivedOn(dateFormat.format(parseIsoDate(receivedDate)!))}.`}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 print:hidden">
            <button onClick={onReset} className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
              <Icon name="arrowLeft" className="h-4 w-4" />
              {t.back}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
            >
              <Icon name="file" className="h-4 w-4" />
              {t.print}
            </button>
          </div>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl print:hidden">
            {t.resultTitle}
          </h1>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-soft">{t.metaType}</dt>
            <dd className="font-medium text-ink">{knowledge.label[lang]}</dd>
          </div>
          {analysis.sender && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-soft">{t.metaFrom}</dt>
              <dd className="font-medium text-ink">{analysis.sender}</dd>
            </div>
          )}
          {documentDate && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-soft">{t.metaDated}</dt>
              <dd className="font-medium text-ink">{dateFormat.format(documentDate)}</dd>
            </div>
          )}
        </dl>
      </div>

      {analysis.ai_instructions_detected && (
        <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-urgent/40 bg-urgent-soft p-4 text-urgent">
          <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">{t.aiWarningTitle}</p>
            <p className="mt-0.5 text-sm text-ink">{t.aiWarningText}</p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start">
        <Section title={t.secMeaning} icon="file" className="lg:col-start-1">
          <p className="text-[17px] leading-relaxed text-ink">{analysis.summary}</p>
        </Section>

        <aside className="space-y-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {deadlines.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-urgent/25 bg-card">
              <div className="flex items-center gap-2.5 bg-urgent-soft px-5 py-3.5">
                <Icon name="calendar" className="h-5 w-5 text-urgent" />
                <h2 className="font-serif text-lg font-semibold text-urgent">{t.secDates}</h2>
              </div>
              <div className="p-5">
                {needsReceivedDate && (
                  <label
                    className={`mb-5 block rounded-lg p-3 text-sm text-ink ${receivedDate ? "bg-paper" : "bg-brass-soft ring-2 ring-brass/60"}`}
                  >
                    <span className="font-medium">{t.receivedQuestion}</span>
                    <input
                      type="date"
                      value={receivedDate}
                      max={toIsoDate(new Date())}
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
                        <p className="mt-1 font-medium text-urgent">{t.reasons[resolved.reason]}</p>
                      ) : (
                        <>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="font-serif text-2xl font-semibold text-ink">
                              {dateFormat.format(resolved.date)}
                            </p>
                            <Countdown days={daysUntil(resolved.date)} t={t} />
                          </div>
                          <p className="text-sm text-ink-soft">
                            {weekdayFormat.format(resolved.date)}
                            {resolved.status === "calculated" && ` · ${t.countedFrom[resolved.basis]}`}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              downloadFile(
                                `deadline-${toIsoDate(resolved.date)}.ics`,
                                deadlineIcs(
                                  resolved.date,
                                  `${item.description} (${analysis.sender || "ClearRights"})`,
                                  `${t.calendarDetails}\n"${item.source_quote}"`,
                                ),
                                "text/calendar",
                              )
                            }
                            className="mt-2 flex items-center gap-1.5 rounded-md border border-rule px-2.5 py-1 text-xs font-medium text-ink hover:border-brass print:hidden"
                          >
                            <Icon name="calendar" className="h-3.5 w-3.5 text-brass" />
                            {t.addToCalendar}
                          </button>
                        </>
                      )}
                      <Citation quote={item.source_quote} verified={item.quote_verified} t={t} />
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-ink-soft">{t.estimateNote}</p>
              </div>
            </section>
          )}

          <section className="overflow-hidden rounded-xl border border-ink/15 bg-card">
            <div className="flex items-center gap-2.5 bg-ink px-5 py-3.5 text-white">
              <Icon name="landmark" className="h-5 w-5 text-brass-soft" />
              <h2 className="font-serif text-lg font-semibold">{t.secHelp}</h2>
            </div>
            <div className="p-5">
              {!knowledge.verified && (
                <p className="mb-4 rounded-md bg-brass-soft px-3 py-2 text-xs font-medium text-brass">{t.demoData}</p>
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
                  <p className="mt-1 text-sm leading-snug text-ink-soft">{knowledge.authority.description[lang]}</p>
                </a>
              )}
              {knowledge.laws.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{t.relevantLaw}</p>
                  <ul className="mt-2 space-y-2">
                    {knowledge.laws.map((law) => (
                      <li key={law.url}>
                        <a
                          href={law.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-wrap items-baseline gap-x-2 hover:text-brass"
                        >
                          <span className="font-serif font-semibold text-ink">
                            {law.name} {law.section}
                          </span>
                          <span className="text-sm text-ink-soft">{law.topic[lang]}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-ink-soft">{t.lovdataNote}</p>
                </div>
              )}
              {knowledge.typical_deadline_note && (
                <p className="mt-4 rounded-md bg-paper px-3 py-2 text-sm text-ink">
                  {knowledge.typical_deadline_note[lang]}
                </p>
              )}
              <details className="mt-5 border-t border-rule pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-ink">{t.freeAid}</summary>
                <ul className="mt-3 space-y-3">
                  {FREE_LEGAL_AID.map((s) => (
                    <li key={s.url} className="text-sm">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-ink underline decoration-brass/50 underline-offset-2 hover:text-brass"
                      >
                        {s.name}
                      </a>
                      <p className="text-ink-soft">{s.description[lang]}</p>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </section>

          <TrustCard analysis={analysis} verified={knowledge.verified} t={t} />
        </aside>

        <div className="space-y-5 lg:col-start-1">
          {analysis.important_points.length > 0 && (
            <Section title={t.secAttention} icon="alert">
              <ul className="space-y-5">
                {analysis.important_points.map((p, i) => (
                  <li key={i}>
                    <p className="text-ink">{p.text}</p>
                    <Citation quote={p.source_quote} verified={p.quote_verified} t={t} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {analysis.sender_request.length > 0 && (
            <Section title={t.secRequests} icon="mail">
              <ul className="space-y-5">
                {analysis.sender_request.map((r, i) => (
                  <li key={i}>
                    <p className="text-ink">{r.text}</p>
                    <Citation quote={r.source_quote} verified={r.quote_verified} t={t} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {analysis.next_steps.length > 0 && (
            <Section title={t.secSteps} icon="checklist">
              <p className="-mt-2 mb-4 text-sm text-ink-soft">{t.stepsDone(done.size, analysis.next_steps.length)}</p>
              <ul className="space-y-1">
                {analysis.next_steps.map((step, i) => (
                  <li key={i}>
                    <label className="-mx-2 flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-paper">
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

          <Section title={t.secDraft} icon="mail" className="print:hidden">
            <DraftPanel
              t={t}
              language={language}
              category={analysis.category}
              sender={analysis.sender}
              documentText={analysis.document_text}
              deadline={draftDeadline}
              deadlineLabel={draftDeadline ? dateFormat.format(parseIsoDate(draftDeadline)!) : null}
            />
          </Section>

          {analysis.terms.length > 0 && (
            <Section title={t.secTerms} icon="book">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {analysis.terms.map((term, i) => (
                  <div key={i}>
                    <dt className="font-serif font-semibold italic text-ink">{term.term}</dt>
                    <dd className="mt-0.5 text-sm leading-snug text-ink-soft">{term.explanation}</dd>
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
