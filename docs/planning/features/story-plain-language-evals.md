# Story: Show evals and dimensions in plain language, with descriptions on hover

## Description

AgentScore's main audience is semi-technical users: product owners, QA leads, and analysts who are responsible for an AI agent's quality but may not know what an "eval" or a "dimension" is. Today, evals appear under their internal names (for example `turn_contextual_recall`), and neither evals nor dimensions come with an explanation. Users have to guess what is being measured, or ask someone on the team.

This story makes the scorecard understandable without prior knowledge. Evals are shown with readable names, and hovering an eval or dimension shows a short plain-language description of what it checks.

### Why it matters
- Users can trust a score only if they understand what produced it. A bar labeled "Retrieval (RAG)" or an eval called "Contextual Precision" tells a non-expert nothing.
- It reduces support questions and demo explanations, because the product explains itself.
- It supports our "no black box" positioning. Every number should trace back to something a person can read.

### What the user sees
- Evals appear as "PII Leakage", not `pii_leakage`.
- Hovering an eval shows what it checks and an example of when it fails.
- Hovering a dimension shows what that category measures, in a sentence or two.

### Writing guidelines for the descriptions
- Say what the eval checks, not how it works internally.
- Avoid jargon. If a technical term is unavoidable, define it in the same sentence.
- Keep each description to one or two sentences, plus a short failure example.
- Write for someone who has never heard of the term "eval".

## User story

As someone reading an agent's scorecard, I want evals and dimensions shown by readable names, with a short explanation when I hover, so I can understand what was measured without knowing the internal names.

## Acceptance criteria

1. Everywhere an eval appears in the customer app (scorecard, dimension breakdown, traces, profile tab, eval results), it shows a display name such as "PII Leakage" or "Turn Faithfulness". It never shows the slug (`pii_leakage`, `turn_faithfulness`).
2. Hovering an eval name shows its plain-language description: what it checks, plus an example of when it fails.
3. Hovering a dimension name shows its plain-language description.
4. The tooltip also opens on keyboard focus, so it works without a mouse.
5. An eval or dimension with no description shows only the name, with no empty tooltip and no error.
6. Custom evals and dimensions that customers create show their own name and description if they have one.
7. The slug stays the internal identifier. API payloads, exports, and CI/CD gates do not change.

## Out of scope
- Changing how evals are scored or grouped.
- Renaming slugs or changing API, export, or CI/CD identifiers.
- Letting customers edit descriptions for the built-in catalog.

## Content source
`docs/documentation/eval-and-dimension-plain-language.md` covers the 41 catalog evals and 11 dimensions. Those descriptions are inferred and must be reviewed against the real rubrics with the eval owner before launch.

## Open questions
- Store the description and display name as fields on the eval and dimension in the Back Office (recommended), so the team can edit them without a deploy. Generating names from slugs would get "MCP" and "RAG" wrong.

## Dependencies
- Review of the descriptions with the eval owner before launch.
