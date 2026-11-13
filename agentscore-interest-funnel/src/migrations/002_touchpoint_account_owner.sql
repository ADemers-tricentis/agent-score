-- Add 'account_owner_reached_out' to the allowed touchpoint kinds.
-- SQLite cannot alter a CHECK constraint, so the table is rebuilt.
CREATE TABLE touchpoint_new (
  id INTEGER PRIMARY KEY,
  person_id INTEGER REFERENCES person(id),
  company_id INTEGER NOT NULL REFERENCES company(id),
  kind TEXT NOT NULL CHECK (kind IN ('intro_email', 'follow_up', 'reply_received', 'our_reply',
    'account_owner_reached_out', 'demo_scheduled', 'beta_invite', 'beta_checkin', 'opt_out', 'other')),
  occurred_on TEXT,
  source TEXT NOT NULL,
  note TEXT,
  actor TEXT NOT NULL,
  run_id INTEGER REFERENCES sync_run(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT INTO touchpoint_new (id, person_id, company_id, kind, occurred_on, source, note, actor, run_id, created_at)
  SELECT id, person_id, company_id, kind, occurred_on, source, note, actor, run_id, created_at FROM touchpoint;
DROP TABLE touchpoint;
ALTER TABLE touchpoint_new RENAME TO touchpoint;
CREATE INDEX touchpoint_company ON touchpoint (company_id);
