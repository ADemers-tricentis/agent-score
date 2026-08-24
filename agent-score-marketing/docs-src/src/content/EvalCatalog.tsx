import { Callout, Dek, Eyebrow, Screenshot } from "../components/PageChrome";
import { EvalSpectrumDiagram } from "../components/diagrams/EvalSpectrum";
import catalogDoor from "../assets/catalog-door.png";
import studioLibrary from "../assets/studio-library.png";
import studioGeval from "../assets/studio-geval.png";
import studioHybrid from "../assets/studio-hybrid.png";

export default function EvalCatalog() {
  return (
    <>
      <Eyebrow>Evaluations</Eyebrow>
      <h1>The Evaluation Catalog</h1>
      <Dek>
        An <strong>eval</strong> is a single, focused question about quality - "was this grounded
        in the context it was given?", "did it call the right tool?", "is this valid JSON?" Agent
        Score ships with over 60 of them, ready to run against your traces on day one.
      </Dek>

      <p>
        No golden datasets to build and no manual labeling before you get your first signal. Every
        eval scores your agent straight from the traces it already produces, and every result
        comes back with a plain-language reason and the trace evidence behind it - never just a
        bare number.
      </p>

      <h2>Three ways an eval can judge</h2>
      <p>Evals sit on a spectrum from strict rules to human-like judgment.</p>

      <EvalSpectrumDiagram />

      <h3>Library</h3>
      <p>
        Deterministic - think of it as a checklist. Did the output match this pattern? Is it valid
        JSON? Did it hit this exact value? Fast, precise, and consistent every time.
      </p>
      <Screenshot
        src={studioLibrary}
        alt="A Library eval called Template: Safe, Non-Toxic Output, derived from the toxicity library metric, showing its rubric and a pass threshold at 0.50"
        caption="A Library eval's detail view - a pre-built metric and a threshold, nothing to write."
      />

      <h3>G-Eval</h3>
      <p>
        Uses an LLM as a judge. Instead of checking for an exact match, it reads the output the way
        a person would and asks a question like "was this response helpful and accurate?" Better
        suited to open-ended tasks where there's no single right answer.
      </p>
      <Screenshot
        src={studioGeval}
        alt="A G-Eval called Template: Helpful, On-Point Answer, showing its plain-English rubric, a Strict mode toggle, and the pass threshold at 0.70"
        caption="A G-Eval's detail view - the plain-English rubric the judge grades against, and where its pass threshold is set."
      />

      <h3>Hybrid</h3>
      <p>
        Combines both - deterministic checks for the parts that have a clear right answer, and LLM
        judgment for the parts that need more nuance.
      </p>
      <Screenshot
        src={studioHybrid}
        alt="A Hybrid eval called Security Findings, showing a MAP (LLM) phase emitting severity-tagged claims that feed a REDUCE (code) phase computing a severity-weighted score, with a pass threshold at 0.50"
        caption="A Hybrid eval's detail view - an LLM MAP phase extracts claims, then a code REDUCE phase computes the final score."
      />

      <h2>Browsing the catalog</h2>
      <p>
        Every eval - library metric, custom G-Eval, or hybrid - lives in one searchable catalog,
        organized by family. This catalog lives in Agent Score's Back Office, maintained by the
        Agent Score team rather than browsed self-serve in the customer app - the families table
        below is the customer-facing summary of what's in it.
      </p>
      <Screenshot
        src={catalogDoor}
        alt="The eval catalog, showing 62 evals as a grid of templates and metrics like Template: Tool Success Rate, Template: Safe Non-Toxic Output, Failure Attribution, and Faithfulness (EvalClaw), filterable by kind, status, and dimension"
        caption="The catalog view - browse by category, or search templates and metrics directly."
      />

      <h2>Families in the catalog</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Family</th>
            <th>Sample evals</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Groundedness &amp; RAG</strong></td>
            <td>Faithfulness, Hallucination, Contextual Precision / Recall / Relevancy</td>
          </tr>
          <tr>
            <td><strong>Correctness</strong></td>
            <td>Answer Correctness, JSON Correctness, Exact / Pattern Match</td>
          </tr>
          <tr>
            <td><strong>Agentic &amp; Tool-use</strong></td>
            <td>Task Completion, Tool Correctness, Argument Correctness, Plan Adherence</td>
          </tr>
          <tr>
            <td><strong>Conversational</strong></td>
            <td>Knowledge Retention, Role Adherence, Goal Accuracy, Topic Adherence</td>
          </tr>
          <tr>
            <td><strong>Quality &amp; Efficiency</strong></td>
            <td>Conciseness, Summarization, Trajectory Efficiency</td>
          </tr>
          <tr>
            <td><strong>Safety</strong></td>
            <td>Bias, Toxicity, PII Leakage, Misuse, Role Violation</td>
          </tr>
        </tbody>
      </table>

      <Callout kind="tip" title="Can't find the eval you need?">
        <p>
          The catalog covers most agents out of the box. When it doesn't,{" "}
          <a href="#/custom-evals">build your own in plain language</a> - no eval-engineering
          background required.
        </p>
      </Callout>

      <p>
        Evals are the smallest unit of measurement. The next page covers how they combine into{" "}
        <a href="#/dimensions-and-profiles">dimensions and profiles</a> to produce a single score.
      </p>
    </>
  );
}
