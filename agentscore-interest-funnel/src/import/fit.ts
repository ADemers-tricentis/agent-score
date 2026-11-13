export type FitPayload = {
  accounts: { company: string; bucket: string; people: number; stage: string; evidence: string; why: string; owner?: string }[];
  quality: { kind: string; who: string; when: string; detail: string }[];
  buckets: { id: string; label: string }[];
  label: Record<string, string>;
  tone: Record<string, string>;
  chase: string[];
  leaks: [string, string, string][];
  qualityKinds: { id: string; label: string; countLabel: string }[];
  byOwner: { owner: string; company: string; account?: string }[];
};

export type FitDoc = { payload: FitPayload; notes: Record<string, string> };

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

export function parseFitHtml(html: string): FitDoc {
  const m = html.match(/<script type="application\/json" id="payload">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("fit HTML: payload script not found");
  const payload = JSON.parse(m[1]) as FitPayload;

  const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  const notes: Record<string, string> = {};
  let heading = "intro";
  const counter: Record<string, number> = {};
  for (const tag of main.matchAll(/<(h1|h2|h3|strong|p)[^>]*>([\s\S]*?)<\/\1>/g)) {
    const text = decode(tag[2]);
    if (!text) continue;
    if (tag[1] === "p") {
      const key = `fit.${heading}`;
      counter[key] = (counter[key] ?? 0) + 1;
      notes[counter[key] === 1 ? key : `${key}.${counter[key]}`] = text;
    } else {
      heading = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
    }
  }
  return { payload, notes };
}
