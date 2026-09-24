"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

const STEPS = [
  "Reading the letter",
  "Explaining it in plain language",
  "Finding dates and deadlines",
  "Checking every quote against the letter",
  "Matching verified Norwegian sources",
];

// The analysis is a single request, so these steps advance on a timer
// to show what is happening rather than report exact progress.
export function Loading() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto max-w-md py-12 sm:py-20" role="status" aria-live="polite">
      <p className="font-serif text-2xl font-semibold text-ink">Reviewing your letter…</p>
      <p className="mt-1 text-sm text-ink-soft">This usually takes 15–25 seconds.</p>
      <ol className="mt-8 space-y-4">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                i < step
                  ? "border-ok bg-ok text-white"
                  : i === step
                    ? "border-brass text-brass"
                    : "border-rule text-transparent"
              }`}
            >
              {i < step ? (
                <Icon name="check" className="h-3.5 w-3.5" />
              ) : (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-brass"
                  style={i === step ? { animation: "pulse-dot 1.2s ease-in-out infinite" } : { opacity: 0 }}
                />
              )}
            </span>
            <span className={i <= step ? "text-ink" : "text-ink-soft/60"}>{label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
