import { INTERNAL_DOMAINS, OWNED_BRAND_DOMAINS } from "./config.ts";
import { all, one, type DB } from "./db.ts";
import { normalizeName } from "./import/text.ts";
import { currentStage } from "./services.ts";

const GENERIC_DOMAINS = new Set(["gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "live.com", "proton.me", "protonmail.com", "aol.com"]);

export type MatchVerdict =
  | "internal"
  | "owned_brand"
  | "repeat"
  | "stack"
  | "new"
  | "ambiguous";

type CompanyRef = { id: number; name: string; stage: string | null; via: string };

export type MatchResult = {
  verdict: MatchVerdict;
  rule: string;
  company: CompanyRef | null;
  person: { id: number; name: string; companies: string[]; do_not_email: boolean } | null;
  candidates: CompanyRef[];
  domain: string | null;
};

function ref(db: DB, id: number, via: string): CompanyRef {
  const c = one<{ id: number; name: string; merged_into_id: number | null }>(db, "SELECT id, name, merged_into_id FROM company WHERE id = ?", id)!;
  const target = c.merged_into_id ? one<{ id: number; name: string }>(db, "SELECT id, name FROM company WHERE id = ?", c.merged_into_id)! : c;
  return { id: target.id, name: target.name, stage: currentStage(db, target.id)?.stage ?? null, via };
}

/** Apply the tracker's exclusion and stacking rules to one incoming submission. */
export function matchSubmission(db: DB, s: { name: string; email?: string | null; company?: string | null }): MatchResult {
  const email = s.email?.trim().toLowerCase() ?? "";
  const domain = email.includes("@") ? email.split("@")[1] : null;
  const base: MatchResult = { verdict: "new", rule: "", company: null, person: null, candidates: [], domain };

  if (domain && INTERNAL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`)))
    return { ...base, verdict: "internal", rule: `@${domain} is a Tricentis address: record as excluded with rule "internal"` };
  if (domain && OWNED_BRAND_DOMAINS.includes(domain))
    return { ...base, verdict: "owned_brand", rule: `@${domain} is a Tricentis-owned brand: record as excluded with rule "owned_brand" and a note like Neotys` };

  const byEmail = email
    ? one<{ id: number; name: string; dne: string | null }>(db, "SELECT id, name, do_not_email_reason AS dne FROM person WHERE email = ?", email)
    : undefined;
  if (byEmail) {
    const companies = all<{ company_id: number; name: string }>(
      db,
      "SELECT ct.company_id, c.name FROM contact ct JOIN company c ON c.id = ct.company_id WHERE ct.person_id = ?",
      byEmail.id,
    );
    return {
      ...base,
      verdict: "repeat",
      rule: "this email is already a contact: record a repeat submission, no new entry",
      person: { id: byEmail.id, name: byEmail.name, companies: companies.map((c) => c.name), do_not_email: !!byEmail.dne },
      company: companies[0] ? ref(db, companies[0].company_id, "email") : null,
      candidates: companies.map((c) => ref(db, c.company_id, "email")),
    };
  }

  const candidates = new Map<number, CompanyRef>();
  if (s.company?.trim()) {
    const k = normalizeName(s.company);
    for (const a of all<{ company_id: number; alias: string }>(db, "SELECT company_id, alias FROM company_alias")) {
      const ak = normalizeName(a.alias);
      if (ak && (ak === k || (k.length >= 4 && (ak.startsWith(k) || k.startsWith(ak)))))
        candidates.set(a.company_id, ref(db, a.company_id, ak === k ? "company name" : "company name prefix"));
    }
  }
  if (domain && !GENERIC_DOMAINS.has(domain)) {
    for (const r of all<{ company_id: number }>(
      db,
      "SELECT DISTINCT ct.company_id FROM contact ct JOIN person p ON p.id = ct.person_id WHERE lower(p.email) LIKE ?",
      `%@${domain}`,
    ))
      if (!candidates.has(r.company_id)) candidates.set(r.company_id, ref(db, r.company_id, `email domain ${domain}`));
  }
  const list = [...new Map([...candidates.values()].map((c) => [c.id, c])).values()];

  if (list.length) {
    const sameName = list.find((c) =>
      one(
        db,
        "SELECT 1 FROM contact ct JOIN person p ON p.id = ct.person_id WHERE ct.company_id = ? AND lower(p.name) = lower(?)",
        c.id,
        s.name.trim(),
      ),
    );
    if (sameName)
      return { ...base, verdict: "repeat", rule: "same name already a contact at this company (different email): treat as a repeat, and note the second address", company: sameName, candidates: list };
  }
  if (list.length === 1)
    return { ...base, verdict: "stack", rule: "company already tracked: record as stacked on this company_id, no new company", company: list[0], candidates: list };
  if (list.length > 1)
    return { ...base, verdict: "ambiguous", rule: "several tracked companies match: pick one and record it under Judgment calls", candidates: list };
  return { ...base, verdict: "new", rule: s.company?.trim() ? "new company" : "company field blank: resolve from the email domain if confident, else name it 'Unresolved (<submitter name>)' and add a note" };
}
