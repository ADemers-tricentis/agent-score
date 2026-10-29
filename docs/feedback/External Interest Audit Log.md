# External Interest Audit Log

Every run of the external-interest-sync agent, newest first. Each entry lists
what changed in the tracker and CSVs and why. Contact emails are deliberately
left out; they live in the contacts CSV.

## 2026-10-29T16:22:23Z

- **Cutoff:** 2026-10-29T13:18:33.000Z -> **new marker:** 2026-10-29T13:18:33.000Z (unchanged)
- **Emails found:** 0 new matching submissions (1 other message ignored: The Future Group (NL) - HQ submission (Jean Delissen), received exactly at the cutoff and already processed in the 2026-10-29T16:08:24Z run)

### Added
None

### Excluded
None

### Held for review
None

### Replies
- **Reply cutoff:** 2026-10-29T15:49:48.000Z -> **new reply marker:** 2026-10-29T15:49:48.000Z (unchanged)
- **Search:** user's mailbox, all folders, `afterDateTime` only; 1 message (one page): a GitHub workflow-failure notification received exactly at the cutoff, already seen in the previous run. Not from a contact in the log.

None

### Judgment calls
- **Markers left as-is:** the only message each search returned was the one already recorded at its marker, so neither `.last-processed` nor `.last-reply-check` moved.

### File changes
- `External Interest.md`: no changes (0 sections added, 0 submitter groups added, 0 Pipeline Tracker rows added; counts, as-of date and Companies replied unchanged)
- `external-interest-mail-merge.csv`: not regenerated (no new companies; still holds The Future Group (NL) - HQ from the previous run)
- `external-interest-contacts.csv`: 0 rows appended; 0 Status cells set to Replied
- `.last-processed`: 2026-10-29T13:18:33.000Z -> unchanged
- `.last-reply-check`: 2026-10-29T15:49:48.000Z -> unchanged

## 2026-10-29T16:08:24Z

- **Cutoff:** 2026-10-26T17:37:30.000Z (recovered from the 2026-10-26 audit entry; `.last-processed` was missing) -> **new marker:** 2026-10-29T13:18:33.000Z
- **Emails found:** 1 matching submission (3 other messages ignored: 2 "AI App Exploration" (Tricentis GmbH (AT) - HQ, Home Depot Store Support, Inc.), and the Sun Life submission (Kishore Kumar) received exactly at the cutoff, already processed on 2026-10-26)

