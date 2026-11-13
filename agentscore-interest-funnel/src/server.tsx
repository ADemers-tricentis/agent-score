import { serve } from "@hono/node-server";
import { Hono, type Context } from "hono";
import { PORT } from "./config.ts";
import { one, openDb } from "./db.ts";
import { backup, mailMergeCsv, mailMergeRows, writeMailMerge } from "./exports.ts";
import { extractLinks } from "./import/text.ts";
import { ownerText } from "./read.ts";
import {
  addCompanyNote,
  addResearch,
  addTouchpoint,
  excludeCompany,
  excludeSubmission,
  mergeCompanies,
  moveStage,
  recordFirstSignin,
  restoreCompany,
  RuleError,
  setAppNote,
  setDoNotEmail,
  setFit,
  setPersonEmail,
  setPrimaryContact,
  setSalesforce,
  updateResearch,
  type Ctx,
} from "./services.ts";
import { statusText, writeSnapshot } from "./snapshot.ts";
import { isStage, stageLabel } from "./stages.ts";
import { FitPage } from "./views/fitpage.tsx";
import { ActivityPage, ExportsPage, GrowthPage, NotesPage, SubmissionsPage, UsagePage } from "./views/otherpages.tsx";
import { CompanyPage, filterLeads, FunnelPage, LeadsPage, StagePage, today, type LeadFilters } from "./views/pages.tsx";
import { Layout } from "./views/ui.tsx";

const db = openDb();
const ctx: Ctx = { db, actor: "user" };
const app = new Hono();

const flash = (c: Context) => ({ ok: c.req.query("ok"), err: c.req.query("err") });
const page = (c: Context, title: string, path: string, body: unknown) =>
  c.html(
    <Layout title={title} path={path} flash={flash(c)}>
      {body as never}
    </Layout>,
  );
const back = (c: Context, to: string, msg: { ok?: string; err?: string }) => {
  const u = new URL(to, "http://x");
  for (const [k, v] of Object.entries(msg)) if (v) u.searchParams.set(k, v);
  return c.redirect(u.pathname + u.search + u.hash, 303);
};
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Run a write in a transaction, rewrite the snapshot, and redirect back with a message. */
async function act(c: Context, to: string, ok: string, fn: (form: Record<string, unknown>) => void) {
  const form = (await c.req.parseBody()) as Record<string, unknown>;
  try {
    db.transaction(() => fn(form))();
    writeSnapshot(db);
    return back(c, to, { ok });
  } catch (e) {
    if (e instanceof RuleError || e instanceof SyntaxError) return back(c, to, { err: e.message });
    throw e;
  }
}

app.get("/", (c) => page(c, "Funnel", "/", <FunnelPage db={db} />));
app.get("/stage/:stage", (c) => {
  const stage = c.req.param("stage");
  if (!isStage(stage)) return c.notFound();
  const mode = c.req.query("mode") === "cumulative" ? "cumulative" : "current";
  return page(c, `${stageLabel(stage)} (${mode})`, "/", <StagePage db={db} stage={stage} mode={mode} />);
});
app.get("/leads", (c) => page(c, "Leads", "/leads", <LeadsPage db={db} f={c.req.query() as LeadFilters} />));
app.get("/leads.csv", (c) => {
  const q = (s: string | null | undefined) => `"${(s ?? "").replace(/"/g, '""')}"`;
  const rows = filterLeads(db, c.req.query() as LeadFilters);
  const csv = [
    ["Company", "Status", "Fit", "Owner", "Relationship", "Signup", "People", "Contacts", "Last outreach"].map(q).join(","),
    ...rows.map((l) => [l.name, statusText(l), l.bucket, ownerText(l), l.rels, l.signup, String(l.people), l.contacts, l.last_out].map(q).join(",")),
  ].join("\n");
  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", `attachment; filename="leads-${today()}.csv"`);
  return c.body(csv + "\n");
});
app.get("/company/:id", (c) => {
  const id = Number(c.req.param("id"));
  const name = one<{ name: string }>(db, "SELECT name FROM company WHERE id = ?", id)?.name ?? "Not found";
  return page(c, name, "", <CompanyPage db={db} id={id} />);
});
app.get("/fit", (c) => page(c, "Fit", "/fit", <FitPage db={db} f={c.req.query()} />));
app.get("/growth", (c) => page(c, "Growth per week", "/growth", <GrowthPage db={db} />));
app.get("/usage", (c) => page(c, "Usage by cohort", "/usage", <UsagePage db={db} />));
app.get("/submissions", (c) => page(c, "Submissions", "/submissions", <SubmissionsPage db={db} disposition={c.req.query("d")} />));
app.get("/activity", (c) => page(c, "Activity", "/activity", <ActivityPage db={db} f={c.req.query()} />));
app.get("/exports", (c) => page(c, "Exports and backup", "/exports", <ExportsPage db={db} />));
app.get("/notes", (c) => page(c, "Page text", "/notes", <NotesPage db={db} />));

