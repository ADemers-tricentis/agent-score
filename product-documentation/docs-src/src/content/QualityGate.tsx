import { Callout, Dek, Eyebrow } from "../components/PageChrome";

export default function QualityGate() {
  return (
    <>
      <Eyebrow>The Scoring Journey</Eyebrow>
      <h1>Quality Gate</h1>
      <Dek>
        The verdict averages many checks, so one bad trace barely moves it. A{" "}
        <strong>quality gate</strong> is the line you draw yourself: a short list of conditions
        over your scored traces that reads <strong>open</strong>, <strong>closed</strong>, or{" "}
        <strong>not enough data</strong>.
      </Dek>

      <h2>Why a gate</h2>
      <p>
        An agent can read "Ship" while failing the one check you care about most. If a single
        response leaks personal data, the weighted score hardly changes. The gate watches that
        check on its own and tells you plainly when it fails.
      </p>

      <Callout kind="note" title="The gate is a signal, not a blocker">
        <p>
          A closed gate does not stop your agent, block a deploy, or change the verdict. It is
          computed from results that are already stored, and it never starts scoring. Your team,
          or your coding agent through MCP, decides what to do when it closes.
        </p>
      </Callout>

      <h2>The four states</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>State</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Open</td>
            <td>Every condition has enough evidence and none is failing.</td>
          </tr>
          <tr>
            <td>Closed</td>
            <td>At least one condition is failing. The gate names which one and the traces behind it.</td>
          </tr>
          <tr>
            <td>Not enough data</td>
            <td>
              A condition has fewer scored traces than its minimum evidence, so it cannot decide
              yet. The gate gives the reason.
            </td>
          </tr>
          <tr>
            <td>No gate configured</td>
            <td>The agent has no conditions yet.</td>
          </tr>
        </tbody>
      </table>
      <p>
        The gate also reports how many scored traces it checked. If the last evaluation failed,
        the gate keeps showing its last good state along with an error code. If a re-evaluation is
        due, the state can lag by a few seconds.
      </p>

      <h2>Conditions</h2>
      <p>
        Each agent has one gate made of conditions. All thresholds use the same 0-100 scale as
        the scorecard. A condition targets one <strong>eval</strong>, one <strong>dimension</strong>,
        or the <strong>overall</strong> score, and the agent must actually score that target.
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Kind</th>
            <th>Fails when</th>
            <th>You set</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Share</td>
            <td>
              More than a set percentage of traces are flagged. A trace is flagged when it scores
              below the trace threshold on one eval. Set 0% to fail on any single trace.
            </td>
            <td>Trace threshold, max flagged percent, population</td>
          </tr>
          <tr>
            <td>Floor</td>
            <td>The latest complete run's figure for the target is below the floor.</td>
            <td>Floor value</td>
          </tr>
          <tr>
            <td>Drop</td>
            <td>The figure fell by more than a set number of points against the previous revision.</td>
            <td>Drop in points</td>
          </tr>
        </tbody>
      </table>

      <h3>Population</h3>
      <p>A share condition counts flagged traces within a population:</p>
      <ul>
        <li>
          <strong>Revision</strong> - the current revision window.
        </li>
        <li>
          <strong>Last traces</strong> - the most recent N scored traces.
        </li>
        <li>
          <strong>Last days</strong> - scored traces from the last N days.
        </li>
      </ul>

      <h3>Minimum evidence</h3>
      <p>
        Every condition has a minimum number of scored traces (1 to 1,000) before it decides.
        Below that number the gate reads <strong>not enough data</strong> instead of guessing.
      </p>

      <Callout kind="tip" title="Drop conditions need revisions">
        <p>
          A drop compares against the previous revision, so it only has something to compare
          after you mark a new revision. See{" "}
          <a href="#/improve">Improve This Agent</a>.
        </p>
      </Callout>

      <h2>Starter templates</h2>
      <p>
        To start quickly, apply a template. Each copies editable conditions onto your agent:
      </p>
      <ul>
        <li>
          <strong>Privacy</strong>
        </li>
        <li>
          <strong>Security</strong>
        </li>
        <li>
          <strong>Safety</strong>
        </li>
      </ul>
      <p>
        Each template is a rule on a built-in eval scoring below 80 over the last 30 days. Applying
        the same template again adds nothing new. If your agent does not score the eval a rule
        uses, the rule is still copied and reads <strong>not applicable</strong>.
      </p>

      <h2>Organization-wide conditions</h2>
      <p>
        A condition can apply to every agent in your organization. You see these on each agent's
        gate, but they are read-only there: you cannot edit, delete, or acknowledge flags on them
        from an agent. A failing organization-wide condition also cannot be overridden.
      </p>

      <h2>Flags</h2>
      <p>
        When a share condition fails a trace, that trace is <strong>flagged</strong>. A flag shows
        the trace's score, the judge's reason, and the run and time of the score the gate used.
        Flags list lowest score first.
      </p>
      <p>
        If a flag is a false alarm, you can <strong>acknowledge</strong> it with a reason of up to
        1,000 characters, recorded with your user. An acknowledged trace counts as passing for that
        condition only, and stays that way through re-scores and threshold edits.
      </p>
      <Callout kind="warn" title="Acknowledging cannot be undone">
        <p>
          Check the judge's reason before you acknowledge a flag. It applies to that one condition
          and cannot be reversed.
        </p>
      </Callout>

      <h2>Overriding a closed gate</h2>
      <p>
        If the gate is closed and you accept the risk, you can force it open with a reason of up to
        1,000 characters, recorded with your user. An override only works while the gate reads
        closed. It ends on its own when:
      </p>
      <ul>
        <li>another condition starts failing,</li>
        <li>a new revision window opens, or</li>
        <li>any condition is created, edited, or deleted.</li>
      </ul>

      <h2>History</h2>
      <p>
        Every change to the gate is recorded, newest first: state changes, conditions created,
        edited, or deleted, templates applied, flags acknowledged, and overrides. Each entry shows
        when it happened, who did it, which surface it came from (app, MCP, assistant, or the
        system), the reason where one applies, the conditions in force at the time, and the traces
        behind a failure.
      </p>

      <h2>Use the gate from your coding agent</h2>
      <p>
        Through <a href="#/connect-with-mcp">MCP</a>, your coding agent can read the gate state and
        the reason, so it knows whether a change is safe to ship. The tools are:
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Tool</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>get_quality_gate</td>
            <td>Reads the gate: state, each condition's result, and the available templates.</td>
          </tr>
          <tr>
            <td>create_gate_condition, update_gate_condition, delete_gate_condition</td>
            <td>
              Adds a condition, changes its thresholds, population or minimum evidence, or removes
              it. To change a condition's kind or target, delete it and create a new one.
            </td>
          </tr>
          <tr>
            <td>apply_gate_template</td>
            <td>Copies the privacy, security, or safety starter conditions.</td>
          </tr>
          <tr>
            <td>list_quality_gate_flags</td>
            <td>Lists flagged traces, with the score and the judge's reason.</td>
          </tr>
          <tr>
            <td>acknowledge_gate_flag</td>
            <td>Marks one flag as a false alarm, with a reason.</td>
          </tr>
          <tr>
            <td>override_quality_gate</td>
            <td>Forces a closed gate open, with a reason.</td>
          </tr>
          <tr>
            <td>list_quality_gate_history</td>
            <td>Lists what changed the gate.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Changing conditions, acknowledging flags, and overriding depend on the{" "}
        <strong>Manage permissions</strong> switches you have turned on for your coding agents.
      </p>

      <h2>What the gate does not do yet</h2>
      <ul>
        <li>It does not block deploys, and there is no CI API or native CI integration for it.</li>
        <li>It is separate from the verdict. A closed gate does not turn "Ship" into "Block".</li>
        <li>It reads scored production traces, not simulation runs.</li>
      </ul>
    </>
  );
}
