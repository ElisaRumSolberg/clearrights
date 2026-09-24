"use client";

import { useState } from "react";
import type { Category } from "@/lib/knowledge";
import type { Draft, Purpose } from "@/lib/draft";
import type { Dict } from "@/lib/i18n";
import { Icon } from "./Icon";

type Props = {
  t: Dict;
  language: string;
  category: Category;
  sender: string;
  documentText: string;
  deadline: string | null;
};

function CopyButton({ text, t }: { text: string; t: Dict }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded-md border border-rule bg-card px-3 py-1.5 text-sm font-medium text-ink hover:border-brass print:hidden"
    >
      {copied ? `✓ ${t.copied}` : t.copy}
    </button>
  );
}

export function DraftPanel({ t, language, category, sender, documentText, deadline }: Props) {
  const purposes: Purpose[] =
    category === "debt_collection" ? ["object", "more_info", "more_time", "payment_plan"] : ["object", "more_info", "more_time"];
  const [purpose, setPurpose] = useState<Purpose>("object");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  async function write() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, extra, language, sender, documentText, deadline }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(res.status === 429 ? t.rateLimited : t.draftError);
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.draftError);
    } finally {
      setLoading(false);
    }
  }

  if (draft) {
    const full = `${t.draftSubject}: ${draft.subject}\n\n${draft.body}`;
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{t.draftNorwegian}</p>
          <CopyButton text={full} t={t} />
        </div>
        <div lang="nb" className="mt-2 rounded-lg border border-rule bg-paper p-4 font-serif text-[15px] leading-relaxed text-ink">
          <p className="mb-3 font-sans text-sm">
            <span className="font-semibold">{t.draftSubject}:</span> {draft.subject}
          </p>
          <p className="whitespace-pre-wrap break-words">{draft.body}</p>
        </div>

        {draft.translation && language !== "simple Norwegian (Bokmål)" && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-ink">{t.draftTranslation}</summary>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-soft">{draft.translation}</p>
          </details>
        )}

        {draft.notes.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm text-ink">
            {draft.notes.map((note, i) => (
              <li key={i} className="flex gap-2">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                {note}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 flex gap-2 rounded-md bg-brass-soft px-3 py-2 text-xs leading-relaxed text-ink">
          <Icon name="alert" className="h-4 w-4 shrink-0 text-brass" />
          {t.draftWarning}
        </p>
        <button
          type="button"
          onClick={() => setDraft(null)}
          className="mt-4 text-sm font-medium text-ink-soft underline underline-offset-2 hover:text-ink print:hidden"
        >
          {t.draftAgain}
        </button>
      </div>
    );
  }

  return (
    <div className="print:hidden">
      <p className="text-sm leading-relaxed text-ink-soft">{t.draftIntro}</p>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-ink">{t.draftPurpose}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {purposes.map((p) => (
            <label
              key={p}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                purpose === p ? "border-ink bg-ink text-white" : "border-rule text-ink hover:border-brass"
              }`}
            >
              <input
                type="radio"
                name="purpose"
                value={p}
                checked={purpose === p}
                onChange={() => setPurpose(p)}
                className="sr-only"
              />
              {t.purposes[p]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 block">
        <span className="text-sm font-medium text-ink">{t.draftExtra}</span>
        <textarea
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder={t.draftExtraPlaceholder}
          className="mt-1.5 w-full rounded-lg border border-rule bg-card p-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/20"
        />
      </label>
      {error && <p className="mt-2 text-sm text-urgent">{error}</p>}
      <button
        type="button"
        onClick={write}
        disabled={loading}
        className="mt-4 rounded-lg bg-ink px-5 py-2.5 font-semibold text-white transition hover:bg-ink/90 disabled:bg-ink/40"
      >
        {loading ? t.draftLoading : t.draftButton}
      </button>
    </div>
  );
}
