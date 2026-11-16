import type { ReactNode } from "react";
import { Callout, Dek, Eyebrow } from "../components/PageChrome";

type Switch = "Read" | "Change" | "Spend credits" | "Delete & credentials";

interface Tool {
  name: string;
  does: ReactNode;
  ask: string;
  inputs: ReactNode;
  access: Switch;
  runs?: string;
}

const CREDITS = "Uses credits.";
const JOB = "Runs in the background. Followed with get_job.";

const groups: { title: string; intro?: ReactNode; tools: Tool[] }[] = [
  {
    title: "Connect and keys",
    tools: [
      {
        name: "create_ingest_key",
        does: (
          <>
            Creates an ingest key and returns the exact exporter settings for sending traces to
            Agent Score. The secret is shown once. Asking again with the name of a live key returns
            that key without its secret.
          </>
        ),
        ask: "Set this agent up to send its traces to Agent Score. Name it checkout-agent.",
        inputs: "A name for the key.",
        access: "Delete & credentials",
      },
      {
        name: "check_agent_connection",
        does: (
          <>
            Lists each live ingest key with when it was last used, counts the traces received,
            accepted and dropped, and lists the agents discovered. It looks at the last hour by
            default, and up to 7 days back. It can wait up to 25 seconds for a new trace. It covers
            agents you connected. AI Workspace agents use no ingest key.
          </>
        ),
        ask: "Use agent-score to check my agent connection.",
        inputs: "Optional: the agent's name, a key name, a start time, how long to wait.",
        access: "Read",
      },
      {
        name: "revoke_ingest_key",
        does: (
          <>
            Revokes an ingest key. Traces sent with it are refused at once, and it can't be
            restored. A key used in the last 24 hours is refused unless you ask to force it. The
            reason goes to the audit log.
          </>
        ),
        ask: "Revoke the ingest key named old-laptop.",
        inputs: "The key's id (read from check_agent_connection), a reason, and force.",
        access: "Delete & credentials",
        runs: "Can't be undone.",
      },
    ],
  },
  {
    title: "Agents and settings",
    tools: [
      {
        name: "list_agents",
        does: (
          <>
            Lists your organization's agents, AI Workspace agents included, A to Z, with each
            one's status, where it runs, latest score and up to 10 recent scores. Eight a page.
          </>
        ),
        ask: "Which agents do we have, and how are they scoring?",
        inputs: "Optional: part of a name, a status (active, inactive, pending, deleted, all).",
        access: "Read",
      },
      {
        name: "get_agent",
        does: (
          <>
            Shows one agent in depth: status and latest score, what its traces show it doing, its
            scoring schedule and verdict bands, its judge model (the key is masked), its cost rates
            and, if you ask, its Agent Card. An inactive agent shows none of the schedule, shape or
            card.
          </>
        ),
        ask: "What are checkout-agent's settings, and which judge model does it use?",
        inputs: "The agent. Optional: include the card.",
        access: "Read",
      },
      {
        name: "get_overview",
        does: (
          <>
            Sums up your tenant over the last 24 hours: agents and traces, Ship, Review and Block
            counts, agents that need attention, recent scoring runs and a 7-day trend. Example
            agents are not counted.
          </>
        ),
        ask: "How is our tenant doing overall?",
        inputs: "None.",
        access: "Read",
      },
      {
        name: "update_agent_settings",
        does: (
          <>
            Changes how often the agent is scored (at least every 60 minutes), how many days of
            traces each run looks back (1 to 90), whether automatic scoring runs, and the four
            verdict-band floors (whole numbers from 0 to 100, highest first). A field you leave out
            is unchanged. Clearing one returns it to the default. The change applies to the next
            run. Past runs keep the bands they were scored with.
          </>
        ),
        ask: "Score checkout-agent every 6 hours and look back 14 days.",
        inputs: "The agent and at least one setting.",
        access: "Spend credits",
        runs: "A change can start scoring.",
      },
      {
        name: "set_agent_status",
        does: (
          <>
            Activates, deactivates or restores an agent. Deactivating stops scoring, cancels
            queued and running scoring work, and drops every trace the agent sends until it is
            activated again. Those traces are lost, not held. Restoring brings back a deleted agent,
            still inactive.
          </>
        ),
        ask: "Deactivate checkout-agent.",
        inputs: "The agent and the status: active, inactive or restored.",
        access: "Delete & credentials",
        runs: "Activating can resume scheduled scoring.",
      },
      {
        name: "delete_agent",
        does: (
          <>
            Deletes an agent. It has to be inactive first. An agent that sent traces in the last 24
            hours is refused unless you ask to force it. Deleting is soft: restoring brings it back,
            inactive. The reason goes to the audit log.
          </>
        ),
        ask: "Deactivate and delete the old checkout-agent.",
        inputs: "The agent's id (read from list_agents), a reason, and force.",
        access: "Delete & credentials",
      },
    ],
  },
  {
    title: "Scoring and runs",
    tools: [
      {
        name: "score_agent",
        does: (
          <>
            Scores the agent now, or only one of its traces. An agent can be scored by hand once
            every five minutes, counting runs started in the app. One run at a time: if one is
            already going, your coding agent follows that one.
          </>
        ),
        ask: "Score checkout-agent now.",
        inputs: "The agent. Optional: one trace id.",
        access: "Spend credits",
        runs: `${CREDITS} ${JOB}`,
      },
      {
        name: "continue_run",
        does: (
          <>
            Approve makes a complete run the baseline later runs are compared against. Resume
            re-scores a failed or partial run in place.
          </>
        ),
        ask: "Approve the latest run as the baseline.",
        inputs: "The agent, the run's id, and approve or resume.",
        access: "Spend credits",
        runs: "Resume uses credits and runs in the background.",
      },
      {
        name: "start_agent_revision",
        does: (
          <>
            Marks where a change to the agent begins. Traces from then on belong to the new{" "}
            <a href="#/glossary">revision</a>, and the next score covers only them. It tells you
            how many traces the revision already has. Using the label of the open revision changes
            nothing.
          </>
        ),
        ask: "I changed checkout-agent. Start a revision called retry-refund-tool.",
        inputs:
          "The agent and a short label. Optional: a start time, only when your coding agent ran the changed agent itself.",
        access: "Change",
      },
      {
        name: "get_scorecard",
        does: (
          <>
            Shows how the agent scored on its latest scored run: the composite, the ship decision
            and verdict, the breakdown by dimension and by eval, confidence, the change against the
            baseline, why a score is provisional, and the profile it was scored under. It can read
            an older run instead.
          </>
        ),
        ask: "How is checkout-agent scoring, and what is the weakest part?",
        inputs: "The agent. Optional: a run id from list_runs.",
        access: "Read",
      },
      {
        name: "list_runs",
        does: (
          <>
            Lists the agent's scoring runs, newest first, with state, composite, verdict, whether
            it is the baseline, whether it is waiting for approval, its revision label, and whether
            it was started from your coding agent or the app. Up to 365 days back.
          </>
        ),
        ask: "Which runs has checkout-agent had this month?",
        inputs: "The agent. Optional: a start time, a run state.",
        access: "Read",
      },
      {
        name: "get_run",
        does: (
          <>
            Shows one run: state, scores and baseline flags. On request, its progress, or a page
            of its interactions with input and output previews and each eval's score, narrowed by
            eval, by evidence, or by a search.
          </>
        ),
        ask: "Show me the interactions from the last run that failed Task Completion.",
        inputs: "The agent and the run's id. Optional: progress or interactions, eval, evidence, search.",
        access: "Read",
      },
      {
        name: "get_interaction",
        does: (
          <>
            Explains one interaction in full: its input and output (cut at 16 KiB) and every eval's
            score with the judge's whole reason. By trace id, it reads the latest run that scored
            the trace.
          </>
        ),
        ask: "Why did trace 4f2a… score low?",
        inputs: "The agent and a trace id, or a run id and the interaction.",
        access: "Read",
      },
      {
        name: "get_eval_interactions",
        does: (
          <>
            Lists the interactions one eval scored on the latest scored run, each with its score and
            the judge's reason. It can sort lowest first. Up to 500 rows. Interactions without
            enough evidence to score are left out.
          </>
        ),
        ask: "Show me the two interactions that scored lowest on Task Completion.",
        inputs: "The agent and the eval (as the scorecard names it). Optional: lowest first, how many.",
        access: "Read",
      },
    ],
  },
  {
    title: "Jobs",
    tools: [
      {
        name: "get_job",
        does: (
          <>
            Says whether a scoring run, a profile re-fit, an advice request or an eval preview has
            finished. For a run, it gives progress and then the composite, ship decision and
            verdict. For a preview, each trace's score and reason so far. A finished re-fit or
            advice job gives only its state. The result is read with get_profile_fit or
            get_improvement_advice.
          </>
        ),
        ask: "Has that run finished?",
        inputs: "The handle the starting tool returned.",
        access: "Read",
      },
    ],
  },
  {
    title: "Traces",
    intro: (
      <p>
        A trace is a tree of spans. A span is one step, such as a model call or a tool call. These
        four tools read one agent's traces. The score of a trace is not here: ask for it with{" "}
        <code>get_interaction</code>.
      </p>
    ),
    tools: [
      {
        name: "search_traces",
        does: (
          <>
            Finds the agent's traces, newest first, by time window (the last 30 days by default) or
            session. Its search matches one exact trace id. It is not a text search.
          </>
        ),
        ask: "Find checkout-agent's failed traces from yesterday.",
        inputs: "The agent. Optional: from, to, session id, an exact trace id.",
        access: "Read",
      },
      {
        name: "trace_outline",
        does: (
          <>
            Lists one trace's spans in time order: ids, parents, type, name, model, latency, token
            counts and the size of each input and output, but no content. It can list only the
            failed spans.
          </>
        ),
        ask: "Which spans failed in trace 4f2a…?",
        inputs: "The agent and the trace id. Optional: failed spans only.",
        access: "Read",
      },
      {
        name: "read_span",
        does: (
          <>
            Reads one span, or one field of it, such as its input, output, status message, tool
            calls, token usage or cost, a piece at a time.
          </>
        ),
        ask: "Show me the input and output of the span that failed first.",
        inputs: "The agent, the trace, the span. Optional: a field, where to start.",
        access: "Read",
      },
      {
        name: "grep_trace",
        does: (
          <>
            Finds exact text in one trace's span names, status messages, inputs and outputs. It
            matches literal text, not patterns, and is case-sensitive. Each match points to a span
            that <code>read_span</code> can open.
          </>
        ),
        ask: "Find where trace 4f2a… mentions refund_id.",
        inputs: "The agent, the trace, the terms. Optional: which fields, one span.",
        access: "Read",
      },
    ],
  },
  {
    title: "Profiles",
    tools: [
      {
        name: "get_profile_fit",
        does: (
          <>
            Shows which profile scores the agent and why: the profile and version, whether it was
            the default, chosen by a fit, or pinned, the dimension weights, each eval's threshold
            and weight, the fit's rationale and signals, and how many traces back the fit. It also
            lists the other profiles the agent could use and, on request, past fit decisions.
          </>
        ),
        ask: "Which profile scores checkout-agent, and why?",
        inputs: "The agent. Optional: include fit history.",
        access: "Read",
      },
      {
        name: "set_agent_profile",
        does: (
          <>
            Pins the agent to one version of a profile, the latest by default. The agent is
            re-scored on the next scheduled pass. Pinning stops automatic re-fits, and neither the
            tools nor the app can take the agent back to automatic, though you can pin another
            version.
          </>
        ),
        ask: "Put checkout-agent on the latest Tool Caller profile.",
        inputs: "The agent, the profile (from get_profile_fit), and a version.",
        access: "Spend credits",
        runs: "Re-scores on the next scheduled pass. Followed with list_runs.",
      },
      {
        name: "refit_agent_profile",
        does: (
          <>
            Re-runs the fit that picks the agent's profile, over its recent traces. If it picks a
            different profile, a re-score is queued. A pinned agent's fit can't change its profile.
            Once every five minutes per agent, and the agent needs traces.
          </>
        ),
        ask: "Re-run the profile fit for checkout-agent.",
        inputs: "The agent.",
        access: "Spend credits",
        runs: `${CREDITS} ${JOB}`,
      },
    ],
  },
  {
    title: "Labeling",
    tools: [
      {
        name: "get_labeling_queue",
        does: (
          <>
            Lists up to 8 traces with no label yet, with the start of each input and output. On
            request, it adds the 10 newest saved labels. It answers even before the app's
            Labeling tab shows the queue.
          </>
        ),
        ask: "Which of checkout-agent's traces still need a label?",
        inputs: "The agent. Optional: how many, include saved labels.",
        access: "Read",
      },
      {
        name: "submit_label",
        does: (
          <>
            Saves up to 10 labels, one per trace. Confirm says the response was correct. To mark it
            wrong, override it as incorrect and say what it should have been: the expected output,
            outcome or tools, or a note. Only a trace's newest label counts, and sending the same
            label again is safe. Labels saved this way are marked as MCP labels, and an
            administrator can retire them.
          </>
        ),
        ask: "Mark trace 4f2a… incorrect. It should have issued the refund.",
        inputs: "The agent and, per trace, confirm or override, plus what it should have been.",
        access: "Change",
      },
    ],
  },
  {
    title: "Improvement advice",
    tools: [
      {
        name: "request_improvement_advice",
        does: (
          <>
            Asks for recommendations on the agent's latest scored run. If advice is already being
            produced, your coding agent follows that request instead. An agent with no scored run,
            or an inactive one, is refused.
          </>
        ),
        ask: "What should I change in checkout-agent, based on the latest scores?",
        inputs: "The agent and a request key your coding agent makes up, so a repeat starts nothing new.",
        access: "Spend credits",
        runs: `${CREDITS} ${JOB}`,
      },
      {
        name: "get_improvement_advice",
        does: (
          <>
            Reads the advice the agent has been given, newest first, three entries at a time. Each
            recommendation has a priority, a title, the recommendation and the reasoning. Long text
            is cut. Read it in full on the <a href="#/improve">Improve</a> tab. It also says when
            new advice is still being produced.
          </>
        ),
        ask: "What advice has checkout-agent been given?",
        inputs: "The agent.",
        access: "Read",
      },
    ],
  },
  {
    title: "Catalog: evals, dimensions and profiles",
    intro: (
      <p>
        The catalog holds the built-in evals, dimensions and profiles, and your organization's own.
        Ones you create start as drafts only you can see and use, until you publish them. See{" "}
        <a href="#/custom-evals">Building Your Own Evals</a> and{" "}
        <a href="#/custom-profiles">Building Your Own Profiles</a> for what each part means.
      </p>
    ),
    tools: [
      {
        name: "list_catalog",
        does: (
          <>
            Lists evals, then dimensions, then profiles, A to Z: the built-in ones and your
            organization's.
          </>
        ),
        ask: "Which evals do we have for tool use?",
        inputs: "Optional: kind, built-in or yours, active or archived, part of a name, a dimension.",
        access: "Read",
      },
      {
        name: "get_catalog_item",
        does: (
          <>
            Reads one item in full. An eval shows its three answers, its rubric, its 20 newest
            versions and the profiles that use it. A profile shows its entries, how many are
            behind the newest eval version, its versions and the agents on it. A dimension shows
            its evals.
          </>
        ),
        ask: "Show me the Task Completion eval in full.",
        inputs: "The kind and the item's id or slug. Optional: a version.",
        access: "Read",
      },
      {
        name: "save_catalog_eval",
        does: (
          <>
            Creates an eval, renames or describes it, archives it, or adds a version. One of those
            per call. An eval's dimensions are set when it is created and can't change. A new
            version moves every profile and agent on the old version onto it, so live scores
            change. Preview it first. Archived items can't be restored here.
          </>
        ),
        ask: "Write an eval that checks the agent confirms the order id before refunding.",
        inputs: "To create: a slug, a name, its dimensions, and what it checks and what scores 1.0 and 0.0.",
        access: "Change",
      },
      {
        name: "save_catalog_dimension",
        does: (
          <>
            Creates a dimension, renames or describes it, or archives it. One of those per call. A
            dimension a profile uses can't be archived. To put an eval in a dimension, create the
            eval with it.
          </>
        ),
        ask: "Create a Refund Safety dimension.",
        inputs: "To create: a slug and a name.",
        access: "Change",
      },
      {
        name: "save_catalog_profile",
        does: (
          <>
            Creates a profile, renames, describes or archives it, adds a version, or moves the
            agents on older versions onto the newest. One of those per call. A new version moves
            the agents on the previous one, so live scores change. A profile with more than 50
            entries can't take a new version from your coding agent.
          </>
        ),
        ask: "Add the new refund eval to our support profile.",
        inputs: "To create: a slug, a name, and the evals with their thresholds, weights and dimension weights.",
        access: "Change",
      },
      {
        name: "preview_catalog_eval",
        does: (
          <>
            Runs a saved eval, or one not yet saved, over up to five of an agent's traces and saves
            nothing. Left to choose, it uses labeled traces and the newest ones. You can run one
            preview of an agent at a time.
          </>
        ),
        ask: "Try the new refund eval on five of checkout-agent's traces.",
        inputs: "The agent, the eval or a draft, and a request key. Optional: which traces.",
        access: "Spend credits",
        runs: `${CREDITS} ${JOB}`,
      },
      {
        name: "publish_catalog_item",
        does: (
          <>
            Publishes your drafts so every member can see and use them: one, up to 20 of a kind, or
            one dimension with its evals. All publish or none do. Publish evals and dimensions before
            a profile uses them. Archiving is the only way to retire a published item.
          </>
        ),
        ask: "Publish the refund eval.",
        inputs: "The item's id (not its slug), its kind, and a reason.",
        access: "Delete & credentials",
        runs: "Can't be undone.",
      },
      {
        name: "rescore_profile",
        does: (
          <>
            Re-scores every agent on a profile's newest version, with no limit on how many. Each is
            scored on its next scheduled pass. An agent already waiting for a re-score is listed
            as already queued.
          </>
        ),
        ask: "Re-score every agent on our support profile.",
        inputs: "The profile.",
        access: "Spend credits",
        runs: "Uses credits. No job: followed with list_runs per agent.",
      },
    ],
  },
  {
    title: "Activity",
    tools: [
      {
        name: "list_activity",
        does: (
          <>
            Lists the agent's scoring timeline, newest first: runs scheduled, started and
            finished, manual triggers, schedule and verdict-band changes, and score milestones.
            The last 7 days by default, up to 90. It marks runs your coding agent started.
          </>
        ),
        ask: "What has happened to checkout-agent this week?",
        inputs: "The agent. Optional: a start time.",
        access: "Read",
      },
    ],
  },
];

