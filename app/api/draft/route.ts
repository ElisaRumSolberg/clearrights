import { buildDraftPrompt, DRAFT_SCHEMA, PURPOSES, type Draft, type DraftRequest, type Purpose } from "@/lib/draft";
import { createClient, generateJson } from "@/lib/gemini";
import { allow, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 90;

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!allow(`draft:min:${ip}`, 6, 60_000) || !allow(`draft:day:${ip}`, 60, 86_400_000)) {
    return error("Too many requests. Please wait a minute and try again.", 429);
  }

  const ai = createClient();
  if (!ai) return error("Server is missing GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT.", 500);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return error("Invalid request.", 400);
  }

  const purpose = body.purpose as Purpose;
  const documentText = String(body.documentText ?? "").trim();
  if (!PURPOSES.includes(purpose) || !documentText) return error("Invalid request.", 400);

  const deadline = typeof body.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.deadline) ? body.deadline : null;
  const req: DraftRequest = {
    purpose,
    extra: String(body.extra ?? "").slice(0, 1_000),
    language: String(body.language ?? "English").slice(0, 40) || "English",
    sender: String(body.sender ?? "").slice(0, 200),
    documentText: documentText.slice(0, 20_000),
    deadline,
  };

  try {
    const draft = await generateJson<Draft>(ai, {
      systemInstruction: buildDraftPrompt(req),
      schema: DRAFT_SCHEMA,
      temperature: 0.3,
      parts: [
        { text: `<letter>\n${req.documentText}\n</letter>` },
        { text: `<writer_note>\n${req.extra || "(none)"}\n</writer_note>` },
        { text: "Write the reply." },
      ],
    });
    return Response.json(draft);
  } catch (err) {
    console.error("Draft generation failed:", err);
    return error("The draft could not be written. Please try again.", 502);
  }
}
