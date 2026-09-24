"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/analysis";
import { prepareFile } from "@/lib/image";
import { Results } from "./components/Results";
import { UploadForm } from "./components/UploadForm";

export default function Home() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze({ file, text, language }: { file: File | null; text: string; language: string }) {
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      if (file) body.append("file", await prepareFile(file));
      else body.append("text", text);
      body.append("language", language);

      const res = await fetch("/api/analyze", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setAnalysis(data);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-14">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-teal-700">ClearRights</p>
        {!analysis && (
          <>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              Official letters should not feel impossible to understand.
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              Upload a letter from a landlord, NAV, a debt collector or a public office. We explain what it means,
              find the deadlines, and show you where to get help in Norway.
            </p>
          </>
        )}
      </header>

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {error}
        </p>
      )}

      {analysis ? (
        <Results analysis={analysis} onReset={() => setAnalysis(null)} />
      ) : (
        <UploadForm loading={loading} onSubmit={analyze} />
      )}

      <footer className="mt-10 border-t border-slate-200 pt-5 text-xs leading-relaxed text-slate-500">
        ClearRights provides general legal information and document explanations. It does not provide legal advice
        and does not replace a qualified lawyer or official legal service.
      </footer>
    </main>
  );
}