const prompts: { name: string; title: string; does: string }[] = [
  {
    name: "review-my-score",
    title: "Review my score",
    does: "Finds the agent's weakest dimension and its weakest eval, then reads the two interactions that scored lowest on it, with the judge's reasons.",
  },
  {
    name: "debug-a-trace",
    title: "Debug a trace",
    does: "Picks a failed trace, or the one you name, outlines its spans, reads the span that failed first, and shows how the trace scored.",
  },
  {
    name: "improve-my-agent",
    title: "Improve my agent",
    does: "Reads the agent's improvement advice, or asks for new advice and waits for it, then turns it into proposed changes to your code.",
  },
  {
    name: "verify-my-change",
    title: "Verify my change",
    does: "Scores the agent after a code change and compares the new score with the previous one.",
  },
  {
    name: "onboard-my-agent",
    title: "Onboard my agent",
    does: "Creates an ingest key, sends traces, then reads which scoring profile the agent was given and why.",
  },
  {
    name: "write-an-eval",
    title: "Write an eval",
    does: "Writes a custom eval for one failure, previews it on the agent's traces, publishes it and adds it to a profile.",
  },
  {
    name: "write-a-dimension",
    title: "Write a dimension",
    does: "Creates a custom dimension and the evals under it, previews them and publishes them.",
  },
  {
    name: "write-a-profile",
    title: "Write a profile",
    does: "Builds a custom scoring profile from existing evals, publishes it and puts an agent on it.",
  },
];

