import type { Child, FC } from "hono/jsx";
import { ALL_STAGES, stageLabel } from "../stages.ts";

const CSS = `
body { font: 14px/1.45 -apple-system, system-ui, sans-serif; margin: 0; color: #1a1a1a; }
header { background: #f3f3f3; border-bottom: 1px solid #ddd; padding: 8px 16px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
header a { color: #1a1a1a; text-decoration: none; } header a.active { font-weight: 600; text-decoration: underline; }
main { padding: 16px; max-width: 1400px; }
table { border-collapse: collapse; margin: 8px 0 16px; } th, td { border: 1px solid #ddd; padding: 4px 8px; vertical-align: top; text-align: left; }
th { background: #fafafa; } td.num, th.num { text-align: right; }
.flash { padding: 8px 12px; margin-bottom: 12px; border: 1px solid; } .ok { background: #eef8ee; border-color: #9c9; } .err { background: #fdeeee; border-color: #d99; }
form.inline { display: inline; } fieldset { border: 1px solid #ddd; margin: 0 0 12px; padding: 8px 12px; }
legend { font-weight: 600; } label { margin-right: 8px; } input, select, textarea { font: inherit; }
textarea { width: 100%; min-height: 60px; } .muted { color: #666; } .small { font-size: 12px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } details { margin: 8px 0; } pre { white-space: pre-wrap; background: #fafafa; padding: 8px; }
.pill { display: inline-block; padding: 1px 6px; border: 1px solid #ccc; border-radius: 8px; margin: 0 4px 4px 0; text-decoration: none; color: inherit; }
.pill.on { background: #333; color: #fff; }
`;

const NAV = [
  ["/", "Funnel"],
  ["/leads", "Leads"],
  ["/fit", "Fit"],
  ["/growth", "Growth"],
  ["/usage", "Usage"],
  ["/submissions", "Submissions"],
  ["/activity", "Activity"],
  ["/exports", "Exports"],
  ["/notes", "Notes"],
] as const;

export const Layout: FC<{ title: string; path: string; flash?: { ok?: string; err?: string }; children?: Child }> = (p) => (
  <html>
    <head>
      <meta charset="utf-8" />
      <title>{p.title} · Interest funnel</title>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </head>
    <body>
      <header>
        <strong>Interest funnel</strong>
        {NAV.map(([href, label]) => (
          <a href={href} class={p.path === href ? "active" : ""}>
            {label}
          </a>
        ))}
        <form action="/leads" method="get" class="inline">
          <input name="q" placeholder="Search companies" />
        </form>
      </header>
      <main>
        {p.flash?.ok && <div class="flash ok">{p.flash.ok}</div>}
        {p.flash?.err && <div class="flash err">{p.flash.err}</div>}
        <h1>{p.title}</h1>
        {p.children}
      </main>
    </body>
  </html>
);

export const StageSelect: FC<{ name?: string; value?: string; includeExit?: boolean; blank?: string }> = (p) => (
  <select name={p.name ?? "stage"}>
    {p.blank !== undefined && <option value="">{p.blank}</option>}
    {ALL_STAGES.filter((s) => p.includeExit !== false || !["not_a_fit", "do_not_email"].includes(s.id)).map((s) => (
      <option value={s.id} selected={s.id === p.value}>
        {s.label}
      </option>
    ))}
  </select>
);

export const Stage: FC<{ stage: string }> = (p) => <span>{stageLabel(p.stage)}</span>;

export const CompanyLink: FC<{ id: number; name: string }> = (p) => <a href={`/company/${p.id}`}>{p.name}</a>;

/** Render inline markdown links as anchors; everything else as text. */
export const Md: FC<{ text: string | null | undefined }> = (p) => {
  if (!p.text) return <span />;
  const parts: Child[] = [];
  let last = 0;
  for (const m of p.text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    parts.push(p.text.slice(last, m.index));
    parts.push(
      /^https?:/.test(m[2]) ? (
        <a href={m[2]} target="_blank" rel="noreferrer">
          {m[1]}
        </a>
      ) : (
        <span title={decodeURIComponent(m[2])}>{m[1]}</span>
      ),
    );
    last = (m.index ?? 0) + m[0].length;
  }
  parts.push(p.text.slice(last));
  return <span>{parts}</span>;
};

export function lineChart(points: { x: string; y: number }[], opts: { width?: number; height?: number; label?: string } = {}) {
  const w = opts.width ?? 720;
  const h = opts.height ?? 220;
  const pad = 32;
  if (!points.length) return "";
  const max = Math.max(1, ...points.map((p) => p.y));
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const xy = points.map((p, i) => [pad + i * step, h - pad - (p.y / max) * (h - pad * 2)] as const);
  const path = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const ticks = points
    .map((p, i) => (i % Math.ceil(points.length / 8) === 0 || i === points.length - 1 ? `<text x="${xy[i][0]}" y="${h - 10}" font-size="10" text-anchor="middle">${p.x.slice(5)}</text>` : ""))
    .join("");
  const dots = xy.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.5"><title>${points[i].x}: ${points[i].y}</title></circle>`).join("");
  return `<svg width="${w}" height="${h}" role="img" aria-label="${opts.label ?? "chart"}" style="border:1px solid #ddd">
    <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#999"/>
    <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" stroke="#999"/>
    <text x="${pad - 4}" y="${pad + 4}" font-size="10" text-anchor="end">${max}</text>
    <text x="${pad - 4}" y="${h - pad}" font-size="10" text-anchor="end">0</text>
    <path d="${path}" fill="none" stroke="#2a6ebb" stroke-width="2"/>${dots}${ticks}</svg>`;
}

export function bar(n: number, max: number, width = 240) {
  const w = max ? Math.max(2, Math.round((n / max) * width)) : 0;
  return `<svg width="${width}" height="12"><rect width="${w}" height="12" fill="#2a6ebb"/></svg>`;
}
