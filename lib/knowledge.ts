// Verified Norwegian legal/administrative knowledge.
//
// The model only picks a category key. Every authority, law reference and URL
// shown to the user comes from this file, never from the model.
//
// Before the demo: open every URL, check every section number against Lovdata,
// then flip `verified` to true. Unverified entries render with a warning badge.

export type LawRef = {
  name: string;
  section: string;
  topic: string;
  url: string;
};

export type HelpService = {
  name: string;
  description: string;
  url: string;
};

export type CategoryKnowledge = {
  label: string;
  description: string; // shown to the model to help it classify
  authority: HelpService | null;
  laws: LawRef[];
  recommended_actions: string[];
  typical_deadline_note: string | null;
  verified: boolean;
};

// Free legal aid run by law students. Shown for every category.
export const FREE_LEGAL_AID: HelpService[] = [
  {
    name: "Jussformidlingen (Bergen)",
    description: "Free legal aid run by law students at the University of Bergen.",
    url: "https://jussformidlingen.no",
  },
  {
    name: "Jussbuss (Oslo)",
    description: "Free legal aid run by law students in Oslo.",
    url: "https://jussbuss.no",
  },
  {
    name: "Jushjelpa i Midt-Norge (Trondheim)",
    description: "Free legal aid run by law students in Trondheim.",
    url: "https://jushjelpa.no",
  },
  {
    name: "JURK",
    description: "Free legal aid for women, run by law students.",
    url: "https://jurk.no",
  },
];

export const KNOWLEDGE = {
  rental_deposit: {
    label: "Rental deposit",
    description:
      "Letters about a residential rental deposit (depositum): withholding, deductions, release or disputes about the deposit account.",
    authority: {
      name: "Husleietvistutvalget (HTU)",
      description: "Handles disputes between landlords and tenants, including deposit disputes.",
      url: "https://www.htu.no",
    },
    laws: [
      {
        name: "Husleieloven",
        section: "§ 3-5",
        topic: "Deposit (depositum)",
        url: "https://lovdata.no/lov/1999-03-26-17/§3-5",
      },
    ],
    recommended_actions: [
      "Keep the original letter",
      "Find your rental agreement",
      "Collect proof of the deposit payment and the deposit account",
      "Keep all written communication with the landlord",
      "Take or find photos of the apartment's condition",
    ],
    typical_deadline_note: null,
    verified: false,
  },
  debt_collection: {
    label: "Debt collection",
    description:
      "Debt collection letters: inkassovarsel, betalingsoppfordring, payment reminders from a debt collection agency.",
    authority: {
      name: "Forbrukerrådet",
      description: "The Norwegian Consumer Council gives free guidance on consumer and debt collection issues.",
      url: "https://www.forbrukerradet.no",
    },
    laws: [
      {
        name: "Inkassoloven",
        section: "§ 9",
        topic: "Debt collection warning (inkassovarsel)",
        url: "https://lovdata.no/lov/1988-05-13-26/§9",
      },
      {
        name: "Inkassoloven",
        section: "§ 10",
        topic: "Payment demand (betalingsoppfordring)",
        url: "https://lovdata.no/lov/1988-05-13-26/§10",
      },
    ],
    recommended_actions: [
      "Keep the original letter",
      "Check whether you recognise the claim and the amount",
      "Find the original invoice and any payment receipts",
      "If you disagree, object in writing before the deadline",
      "Do not ignore the letter: costs can increase",
    ],
    typical_deadline_note: null,
    verified: false,
  },
  nav_decision: {
    label: "NAV decision",
    description:
      "Decisions (vedtak) from NAV about benefits, allowances or repayment claims.",
    authority: {
      name: "NAV",
      description: "You can appeal (klage) a NAV decision directly to NAV.",
      url: "https://www.nav.no/klage",
    },
    laws: [
      {
        name: "Folketrygdloven",
        section: "§ 21-12",
        topic: "Appeal deadline for NAV decisions",
        url: "https://lovdata.no/lov/1997-02-28-19/§21-12",
      },
    ],
    recommended_actions: [
      "Keep the original decision letter",
      "Note the date you received the decision",
      "Collect documents that support your case",
      "If you disagree, send an appeal (klage) before the deadline",
    ],
    typical_deadline_note: "Appeal deadline for NAV decisions is usually 6 weeks.",
    verified: false,
  },
  public_authority_decision: {
    label: "Other public authority decision",
    description:
      "Decisions (vedtak) from a municipality, UDI, Lånekassen, Skatteetaten or another public body, other than NAV.",
    authority: null,
    laws: [
      {
        name: "Forvaltningsloven",
        section: "§ 29",
        topic: "Appeal deadline for administrative decisions",
        url: "https://lovdata.no/lov/1967-02-10/§29",
      },
    ],
    recommended_actions: [
      "Keep the original decision letter",
      "Note the date you received the decision",
      "Check the letter for which office handles appeals",
      "If you disagree, send an appeal (klage) before the deadline",
    ],
    typical_deadline_note: "The general appeal deadline for administrative decisions is usually 3 weeks.",
    verified: false,
  },
  other: {
    label: "Other",
    description: "Anything that does not clearly fit one of the other categories.",
    authority: null,
    laws: [],
    recommended_actions: [
      "Keep the original document",
      "Write down the date you received it",
      "Contact a free legal aid service if you are unsure what to do",
    ],
    typical_deadline_note: null,
    verified: true,
  },
} satisfies Record<string, CategoryKnowledge>;

export type Category = keyof typeof KNOWLEDGE;

export const CATEGORIES = Object.keys(KNOWLEDGE) as Category[];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && value in KNOWLEDGE;
}
