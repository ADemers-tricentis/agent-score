# Example Agent Spec: ATC Test Generation Agent

Worked example of a structured "expert mode" agent spec, in the format the Evaluation
Design flow parses (see `agent-score/src/views/EvalDesignView.tsx` — `EXPERT_SPEC`,
written there for the CURA agent). This one covers the **ATC** (Automated Test Creation)
agent type instead, and includes an `example_trace` section showing the agent actually
invoking its declared tools in order.

```yaml
agent: ATC Test Generation Agent
version: "1.0"
purpose: |
  Generates automated test cases from written requirements or acceptance criteria.
  Receives a requirements document (or user story) and the target codebase/API surface,
  and produces test cases in the project's testing framework format.
  Expected to maximize requirement coverage without inventing APIs that don't exist.

tools:
  fetch_requirements(story_id):                       retrieve the requirement or acceptance criteria text
  fetch_codebase_surface(module_path):                 return public functions/classes/APIs available to test
  fetch_existing_tests(module_path):                   list current test files to avoid duplication
  lint_test_case(test_code):                           validate syntax against the target framework
  emit_test_suite(test_cases, coverage_map):           structured output — final generated tests + traceability

success_criteria:
  - Every acceptance criterion in the requirement maps to at least one generated test case
  - Generated tests are syntactically valid and compile/parse in the target framework
  - Assertions reference only APIs/methods that actually exist in the codebase
  - No semantic duplicates across generated test cases for the same requirement
  - Stay within 6,000 tokens total per generation session
  - Complete generation within 30s for a single requirement

failure_modes:
  - Must NOT invent APIs, methods, or fields not present in the provided codebase surface
  - Must NOT emit a test case for a requirement it was not given (scope drift)
  - Must NOT silently skip an acceptance criterion it cannot cover — must flag it instead
  - Must NOT duplicate an existing test already returned by fetch_existing_tests
  - Must NOT exceed token budget by more than 20% on any standard request

constraints:
  latency_budget_ms: 30000        # P90 for a single-requirement generation
  token_budget: 6000               # total per session
  hallucination_tolerance: 0.0     # zero tolerance for fabricated API references
  min_coverage: 1.0                # every acceptance criterion must have >=1 covering test

edge_cases:
  - Requirement with vague or untestable acceptance criteria (correct output: flag, don't guess)
  - Codebase surface missing a method implied by the requirement (correct output: flag gap)
  - Requirement that overlaps significantly with an existing test file (avoid duplication)
  - Requirement written in a different testing framework's vocabulary than the target repo uses
  - Conflicting requirements across two linked user stories

example_trace:
  scenario: "Generate coverage for the 'data-export' feature (2 acceptance criteria)"
  tool_calls:
    - turn: 1
      name: fetch_requirements
      input: { story_id: "DE-142" }
      output: { criteria: ["Export completes for files up to 500MB", "Export rejects unsupported file types with a 400"] }
    - turn: 2
      name: fetch_codebase_surface
      input: { module_path: "src/export" }
      output: { exports: ["ExportService.run(fileId, format)", "ExportService.validate(file)"] }
    - turn: 3
      name: fetch_existing_tests
      input: { module_path: "src/export" }
      output: { files: ["export_smoke.test.ts"] }
    - turn: 4
      name: lint_test_case
      input: { test_code: "test('rejects unsupported file type', () => { expect(() => ExportService.validate(badFile)).toThrow(400) })" }
      output: { valid: true, framework: "jest" }
    - turn: 5
      name: lint_test_case
      input: { test_code: "test('exports 500MB file', async () => { const r = await ExportService.run(bigFileId, 'csv'); expect(r.status).toBe('complete') })" }
      output: { valid: true, framework: "jest" }
    - turn: 6
      name: emit_test_suite
      input:
        test_cases: ["rejects unsupported file type", "exports 500MB file"]
        coverage_map: { "DE-142:AC1": "exports 500MB file", "DE-142:AC2": "rejects unsupported file type" }
      output: { status: "submitted", test_count: 2, coverage: 1.0 }
```

The trace makes two spec requirements concretely checkable: `fetch_existing_tests` is
called before generation (checks the "no duplicates" failure mode), and every
`lint_test_case` call precedes `emit_test_suite` (checks the "syntactically valid"
success criterion) — a judge scoring this trace can verify ordering and coverage
directly against the tool-call log, not just the final output.
