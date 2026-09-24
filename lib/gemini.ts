import { GoogleGenAI, ThinkingLevel, type Part } from "@google/genai";

// Two ways to reach Gemini: an AI Studio API key, or Vertex AI with Google Cloud
// login (gcloud auth application-default login) when no key is set.
const USE_VERTEX = !process.env.GEMINI_API_KEY;

// The stable model answers in ~15 s. gemini-3-flash-preview can be faster but
// its latency swings from 9 s to over 70 s, so it is only the backup.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// If the primary is slow or fails, start the backup in parallel and use
// whichever answers first.
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3-flash-preview";
const HEDGE_AFTER_MS = Number(process.env.GEMINI_HEDGE_AFTER_MS) || 25_000;
const REQUEST_TIMEOUT_MS = 70_000;

export function createClient(): GoogleGenAI | null {
  if (!USE_VERTEX) return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  if (!process.env.GOOGLE_CLOUD_PROJECT) return null;
  return new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION || "global",
  });
}

type JsonRequest = {
  parts: Part[];
  systemInstruction: string;
  schema: object;
  temperature?: number;
};

async function generate<T>(ai: GoogleGenAI, model: string, req: JsonRequest, signal: AbortSignal): Promise<T> {
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: req.parts }],
    config: {
      systemInstruction: req.systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema: req.schema,
      temperature: req.temperature ?? 0.2,
      abortSignal: signal,
      // Extraction doesn't need long reasoning, and less thinking is faster.
      ...(model.startsWith("gemini-3") && { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }),
    },
  });
  return JSON.parse(response.text ?? "") as T;
}

export function generateJson<T>(ai: GoogleGenAI, req: JsonRequest): Promise<T> {
  const primaryAbort = new AbortController();
  const fallbackAbort = new AbortController();
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  const primary = generate<T>(ai, MODEL, req, AbortSignal.any([primaryAbort.signal, timeout]));

  // Start the fallback only if the primary fails or is still running after HEDGE_AFTER_MS.
  const fallback = Promise.race([
    primary.then(
      () => "done" as const,
      (err) => {
        console.warn(`${MODEL} failed, using ${FALLBACK_MODEL}:`, err);
        return "failed" as const;
      },
    ),
    new Promise<"slow">((resolve) => setTimeout(() => resolve("slow"), HEDGE_AFTER_MS)),
  ]).then((state) => {
    if (state === "done") return new Promise<never>(() => {});
    if (state === "slow") console.warn(`${MODEL} slow after ${HEDGE_AFTER_MS} ms, starting ${FALLBACK_MODEL}`);
    return generate<T>(ai, FALLBACK_MODEL, req, AbortSignal.any([fallbackAbort.signal, timeout]));
  });

  // Whichever answers first wins; cancel the other.
  primary.then(() => fallbackAbort.abort(), () => {});
  fallback.then(() => primaryAbort.abort(), () => {});
  return Promise.any([primary, fallback]);
}
