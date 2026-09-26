import type { Localized } from "./i18n";

// Verified Norwegian legal/administrative knowledge.
//
// The model only picks a category key. Every authority, law reference and URL
// shown to the user comes from this file, never from the model.
//
// Every section, URL and authority below was checked by hand on 2026-09-25.
// When adding or changing an entry, set `verified: false` until it has been
// checked again; unverified entries render with a warning badge.

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
    verified: true,
  },
  debt_collection: {
    label: { en: "Debt collection", tr: "Borç tahsilatı (inkasso)", no: "Inkasso" },
    description:
      "Debt collection letters: inkassovarsel, betalingsoppfordring, payment reminders from a debt collection agency.",
    authority: {
      name: "Forbrukerrådet",
      description: {
        en: "The Norwegian Consumer Council gives consumers free information and guidance on debt collection, including how to object to a claim. Complaints about a debt collector's conduct can go to Finansklagenemnda Inkasso.",
        tr: "Norveç Tüketici Konseyi, tüketicilere inkasso konusunda, bir talebe nasıl itiraz edileceği dahil, ücretsiz bilgi ve rehberlik sağlar. Bir inkasso şirketinin davranışıyla ilgili şikâyetler Finansklagenemnda Inkasso'ya yapılabilir.",
        no: "Forbrukerrådet gir forbrukere gratis informasjon og veiledning om inkasso, blant annet om hvordan du protesterer mot et krav. Klager på et inkassobyrås opptreden kan sendes til Finansklagenemnda Inkasso.",
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
    verified: true,
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
          en: "Appeals in National Insurance cases",
          tr: "Sosyal güvenlik (folketrygd) davalarında itiraz",
          no: "Klage og anke i trygdesaker",
        },
        url: "https://lovdata.no/lov/1997-02-28-19/§21-12",
      },
    ],
    // NAV: "Fristen varierer etter hva slags sak det er" — never state one deadline for all NAV decisions.
    typical_deadline_note: {
      en: "The appeal deadline depends on the decision. For many decisions under the National Insurance Act it is 6 weeks; for some NAV decisions it is 3 weeks. The exact deadline is always stated in your decision letter.",
      tr: "İtiraz süresi karara göre değişir. Folketrygdloven kapsamındaki birçok kararda süre 6 haftadır; bazı NAV kararlarında ise 3 haftadır. Kesin itiraz süresi her zaman karar mektubunuzda yazar.",
      no: "Klagefristen avhenger av vedtaket. For mange vedtak etter folketrygdloven er den seks uker, for noen NAV-vedtak er den tre uker. Den nøyaktige fristen står alltid i vedtaket du har fått.",
    },
    verified: true,
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
    verified: true,
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
