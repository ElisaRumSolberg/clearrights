import type { Localized } from "./i18n";

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
  topic: Localized;
  url: string;
};

export type HelpService = {
  name: string;
  description: Localized;
  url: string;
};

export type CategoryKnowledge = {
  label: Localized;
  description: string; // English, shown to the model to help it classify
  authority: HelpService | null;
  laws: LawRef[];
  typical_deadline_note: Localized | null;
  verified: boolean;
};

// Free legal aid run by law students. Shown for every category.
export const FREE_LEGAL_AID: HelpService[] = [
  {
    name: "Jussformidlingen (Bergen)",
    description: {
      en: "Free legal aid run by law students at the University of Bergen.",
      tr: "Bergen Üniversitesi hukuk öğrencilerinin yürüttüğü ücretsiz hukuki yardım.",
      no: "Gratis rettshjelp drevet av jusstudenter ved Universitetet i Bergen.",
    },
    url: "https://jussformidlingen.no",
  },
  {
    name: "Jussbuss (Oslo)",
    description: {
      en: "Free legal aid run by law students in Oslo.",
      tr: "Oslo'da hukuk öğrencilerinin yürüttüğü ücretsiz hukuki yardım.",
      no: "Gratis rettshjelp drevet av jusstudenter i Oslo.",
    },
    url: "https://jussbuss.no",
  },
  {
    name: "Jushjelpa i Midt-Norge (Trondheim)",
    description: {
      en: "Free legal aid run by law students in Trondheim.",
      tr: "Trondheim'da hukuk öğrencilerinin yürüttüğü ücretsiz hukuki yardım.",
      no: "Gratis rettshjelp drevet av jusstudenter i Trondheim.",
    },
    url: "https://jushjelpa.no",
  },
  {
    name: "JURK",
    description: {
      en: "Free legal aid for women, run by law students.",
      tr: "Kadınlara yönelik, hukuk öğrencilerinin yürüttüğü ücretsiz hukuki yardım.",
      no: "Gratis rettshjelp for kvinner, drevet av jusstudenter.",
    },
    url: "https://jurk.no",
  },
];

export const KNOWLEDGE = {
  rental_deposit: {
    label: { en: "Rental deposit", tr: "Kira depozitosu", no: "Depositum" },
    description:
      "Letters about a residential rental deposit (depositum): withholding, deductions, release or disputes about the deposit account.",
    authority: {
      name: "Husleietvistutvalget (HTU)",
      description: {
        en: "Handles disputes between landlords and tenants, including deposit disputes.",
        tr: "Ev sahibi ile kiracı arasındaki anlaşmazlıklara, depozito anlaşmazlıkları dahil, bakar.",
        no: "Behandler tvister mellom utleier og leietaker, også om depositum.",
      },
      url: "https://www.htu.no",
    },
    laws: [
      {
        name: "Husleieloven",
        section: "§ 3-5",
        topic: { en: "Deposit (depositum)", tr: "Depozito (depositum)", no: "Depositum" },
        url: "https://lovdata.no/lov/1999-03-26-17/§3-5",
      },
    ],
    typical_deadline_note: null,
    verified: false,
  },
  debt_collection: {
    label: { en: "Debt collection", tr: "Borç tahsilatı (inkasso)", no: "Inkasso" },
    description:
      "Debt collection letters: inkassovarsel, betalingsoppfordring, payment reminders from a debt collection agency.",
    authority: {
      name: "Forbrukerrådet",
      description: {
        en: "The Norwegian Consumer Council gives free guidance on consumer and debt collection issues.",
        tr: "Norveç Tüketici Konseyi, tüketici ve borç tahsilatı konularında ücretsiz rehberlik verir.",
        no: "Forbrukerrådet gir gratis veiledning om forbruker- og inkassosaker.",
      },
      url: "https://www.forbrukerradet.no",
    },
    laws: [
      {
        name: "Inkassoloven",
        section: "§ 9",
        topic: {
          en: "Debt collection warning (inkassovarsel)",
          tr: "İnkasso uyarısı (inkassovarsel)",
          no: "Inkassovarsel",
        },
        url: "https://lovdata.no/lov/1988-05-13-26/§9",
      },
      {
        name: "Inkassoloven",
        section: "§ 10",
        topic: {
          en: "Payment demand (betalingsoppfordring)",
          tr: "Ödeme talebi (betalingsoppfordring)",
          no: "Betalingsoppfordring",
        },
        url: "https://lovdata.no/lov/1988-05-13-26/§10",
      },
    ],
    typical_deadline_note: null,
    verified: false,
  },
  nav_decision: {
    label: { en: "NAV decision", tr: "NAV kararı", no: "Vedtak fra NAV" },
    description: "Decisions (vedtak) from NAV about benefits, allowances or repayment claims.",
    authority: {
      name: "NAV",
      description: {
        en: "You can appeal (klage) a NAV decision directly to NAV.",
        tr: "NAV kararına doğrudan NAV'a itiraz (klage) edebilirsiniz.",
        no: "Du kan klage på et vedtak fra NAV direkte til NAV.",
      },
      url: "https://www.nav.no/klage",
    },
    laws: [
      {
        name: "Folketrygdloven",
        section: "§ 21-12",
        topic: {
          en: "Appeal deadline for NAV decisions",
          tr: "NAV kararlarına itiraz süresi",
          no: "Klagefrist for vedtak fra NAV",
        },
        url: "https://lovdata.no/lov/1997-02-28-19/§21-12",
      },
    ],
    typical_deadline_note: {
      en: "The appeal deadline for NAV decisions is usually 6 weeks.",
      tr: "NAV kararlarına itiraz süresi genellikle 6 haftadır.",
      no: "Klagefristen for vedtak fra NAV er vanligvis seks uker.",
    },
    verified: false,
  },
  public_authority_decision: {
    label: {
      en: "Other public authority decision",
      tr: "Diğer kamu kurumu kararı",
      no: "Vedtak fra annen offentlig myndighet",
    },
    description:
      "Decisions (vedtak) from a municipality, UDI, Lånekassen, Skatteetaten or another public body, other than NAV.",
    authority: null,
    laws: [
      {
        name: "Forvaltningsloven",
        section: "§ 29",
        topic: {
          en: "Appeal deadline for administrative decisions",
          tr: "İdari kararlara itiraz süresi",
          no: "Klagefrist for forvaltningsvedtak",
        },
        url: "https://lovdata.no/lov/1967-02-10/§29",
      },
    ],
    typical_deadline_note: {
      en: "The general appeal deadline for administrative decisions is usually 3 weeks.",
      tr: "İdari kararlara genel itiraz süresi genellikle 3 haftadır.",
      no: "Den generelle klagefristen for forvaltningsvedtak er vanligvis tre uker.",
    },
    verified: false,
  },
  other: {
    label: { en: "Other", tr: "Diğer", no: "Annet" },
    description: "Anything that does not clearly fit one of the other categories.",
    authority: null,
    laws: [],
    typical_deadline_note: null,
    verified: true,
  },
} satisfies Record<string, CategoryKnowledge>;

export type Category = keyof typeof KNOWLEDGE;

export const CATEGORIES = Object.keys(KNOWLEDGE) as Category[];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && value in KNOWLEDGE;
}
