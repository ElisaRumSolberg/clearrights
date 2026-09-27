// Deterministic check for text in a letter that is addressed to an AI system.
// It does not depend on the model, so the user is warned even if a hidden
// instruction manages to influence the analysis.

const PATTERNS = [
  /ignore\s+(all\s+)?(the\s+)?(previous|prior|above|earlier)\s+(instructions|rules|prompts?)/i,
  /ignorer\s+(alle\s+)?(tidligere\s+)?(instruksjoner|instrukser|regler)/i,
  /\b(ai|ki)[\s-]?(assistant|assistent|assistenten|system|model|modell)\b/i,
  /\b(note|instruction|message)\s+(to|for)\s+(the\s+)?(ai|assistant|model|llm)\b/i,
  /\b(merknad|beskjed|instruks(jon)?)\s+til\s+(ki|kunstig intelligens|assistenten)\b/i,
  /\bsystem\s*(note|prompt|message|instruction)\b/i,
  /\b(language model|språkmodell|llm)\b/i,
  /\byou are (an? )?(ai|assistant|language model)\b/i,
];

export function containsAiInstructions(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}
