"use client";

import { useEffect, useState } from "react";
import type { Analysis } from "@/lib/analysis";
import { DICT, langFor, type Lang } from "@/lib/i18n";
import { prepareFile } from "@/lib/image";
import { SAMPLES } from "@/lib/samples";
import { Icon, type IconName } from "./components/Icon";
import { Loading } from "./components/Loading";
import { Results } from "./components/Results";
import { UploadForm } from "./components/UploadForm";

const PRINCIPLE_ICONS: IconName[] = ["file", "calendar", "landmark", "lock"];

export default function Home() {
  const [language, setLanguage] = useState("English");
  const [result, setResult] = useState<{ analysis: Analysis; lang: Lang; language: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // While a result is shown, keep the interface in the language it was requested in.
  const lang = result?.lang ?? langFor(language);
  const t = DICT[lang];

  // Correct casing rules (Turkish İ/ı) and screen reader pronunciation.
  useEffect(() => {
    document.documentElement.lang = lang === "no" ? "nb" : lang;
  }, [lang]);

  async function analyze({ file, text }: { file: File | null; text: string }) {
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0 });
    try {
      const body = new FormData();
      if (file) body.append("file", await prepareFile(file));
      else body.append("text", text);
      body.append("language", language);

      const res = await fetch("/api/analyze", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(res.status === 429 ? t.rateLimited : (data.error ?? t.genericError));
      setResult({ analysis: data, lang: langFor(language), language });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="border-b border-rule bg-card/80 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={() => setResult(null)}
            className="flex items-center gap-2.5 text-ink"
            aria-label="ClearRights home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-brass-soft">
              <Icon name="scale" className="h-5 w-5" />
            </span>
            <span className="font-serif text-xl font-semibold tracking-tight">ClearRights</span>
          </button>
          <span className="hidden rounded-full border border-rule px-3 py-1 text-xs font-medium text-ink-soft sm:inline">
            {t.badge}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12 print:max-w-none print:p-0">
        {error && (
          <p role="alert" className="mb-6 flex items-start gap-2 rounded-lg border border-urgent/30 bg-urgent-soft px-4 py-3 text-sm text-urgent">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {loading ? (
          <Loading t={t} />
        ) : result ? (
          <Results
            analysis={result.analysis}
            lang={result.lang}
            language={result.language}
            onReset={() => setResult(null)}
          />
        ) : (
          <section className="grid items-start gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <div className="lg:pt-6">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brass">{t.eyebrow}</p>
              <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                {t.headline}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{t.lead}</p>
              <div className="mt-6 rounded-xl border border-brass/30 bg-brass-soft/60 p-4">
                <p className="text-sm font-semibold text-ink">{t.trySample}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {(["deposit", "debt"] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => analyze({ file: null, text: SAMPLES[id] })}
                      className="flex items-center gap-2 rounded-lg border border-rule bg-card px-3 py-2 text-left text-sm font-medium text-ink shadow-sm transition hover:border-brass"
                    >
                      <Icon name="file" className="h-4 w-4 shrink-0 text-brass" />
                      {t.samples[id]}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-soft">{t.sampleNote}</p>
              </div>
              <ul className="mt-8 grid gap-5 sm:grid-cols-2">
                {t.principles.map((p, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brass-soft text-brass">
                      <Icon name={PRINCIPLE_ICONS[i]} className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{p.title}</p>
                      <p className="text-sm leading-snug text-ink-soft">{p.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <UploadForm
              t={t}
              language={language}
              onLanguageChange={setLanguage}
              onSubmit={analyze}
            />
          </section>
        )}
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl gap-3 px-4 py-6 text-xs leading-relaxed text-ink-soft sm:px-6">
          <Icon name="shield" className="h-4 w-4 shrink-0 text-brass" />
          <p>{t.disclaimer}</p>
        </div>
      </footer>
    </>
  );
}
