import { GoogleGenAI, type Part } from "@google/genai";
import { RESPONSE_SCHEMA, type Analysis, type ModelAnalysis } from "@/lib/analysis";
import { isCategory } from "@/lib/knowledge";
import { buildSystemPrompt } from "@/lib/prompt";
import { quoteAppearsIn } from "@/lib/verifyQuote";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
// Vercel rejects request bodies above ~4.5 MB; the browser downscales photos to stay under this.
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return error("Server is missing GEMINI_API_KEY.", 500);
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

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let model: ModelAnalysis;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: buildSystemPrompt(outputLanguage, new Date().toISOString().slice(0, 10)),
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    });
    model = JSON.parse(response.text ?? "") as ModelAnalysis;
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