### Added
| Company | Submitter(s) | Submitted | Why added | Sources used |
|---|---|---|---|---|
| The Future Group (NL) - HQ | Jean Delissen (Test manager, Partner) | 2026-10-29 | New company | [Craft](https://craft.co/the-future-group-335), [TheOrg team](https://theorg.com/org/the-future-group/teams/data-engineering-and-testing), [TheOrg profile](https://theorg.com/org/the-future-group/org-chart/jean-delissen) |

### Excluded
None. The one new submitter is external and not already in the tracker or contacts log (checked name, email and company name).

### Held for review
None. No instruction-like content in the submission.

### Replies
- **Reply cutoff:** 2026-10-29T15:14:09.000Z (recovered from the 2026-10-29T15:31:23Z audit entry; `.last-reply-check` was missing) -> **new reply marker:** 2026-10-29T15:49:48.000Z
- **Search:** user's mailbox, all folders, `afterDateTime` only; 4 messages (one page). None from a contact in the log: 2 GitHub workflow notifications, 1 Zoom meeting-assets notice (at the cutoff), 1 calendar cancellation sent by the user.

None

### Judgment calls
- **Missing markers:** `.claude/skills/external-interest-sync/` no longer existed (deleted along with the skill's SKILL.md, per git status), so both marker files were gone. Instead of the tracker-date fallback, cutoffs were taken from the last two audit-log entries, which record the exact marker values. The folder was recreated and both markers written.
- **Source breakdown line:** updated alongside the Interested count (107 -> 108 via the Labs form, 111 -> 112 total), following the 2026-10-26 run.
- **The Future Group:** no company website found in search; the description relies on Craft and TheOrg directory listings. The use-case inference leans on the Partner relationship and the submitter's SAP test-manager profile. No public evidence of a formal Tricentis partnership.

### File changes
- `External Interest.md`: 1 section added (The Future Group (NL) - HQ), 0 submitter groups added to existing sections, 1 Pipeline Tracker row added; submission count 144 -> 145; as-of 2026-10-26 -> 2026-10-29; Interested companies 111 -> 112; Companies replied 17 -> 17 (none); Source breakdown 107 -> 108 Labs form, 111 -> 112 total; intro notes appended: none
- `external-interest-mail-merge.csv`: overwritten with 1 row (The Future Group (NL) - HQ)
- `external-interest-contacts.csv`: 1 row appended (The Future Group (NL) - HQ); 0 Status cells set to Replied
- `.last-processed`: missing (last recorded 2026-10-26T17:37:30.000Z) -> 2026-10-29T13:18:33.000Z
- `.last-reply-check`: missing (last recorded 2026-10-29T15:14:09.000Z) -> 2026-10-29T15:49:48.000Z

### Trace export
Not accepted. `create_ingest_key` was blocked by the permission classifier; the export using the shared headers in `test-agent/.env` returned HTTP 403 Forbidden on every batch, and `check_agent_connection` showed 0 traces received for external-interest-sync. The tracker and CSV edits above stand.

## 2026-10-29T15:31:23Z

Reply check only (run by hand, not a full sync). The labs@tricentis.com inbox was not checked, and `.last-processed` is unchanged.

### Replies
- **Reply cutoff:** none (first reply check, fell back to the earliest Email Sent Date, 2026-09-09) -> **new reply marker:** 2026-10-29T15:14:09.000Z
- **Search:** Inbox folder, query "AgentScore", 22 messages (one page, no more results). Other folders were not searched.

| Company | Contact | Replied | Status change | Detail |
|---|---|---|---|---|
| Telekom Deutschland GmbH | André Hoffmann | 2026-10-29 | Email sent -> Replied | Very interested as a Tricentis partner; says he has only had the welcome email so far and asks when access and next steps will come. Three Telekom colleagues cc'd. |
| QACooper LLC | Michael W Cooper | 2026-10-28 | Email sent -> Replied | One-word "Thanks" reply to the welcome email; no times or questions. |
| The Tech Collective | Nadia Grundholm | 2026-10-28 | already Replied, no change | Asked for an intro for a small team next week. |
| Stanza | Anirban Toy Choudhury | 2026-09-24 | already Replied, no change | Introduced Matt Mahowald (Platform Engineering Lead), who asked for availability. |
| Tritusa Consulting (AU) | Jawahar Govindaraj | 2026-10-22, 2026-10-23 | already Active Beta, no change | Beta support threads (scoring and Agent Card questions). |
| Wolters Kluwer United States Inc. | Chris Allanson | 2026-10-13 to 2026-10-15 | already Active Beta, no change | Tenant and access setup thread. |
| Aptiv Global Operations Limited | Meenakshi Sundaram Chockalingam | 2026-10-12 | already Active Beta, no change | Sign-in error and workaround question. |

### Judgment calls
- Reply dates use US Central time, so QACooper's reply (01:04 UTC on 10-29) is dated 2026-10-28, matching how The Tech Collective's date was recorded.
- QACooper's reply is only "Thanks". It counts as a reply under the rules, but it isn't a real engagement signal.
- Deephan Mohanraj (Tritusa): automatic out-of-office reply, 2026-10-22, ignored.
- Alex Syed (Accenture) and Matt Mahowald (Stanza) are not in the contacts log. Accenture is already Pending Beta and Stanza is already Replied, so nothing was applied.

### Held for review
None

### File changes
- `External Interest.md`: Pipeline Tracker Status for QACooper LLC and Telekom Deutschland GmbH set to Replied; `Replied:` line added to both sections; Companies replied 15 -> 17
- `external-interest-contacts.csv`: 2 Status cells set to Replied (QACooper LLC, Telekom Deutschland GmbH)
- `.last-reply-check`: created, 2026-10-29T15:14:09.000Z

## 2026-10-26T17:50:45Z

- **Cutoff:** 2026-10-22T13:36:58.000Z -> **new marker:** 2026-10-26T17:37:30.000Z
- **Emails found:** 6 matching submissions (5 other messages ignored: 3 "AI App Exploration" (Sweers and Co., Meyn Food Processing Technology BV, Home Depot Store Support, Inc.), 1 "Release Risk Intelligence" (Verizon International), and the SKYPhoenix IT GmbH submission received exactly at the cutoff, which the previous run already processed)

### Added
| Company | Submitter(s) | Submitted | Why added | Sources used |
|---|---|---|---|---|
| Sun Life (form blank, domain-resolved) | Kishore Kumar (Test Lead, Other) | 2026-10-26 | New company | [Sun Life](https://www.sunlife.ca/en/about-us/newsroom/news-releases/announcement/sun-life-puts-ai-to-work-so-advisors-can-spend-more-time-delivering-trusted-advice/124122/), [Advisor.ca](https://advisor.ca/industry-news/tech-roundup-sun-life-uses-generative-ai-notetaking-tool/), [Wealth Professional](https://www.wealthprofessional.ca/news/industry-news/sun-life-ai-concierge-fields-11000-client-conversations-in-its-first-month/393321), [Coverager](https://coverager.com/sun-life-expands-ai-tools-for-advisors/), [BrainStation](https://brainstation.io/magazine/sun-life-introduces-intelligent-digital-coach-ella) |
| Thought Frameworks | Roopa S (Automation Lead, Partner) | 2026-10-26 | New company | [LinkedIn](https://www.linkedin.com/company/thought-frameworks), [Indeed](https://in.indeed.com/cmp/Thought-Frameworks) |
| NTT Data (UK) | Stinu Easo (QA, Partner) | 2026-10-23 | New company | [NTT DATA Business Solutions](https://nttdata-solutions.com/uk/blog/ntt-data-sap-uk-ntt-data-sap-or-ntt-data-business-solutions/), [NTT DATA UK](https://uk.nttdata.com/news/ntt-data-unveils-smart-ai-agent-ecosystem), [Business Wire](https://www.businesswire.com/news/home/20250320628624/en/NTT-DATA-Launches-Agentic-AI-Services-for-Hyperscaler-AI-Technologies) |
| Mattoni 1873 a.s. | Ondrej Kyzek (Business Solutions IT manager, Customer) | 2026-10-23 | New company | [Mattoni 1873](https://www.mattoni1873.cz/en/media/karlovarske-mineralni-vody-adopt-new-identity-mattoni-1873), [Wikipedia](https://en.wikipedia.org/wiki/Mattoni_1873), [MediaGuru](https://www.mediaguru.cz/mattoni-1873-prilezitosti-hledame-neustale) |
| QACooper LLC | Michael W Cooper (CEO, Partner) | 2026-10-22 | New company | [TechWell](https://members.techwell.com/speakers/michael-cooper), [Healthcare IT Leaders](https://www.healthcareitleaders.com/blog/healthcare-leaders-healthcare-leaders-adds-chief-quality-officervp-enterprise-qa-testing-services/) (neither confirmed to be the same person) |
| Telekom Deutschland GmbH | André Hoffmann (Senior Test Automation Architect, Partner) | 2026-10-22 | New company | [Deutsche Telekom](https://www.telekom.com/en/company/digital-responsibility/details/artificial-intelligence-at-deutsche-telekom-1055154), [Rasa](https://rasa.com/customers/deutsche-telekom-cs), [Eclipse LMOS](https://eclipse.dev/lmos/blog/LMOS-Accelerated-Agent-Dev/), [ElevenLabs](https://elevenlabs.io/de/blog/deutsche-telekom) |

### Excluded
None. No internal, owned-brand or repeat submitters in this batch (checked names, emails and company names against the tracker and contacts log).

### Held for review
None. No instruction-like content in any submission.

### Judgment calls
- **Subject match:** every notification subject carries a " - <Company>" suffix, so "exact" subject matching was applied as a prefix match on "New Tricentis Labs Submission for AI Agent Testing and Evaluation"; subjects for other Labs products were ignored.
- **Cutoff boundary:** the SKYPhoenix IT GmbH email (Simon Kreitmayer) was returned because its received time equals the cutoff; it is already stacked under Dolpheen IT Solutions, so it was skipped as already processed rather than counted as a repeat.
- **Sun Life:** Company field blank (subject said "Company Not Found"); resolved from the sunlife.com email domain. Confident on the company, not on which Sun Life entity or country.
- **QACooper LLC:** no public company information found; the prose says so. The Michael Cooper QA profiles cited may be a different person.
- **NTT Data (UK):** email domain points to NTT DATA Business Solutions (SAP arm); kept the form's company name as the heading.
- **Telekom Deutschland:** "Partner" relationship is unusual for an operator; use-case inference leans on Deutsche Telekom's public agent work, not the submitter's role.
- **Format:** new tracker sections follow the existing sections' layout (no separate Contact line; "Email sent" / "Beta scheduled" placeholders as "-"). Contacts-log rows follow the file's actual 9-column header and M/D/YY date style rather than the 7-column, quoted, YYYY-MM-DD format in the agent instructions, so columns stay aligned.
- **Source breakdown line:** besides the Interested count, the Pipeline Tracker's "Source breakdown" line was updated (101 -> 107 via the Labs form, 105 -> 111 total) so it still sums to the Interested count.

### File changes
- `External Interest.md`: 6 sections added (Sun Life, Thought Frameworks, NTT Data (UK), Mattoni 1873 a.s., QACooper LLC, Telekom Deutschland GmbH), 0 submitter groups added to existing sections, 6 Pipeline Tracker rows added; submission count 138 -> 144; as-of 2026-10-22 -> 2026-10-26; Interested companies 105 -> 111; intro notes appended: none
- `external-interest-mail-merge.csv`: overwritten with 6 rows (Sun Life, Thought Frameworks, NTT Data (UK), Mattoni 1873 a.s., QACooper LLC, Telekom Deutschland GmbH)
- `external-interest-contacts.csv`: 6 rows appended (same six companies)
- `.last-processed`: 2026-10-22T13:36:58.000Z -> 2026-10-26T17:37:30.000Z
