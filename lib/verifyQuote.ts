// Checks that a quote the model attributes to the document actually appears in
// the document text. Ignores case, whitespace and quote-mark style so that line
// breaks in the PDF don't cause false negatives.

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’‚‛`´]/g, "'")
    .replace(/[“”„«»]/g, '"')
    .replace(/[‐-―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function quoteAppearsIn(quote: string, documentText: string): boolean {
  const q = normalize(quote).replace(/^["'.…]+|["'.…]+$/g, "").trim();
  if (q.length < 8) return false;
  return normalize(documentText).includes(q);
}
