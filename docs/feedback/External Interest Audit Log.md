# External Interest Audit Log

Every run of the external-interest-sync agent, newest first. Each entry lists
what changed in the tracker and CSVs and why. Contact emails are deliberately
left out; they live in the contacts CSV.

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
