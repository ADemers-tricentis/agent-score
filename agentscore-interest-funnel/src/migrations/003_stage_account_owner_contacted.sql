-- Add the 'account_owner_contacted' funnel stage (between interested and email_sent).
-- SQLite cannot alter a CHECK constraint, so the table is rebuilt.
CREATE TABLE stage_event_new (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES company(id),
  stage TEXT NOT NULL CHECK (stage IN ('interested', 'account_owner_contacted', 'email_sent', 'follow_up_sent', 'replied',
    'demo_scheduled', 'pending_beta', 'invited_to_beta', 'actively_using', 'not_a_fit', 'do_not_email')),
  occurred_on TEXT,
  note TEXT,
  reason TEXT,
  actor TEXT NOT NULL,
  run_id INTEGER REFERENCES sync_run(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT INTO stage_event_new (id, company_id, stage, occurred_on, note, reason, actor, run_id, created_at)
  SELECT id, company_id, stage, occurred_on, note, reason, actor, run_id, created_at FROM stage_event;
DROP TABLE stage_event;
ALTER TABLE stage_event_new RENAME TO stage_event;
CREATE INDEX stage_event_company ON stage_event (company_id, id);
