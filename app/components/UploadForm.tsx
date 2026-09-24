"use client";

import { useRef, useState } from "react";

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
  loading: boolean;
  onSubmit: (input: { file: File | null; text: string; language: string }) => void;
};

export function UploadForm({ loading, onSubmit }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("English");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSubmit = !loading && (file !== null || text.trim().length > 0);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ file, text, language });
      }}
    >
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
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging ? "border-teal-600 bg-teal-50" : "border-slate-300 bg-white hover:border-teal-500"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <p className="font-medium text-slate-900">{file.name}</p>
            <p className="mt-1 text-sm text-slate-500">Click to choose another file</p>
          </>
        ) : (
          <>
            <p className="font-medium text-slate-900">Drop your letter here, or click to upload</p>
            <p className="mt-1 text-sm text-slate-500">PDF or photo (JPG, PNG)</p>
          </>
        )}
      </div>

      {!file && (
        <details className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">Or paste the text instead</summary>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Paste the letter here…"
            className="mt-3 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-teal-600 focus:outline-none"
          />
        </details>
      )}

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Explain it to me in</span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-teal-600 focus:outline-none"
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
        className="w-full rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? "Reading your letter…" : "Explain this letter"}
      </button>

      <p className="text-center text-xs text-slate-500">
        Your document is sent to the AI for analysis and is not stored by ClearRights.
      </p>
    </form>
  );
}
