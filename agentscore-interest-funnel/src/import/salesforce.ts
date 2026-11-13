import { PLACEHOLDER_OWNERS } from "../config.ts";
import { splitTopLevel } from "./text.ts";

export type ParsedAccount = {
  owner: string;
  account: string;
  type: string | null;
  persons: string[];
  matchMethod: "contact_email" | "account_name" | "website";
  note: string | null;
};

export type ParsedOwnerLine = {
  status: "matched" | "no_account" | "unassigned";
  accounts: ParsedAccount[];
  notes: string[];
  unparsed: string[];
};

const TYPES = "Churned Customer|Prospective Partner|Customer|Partner|Prospect";

function splitNames(s: string): string[] {
  return s
    .split(/,\s*|\s+and\s+/)
    .map((n) => n.trim())
    .filter(Boolean);
}

function matchMethod(note: string | null): ParsedAccount["matchMethod"] {
  if (!note) return "contact_email";
  if (/website/i.test(note)) return "website";
  if (/matched by name/i.test(note)) return "account_name";
  return "contact_email";
}

function parseAccountPart(part: string, owner: string, tailPersons: string[]): ParsedAccount | null {
  const typed = part.match(new RegExp(`^(.*?),\\s*(${TYPES})(?:,\\s*for (.+))?$`));
  if (typed)
    return {
      owner,
      account: typed[1].trim(),
      type: typed[2],
      persons: typed[3] ? splitNames(typed[3]) : tailPersons,
      matchMethod: "contact_email",
      note: null,
    };
  const untyped = part.match(/^(.*?) for (.+)$/);
  if (untyped) return { owner, account: untyped[1].trim(), type: null, persons: splitNames(untyped[2]), matchMethod: "contact_email", note: null };
  return null;
}

export function parseOwnerLine(value: string): ParsedOwnerLine {
  const out: ParsedOwnerLine = { status: "matched", accounts: [], notes: [], unparsed: [] };
  const v = value.trim();
  if (/^no Salesforce account/i.test(v)) {
    out.status = "no_account";
    out.notes.push(v);
    return out;
  }
  for (const clause of splitTopLevel(v, "; ")) {
    const open = clause.search(/ \(accounts?: /);
    if (open < 0) {
      out.notes.push(clause);
      continue;
    }
    const owner = clause.slice(0, open).trim();
    let depth = 0;
    let close = -1;
    for (let i = open + 1; i < clause.length; i++) {
      if (clause[i] === "(") depth++;
      if (clause[i] === ")") {
        depth--;
        if (depth === 0) {
          close = i;
          break;
        }
      }
    }
    if (close < 0) {
      out.unparsed.push(clause);
      continue;
    }
    const inner = clause.slice(clause.indexOf(":", open) + 1, close).trim();
    let tail = clause.slice(close + 1).trim();
    let tailPersons: string[] = [];
    const forMatch = tail.match(/^for (.+?)(?:(?:, whose |\. )(.*))?$/);
    if (forMatch) {
      tailPersons = splitNames(forMatch[1]);
      tail = forMatch[2] ? forMatch[2].trim() : "";
    } else tail = tail.replace(/^\.\s*/, "");
    if (tail) out.notes.push(tail);

    const parts = splitTopLevel(inner, "; ");
    const plural = /\(accounts:/.test(clause.slice(open, open + 12));
    const accountParts = plural ? parts.flatMap((p) => p.split(/,\s+(?=[^,]+ for )/)) : parts.slice(0, 1);
    const innerNotes = plural ? [] : parts.slice(1);
    for (const p of accountParts) {
      const acc = parseAccountPart(p, owner, tailPersons);
      if (!acc) {
        out.unparsed.push(`${owner}: ${p}`);
        continue;
      }
      acc.note = innerNotes.join("; ") || null;
      acc.matchMethod = matchMethod(acc.note);
      out.accounts.push(acc);
    }
  }
  if (out.accounts.length && out.accounts.every((a) => PLACEHOLDER_OWNERS.includes(a.owner))) out.status = "unassigned";
  return out;
}
