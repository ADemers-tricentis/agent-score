import { mdTable } from "./text.ts";

export type SubmitterGroup = {
  line: number;
  dateRaw: string;
  name?: string;
  title?: string;
  relationship?: string;
  submittedAs?: string;
  contactNote?: string;
};

export type HeaderField = { label: string; value: string; line: number };

export type Paragraph = { labelRaw: string; base: string; qualifier: string | null; body: string; line: number };

export type Section = {
  heading: string;
  line: number;
  raw: string;
  groups: SubmitterGroup[];
  fields: HeaderField[];
  paragraphs: Paragraph[];
  unlabelled: { text: string; line: number }[];
};

export type DetailsRow = { company: string; contacts: string; owner: string; status: string; line: number };

export type Tracker = {
  intro: string;
  agentStacksIntro: string;
  agentStacks: { stack: string; count: number; accounts: string; line: number }[];
  pipelineIntro: string;
  cumulative: Record<string, number>;
  current: Record<string, number>;
  details: DetailsRow[];
  statusLegend: string;
  sections: Section[];
};

const GROUP_KEYS = new Set(["Date", "Name", "Title", "Relationship", "Submitted as", "Entity", "Contact"]);
const HEADER_KEYS = new Set([
  ...GROUP_KEYS,
  "Account owner (Salesforce)",
  "Email sent",
  "Follow-up sent",
  "Replied",
  "Our reply",
  "Beta scheduled",
  "Beta invite sent",
  "Beta check-in sent",
  "Actively using",
  "Do not email",
  "Follow-up",
  "Demo contact",
  "Also on the demo",
]);

function headerMatch(line: string): { key: string; value: string } | null {
  const m = line.match(/^([A-Z][A-Za-z ()/-]*?):\s?(.*)$/);
  if (!m || !HEADER_KEYS.has(m[1])) return null;
  return { key: m[1], value: m[2].replace(/\s+$/, "") };
}

function splitBlocks(lines: string[], startLine: number) {
  const blocks: { lines: string[]; line: number }[] = [];
  let cur: string[] = [];
  let curStart = startLine;
  lines.forEach((l, i) => {
    if (l.trim() === "") {
      if (cur.length) blocks.push({ lines: cur, line: curStart });
      cur = [];
    } else {
      if (!cur.length) curStart = startLine + i;
      cur.push(l);
    }
  });
  if (cur.length) blocks.push({ lines: cur, line: curStart });
  return blocks;
}

function parseSection(heading: string, line: number, body: string[]): Section {
  const section: Section = {
    heading,
    line,
    raw: [`### ${heading}`, ...body].join("\n").trim(),
    groups: [],
    fields: [],
    paragraphs: [],
    unlabelled: [],
  };
  let group: SubmitterGroup | null = null;
  for (const block of splitBlocks(body, line + 1)) {
    const parsed = block.lines.map(headerMatch);
    if (parsed.every(Boolean)) {
      parsed.forEach((h, i) => {
        const { key, value } = h!;
        const at = block.line + i;
        if (key === "Date") {
          group = { line: at, dateRaw: value };
          section.groups.push(group);
        } else if (GROUP_KEYS.has(key) && group) {
          if (key === "Name") group.name = value;
          else if (key === "Title") group.title = value;
          else if (key === "Relationship") group.relationship = value;
          else if (key === "Submitted as" || key === "Entity") group.submittedAs = value;
          else if (key === "Contact") group.contactNote = value;
        } else {
          section.fields.push({ label: key, value, line: at });
        }
      });
      continue;
    }
    const text = block.lines.join("\n");
    if (text.trim() === "---") continue;
    const m = text.match(/^([^:\n]{1,90}?):\s([\s\S]*)$/);
    if (m) {
      const labelRaw = m[1].trim();
      const q = labelRaw.match(/^(.*?)\s*\((.*)\)$/);
      section.paragraphs.push({
        labelRaw,
        base: (q ? q[1] : labelRaw).toLowerCase(),
        qualifier: q ? q[2] : null,
        body: m[2].trim(),
        line: block.line,
      });
    } else {
      section.unlabelled.push({ text, line: block.line });
    }
  }
  return section;
}

function tableAfter(lines: string[], from: number): { rows: string[][]; lineOf: number[] } {
  const rows: string[][] = [];
  const lineOf: number[] = [];
  let i = from;
  while (i < lines.length && !lines[i].trim().startsWith("|")) i++;
  while (i < lines.length && lines[i].trim().startsWith("|")) {
    const parsed = mdTable([lines[i]]);
    if (parsed.length) {
      rows.push(parsed[0]);
      lineOf.push(i + 1);
    }
    i++;
  }
  return { rows, lineOf };
}

export function parseTracker(text: string): Tracker {
  const lines = text.split("\n");
  const find = (re: RegExp, from = 0) => lines.findIndex((l, i) => i >= from && re.test(l));

  const agentStacksAt = find(/^## Agent Stacks/);
  const pipelineAt = find(/^## Pipeline Tracker/);
  const cumulativeAt = find(/^### Cumulative/);
  const currentAt = find(/^### Current stage/);
  const detailsAt = find(/^## Details/);

  const intro = lines.slice(1, agentStacksAt).join("\n").replace(/\n---\s*$/, "").trim();

  const stackTable = tableAfter(lines, agentStacksAt);
  const agentStacksIntro = lines
    .slice(agentStacksAt + 1, stackTable.lineOf[0] - 1)
    .join("\n")
    .trim();
  const agentStacks = stackTable.rows.slice(1).map((r, i) => ({
    stack: r[0],
    count: Number(r[1]),
    accounts: r[2],
    line: stackTable.lineOf[i + 1],
  }));

  const pipelineIntro = lines.slice(pipelineAt + 1, cumulativeAt).join("\n").trim();
  const toCounts = (rows: string[][]) => Object.fromEntries(rows.slice(1).map((r) => [r[0], Number(r[1])]));
  const cumulative = toCounts(tableAfter(lines, cumulativeAt).rows);
  const current = toCounts(tableAfter(lines, currentAt).rows);

  const detailsTable = tableAfter(lines, detailsAt);
  const details = detailsTable.rows.slice(1).map((r, i) => ({
    company: r[0],
    contacts: r[1],
    owner: r[2],
    status: r[3],
    line: detailsTable.lineOf[i + 1],
  }));
  const legendAt = find(/^\*\(Status values/, detailsAt);
  const statusLegend = legendAt >= 0 ? lines[legendAt].trim() : "";

  const sections: Section[] = [];
  const firstSection = find(/^### /, detailsAt);
  let start = firstSection;
  while (start >= 0 && start < lines.length) {
    let end = start + 1;
    while (end < lines.length && !lines[end].startsWith("### ")) end++;
    sections.push(parseSection(lines[start].slice(4).trim(), start + 1, lines.slice(start + 1, end)));
    start = end < lines.length ? end : -1;
  }

  return { intro, agentStacksIntro, agentStacks, pipelineIntro, cumulative, current, details, statusLegend, sections };
}
