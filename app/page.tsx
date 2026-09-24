"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/analysis";
import { prepareFile } from "@/lib/image";
import { Icon, type IconName } from "./components/Icon";
import { Loading } from "./components/Loading";
import { Results } from "./components/Results";
import { UploadForm } from "./components/UploadForm";

const PRINCIPLES: { icon: IconName; title: string; text: string }[] = [
  { icon: "file", title: "Quoted from your letter", text: "Every point links back to the exact sentence it comes from." },
  { icon: "calendar", title: "Deadlines calculated, not guessed", text: "“Within 14 days of receipt” becomes a real date." },
  { icon: "landmark", title: "Verified Norwegian sources", text: "Authorities and laws come from a checked list, not from the AI." },
  { icon: "lock", title: "Nothing is stored", text: "Your letter is analysed and then discarded." },
];

export default function Home() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze({ file, text, language }: { file: File | null; text: string; language: string }) {
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
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="border-b border-rule bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={() => setAnalysis(null)}
            className="flex items-center gap-2.5 text-ink"
            aria-label="ClearRights home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-brass-soft">
              <Icon name="scale" className="h-5 w-5" />
            </span>
            <span className="font-serif text-xl font-semibold tracking-tight">ClearRights</span>
          </button>
          <span className="hidden rounded-full border border-rule px-3 py-1 text-xs font-medium text-ink-soft sm:inline">
            Norway · Legal information, not legal advice
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {error && (
          <p role="alert" className="mb-6 flex items-start gap-2 rounded-lg border border-urgent/30 bg-urgent-soft px-4 py-3 text-sm text-urgent">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {loading ? (
          <Loading />
        ) : analysis ? (
          <Results analysis={analysis} onReset={() => setAnalysis(null)} />
        ) : (
          <>
            <section className="grid items-start gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
              <div className="lg:pt-6">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brass">
                  For students, newcomers and everyone in between
                </p>
                <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                  Official letters should not feel impossible to understand.
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
                  Upload a letter from a landlord, NAV, a debt collector or a public office. ClearRights explains it in
                  your language, finds the deadlines, and shows you where to get help in Norway.
                </p>
                <ul className="mt-8 grid gap-5 sm:grid-cols-2">
                  {PRINCIPLES.map((p) => (
                    <li key={p.title} className="flex gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brass-soft text-brass">
                        <Icon name={p.icon} className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{p.title}</p>
                        <p className="text-sm leading-snug text-ink-soft">{p.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <UploadForm loading={loading} onSubmit={analyze} />
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl gap-3 px-4 py-6 text-xs leading-relaxed text-ink-soft sm:px-6">
          <Icon name="shield" className="h-4 w-4 shrink-0 text-brass" />
          <p>
            ClearRights provides general legal information and document explanations. It does not provide legal advice
            and does not replace a qualified lawyer or official legal service.
          </p>
        </div>
      </footer>
    </>
  );
}
