"use client";

import { useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { Icon } from "./Icon";

export const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Turkish", label: "Türkçe" },
  { value: "simple Norwegian (Bokmål)", label: "Enkel norsk" },
  { value: "Arabic", label: "العربية" },
  { value: "Ukrainian", label: "Українська" },
  { value: "Polish", label: "Polski" },
  { value: "Somali", label: "Soomaali" },
  { value: "Tigrinya", label: "ትግርኛ" },
  { value: "Persian", label: "فارسی" },
  { value: "Spanish", label: "Español" },
];

type Props = {
  t: Dict;
  language: string;
  onLanguageChange: (language: string) => void;
  onSubmit: (input: { file: File | null; text: string }) => void;
};

export function UploadForm({ t, language, onLanguageChange, onSubmit }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"file" | "text">("file");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSubmit = mode === "file" ? file !== null : text.trim().length > 0;

  return (
    <form
      className="rounded-xl border border-rule bg-card p-5 shadow-[0_1px_0_rgba(19,35,63,0.04),0_12px_32px_-12px_rgba(19,35,63,0.18)] sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ file: mode === "file" ? file : null, text: mode === "text" ? text : "" });
      }}
    >
      <h2 className="font-serif text-xl font-semibold text-ink">{t.formTitle}</h2>

      <div className="mt-4 grid grid-cols-2 rounded-lg bg-paper p-1 text-sm font-medium" role="tablist">
        {(["file", "text"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-md py-2 transition ${mode === m ? "bg-card text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}
          >
            {m === "file" ? t.tabFile : t.tabText}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) setFile(dropped);
          }}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
            dragging ? "border-brass bg-brass-soft" : "border-rule hover:border-brass/60 hover:bg-paper/60"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brass-soft text-brass">
            <Icon name={file ? "file" : "upload"} className="h-5 w-5" />
          </span>
          {file ? (
            <>
              <p className="mt-3 max-w-full truncate font-medium text-ink">{file.name}</p>
              <p className="mt-1 text-sm text-ink-soft">{t.dropChange}</p>
            </>
          ) : (
            <>
              <p className="mt-3 font-medium text-ink">{t.dropTitle}</p>
              <p className="mt-1 text-sm text-ink-soft">{t.dropHint}</p>
            </>
          )}
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={9}
          placeholder={t.pastePlaceholder}
          className="mt-4 w-full rounded-lg border border-rule bg-card p-3 text-sm leading-relaxed text-ink placeholder:text-ink-soft/60 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/20"
        />
      )}

      <label className="mt-5 block">
        <span className="text-sm font-medium text-ink">{t.explainIn}</span>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="mt-1.5 block w-full rounded-lg border border-rule bg-card px-3 py-2.5 text-ink focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/20"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-6 w-full rounded-lg bg-ink px-5 py-3.5 font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/25"
      >
        {t.submit}
      </button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-ink-soft">
        <Icon name="lock" className="h-3.5 w-3.5" />
        {t.privacy}
      </p>

    </form>
  );
}