const guides: { uri: string; does: string }[] = [
  {
    uri: "agent-score://docs/onboard-your-agent",
    does: "Step by step: instrument your agent with OpenTelemetry, export its traces, and confirm they arrive.",
  },
  {
    uri: "agent-score://docs/using-the-tools",
    does: "Which tool answers which question, how to follow a job, how to page a long list, and what stays in the app.",
  },
  {
    uri: "agent-score://docs/how-agent-score-works",
    does: "The scoring flow, evals, dimensions and profiles, profile fitting and the Agent Card, the score and verdict, and what traces must carry to be measured.",
  },
];

function ToolTable({ tools }: { tools: Tool[] }) {
  return (
    <table className="doc-table">
      <thead>
        <tr>
          <th>Tool</th>
          <th>What it does</th>
        </tr>
      </thead>
      <tbody>
        {tools.map((t) => (
          <tr key={t.name}>
            <td>
              <code>{t.name}</code>
              <br />
              <strong>{t.access}</strong>
              {t.runs && (
                <>
                  <br />
                  {t.runs}
                </>
              )}
            </td>
            <td>
              <div>{t.does}</div>
              <div>
                <em>Ask:</em> “{t.ask}”
              </div>
              <div>
                <em>Needs:</em> {t.inputs}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function McpTools() {
  return (
    <>
      <Eyebrow>Get Started</Eyebrow>
      <h1>MCP tools reference</h1>
      <Dek>
        Everything your coding agent can do in Agent Score once it's connected: the prompts it can
        start from, the guides it reads, and every tool, with the switch each one needs and what it
        costs.
      </Dek>
      <p>
        You don't call these by name. Ask in a sentence, as on{" "}
        <a href="#/connect-with-mcp">Connect with MCP</a>, and your coding agent picks the tools.
        Use this page to see what's possible, which switch a job needs, and what a reply means. For
        the improvement loop step by step, see{" "}
        <a href="#/improve">Improve This Agent</a>.
      </p>

      <h2>The five switches</h2>
      <p>
        On <strong>Integrations</strong>, <strong>Manage permissions</strong> has one switch per
        group. A tool works only when its group is on.
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Switch</th>
            <th>Tools</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Read</strong></td>
            <td>
              Every tool that only reads: agents, the overview, scores, runs, traces, jobs,
              profiles, the labeling queue, advice, activity and the catalog.
            </td>
          </tr>
          <tr>
            <td><strong>Change</strong></td>
            <td>
              <code>start_agent_revision</code>, <code>submit_label</code>,{" "}
              <code>save_catalog_eval</code>, <code>save_catalog_dimension</code>,{" "}
              <code>save_catalog_profile</code>
            </td>
          </tr>
          <tr>
            <td><strong>Spend credits</strong></td>
            <td>
              <code>score_agent</code>, <code>continue_run</code>,{" "}
              <code>update_agent_settings</code>, <code>set_agent_profile</code>,{" "}
              <code>refit_agent_profile</code>, <code>request_improvement_advice</code>,{" "}
              <code>preview_catalog_eval</code>, <code>rescore_profile</code>
            </td>
          </tr>
          <tr>
            <td><strong>Delete &amp; credentials</strong></td>
            <td>
              <code>create_ingest_key</code>, <code>revoke_ingest_key</code>,{" "}
              <code>set_agent_status</code>, <code>delete_agent</code>,{" "}
              <code>publish_catalog_item</code>
            </td>
          </tr>
          <tr>
            <td><strong>Prompts &amp; guides</strong></td>
            <td>The eight prompts and three guides below.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Your organization can also turn single tools on or off. When a tool is off, your coding
        agent tells you and stops. It does not look for a way around it. A group you turn on shows
        up after you reconnect your coding agent.
      </p>
      <Callout kind="note" title="What uses credits">
        <p>
          Tools under Spend credits start scoring work: a run, a re-fit, a preview, advice, or a
          re-score. That uses your organization's AI credits for agents you connected yourself.
          Agents that run in AI Workspace, and other agents Tricentis pays for, are scored without
          your organization's credits.
        </p>
      </Callout>

      <h2>Prompts</h2>
      <p>
        A prompt is a ready-made job that walks your coding agent through several tools in order.
        Clients that support MCP prompts list them by name, often as slash commands. Each takes one
        optional input: the name or id of the agent to work on. Without it, your coding agent uses
        your only agent, or asks which one.
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Prompt</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          {prompts.map((p) => (
            <tr key={p.name}>
              <td>
                <code>{p.name}</code>
                <br />
                {p.title}
              </td>
              <td>{p.does}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        A prompt uses the same tools as a request in your own words, so it needs the same
        switches.
      </p>
      <Callout kind="warn" title="The write prompts publish">
        <p>
          <code>write-an-eval</code>, <code>write-a-dimension</code> and{" "}
          <code>write-a-profile</code> end by publishing, which can't be undone. Publishing makes
          the item visible to everyone in your organization. Adding an eval to a profile moves every
          agent on that profile.
        </p>
      </Callout>

      <h2>Guides</h2>
      <p>
        The server also offers three guides your coding agent can read. It reads them when it needs
        them, and you can ask it to.
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Guide</th>
            <th>What it covers</th>
          </tr>
        </thead>
        <tbody>
          {guides.map((g) => (
            <tr key={g.uri}>
              <td>
                <code>{g.uri}</code>
              </td>
              <td>{g.does}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Naming the agent</h2>
      <ul>
        <li>
          Use the agent's name or its id. A name has to match the whole name, in any case.
        </li>
        <li>
          If no agent has that name, the reply suggests up to five that do exist. Your coding agent
          uses one that clearly matches, or asks you.
        </li>
        <li>
          Deleting an agent and revoking a key take an id, never a name. Your coding agent reads the
          id from the list first.
        </li>
      </ul>

      <h2>Jobs that run in the background</h2>
      <p>
        Scoring runs, profile re-fits, advice and eval previews take a while. The tool that starts
        one returns a handle, and your coding agent follows it with <code>get_job</code>. Each call
        waits on the server for up to 25 seconds, and your coding agent asks again until the job is
        done. You don't need to check back.
      </p>
      <ul>
        <li>
          A job is queued, running, complete, partial, failed or cancelled. A complete or partial
          run gives the composite, the ship decision and the verdict.
        </li>
        <li>A failed job gives a short message. Your coding agent reports it and stops.</li>
        <li>
          Cancelled advice was replaced by a newer request. A cancelled re-fit was discarded,
          usually because the agent is pinned or its profile changed meanwhile.
        </li>
        <li>
          <code>set_agent_profile</code> and <code>rescore_profile</code> don't return a job. The
          re-score happens on the agent's next scheduled pass, and shows up in{" "}
          <code>list_runs</code>.
        </li>
      </ul>

      <h2>Tools by job</h2>
      <p>
        Each row gives the tool, the switch it needs, whether it uses credits or runs in the
        background, what it does, something to ask, and what it needs from you or your coding
        agent.
      </p>
      {groups.map((g) => (
        <div key={g.title}>
          <h3>{g.title}</h3>
          {g.intro}
          <ToolTable tools={g.tools} />
        </div>
      ))}

      <h2>Limits</h2>
      <ul>
        <li>
          An agent can be scored by hand once every five minutes. Runs started in the app count.
          Scheduled runs and re-scores don't.
        </li>
        <li>
          One scoring run at a time per agent. Asking for another follows the one in progress.
        </li>
        <li>A profile can be re-fitted once every five minutes per agent.</li>
        <li>
          The tools that start scoring or advice, resume a run, change an agent's status, delete,
          revoke, label, start a revision or publish allow 5 calls a minute and 20 an hour, each
          tool counted on its own. Reads allow 60 a minute, and <code>get_job</code> and the four
          trace tools 120.
        </li>
        <li>
          Tools that return scores, traces, labels, advice or catalog text share a budget of 1,500
          calls an hour.
        </li>
        <li>
          Long text is cut, and the reply says so. Your coding agent reads past a cut in a trace
          with <code>grep_trace</code> and <code>read_span</code>. Cut advice is read in full in the
          app.
        </li>
      </ul>

      <h2>When something goes wrong</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Reply</th>
            <th>What it means, and what your coding agent does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>cooldown</code>, <code>rate_limited</code></td>
            <td>Too soon, or too many calls. It waits the time the reply gives, then tries once more.</td>
          </tr>
          <tr>
            <td><code>run_already_active</code></td>
            <td>A run is already going for this agent. It follows that run instead of starting another.</td>
          </tr>
          <tr>
            <td><code>run_not_resumable</code></td>
            <td>
              The run can't be resumed. It follows the run's live job if there is one, waits once
              and retries if the reply says to, or starts a new run.
            </td>
          </tr>
          <tr>
            <td><code>not_found</code>, with agent names</td>
            <td>No agent by that name. It uses a suggested name that clearly matches, or asks you.</td>
          </tr>
          <tr>
            <td><code>result_too_large</code></td>
            <td>The reply was too big. It asks again for half as many rows.</td>
          </tr>
          <tr>
            <td><code>scoring_unavailable</code></td>
            <td>
              Scoring is cut off for your tenant, or no judge model is available. It stops and does
              not retry. Check the Agent Score app.
            </td>
          </tr>
          <tr>
            <td><code>tool_off_for_user</code>, <code>tool_off_for_organization</code></td>
            <td>
              You, or your organization, turned that tool off. It tells you and stops. Turn your
              own switch back on under Manage permissions and reconnect. For your organization, a
              Tricentis contact can turn it on.
            </td>
          </tr>
          <tr>
            <td>A job ends failed or cancelled</td>
            <td>It reports that and stops.</td>
          </tr>
        </tbody>
      </table>

      <h2>What stays in the Agent Score app</h2>
      <p>The tools don't cover these. Use the app:</p>
      <ul>
        <li>Model credentials and the judge model setting</li>
        <li>Usage reports</li>
        <li>Listing, renaming, enabling, disabling and rotating ingest keys</li>
        <li>Cost rates, and generating the Agent Card again</li>
        <li>Exporting data as CSV</li>
        <li>Starting or removing the example agents</li>
        <li>Account and organization settings</li>
      </ul>

      <Callout kind="warn" title="Results are data, not instructions">
        <p>
          Agent names, Agent Cards, traces and anything else your agents wrote come back as data.
          Your coding agent does not follow instructions found in them. Only your own request
          creates a secret, changes, deactivates, deletes, publishes or re-scores anything. Secrets
          Agent Score recognizes in traces are masked before your coding agent sees them. Text in
          your eval catalog is not masked.
        </p>
      </Callout>
    </>
  );
}