const companyId = (c: Context) => Number(c.req.param("id"));
const companyUrl = (c: Context) => `/company/${companyId(c)}`;

app.post("/company/:id/stage", (c) =>
  act(c, companyUrl(c), "Stage saved", (f) => {
    const r = moveStage(ctx, { companyId: companyId(c), stage: String(f.stage), occurredOn: str(f.date), note: str(f.note), reason: str(f.reason) });
    if (!r.changed) throw new RuleError("unchanged", `Already at ${stageLabel(r.to)}`);
  }),
);
app.post("/company/:id/touchpoint", (c) =>
  act(c, companyUrl(c), "Touchpoint added", (f) =>
    addTouchpoint(ctx, { companyId: companyId(c), personId: str(f.person) ? Number(f.person) : null, kind: String(f.kind), occurredOn: str(f.date), source: "app", note: str(f.note) }),
  ),
);
app.post("/company/:id/fit", (c) =>
  act(c, companyUrl(c), "Fit saved", (f) => setFit(ctx, { companyId: companyId(c), bucketId: String(f.bucket), evidence: str(f.evidence), why: str(f.why) })),
);
app.post("/company/:id/note", (c) => act(c, companyUrl(c), "Note added", (f) => addCompanyNote(ctx, { companyId: companyId(c), body: String(f.body ?? "") })));
app.post("/company/:id/signin", (c) =>
  act(c, companyUrl(c), "Sign-in recorded", (f) =>
    recordFirstSignin(ctx, {
      companyId: companyId(c),
      personId: str(f.person) ? Number(f.person) : null,
      signedInOn: str(f.date) ?? today(),
      kind: f.kind === "reported_use" ? "reported_use" : "product_login",
      note: str(f.note),
    }),
  ),
);
app.post("/company/:id/merge", async (c) => {
  const form = (await c.req.parseBody()) as Record<string, unknown>;
  const target = Number(form.target);
  try {
    db.transaction(() => mergeCompanies(ctx, { sourceId: companyId(c), targetId: target, reason: String(form.reason ?? "") }))();
    writeSnapshot(db);
    return back(c, `/company/${target}`, { ok: "Merged" });
  } catch (e) {
    if (e instanceof RuleError) return back(c, companyUrl(c), { err: e.message });
    throw e;
  }
});
app.post("/company/:id/exclude", (c) => act(c, companyUrl(c), "Excluded", (f) => excludeCompany(ctx, { companyId: companyId(c), reason: String(f.reason ?? "") })));
app.post("/company/:id/restore", (c) => act(c, companyUrl(c), "Restored", (f) => restoreCompany(ctx, { companyId: companyId(c), reason: String(f.reason ?? "") })));
app.post("/company/:id/primary", (c) => act(c, companyUrl(c), "Primary contact set", (f) => setPrimaryContact(ctx, { companyId: companyId(c), personId: Number(f.person) })));
app.post("/company/:id/salesforce", (c) =>
  act(c, companyUrl(c), "Salesforce saved", (f) => {
    const j = JSON.parse(String(f.json ?? "{}"));
    setSalesforce(ctx, { companyId: companyId(c), status: j.status, accounts: j.accounts ?? [], note: j.note ?? null });
  }),
);
app.post("/company/:id/research", (c) =>
  act(c, companyUrl(c), "Research added", (f) => {
    const body = String(f.body ?? "").trim();
    if (!body) throw new RuleError("empty", "Research text is empty");
    addResearch(ctx, { companyId: companyId(c), field: String(f.field), labelRaw: str(f.label) ?? undefined, body, sources: extractLinks(body).filter((l) => /^https?:/.test(l.url)) });
  }),
);
app.post("/research/:rid", (c) =>
  act(c, `/company/${c.req.query("company")}`, "Research saved", (f) => {
    const body = String(f.body ?? "").trim();
    updateResearch(ctx, { id: Number(c.req.param("rid")), body, sources: extractLinks(body).filter((l) => /^https?:/.test(l.url)) });
  }),
);
app.post("/submission/:sid/exclude", (c) =>
  act(c, `/company/${c.req.query("company")}`, "Submission excluded", (f) =>
    excludeSubmission(ctx, { submissionId: Number(c.req.param("sid")), rule: String(f.rule), reason: String(f.reason ?? "") }),
  ),
);
app.post("/person/:pid/email", (c) =>
  act(c, `/company/${c.req.query("company")}`, "Email saved", (f) =>
    setPersonEmail(ctx, { personId: Number(c.req.param("pid")), email: str(f.email), companyId: Number(c.req.query("company")) || null }),
  ),
);
app.post("/person/:pid/dne", (c) =>
  act(c, `/company/${c.req.query("company")}`, "Marked do not email", (f) =>
    setDoNotEmail(ctx, { personId: Number(c.req.param("pid")), on: today(), reason: String(f.reason ?? ""), companyId: Number(c.req.query("company")) || null }),
  ),
);
app.post("/notes", (c) => act(c, "/notes", "Saved", (f) => setAppNote(ctx, String(f.key), String(f.body ?? ""))));

