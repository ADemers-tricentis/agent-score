PRAGMA foreign_keys = ON;

CREATE TABLE company (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'form' CHECK (source IN ('form', 'sales', 'referral')),
  source_detail TEXT,
  sf_lookup_status TEXT NOT NULL DEFAULT 'not_looked_up'
    CHECK (sf_lookup_status IN ('matched', 'no_account', 'unassigned', 'not_looked_up')),
  sf_owner_raw TEXT,
  primary_person_id INTEGER REFERENCES person(id),
  chase_rank INTEGER,
  merged_into_id INTEGER REFERENCES company(id),
  excluded_reason TEXT,
  import_raw_md TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE company_alias (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  origin TEXT NOT NULL,
  UNIQUE (company_id, alias)
);
CREATE INDEX company_alias_lower ON company_alias (lower(alias));

CREATE TABLE person (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE COLLATE NOCASE,
  do_not_email_on TEXT,
  do_not_email_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- One row per person at a company. Holds the per-person status the contacts CSV tracked.
CREATE TABLE contact (
  id INTEGER PRIMARY KEY,
  person_id INTEGER NOT NULL REFERENCES person(id),
  company_id INTEGER NOT NULL REFERENCES company(id),
  role TEXT NOT NULL DEFAULT 'submitter' CHECK (role IN ('submitter', 'demo_contact', 'other')),
  status TEXT NOT NULL DEFAULT 'interested',
  status_note TEXT,
  outreach_excluded_reason TEXT,
  note TEXT,
  UNIQUE (person_id, company_id)
);

CREATE TABLE submission (
  id INTEGER PRIMARY KEY,
  person_id INTEGER REFERENCES person(id),
  person_name TEXT NOT NULL,
  company_id INTEGER REFERENCES company(id),
  submitted_at TEXT,
  source TEXT NOT NULL DEFAULT 'labs_form' CHECK (source IN ('labs_form', 'sales', 'referral')),
  form_company_field TEXT,
  title TEXT,
  relationship TEXT,
  comments TEXT,
  disposition TEXT NOT NULL CHECK (disposition IN ('counted', 'stacked', 'repeat', 'excluded', 'held')),
  disposition_rule TEXT,
  reason TEXT,
  inbox_message_id TEXT UNIQUE,
  run_id INTEGER REFERENCES sync_run(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE sf_account (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT,
  owner_name TEXT,
  owner_is_placeholder INTEGER NOT NULL DEFAULT 0,
  looked_up_on TEXT
);

CREATE TABLE company_sf_account (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES company(id),
  sf_account_id INTEGER NOT NULL REFERENCES sf_account(id),
  person_id INTEGER REFERENCES person(id),
  match_method TEXT,
  label TEXT,
  note TEXT,
  UNIQUE (company_id, sf_account_id, person_id)
);

CREATE TABLE stage_event (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES company(id),
  stage TEXT NOT NULL CHECK (stage IN ('interested', 'email_sent', 'follow_up_sent', 'replied',
    'demo_scheduled', 'pending_beta', 'invited_to_beta', 'actively_using', 'not_a_fit', 'do_not_email')),
  occurred_on TEXT,
  note TEXT,
  reason TEXT,
  actor TEXT NOT NULL,
  run_id INTEGER REFERENCES sync_run(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX stage_event_company ON stage_event (company_id, id);

CREATE TABLE touchpoint (
  id INTEGER PRIMARY KEY,
  person_id INTEGER REFERENCES person(id),
  company_id INTEGER NOT NULL REFERENCES company(id),
  kind TEXT NOT NULL CHECK (kind IN ('intro_email', 'follow_up', 'reply_received', 'our_reply',
    'demo_scheduled', 'beta_invite', 'beta_checkin', 'opt_out', 'other')),
  occurred_on TEXT,
  source TEXT NOT NULL,
  note TEXT,
  actor TEXT NOT NULL,
  run_id INTEGER REFERENCES sync_run(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX touchpoint_company ON touchpoint (company_id);

CREATE TABLE cohort (
  id INTEGER PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  invite_sent_on TEXT,
  how_chosen TEXT,
  notes_md TEXT
);

CREATE TABLE cohort_member (
  id INTEGER PRIMARY KEY,
  cohort_id INTEGER NOT NULL REFERENCES cohort(id),
  company_id INTEGER NOT NULL REFERENCES company(id),
  person_id INTEGER REFERENCES person(id),
  invite_sent_on TEXT,
  demo_scheduled_on TEXT,
  UNIQUE (cohort_id, company_id, person_id)
);

CREATE TABLE first_signin (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES company(id),
  person_id INTEGER REFERENCES person(id),
  signed_in_on TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('product_login', 'reported_use')),
  note TEXT,
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE research_field (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES company(id),
  field TEXT NOT NULL,
  label_raw TEXT NOT NULL,
  qualifier TEXT,
  body_md TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  as_of TEXT,
  actor TEXT NOT NULL,
  run_id INTEGER REFERENCES sync_run(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX research_field_company ON research_field (company_id, sort);

CREATE TABLE research_source (
  id INTEGER PRIMARY KEY,
  research_field_id INTEGER NOT NULL REFERENCES research_field(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  link_text TEXT
);

CREATE TABLE company_link (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES company(id),
  kind TEXT NOT NULL,
  label TEXT,
  path_or_url TEXT NOT NULL,
  UNIQUE (company_id, path_or_url)
);

CREATE TABLE agent_stack (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort INTEGER NOT NULL
);

CREATE TABLE company_agent_stack (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES company(id),
  stack_id INTEGER NOT NULL REFERENCES agent_stack(id),
  qualifier TEXT,
  UNIQUE (company_id, stack_id)
);

CREATE TABLE fit_bucket (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  short_label TEXT NOT NULL,
  tone TEXT NOT NULL,
  sort INTEGER NOT NULL
);

CREATE TABLE fit_assessment (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES company(id),
  bucket_id TEXT NOT NULL REFERENCES fit_bucket(id),
  evidence TEXT,
  why TEXT,
  fit_label TEXT,
  assessed_on TEXT,
  is_current INTEGER NOT NULL DEFAULT 1,
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX fit_assessment_current ON fit_assessment (company_id, is_current);

CREATE TABLE funnel_insight (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  count_text TEXT,
  action_md TEXT,
  sort INTEGER NOT NULL
);

CREATE TABLE funnel_insight_company (
  insight_id INTEGER NOT NULL REFERENCES funnel_insight(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES company(id),
  PRIMARY KEY (insight_id, company_id)
);

CREATE TABLE signup_issue (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('no_company', 'internal', 'duplicate')),
  who TEXT NOT NULL,
  when_text TEXT,
  detail TEXT,
  submission_id INTEGER REFERENCES submission(id),
  company_id INTEGER REFERENCES company(id),
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE app_note (
  key TEXT PRIMARY KEY,
  body_md TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE company_note (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES company(id),
  body_md TEXT NOT NULL,
  actor TEXT NOT NULL,
  run_id INTEGER REFERENCES sync_run(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE sync_run (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL,
  dry_run INTEGER NOT NULL DEFAULT 0,
  actor TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  finished_at TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  cutoff_before TEXT,
  cutoff_after TEXT,
  reply_cutoff_before TEXT,
  reply_cutoff_after TEXT,
  summary_md TEXT
);

CREATE TABLE sync_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE change_log (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor TEXT NOT NULL,
  run_id INTEGER REFERENCES sync_run(id),
  entity TEXT NOT NULL,
  entity_id INTEGER,
  company_id INTEGER REFERENCES company(id),
  action TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  reason TEXT
);
CREATE INDEX change_log_company ON change_log (company_id);
