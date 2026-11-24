import type { Child, FC } from "hono/jsx";
import type { Lead } from "../read.ts";
import { statusDetail } from "../snapshot.ts";
import { ALL_STAGES, stageLabel } from "../stages.ts";

/** Tokens from DESIGN.md (Linear). */
const CSS = `
:root {
  color-scheme: dark;
  --primary: #5e6ad2; --primary-hover: #828fff; --primary-focus: #5e69d1;
  --ink: #f7f8f8; --ink-muted: #d0d6e0; --ink-subtle: #8a8f98; --ink-tertiary: #62666d;
  --canvas: #010102; --s1: #0f1011; --s2: #141516; --s3: #18191a; --s4: #191a1b;
  --hairline: #23252a; --hairline-strong: #34343a; --hairline-tertiary: #3e3e44;
  --success: #27a644; --danger: #eb5757; --secure: #7a7fad;
  --sans: "Inter", "SF Pro Display", -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
  --mono: "JetBrains Mono", "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --r-xs: 4px; --r-sm: 6px; --r-md: 8px; --r-lg: 12px; --r-xl: 16px; --r-pill: 9999px;
  --edge: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  --focus: 0 0 0 2px rgba(94, 105, 209, 0.5);
}
* { box-sizing: border-box; }
html { background: var(--canvas); }
body { margin: 0; background: var(--canvas); color: var(--ink); font: 400 14px/1.5 var(--sans); letter-spacing: 0; -webkit-font-smoothing: antialiased; }
::selection { background: rgba(94, 106, 210, 0.4); }

a { color: inherit; text-decoration: none; }
a:hover { color: var(--primary-hover); }
p a, .muted a, .link, .md a { color: var(--primary-hover); }
p a:hover, .link:hover, .md a:hover { color: var(--ink); }
a:focus-visible, button:focus-visible, summary:focus-visible { outline: none; box-shadow: var(--focus); border-radius: var(--r-sm); }

h1 { font-size: 28px; font-weight: 600; line-height: 1.2; letter-spacing: -0.6px; margin: 0; }
h2 { font-size: 20px; font-weight: 600; line-height: 1.3; letter-spacing: -0.3px; margin: 48px 0 12px; }
h3 { font-size: 16px; font-weight: 600; line-height: 1.35; letter-spacing: -0.15px; margin: 32px 0 8px; }
p { margin: 8px 0 12px; color: var(--ink-muted); max-width: 920px; }
code, pre { font: 400 12.5px/1.5 var(--mono); }
code { background: var(--s2); border: 1px solid var(--hairline); border-radius: var(--r-xs); padding: 1px 5px; color: var(--ink-muted); word-break: break-all; }
pre { white-space: pre-wrap; word-break: break-word; background: var(--s1); border: 1px solid var(--hairline); border-radius: var(--r-md); padding: 12px 14px; color: var(--ink-muted); margin: 8px 0; }
ul { margin: 8px 0 16px; padding-left: 18px; color: var(--ink-muted); } li { margin: 4px 0; }
.muted { color: var(--ink-subtle); } .small { font-size: 12px; line-height: 1.4; } .num { text-align: right; font-variant-numeric: tabular-nums; }
.eyebrow { font-size: 13px; font-weight: 500; letter-spacing: 0.4px; color: var(--ink-subtle); }

/* top-nav */
.topnav { position: sticky; top: 0; z-index: 10; background: rgba(1, 1, 2, 0.85); backdrop-filter: saturate(180%) blur(12px); border-bottom: 1px solid var(--hairline); }
.topnav-inner { max-width: 1280px; margin: 0 auto; height: 56px; padding: 0 32px; display: flex; align-items: center; gap: 24px; }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 600; letter-spacing: -0.2px; white-space: nowrap; }
.brand:hover { color: var(--ink); }
.topnav nav { display: flex; gap: 2px; flex: 1; overflow-x: auto; scrollbar-width: none; }
.topnav nav a { color: var(--ink-subtle); padding: 6px 10px; border-radius: var(--r-md); white-space: nowrap; font-weight: 500; }
.topnav nav a:hover { color: var(--ink); background: var(--s1); }
.topnav nav a.active { color: var(--ink); background: var(--s2); }
.topnav .search input { width: 220px; }

main { max-width: 1280px; margin: 0 auto; padding: 32px 32px 96px; }
.page-head { margin: 8px 0 24px; display: flex; flex-direction: column; gap: 6px; }

/* flash */
.flash { display: flex; align-items: center; gap: 10px; background: var(--s1); border: 1px solid var(--hairline); border-radius: var(--r-md); padding: 10px 14px; margin: 0 0 16px; color: var(--ink-muted); box-shadow: var(--edge); max-width: none; }
.flash::before { content: ""; flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--success); }
.flash.err::before { background: var(--danger); }

/* tables */
.table-wrap { overflow-x: auto; background: var(--s1); border: 1px solid var(--hairline); border-radius: var(--r-lg); box-shadow: var(--edge); margin: 12px 0 24px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 9px 14px; text-align: left; vertical-align: top; border-top: 1px solid var(--hairline); }
tr:first-child > th, tr:first-child > td { border-top: 0; }
th { font-size: 12px; font-weight: 500; color: var(--ink-subtle); white-space: nowrap; background: var(--s1); }
td { color: var(--ink-muted); }
td a { color: var(--ink); }
td a:hover { color: var(--primary-hover); }
tr:hover > td { background: var(--s2); }
td.small, th.small { font-size: 12px; }
td div.small { margin-top: 2px; }
td.date, th.date { white-space: nowrap; font-variant-numeric: tabular-nums; }
td input, td select { min-height: 28px; padding: 4px 10px; font-size: 12px; }
td select { padding-right: 26px; background-position: right 9px center; }
td button { min-height: 28px; padding: 4px 10px; font-size: 12px; background: transparent; border-color: var(--hairline-strong); color: var(--ink-muted); }
td.json { font: 400 11.5px/1.5 var(--mono); color: var(--ink-subtle); word-break: break-word; max-width: 520px; }

/* cards and forms */
.card, fieldset { background: var(--s1); border: 1px solid var(--hairline); border-radius: var(--r-lg); box-shadow: var(--edge); padding: 20px 24px; margin: 0 0 16px; min-width: 0; }
legend { float: left; width: 100%; padding: 0; margin: 0 0 12px; font-size: 15px; font-weight: 500; letter-spacing: -0.2px; color: var(--ink); }
legend + * { clear: both; }
fieldset form, form.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
fieldset form > textarea, fieldset form > .small, fieldset form > div { flex-basis: 100%; }
fieldset form > .small { margin-top: 2px; }
label { display: inline-flex; align-items: center; gap: 8px; color: var(--ink-subtle); font-size: 13px; }
form.inline { display: inline-flex; gap: 6px; align-items: center; }
form.filters { display: flex; flex-wrap: wrap; gap: 12px 16px; align-items: center; }

input, select, textarea { font: 400 13px/1.4 var(--sans); color: var(--ink); background: var(--s1); border: 1px solid var(--hairline); border-radius: var(--r-md); padding: 7px 12px; min-height: 34px; max-width: 100%; outline: none; transition: border-color 0.12s, box-shadow 0.12s; }
fieldset input, fieldset select, fieldset textarea, .card input, .card select, .card textarea, td input, td select { background: var(--s2); }
input::placeholder, textarea::placeholder { color: var(--ink-tertiary); }
input:hover, select:hover, textarea:hover { border-color: var(--hairline-strong); }
input:focus, select:focus, textarea:focus { border-color: var(--primary-focus); box-shadow: var(--focus); }
input[type="checkbox"] { min-height: 0; width: 15px; height: 15px; accent-color: var(--primary); }
input[type="date"] { font-variant-numeric: tabular-nums; }
select { appearance: none; padding-right: 30px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%238a8f98' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 11px center; }
textarea { width: 100%; min-height: 72px; resize: vertical; line-height: 1.5; }
textarea.code { font: 400 12px/1.5 var(--mono); min-height: 180px; }

button, .button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; font: 500 14px/1.2 var(--sans); color: var(--ink); background: var(--s2); border: 1px solid var(--hairline-strong); border-radius: var(--r-md); padding: 8px 14px; min-height: 34px; cursor: pointer; white-space: nowrap; transition: background 0.12s, border-color 0.12s; }
button:hover, .button:hover { background: var(--s4); border-color: var(--hairline-tertiary); color: var(--ink); }
button.primary, .button.primary { background: var(--primary); border-color: transparent; color: #fff; }
button.primary:hover, .button.primary:hover { background: var(--primary-hover); }
button.primary:active, .button.primary:active { background: var(--primary-focus); }
button.ghost, .button.ghost { background: transparent; border-color: transparent; color: var(--ink-subtle); }
button.ghost:hover, .button.ghost:hover { background: var(--s1); color: var(--ink); }

details { margin: 8px 0; }
summary { cursor: pointer; color: var(--ink-subtle); font-size: 13px; list-style: none; display: inline-flex; align-items: center; gap: 6px; }
summary::-webkit-details-marker { display: none; }
summary::before { content: ""; width: 0; height: 0; border-left: 4px solid currentColor; border-top: 4px solid transparent; border-bottom: 4px solid transparent; transition: transform 0.12s; }
details[open] > summary::before { transform: rotate(90deg); }
summary:hover { color: var(--ink); }
details.row { margin: 0; padding: 12px 0; border-top: 1px solid var(--hairline); }
details.row:first-child { border-top: 0; }
details.row > summary { color: var(--ink-muted); font-size: 14px; }

/* tabs (pricing-tab) */
.tabs { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin: 12px 0; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--r-pill); border: 1px solid transparent; color: var(--ink-subtle); font-size: 13px; font-weight: 500; white-space: nowrap; }
.pill:hover { color: var(--ink); background: var(--s1); }
.pill.on { background: var(--s2); color: var(--ink); border-color: var(--hairline); }
.pill .count { color: var(--ink-tertiary); font-variant-numeric: tabular-nums; }

/* status-badge */
.badge { display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; border-radius: var(--r-pill); background: var(--s2); border: 1px solid var(--hairline); color: var(--ink-muted); font-size: 12px; line-height: 1.4; white-space: nowrap; }
.dot { flex: none; width: 7px; height: 7px; border-radius: 50%; background: var(--ink-tertiary); }
.dot.s-interested { background: transparent; border: 1.5px solid var(--ink-tertiary); }
.dot.s-account_owner_contacted, .dot.s-email_sent, .dot.s-follow_up_sent { background: var(--ink-subtle); }
.dot.s-replied, .dot.s-demo_scheduled { background: var(--secure); }
.dot.s-pending_beta, .dot.s-invited_to_beta { background: var(--primary); }
.dot.s-actively_using { background: var(--success); }
.dot.s-not_a_fit, .dot.s-do_not_email { background: transparent; border: 1.5px dashed var(--ink-tertiary); }
.status { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 3px; }
.status .small { color: var(--ink-subtle); }

/* stats */
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 0 0 24px; }
.stat { background: var(--s1); border: 1px solid var(--hairline); border-radius: var(--r-lg); box-shadow: var(--edge); padding: 18px 20px; }
.stat-value { font-size: 32px; font-weight: 600; letter-spacing: -1px; line-height: 1.1; font-variant-numeric: tabular-nums; }
.stat-label { margin-top: 6px; font-size: 13px; color: var(--ink-subtle); }
.stat a:hover .stat-value { color: var(--primary-hover); }

/* meta (key / value panel) */
.meta { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px 32px; }
.meta-k { font-size: 12px; font-weight: 500; color: var(--ink-subtle); margin-bottom: 6px; }
.meta-v { color: var(--ink-muted); }
.meta .wide { grid-column: span 2; }
.meta .full { grid-column: 1 / -1; }

/* panels and charts */
.panel { background: var(--s1); border: 1px solid var(--hairline); border-radius: var(--r-xl); box-shadow: var(--edge); padding: 24px; margin: 12px 0 24px; }
.panel > .table-wrap { margin: 0; border: 0; box-shadow: none; border-radius: 0; background: transparent; }
.chart { display: block; width: 100%; height: auto; }
.track { position: relative; height: 8px; min-width: 120px; border-radius: var(--r-pill); background: var(--s3); overflow: hidden; }
.track > i { position: absolute; inset: 0 auto 0 0; border-radius: var(--r-pill); }
.track .cum { background: rgba(94, 106, 210, 0.35); }
.track .cur { background: var(--primary); }
.legend { display: flex; gap: 16px; font-size: 12px; color: var(--ink-subtle); }
.legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
td.bar-cell { width: 45%; vertical-align: middle; }
.funnel td { vertical-align: middle; }
.funnel td.num a { color: var(--primary-hover); font-weight: 500; }
.funnel td.num a:hover { color: var(--ink); }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.grid > * { min-width: 0; }
.grid h2:first-child { margin-top: 24px; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.section-head p { margin: 0; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 12px 0 24px; }
.actions p { margin: 0; }

@media (max-width: 1024px) {
  .grid { grid-template-columns: 1fr; }
  .meta { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 768px) {
  .topnav-inner { padding: 0 16px; gap: 12px; }
  .topnav .search { display: none; }
  main { padding: 24px 16px 64px; }
  h1 { font-size: 24px; }
}
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

const BrandMark = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <rect x="1" y="2" width="16" height="3.5" rx="1.75" fill="#5e6ad2" />
    <rect x="4" y="7.25" width="10" height="3.5" rx="1.75" fill="#5e6ad2" opacity="0.75" />
    <rect x="7" y="12.5" width="4" height="3.5" rx="1.75" fill="#5e6ad2" opacity="0.5" />
  </svg>
);

export const Layout: FC<{ title: string; path: string; flash?: { ok?: string; err?: string }; children?: Child }> = (p) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{p.title} · Interest funnel</title>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </head>
    <body>
      <header class="topnav">
        <div class="topnav-inner">
          <a href="/" class="brand">
            <BrandMark />
            Interest funnel
          </a>
          <nav>
            {NAV.map(([href, label]) => (
              <a href={href} class={p.path === href ? "active" : ""}>
                {label}
              </a>
            ))}
          </nav>
          <form action="/leads" method="get" class="search">
            <input type="search" name="q" placeholder="Search companies" />
          </form>
        </div>
      </header>
      <main>
        {p.flash?.ok && <div class="flash ok">{p.flash.ok}</div>}
        {p.flash?.err && <div class="flash err">{p.flash.err}</div>}
        <div class="page-head">
          <span class="eyebrow">AgentScore external interest</span>
          <h1>{p.title}</h1>
        </div>
        {p.children}
      </main>
    </body>
  </html>
);

export const Table: FC<{ class?: string; children?: Child }> = (p) => (
  <div class="table-wrap">
    <table class={p.class}>{p.children}</table>
  </div>
);

export const Stat: FC<{ value: Child; label: string; href?: string }> = (p) => {
  const body = (
    <>
      <div class="stat-value">{p.value}</div>
      <div class="stat-label">{p.label}</div>
    </>
  );
  return <div class="stat">{p.href ? <a href={p.href}>{body}</a> : body}</div>;
};

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

export const Stage: FC<{ stage: string }> = (p) =>
  p.stage ? (
    <span class="badge">
      <i class={`dot s-${p.stage}`} />
      {stageLabel(p.stage)}
    </span>
  ) : (
    <span />
  );

/** Stage badge with the stage's date and note underneath. */
export const Status: FC<{ lead: Pick<Lead, "stage" | "stage_on" | "stage_note"> }> = (p) => {
  const detail = statusDetail(p.lead);
  return (
    <span class="status">
      <Stage stage={p.lead.stage} />
      {detail && <span class="small">{detail}</span>}
    </span>
  );
};

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
  return <span class="md">{parts}</span>;
};

export function lineChart(points: { x: string; y: number }[], opts: { width?: number; height?: number; label?: string } = {}) {
  const w = opts.width ?? 1200;
  const h = opts.height ?? 280;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  if (!points.length) return "";
  const max = Math.max(1, ...points.map((p) => p.y));
  const step = points.length > 1 ? (w - padL - padR) / (points.length - 1) : 0;
  const y = (v: number) => h - padB - (v / max) * (h - padT - padB);
  const xy = points.map((p, i) => [padL + i * step, y(p.y)] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${xy[xy.length - 1][0].toFixed(1)},${h - padB} L${padL},${h - padB} Z`;
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => {
      const v = Math.round(max * f);
      return `<line x1="${padL}" y1="${y(v)}" x2="${w - padR}" y2="${y(v)}" stroke="#23252a"/><text x="${padL - 10}" y="${y(v) + 4}" font-size="11" fill="#62666d" text-anchor="end">${v}</text>`;
    })
    .join("");
  const ticks = points
    .map((p, i) =>
      i % Math.ceil(points.length / 10) === 0 || i === points.length - 1
        ? `<text x="${xy[i][0]}" y="${h - 10}" font-size="11" fill="#8a8f98" text-anchor="middle">${p.x.slice(5)}</text>`
        : "",
    )
    .join("");
  const dots = xy
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3" fill="#0f1011" stroke="#828fff" stroke-width="1.5"><title>${points[i].x}: ${points[i].y}</title></circle>`)
    .join("");
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${opts.label ?? "chart"}" font-family="Inter, -apple-system, system-ui, sans-serif">
    ${grid}<path d="${area}" fill="#5e6ad2" fill-opacity="0.12"/><path d="${line}" fill="none" stroke="#5e6ad2" stroke-width="2" stroke-linejoin="round"/>${dots}${ticks}</svg>`;
}

/** Cumulative line + area on the left axis, a dashed step line on the right axis. */
export function growthChart(
  points: { x: string; a: number; b: number }[],
  opts: { width?: number; height?: number; labelA: string; labelB: string },
) {
  const w = opts.width ?? 1200;
  const h = opts.height ?? 340;
  const padL = 44;
  const padR = 44;
  const padT = 16;
  const padB = 32;
  if (!points.length) return "";
  // Round up to a multiple of 4 (small) or 20 (large) so the four grid steps are whole numbers.
  const nice = (m: number) => (m <= 40 ? Math.max(4, Math.ceil(m / 4) * 4) : Math.ceil(m / 20) * 20);
  const maxA = nice(Math.max(1, ...points.map((p) => p.a)));
  const maxB = nice(Math.max(1, ...points.map((p) => p.b)));
  const step = points.length > 1 ? (w - padL - padR) / (points.length - 1) : 0;
  const ya = (v: number) => h - padB - (v / maxA) * (h - padT - padB);
  const yb = (v: number) => h - padB - (v / maxB) * (h - padT - padB);
  const X = (i: number) => padL + i * step;
  const line = points.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${ya(p.a).toFixed(1)}`).join(" ");
  const area = `${line} L${X(points.length - 1).toFixed(1)},${h - padB} L${padL},${h - padB} Z`;
  const stepLine = points
    .map((p, i) => (i ? `L${X(i).toFixed(1)},${yb(points[i - 1].b).toFixed(1)} L${X(i).toFixed(1)},${yb(p.b).toFixed(1)}` : `M${X(i).toFixed(1)},${yb(p.b).toFixed(1)}`))
    .join(" ");
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => {
      const va = Math.round(maxA * f);
      const vb = Math.round(maxB * f);
      return `<line x1="${padL}" y1="${ya(va)}" x2="${w - padR}" y2="${ya(va)}" stroke="#23252a"/>
        <text x="${padL - 10}" y="${ya(va) + 4}" font-size="11" fill="#8a8f98" text-anchor="end">${va}</text>
        <text x="${w - padR + 10}" y="${ya(va) + 4}" font-size="11" fill="#62666d">${vb}</text>`;
    })
    .join("");
  const ticks = points
    .map((p, i) =>
      i % Math.ceil(points.length / 10) === 0 || i === points.length - 1
        ? `<text x="${X(i)}" y="${h - 10}" font-size="11" fill="#8a8f98" text-anchor="middle">${p.x.slice(5)}</text>`
        : "",
    )
    .join("");
  const dots = points
    .map((p, i) => `<circle cx="${X(i)}" cy="${ya(p.a)}" r="3" fill="#0f1011" stroke="#828fff" stroke-width="1.5"><title>${p.x}: ${p.a} companies, ${p.b} actively using</title></circle>`)
    .join("");
  const lx = padL + 16;
  const legend = `<g font-size="11" fill="#d0d6e0">
      <line x1="${lx}" y1="22" x2="${lx + 18}" y2="22" stroke="#5e6ad2" stroke-width="2"/><text x="${lx + 24}" y="26">${opts.labelA}</text>
      <line x1="${lx}" y1="40" x2="${lx + 18}" y2="40" stroke="#27a644" stroke-width="1.5" stroke-dasharray="4 3"/><text x="${lx + 24}" y="44">${opts.labelB} (right axis)</text></g>`;
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Lead growth over time" font-family="Inter, -apple-system, system-ui, sans-serif">
    ${grid}<path d="${area}" fill="#5e6ad2" fill-opacity="0.12"/><path d="${line}" fill="none" stroke="#5e6ad2" stroke-width="2" stroke-linejoin="round"/>
    <path d="${stepLine}" fill="none" stroke="#27a644" stroke-width="1.5" stroke-dasharray="4 3"/>${dots}${ticks}${legend}</svg>`;
}

/** A horizontal bar: `current` drawn solid over a lighter `cumulative` (or just `n`). */
export const Bar: FC<{ n: number; max: number; cumulative?: number }> = (p) => {
  const pct = (v: number) => (p.max ? `${Math.max(v ? 1.5 : 0, (v / p.max) * 100).toFixed(1)}%` : "0%");
  return (
    <div class="track">
      {p.cumulative !== undefined && <i class="cum" style={`width:${pct(p.cumulative)}`} />}
      <i class="cur" style={`width:${pct(p.n)}`} />
    </div>
  );
};