app.get("/exports/mail-merge.csv", (c) => {
  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", 'attachment; filename="external-interest-contacts.csv"');
  return c.body(mailMergeCsv(mailMergeRows(db, { allUnemailed: true }).rows));
});
app.post("/exports/mail-merge", (c) => {
  const r = writeMailMerge(db, { allUnemailed: true });
  return back(c, "/exports", { ok: `Wrote ${r.rows} rows to ${r.file}` });
});
app.post("/exports/mark-emailed", (c) =>
  act(c, "/exports", "Recorded the intro emails", (f) => {
    const rows = mailMergeRows(db, { allUnemailed: true }).rows;
    for (const r of rows) {
      const p = one<{ person_id: number; company_id: number }>(
        db,
        "SELECT ct.person_id, ct.company_id FROM contact ct JOIN person p ON p.id = ct.person_id JOIN company c ON c.id = ct.company_id WHERE p.email = ? AND c.name = ?",
        r.email,
        r.company,
      );
      if (p) addTouchpoint(ctx, { companyId: p.company_id, personId: p.person_id, kind: "intro_email", occurredOn: str(f.date) ?? today(), source: "mail_merge" });
    }
  }),
);
app.post("/exports/snapshot", (c) => back(c, "/exports", { ok: `Wrote ${writeSnapshot(db)}` }));
app.post("/exports/backup", async (c) => back(c, "/exports", { ok: `Backed up to ${await backup(db)}` }));

serve({ fetch: app.fetch, port: PORT, hostname: "127.0.0.1" }, (info) => {
  console.log(`Interest funnel on http://localhost:${info.port}`);
});
