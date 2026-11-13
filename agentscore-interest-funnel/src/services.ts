import { all, one, type DB } from "./db.ts";
import { isExit, isStage, stageIndex, stageLabel, TOUCHPOINT_STAGE, type Stage } from "./stages.ts";

export type Actor = "user" | "sync-agent" | "import" | "cli";

export type Ctx = { db: DB; actor: Actor; runId?: number | null };

export class RuleError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function logChange(
  ctx: Ctx,
  c: {
    entity: string;
    entityId?: number | bigint | null;
    companyId?: number | null;
    action: string;
    before?: unknown;
    after?: unknown;
    reason?: string | null;
  },
) {
  ctx.db
    .prepare(
      `INSERT INTO change_log (actor, run_id, entity, entity_id, company_id, action, before_json, after_json, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      ctx.actor,
      ctx.runId ?? null,
      c.entity,
      c.entityId == null ? null : Number(c.entityId),
      c.companyId ?? null,
      c.action,
      c.before === undefined ? null : JSON.stringify(c.before),
      c.after === undefined ? null : JSON.stringify(c.after),
      c.reason ?? null,
    );
}

export type StageRow = { id: number; stage: Stage; occurred_on: string | null; note: string | null };

export function currentStage(db: DB, companyId: number): StageRow | undefined {
  return one<StageRow>(
    db,
    "SELECT id, stage, occurred_on, note FROM stage_event WHERE company_id = ? ORDER BY id DESC LIMIT 1",
    companyId,
  );
}

export function requireCompany(db: DB, companyId: number) {
  const c = one<{ id: number; name: string; merged_into_id: number | null }>(
    db,
    "SELECT id, name, merged_into_id FROM company WHERE id = ?",
    companyId,
  );
  if (!c) throw new RuleError("not_found", `No company with id ${companyId}`);
  return c;
}

/**
 * Move a company to a stage. Forward moves always work. Moving backwards, or out of an exit
 * state, needs a reason and is refused for the sync agent.
 */
export function moveStage(
  ctx: Ctx,
  a: { companyId: number; stage: string; occurredOn?: string | null; note?: string | null; reason?: string | null },
): { changed: boolean; from: Stage | null; to: Stage } {
  if (!isStage(a.stage)) throw new RuleError("bad_stage", `Unknown stage "${a.stage}"`);
  const company = requireCompany(ctx.db, a.companyId);
  if (company.merged_into_id) throw new RuleError("merged", `${company.name} was merged into company ${company.merged_into_id}`);
  const cur = currentStage(ctx.db, a.companyId);
  const from = cur?.stage ?? null;
  if (from === a.stage) return { changed: false, from, to: a.stage };

  const backwards =
    from !== null &&
    ((isExit(from) && !isExit(a.stage)) || (!isExit(from) && !isExit(a.stage) && stageIndex(a.stage) < stageIndex(from)));
  if (backwards) {
    if (ctx.actor === "sync-agent")
      throw new RuleError(
        "never_backwards",
        `${company.name} is at ${stageLabel(from!)}; the sync agent may not move it to ${stageLabel(a.stage)}`,
      );
    if (!a.reason?.trim())
      throw new RuleError("reason_required", `Moving ${company.name} from ${stageLabel(from!)} to ${stageLabel(a.stage)} needs a reason`);
  }
  if (isExit(a.stage) && !a.reason?.trim() && !a.note?.trim())
    throw new RuleError("reason_required", `Moving ${company.name} to ${stageLabel(a.stage)} needs a reason`);

  const info = ctx.db
    .prepare(
      "INSERT INTO stage_event (company_id, stage, occurred_on, note, reason, actor, run_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(a.companyId, a.stage, a.occurredOn ?? null, a.note ?? null, a.reason ?? null, ctx.actor, ctx.runId ?? null);
  logChange(ctx, {
    entity: "stage_event",
    entityId: info.lastInsertRowid,
    companyId: a.companyId,
    action: backwards ? "stage_backward" : "stage_change",
    before: from,
    after: { stage: a.stage, occurred_on: a.occurredOn ?? null, note: a.note ?? null },
    reason: a.reason,
  });
  return { changed: true, from, to: a.stage as Stage };
}

/** Advance only. Returns changed=false if the company is already at or past the stage, or exited. */
export function advanceTo(ctx: Ctx, a: { companyId: number; stage: Stage; occurredOn?: string | null; note?: string | null }) {
  const cur = currentStage(ctx.db, a.companyId);
  if (cur && (isExit(cur.stage) || stageIndex(cur.stage) >= stageIndex(a.stage)))
    return { changed: false, from: cur.stage, to: cur.stage };
  return moveStage(ctx, a);
}

export function addTouchpoint(
  ctx: Ctx,
  a: {
    companyId: number;
    personId?: number | null;
    kind: string;
    occurredOn?: string | null;
    source: string;
    note?: string | null;
    advance?: boolean;
  },
) {
  requireCompany(ctx.db, a.companyId);
  const info = ctx.db
    .prepare(
      `INSERT INTO touchpoint (person_id, company_id, kind, occurred_on, source, note, actor, run_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(a.personId ?? null, a.companyId, a.kind, a.occurredOn ?? null, a.source, a.note ?? null, ctx.actor, ctx.runId ?? null);
  logChange(ctx, {
    entity: "touchpoint",
    entityId: info.lastInsertRowid,
    companyId: a.companyId,
    action: "add",
    after: { kind: a.kind, person_id: a.personId ?? null, occurred_on: a.occurredOn ?? null, note: a.note ?? null },
  });
  const implied = TOUCHPOINT_STAGE[a.kind];
  if (a.personId && implied) raiseContactStatus(ctx, a.companyId, a.personId, implied);
  if (a.kind === "beta_checkin" && a.personId) raiseContactStatus(ctx, a.companyId, a.personId, "invited_to_beta");
  let stage = { changed: false, from: currentStage(ctx.db, a.companyId)?.stage ?? null, to: null as Stage | null };
  if (implied && a.advance !== false) {
    const r = advanceTo(ctx, { companyId: a.companyId, stage: implied, occurredOn: a.occurredOn, note: `from ${a.kind}` });
    stage = r;
  }
  return { touchpointId: Number(info.lastInsertRowid), stage };
}

export function raiseContactStatus(ctx: Ctx, companyId: number, personId: number, stage: Stage) {
  const c = one<{ id: number; status: string }>(
    ctx.db,
    "SELECT id, status FROM contact WHERE company_id = ? AND person_id = ?",
    companyId,
    personId,
  );
  if (!c) return;
  if (isExit(c.status) || stageIndex(c.status) >= stageIndex(stage)) return;
  ctx.db.prepare("UPDATE contact SET status = ?, status_note = NULL WHERE id = ?").run(stage, c.id);
  logChange(ctx, { entity: "contact", entityId: c.id, companyId, action: "status", before: c.status, after: stage });
}

export function recordFirstSignin(
  ctx: Ctx,
  a: { companyId: number; personId?: number | null; signedInOn: string; kind?: "product_login" | "reported_use"; note?: string | null },
) {
  const info = ctx.db
    .prepare("INSERT INTO first_signin (company_id, person_id, signed_in_on, kind, note, actor) VALUES (?, ?, ?, ?, ?, ?)")
    .run(a.companyId, a.personId ?? null, a.signedInOn, a.kind ?? "product_login", a.note ?? null, ctx.actor);
  logChange(ctx, {
    entity: "first_signin",
    entityId: info.lastInsertRowid,
    companyId: a.companyId,
    action: "add",
    after: { person_id: a.personId ?? null, signed_in_on: a.signedInOn, kind: a.kind ?? "product_login" },
  });
  if (a.personId) raiseContactStatus(ctx, a.companyId, a.personId, "actively_using");
  return advanceTo(ctx, { companyId: a.companyId, stage: "actively_using", occurredOn: a.signedInOn, note: "first sign-in" });
}

export function setFit(
  ctx: Ctx,
  a: { companyId: number; bucketId: string; evidence?: string | null; why?: string | null; assessedOn?: string | null },
) {
  const bucket = one(ctx.db, "SELECT id FROM fit_bucket WHERE id = ?", a.bucketId);
  if (!bucket) throw new RuleError("bad_bucket", `Unknown fit bucket "${a.bucketId}"`);
  const before = one(ctx.db, "SELECT bucket_id, evidence, why FROM fit_assessment WHERE company_id = ? AND is_current = 1", a.companyId);
  ctx.db.prepare("UPDATE fit_assessment SET is_current = 0 WHERE company_id = ?").run(a.companyId);
  const info = ctx.db
    .prepare(
      "INSERT INTO fit_assessment (company_id, bucket_id, evidence, why, assessed_on, actor) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(a.companyId, a.bucketId, a.evidence ?? null, a.why ?? null, a.assessedOn ?? today(), ctx.actor);
  logChange(ctx, {
    entity: "fit_assessment",
    entityId: info.lastInsertRowid,
    companyId: a.companyId,
    action: "set",
    before,
    after: { bucket_id: a.bucketId, evidence: a.evidence ?? null, why: a.why ?? null },
  });
}

export function addCompanyNote(ctx: Ctx, a: { companyId: number; body: string }) {
  if (!a.body.trim()) throw new RuleError("empty", "Note is empty");
  const info = ctx.db
    .prepare("INSERT INTO company_note (company_id, body_md, actor, run_id) VALUES (?, ?, ?, ?)")
    .run(a.companyId, a.body.trim(), ctx.actor, ctx.runId ?? null);
  logChange(ctx, { entity: "company_note", entityId: info.lastInsertRowid, companyId: a.companyId, action: "add", after: a.body.trim() });
}

export function addResearch(
  ctx: Ctx,
  a: { companyId: number; field: string; labelRaw?: string; qualifier?: string | null; body: string; sources?: { url: string; text?: string }[] },
) {
  const sort = one<{ n: number }>(ctx.db, "SELECT coalesce(max(sort), 0) + 1 AS n FROM research_field WHERE company_id = ?", a.companyId)!.n;
  const info = ctx.db
    .prepare(
      `INSERT INTO research_field (company_id, field, label_raw, qualifier, body_md, sort, as_of, actor, run_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      a.companyId,
      a.field,
      a.labelRaw ?? a.field.replace(/_/g, " "),
      a.qualifier ?? null,
      a.body,
      sort,
      today(),
      ctx.actor,
      ctx.runId ?? null,
    );
  for (const s of a.sources ?? [])
    ctx.db.prepare("INSERT INTO research_source (research_field_id, url, link_text) VALUES (?, ?, ?)").run(info.lastInsertRowid, s.url, s.text ?? null);
  logChange(ctx, {
    entity: "research_field",
    entityId: info.lastInsertRowid,
    companyId: a.companyId,
    action: "add",
    after: { field: a.field, body: a.body, sources: a.sources ?? [] },
  });
  return Number(info.lastInsertRowid);
}

export function updateResearch(ctx: Ctx, a: { id: number; body: string; sources?: { url: string; text?: string }[] }) {
  const before = one<{ company_id: number; body_md: string }>(ctx.db, "SELECT company_id, body_md FROM research_field WHERE id = ?", a.id);
  if (!before) throw new RuleError("not_found", `No research field ${a.id}`);
  ctx.db.prepare("UPDATE research_field SET body_md = ?, as_of = ?, actor = ? WHERE id = ?").run(a.body, today(), ctx.actor, a.id);
  if (a.sources) {
    ctx.db.prepare("DELETE FROM research_source WHERE research_field_id = ?").run(a.id);
    for (const s of a.sources)
      ctx.db.prepare("INSERT INTO research_source (research_field_id, url, link_text) VALUES (?, ?, ?)").run(a.id, s.url, s.text ?? null);
  }
  logChange(ctx, { entity: "research_field", entityId: a.id, companyId: before.company_id, action: "edit", before: before.body_md, after: a.body });
}

export function excludeSubmission(ctx: Ctx, a: { submissionId: number; rule: string; reason: string }) {
  if (!a.reason.trim()) throw new RuleError("reason_required", "Exclusion needs a reason");
  const s = one<{ id: number; company_id: number | null; disposition: string }>(
    ctx.db,
    "SELECT id, company_id, disposition FROM submission WHERE id = ?",
    a.submissionId,
  );
  if (!s) throw new RuleError("not_found", `No submission ${a.submissionId}`);
  ctx.db.prepare("UPDATE submission SET disposition = 'excluded', disposition_rule = ?, reason = ? WHERE id = ?").run(a.rule, a.reason, s.id);
  logChange(ctx, { entity: "submission", entityId: s.id, companyId: s.company_id, action: "exclude", before: s.disposition, after: a.rule, reason: a.reason });
  if (s.company_id) {
    const left = one<{ n: number }>(
      ctx.db,
      "SELECT count(*) AS n FROM submission WHERE company_id = ? AND disposition IN ('counted', 'stacked')",
      s.company_id,
    )!.n;
    const src = one<{ source: string }>(ctx.db, "SELECT source FROM company WHERE id = ?", s.company_id)!.source;
    if (left === 0 && src === "form") excludeCompany(ctx, { companyId: s.company_id, reason: `every submission excluded: ${a.reason}` });
  }
}

export function excludeCompany(ctx: Ctx, a: { companyId: number; reason: string }) {
  if (!a.reason.trim()) throw new RuleError("reason_required", "Exclusion needs a reason");
  const before = one<{ excluded_reason: string | null }>(ctx.db, "SELECT excluded_reason FROM company WHERE id = ?", a.companyId);
  ctx.db.prepare("UPDATE company SET excluded_reason = ? WHERE id = ?").run(a.reason, a.companyId);
  logChange(ctx, { entity: "company", entityId: a.companyId, companyId: a.companyId, action: "exclude", before, after: a.reason, reason: a.reason });
}

export function restoreCompany(ctx: Ctx, a: { companyId: number; reason: string }) {
  if (!a.reason.trim()) throw new RuleError("reason_required", "Restoring needs a reason");
  ctx.db.prepare("UPDATE company SET excluded_reason = NULL WHERE id = ?").run(a.companyId);
  logChange(ctx, { entity: "company", entityId: a.companyId, companyId: a.companyId, action: "restore", reason: a.reason });
}

/**
 * Merge `sourceId` into `targetId`. Submitters, contacts, history and research move to the target;
 * the target advances to the source's stage if the source was further along.
 */
export function mergeCompanies(ctx: Ctx, a: { sourceId: number; targetId: number; reason: string }) {
  if (a.sourceId === a.targetId) throw new RuleError("same", "Cannot merge a company into itself");
  if (!a.reason.trim()) throw new RuleError("reason_required", "Merging needs a reason");
  const src = requireCompany(ctx.db, a.sourceId);
  const tgt = requireCompany(ctx.db, a.targetId);
  if (src.merged_into_id || tgt.merged_into_id) throw new RuleError("merged", "One of these companies was already merged");
  const srcStage = currentStage(ctx.db, a.sourceId);
  const tgtStage = currentStage(ctx.db, a.targetId);
  const db = ctx.db;
  for (const table of ["submission", "touchpoint", "research_field", "company_link", "company_note", "first_signin", "cohort_member"])
    db.prepare(`UPDATE ${table} SET company_id = ? WHERE company_id = ?`).run(a.targetId, a.sourceId);
  for (const c of all<{ id: number; person_id: number }>(db, "SELECT id, person_id FROM contact WHERE company_id = ?", a.sourceId)) {
    const exists = one(db, "SELECT 1 FROM contact WHERE company_id = ? AND person_id = ?", a.targetId, c.person_id);
    if (exists) db.prepare("DELETE FROM contact WHERE id = ?").run(c.id);
    else db.prepare("UPDATE contact SET company_id = ? WHERE id = ?").run(a.targetId, c.id);
  }
  db.prepare("UPDATE OR IGNORE company_sf_account SET company_id = ? WHERE company_id = ?").run(a.targetId, a.sourceId);
  db.prepare("UPDATE OR IGNORE company_agent_stack SET company_id = ? WHERE company_id = ?").run(a.targetId, a.sourceId);
  db.prepare("UPDATE OR IGNORE company_alias SET company_id = ? WHERE company_id = ?").run(a.targetId, a.sourceId);
  db.prepare("INSERT OR IGNORE INTO company_alias (company_id, alias, origin) VALUES (?, ?, 'merge')").run(a.targetId, src.name);
  db.prepare("UPDATE fit_assessment SET is_current = 0 WHERE company_id = ?").run(a.sourceId);
  db.prepare("UPDATE company SET merged_into_id = ? WHERE id = ?").run(a.targetId, a.sourceId);
  logChange(ctx, {
    entity: "company",
    entityId: a.sourceId,
    companyId: a.targetId,
    action: "merge",
    before: { source: src.name, source_stage: srcStage?.stage ?? null, target_stage: tgtStage?.stage ?? null },
    after: { merged_into: tgt.name },
    reason: a.reason,
  });
  if (srcStage && !isExit(srcStage.stage)) advanceTo(ctx, { companyId: a.targetId, stage: srcStage.stage, note: `merged from ${src.name}` });
}

export function setPrimaryContact(ctx: Ctx, a: { companyId: number; personId: number }) {
  const before = one<{ primary_person_id: number | null }>(ctx.db, "SELECT primary_person_id FROM company WHERE id = ?", a.companyId);
  ctx.db.prepare("UPDATE company SET primary_person_id = ? WHERE id = ?").run(a.personId, a.companyId);
  logChange(ctx, { entity: "company", entityId: a.companyId, companyId: a.companyId, action: "primary_contact", before, after: a.personId });
}

export function setDoNotEmail(ctx: Ctx, a: { personId: number; on: string; reason: string; companyId?: number | null }) {
  if (!a.reason.trim()) throw new RuleError("reason_required", "Do not email needs a reason");
  ctx.db.prepare("UPDATE person SET do_not_email_on = ?, do_not_email_reason = ? WHERE id = ?").run(a.on, a.reason, a.personId);
  logChange(ctx, { entity: "person", entityId: a.personId, companyId: a.companyId ?? null, action: "do_not_email", after: { on: a.on }, reason: a.reason });
}

export function createCompany(
  ctx: Ctx,
  a: { name: string; source?: "form" | "sales" | "referral"; sourceDetail?: string | null; firstSeen?: string | null; aliases?: string[] },
): number {
  const name = a.name.trim();
  if (!name) throw new RuleError("empty", "Company name is empty");
  if (one(ctx.db, "SELECT 1 FROM company WHERE lower(name) = lower(?)", name))
    throw new RuleError("exists", `A company named "${name}" already exists`);
  const info = ctx.db
    .prepare("INSERT INTO company (name, source, source_detail) VALUES (?, ?, ?)")
    .run(name, a.source ?? "form", a.sourceDetail ?? null);
  const id = Number(info.lastInsertRowid);
  for (const alias of new Set([name, ...(a.aliases ?? [])]))
    ctx.db.prepare("INSERT OR IGNORE INTO company_alias (company_id, alias, origin) VALUES (?, ?, ?)").run(id, alias, ctx.actor);
  logChange(ctx, { entity: "company", entityId: id, companyId: id, action: "create", after: { name, source: a.source ?? "form" } });
  moveStage(ctx, { companyId: id, stage: "interested", occurredOn: a.firstSeen ?? null });
  return id;
}

export function findPersonByEmail(db: DB, email: string) {
  return one<{ id: number; name: string; email: string; do_not_email_reason: string | null }>(
    db,
    "SELECT id, name, email, do_not_email_reason FROM person WHERE email = ?",
    email.trim(),
  );
}

export function ensureContact(ctx: Ctx, a: { companyId: number; name: string; email?: string | null; role?: "submitter" | "demo_contact" | "other" }) {
  let person = a.email
    ? findPersonByEmail(ctx.db, a.email)
    : one<{ id: number; name: string; email: string; do_not_email_reason: string | null }>(
        ctx.db,
        "SELECT p.id, p.name, p.email, p.do_not_email_reason FROM contact ct JOIN person p ON p.id = ct.person_id WHERE ct.company_id = ? AND lower(p.name) = lower(?)",
        a.companyId,
        a.name.trim(),
      );
  if (!person) {
    const info = ctx.db.prepare("INSERT INTO person (name, email) VALUES (?, ?)").run(a.name.trim(), a.email?.trim() || null);
    person = { id: Number(info.lastInsertRowid), name: a.name, email: a.email ?? "", do_not_email_reason: null };
    logChange(ctx, { entity: "person", entityId: person.id, companyId: a.companyId, action: "create", after: { name: a.name } });
  }
  const exists = one(ctx.db, "SELECT 1 FROM contact WHERE company_id = ? AND person_id = ?", a.companyId, person.id);
  if (!exists) {
    ctx.db.prepare("INSERT INTO contact (person_id, company_id, role) VALUES (?, ?, ?)").run(person.id, a.companyId, a.role ?? "submitter");
    logChange(ctx, { entity: "contact", companyId: a.companyId, action: "add", after: { person_id: person.id, name: person.name, role: a.role ?? "submitter" } });
  }
  return person.id;
}

export function addCompanyLink(ctx: Ctx, a: { companyId: number; kind: string; label?: string | null; pathOrUrl: string }) {
  requireCompany(ctx.db, a.companyId);
  const info = ctx.db
    .prepare("INSERT OR IGNORE INTO company_link (company_id, kind, label, path_or_url) VALUES (?, ?, ?, ?)")
    .run(a.companyId, a.kind, a.label ?? null, a.pathOrUrl);
  if (info.changes) logChange(ctx, { entity: "company_link", entityId: info.lastInsertRowid, companyId: a.companyId, action: "add", after: { kind: a.kind, label: a.label ?? null, path: a.pathOrUrl } });
  return { added: info.changes > 0 };
}

export type SubmissionInput = {
  name: string;
  email?: string | null;
  form_company?: string | null;
  title?: string | null;
  relationship?: string | null;
  submitted_at?: string | null;
  comments?: string | null;
  inbox_message_id?: string | null;
  company_id?: number | null;
  new_company?: { name: string; aliases?: string[] } | null;
  disposition: "counted" | "stacked" | "repeat" | "excluded" | "held";
  rule?: string | null;
  reason?: string | null;
};

export function addSubmission(ctx: Ctx, s: SubmissionInput) {
  if (s.inbox_message_id) {
    const dup = one<{ id: number; company_id: number | null }>(ctx.db, "SELECT id, company_id FROM submission WHERE inbox_message_id = ?", s.inbox_message_id);
    if (dup) return { submissionId: dup.id, companyId: dup.company_id, personId: null, duplicate: true, createdCompany: false };
  }
  if (!s.name?.trim()) throw new RuleError("empty", "Submission needs a name");
  if ((s.disposition === "excluded" || s.disposition === "held" || s.disposition === "repeat") && !s.reason?.trim())
    throw new RuleError("reason_required", `A ${s.disposition} submission needs a reason`);
  let companyId = s.company_id ?? null;
  let createdCompany = false;
  if (s.disposition === "counted") {
    if (!s.new_company?.name) throw new RuleError("company_required", "A counted submission creates a company: pass new_company.name");
    companyId = createCompany(ctx, { name: s.new_company.name, aliases: [...(s.new_company.aliases ?? []), ...(s.form_company ? [s.form_company] : [])], firstSeen: s.submitted_at?.slice(0, 10) });
    createdCompany = true;
  } else if (s.disposition === "stacked" || s.disposition === "repeat") {
    if (!companyId) throw new RuleError("company_required", `A ${s.disposition} submission needs company_id`);
    requireCompany(ctx.db, companyId);
  }
  let personId: number | null = null;
  if (companyId && (s.disposition === "counted" || s.disposition === "stacked" || s.disposition === "repeat"))
    personId = ensureContact(ctx, { companyId, name: s.name, email: s.email });
  const info = ctx.db
    .prepare(
      `INSERT INTO submission (person_id, person_name, company_id, submitted_at, source, form_company_field, title, relationship, comments,
         disposition, disposition_rule, reason, inbox_message_id, run_id)
       VALUES (?, ?, ?, ?, 'labs_form', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      personId,
      s.name.trim(),
      companyId,
      s.submitted_at ?? null,
      s.form_company ?? null,
      s.title ?? null,
      s.relationship ?? null,
      s.comments ?? null,
      s.disposition,
      s.rule ?? null,
      s.reason ?? null,
      s.inbox_message_id ?? null,
      ctx.runId ?? null,
    );
  if (createdCompany && personId) ctx.db.prepare("UPDATE company SET primary_person_id = ? WHERE id = ?").run(personId, companyId);
  logChange(ctx, {
    entity: "submission",
    entityId: info.lastInsertRowid,
    companyId,
    action: s.disposition,
    after: { name: s.name, form_company: s.form_company ?? null, submitted_at: s.submitted_at ?? null, rule: s.rule ?? null },
    reason: s.reason,
  });
  return { submissionId: Number(info.lastInsertRowid), companyId, personId, duplicate: false, createdCompany };
}

export type SfAccountInput = { account: string; type?: string | null; owner: string; person?: string | null; match_method?: string; label?: string | null; note?: string | null };

export function setSalesforce(ctx: Ctx, a: { companyId: number; status: "matched" | "no_account" | "unassigned" | "not_looked_up"; accounts?: SfAccountInput[]; note?: string | null }) {
  const before = {
    status: one<{ s: string }>(ctx.db, "SELECT sf_lookup_status AS s FROM company WHERE id = ?", a.companyId)?.s,
    accounts: all(ctx.db, "SELECT a.name, a.owner_name FROM company_sf_account csa JOIN sf_account a ON a.id = csa.sf_account_id WHERE csa.company_id = ?", a.companyId),
  };
  ctx.db.prepare("DELETE FROM company_sf_account WHERE company_id = ?").run(a.companyId);
  for (const acc of a.accounts ?? []) {
    const placeholder = acc.owner === "Tricentis Bulldog" ? 1 : 0;
    ctx.db
      .prepare(
        `INSERT INTO sf_account (name, type, owner_name, owner_is_placeholder, looked_up_on) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (name) DO UPDATE SET type = excluded.type, owner_name = excluded.owner_name,
           owner_is_placeholder = excluded.owner_is_placeholder, looked_up_on = excluded.looked_up_on`,
      )
      .run(acc.account, acc.type ?? null, acc.owner, placeholder, today());
    const accountId = one<{ id: number }>(ctx.db, "SELECT id FROM sf_account WHERE name = ?", acc.account)!.id;
    let personId: number | null = null;
    if (acc.person) {
      personId =
        (acc.person.includes("@") ? findPersonByEmail(ctx.db, acc.person)?.id : undefined) ??
        one<{ id: number }>(ctx.db, "SELECT p.id FROM contact c JOIN person p ON p.id = c.person_id WHERE c.company_id = ? AND lower(p.name) = lower(?)", a.companyId, acc.person)?.id ??
        null;
    }
    ctx.db
      .prepare("INSERT OR IGNORE INTO company_sf_account (company_id, sf_account_id, person_id, match_method, label, note) VALUES (?, ?, ?, ?, ?, ?)")
      .run(a.companyId, accountId, personId, acc.match_method ?? "contact_email", acc.label ?? null, acc.note ?? null);
  }
  const status = a.status === "matched" && (a.accounts ?? []).every((x) => x.owner === "Tricentis Bulldog") && (a.accounts ?? []).length ? "unassigned" : a.status;
  ctx.db.prepare("UPDATE company SET sf_lookup_status = ?, sf_owner_raw = ? WHERE id = ?").run(status, a.note ?? null, a.companyId);
  logChange(ctx, { entity: "company", entityId: a.companyId, companyId: a.companyId, action: "salesforce", before, after: { status, accounts: a.accounts ?? [] } });
}

export function setPersonEmail(ctx: Ctx, a: { personId: number; email: string | null; companyId?: number | null }) {
  const before = one<{ email: string | null }>(ctx.db, "SELECT email FROM person WHERE id = ?", a.personId);
  ctx.db.prepare("UPDATE person SET email = ? WHERE id = ?").run(a.email?.trim() || null, a.personId);
  logChange(ctx, { entity: "person", entityId: a.personId, companyId: a.companyId ?? null, action: "email", before: before?.email ?? null, after: a.email });
}

export function setAppNote(ctx: Ctx, key: string, body: string) {
  const before = one<{ body_md: string }>(ctx.db, "SELECT body_md FROM app_note WHERE key = ?", key)?.body_md ?? null;
  ctx.db
    .prepare(
      `INSERT INTO app_note (key, body_md, updated_at) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       ON CONFLICT (key) DO UPDATE SET body_md = excluded.body_md, updated_at = excluded.updated_at`,
    )
    .run(key, body);
  logChange(ctx, { entity: "app_note", action: "edit", before, after: body, reason: key });
}

export function getState(db: DB, key: string): string | null {
  return one<{ value: string }>(db, "SELECT value FROM sync_state WHERE key = ?", key)?.value ?? null;
}

export function setState(ctx: Ctx, key: string, value: string) {
  const before = getState(ctx.db, key);
  ctx.db
    .prepare(
      `INSERT INTO sync_state (key, value, updated_at) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(key, value);
  logChange(ctx, { entity: "sync_state", action: "set", before: { [key]: before }, after: { [key]: value } });
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
