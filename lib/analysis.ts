import { CATEGORIES, type Category } from "./knowledge";

// What the model returns. Dates are NOT computed here: relative deadlines come
// back as amount/unit/anchor and lib/deadline.ts turns them into real dates.
export type DeadlineKind = "response" | "payment" | "appeal" | "appointment" | "other";
export type DeadlineUnit = "days" | "weeks" | "months";
export type DeadlineAnchor = "received" | "document_date" | "other";

export type ExtractedDate = {
  kind: DeadlineKind;
  description: string;
  raw_expression: string;
  is_relative: boolean;
  absolute_date: string | null; // YYYY-MM-DD, only when is_relative is false
  amount: number | null;
  unit: DeadlineUnit | null;
  anchor: DeadlineAnchor | null;
  source_quote: string;
};

export type QuotedItem = {
  text: string;
  source_quote: string;
};

export type ModelAnalysis = {
  category: Category;
  document_language: string;
  sender: string;
  document_date: string | null;
  summary: string;
  sender_request: QuotedItem[];
  important_points: QuotedItem[];
  dates: ExtractedDate[];
  next_steps: string[];
  terms: { term: string; explanation: string }[];
  document_text: string;
};

// What the API route sends to the browser: model output plus server-side checks.
export type Analysis = Omit<ModelAnalysis, "sender_request" | "important_points" | "dates"> & {
  sender_request: (QuotedItem & { quote_verified: boolean })[];
  important_points: (QuotedItem & { quote_verified: boolean })[];
  dates: (ExtractedDate & { quote_verified: boolean })[];
  // Found by lib/injection.ts, independent of the model.
  ai_instructions_detected: boolean;
};

const quoted = {
  type: "object",
  properties: {
    text: { type: "string" },
    source_quote: {
      type: "string",
      description: "Exact sentence copied character-for-character from the document, in its original language.",
    },
  },
  required: ["text", "source_quote"],
};

export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: CATEGORIES },
    document_language: { type: "string" },
    sender: { type: "string" },
    document_date: {
      type: ["string", "null"],
      description: "Date the document was written, YYYY-MM-DD, or null if not stated.",
    },
    summary: { type: "string" },
    sender_request: { type: "array", items: quoted },
    important_points: { type: "array", items: quoted },
    dates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["response", "payment", "appeal", "appointment", "other"] },
          description: { type: "string" },
          raw_expression: {
            type: "string",
            description: "The date or deadline wording exactly as written, e.g. 'innen 14 dager fra mottak'.",
          },
          is_relative: { type: "boolean" },
          absolute_date: { type: ["string", "null"], description: "YYYY-MM-DD when the document states a fixed date." },
          amount: { type: ["integer", "null"] },
          unit: { type: ["string", "null"], enum: ["days", "weeks", "months", null] },
          anchor: { type: ["string", "null"], enum: ["received", "document_date", "other", null] },
          source_quote: { type: "string" },
        },
        required: [
          "kind", "description", "raw_expression", "is_relative",
          "absolute_date", "amount", "unit", "anchor", "source_quote",
        ],
      },
    },
    next_steps: { type: "array", items: { type: "string" } },
    terms: {
      type: "array",
      items: {
        type: "object",
        properties: { term: { type: "string" }, explanation: { type: "string" } },
        required: ["term", "explanation"],
      },
    },
    document_text: {
      type: "string",
      description: "Full text of the document, transcribed exactly in its original language.",
    },
  },
  required: [
    "category", "document_language", "sender", "document_date", "summary",
    "sender_request", "important_points", "dates", "next_steps", "terms", "document_text",
  ],
};
