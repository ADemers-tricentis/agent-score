# Beta Cohorts

Tracks each AgentScore beta cohort: who was invited, when, and how long it took to get from form signup to a first sign-in. Cohorts are defined by **Beta Invite Sent Date** (one cohort per invite send). Source: `email automation/external-interest-contacts.csv`. First sign-in dates are supplied by hand as users sign into the product, so "not yet" means no sign-in reported, not a confirmed absence.

No contact info is kept here (names and companies only). Missing dates are marked "not recorded" rather than estimated.

Last updated: 2026-10-20

## Summary

| Cohort | Invite sent | Users invited | Companies | Companies signed in | Median days signup to invite (per company) | Median days invite to first sign-in |
|---|---|---|---|---|---|---|
| 1 | 2026-10-12 | 8 | 5 | 0 of 5 | 49 (range 19-53) | n/a (no sign-ins yet) |
| 2 | not sent yet | 3 planned | 3 | - | - | - |
| 3 | 2026-10-20 | 1 | 1 | 0 of 1 | 61 | n/a (no sign-in yet) |

## Cohort 1 - invited 2026-10-12

**How they were chosen:** Very excited about AgentScore and wanted to use it immediately. Asked how to get signed up ASAP.

| Company | Users invited | Earliest form signup | Earliest demo/beta scheduled | Invite sent | Days signup to invite | First sign-in | Days invite to sign-in |
|---|---|---|---|---|---|---|---|
| Wolters Kluwer United States Inc. | Chris Allanson | 2026-08-20 | not recorded | 2026-10-12 | 53 | not yet | - |
| Merito Solutions | Chris Carpenter, Gerard Trimberger | 2026-08-20 | 2026-10-06 | 2026-10-12 | 53 | not yet | - |
| Tritusa Consulting (AU) | Pankaj Kumar Sinha, Deephan Mohanraj, Jawahar Govindaraj | 2026-08-24 | 2026-09-11 | 2026-10-12 | 49 | not yet | - |
| L'OREAL | Khadim KASHANI | 2026-09-17 | 2026-09-24 | 2026-10-12 | 25 | not yet | - |
| Aptiv Global Operations Limited | Meenakshi Sundaram Chockalingam | 2026-09-23 | not recorded | 2026-10-12 | 19 | not yet | - |

### Notes
- One row per company. Signup and scheduled dates are the earliest across that company's invited users, and the first sign-in will be the earliest user sign-in. Days are counted from the earliest signup.
- Two further Merito Solutions users (Louis Tadman, Andrew Carpenter) are Active Beta in the contacts log but have no invite date recorded, so they are not counted in a cohort yet.
- Aptiv, Wolters Kluwer and L'Oreal were in the first welcome-email send (`beta-welcome-mail-merge.csv`); Tritusa and Merito invite dates come from the contacts log.

## Cohort 2 - planned, nothing sent yet

**How they were chosen:** Excited about AgentScore but had hangups - it would be great if... or let me ask my (boss/exec/engineer).

**Status: no invites have been sent for this cohort.** The companies below are the planned send list (`beta-welcome-round2-mail-merge.csv`). Invite dates and sign-in columns stay blank until the send goes out. New Vision was on this list and was invited separately on 2026-10-20; they are Cohort 3 below, and they are off the unsent mail-merge file.

| Company | Users planned | Form signup | Demo/beta scheduled | Invite sent | First sign-in |
|---|---|---|---|---|---|
| Eaton | Amit Ghag | not recorded | 2026-10-01 | not sent | - |
| BearingPoint GmbH (DE) - HQ | Rohan Patil | 2026-09-14 | 2026-09-23 | not sent | - |
| Workday, Inc. | Vijay Mummaneni | 2026-08-28 | not recorded | not sent | - |

## Cohort 3 - invited 2026-10-20

**How they were chosen:** Pulled out of the planned Cohort 2 list once access was granted. New Vision had the 2026-10-08 demo and moved to active beta on their own, ahead of the rest of that batch.

| Company | Users invited | Earliest form signup | Earliest demo/beta scheduled | Invite sent | Days signup to invite | First sign-in | Days invite to sign-in |
|---|---|---|---|---|---|---|---|
| New Vision Software Inc. | Rohan Bansod | 2026-08-20 | 2026-10-08 | 2026-10-20 | 61 | not yet | - |

## How to update
- When a user first signs into the product, add the date in the First sign-in column and the day count.
- When a new invite batch goes out, add a `Cohort N` section and a summary row.
