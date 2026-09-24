import { GoogleGenAI, ThinkingLevel, type Part } from "@google/genai";
import { RESPONSE_SCHEMA, type Analysis, type ModelAnalysis } from "@/lib/analysis";
import { isCategory } from "@/lib/knowledge";
import { buildSystemPrompt } from "@/lib/prompt";
import { quoteAppearsIn } from "@/lib/verifyQuote";

export const runtime = "nodejs";
export const maxDuration = 90;

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

function createClient(): GoogleGenAI | null {
  if (!USE_VERTEX) return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  if (!process.env.GOOGLE_CLOUD_PROJECT) return null;
  return new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION || "global",
  });
}
// Vercel rejects request bodies above ~4.5 MB; the browser downscales photos to stay under this.
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

async function generate(
  ai: GoogleGenAI,
  model: string,
  parts: Part[],
  systemInstruction: string,
  signal: AbortSignal,
): Promise<ModelAnalysis> {
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
      abortSignal: signal,
      // Extraction doesn't need long reasoning, and less thinking is faster.
      ...(model.startsWith("gemini-3") && { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }),
    },
  });
  return JSON.parse(response.text ?? "") as ModelAnalysis;
}

function hedgedGenerate(ai: GoogleGenAI, parts: Part[], systemInstruction: string): Promise<ModelAnalysis> {
  const primaryAbort = new AbortController();
  const fallbackAbort = new AbortController();
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  const primary = generate(ai, MODEL, parts, systemInstruction, AbortSignal.any([primaryAbort.signal, timeout]));

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
    return generate(ai, FALLBACK_MODEL, parts, systemInstruction, AbortSignal.any([fallbackAbort.signal, timeout]));
  });

  // Whichever answers first wins; cancel the other.
  primary.then(() => fallbackAbort.abort(), () => {});
  fallback.then(() => primaryAbort.abort(), () => {});
  return Promise.any([primary, fallback]);
}

export async function POST(request: Request) {
  const ai = createClient();
  if (!ai) {
    return error("Server is missing GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT.", 500);
  }

  const form = await request.formData();
  const file = form.get("file");
  const pastedText = String(form.get("text") ?? "").trim();
  const outputLanguage = String(form.get("language") ?? "English").slice(0, 40) || "English";

  const parts: Part[] = [];
  if (file instanceof File && file.size > 0) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return error("Unsupported file type. Upload a PDF, JPG, PNG or WebP.", 415);
    }
    if (file.size > MAX_FILE_BYTES) {
      return error("File is too large (max 4 MB).", 413);
    }
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    parts.push({ inlineData: { mimeType: file.type, data } });
  } else if (pastedText) {
    parts.push({ text: `<document>\n${pastedText.slice(0, 30_000)}\n</document>` });
  } else {
    return error("Upload a file or paste the text of the letter.", 400);
  }
  parts.push({ text: "Analyze this document." });

  const systemInstruction = buildSystemPrompt(outputLanguage, new Date().toISOString().slice(0, 10));
  let model: ModelAnalysis;
  try {
    model = await hedgedGenerate(ai, parts, systemInstruction);
  } catch (err) {
    console.error("Gemini analysis failed:", err);
    return error("The document could not be analyzed. Please try again.", 502);
  }

  // For pasted text, check quotes against what the user actually pasted,
  // not the model's own transcription.
  const sourceText = pastedText && parts[0].text ? pastedText : model.document_text ?? "";
  const verify = <T extends { source_quote: string }>(items: T[] | undefined) =>
    (items ?? []).map((item) => ({ ...item, quote_verified: quoteAppearsIn(item.source_quote, sourceText) }));

  const analysis: Analysis = {
    ...model,
    category: isCategory(model.category) ? model.category : "other",
    sender_request: verify(model.sender_request),
    important_points: verify(model.important_points),
    dates: verify(model.dates),
    next_steps: model.next_steps ?? [],
    terms: model.terms ?? [],
  };

  return Response.json(analysis);
}
