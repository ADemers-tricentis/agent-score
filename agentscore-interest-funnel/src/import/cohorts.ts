import { isoDate, mdTable } from "./text.ts";

export type CohortRow = {
  company: string;
  users: string[];
  earliestSignup: string | null;
  earliestScheduled: string | null;
  inviteSent: string | null;
  daysSignupToInvite: string;
  firstSignin: string | null;
  daysInviteToSignin: string;
  line: number;
};

export type Cohort = { number: number; invitedOn: string | null; howChosen: string; rows: CohortRow[]; notes: string };

export type CohortsDoc = {
  intro: string;
  howToUpdate: string;
  summary: Record<string, string>[];
  cohorts: Cohort[];
};

export function parseCohorts(text: string): CohortsDoc {
  const lines = text.split("\n");
  const sectionStarts = lines.map((l, i) => (/^## /.test(l) ? i : -1)).filter((i) => i >= 0);
  const sectionText = (i: number) => {
    const next = sectionStarts.find((s) => s > i) ?? lines.length;
    return lines.slice(i + 1, next);
  };
  const intro = lines.slice(1, sectionStarts[0]).join("\n").trim();
  const summaryAt = lines.findIndex((l) => /^## Summary/.test(l));
  const summaryTable = mdTable(sectionText(summaryAt));
  const summary = summaryTable.slice(1).map((r) => Object.fromEntries(summaryTable[0].map((h, i) => [h, r[i]])));
  const updateAt = lines.findIndex((l) => /^## How to update/.test(l));
  const howToUpdate = updateAt >= 0 ? sectionText(updateAt).join("\n").trim() : "";

  const cohorts: Cohort[] = [];
  lines.forEach((l, i) => {
    const m = l.match(/^## Cohort (\d+) - invited (\d{4}-\d{2}-\d{2})/);
    if (!m) return;
    const body = sectionText(i);
    const how = body.find((b) => b.startsWith("**How they were chosen:**"))?.replace("**How they were chosen:**", "").trim() ?? "";
    const rows: CohortRow[] = [];
    let header: string[] | null = null;
    body.forEach((b, j) => {
      if (!b.trim().startsWith("|")) return;
      const [cells] = mdTable([b]);
      if (!cells) return;
      if (!header) {
        header = cells;
        return;
      }
      const rec = Object.fromEntries(header.map((h, k) => [h, cells[k]]));
      rows.push({
        company: rec["Company"],
        users: rec["Users invited"].split(",").map((u) => u.trim()).filter(Boolean),
        earliestSignup: isoDate(rec["Earliest form signup"]),
        earliestScheduled: isoDate(rec["Earliest demo/beta scheduled"]),
        inviteSent: isoDate(rec["Invite sent"]),
        daysSignupToInvite: rec["Days signup to invite"],
        firstSignin: isoDate(rec["First sign-in"]),
        daysInviteToSignin: rec["Days invite to sign-in"],
        line: i + 2 + j,
      });
    });
    const notesAt = body.findIndex((b) => /^### Notes/.test(b));
    const notes = notesAt >= 0 ? body.slice(notesAt + 1).join("\n").trim() : "";
    cohorts.push({ number: Number(m[1]), invitedOn: m[2], howChosen: how, rows, notes });
  });
  return { intro, howToUpdate, summary, cohorts };
}
