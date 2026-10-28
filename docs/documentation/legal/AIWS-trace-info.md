# Replies on AI Workspace traces

Answers to the open questions on trace retention, disabling collection, and what relic-service sends.

## Whether the AI Hub’s downstream model providers retain trace data or use it for model training

Unanswered.

## How the 12-month trace retention period interacts with the 90-day post-termination deletion requirement

Automatic deletion waits 12 months. Trace payloads are deleted after 12 months by default (`trace_retention_months=12`, which is also the maximum). The bucket has a 395-day lifecycle backstop. A terminated tenant’s traces therefore remain past 90 days.

Deleting them inside 90 days takes a hard purge of the tenant by Tricentis staff in the back office. The purge removes:

- the tenant and every agent under it
- every stored trace, meaning the payload objects and the index rows
- session snapshots and run transcripts

It writes a purge record. Member memberships are removed. User accounts stay. Consent records are kept for 7 years and are never purged.

Spans that AI Workspace has already sent to Better Stack stay there. A tenant purge in AgentScore does not delete them. They follow Better Stack’s own retention.

## Whether disabling trace collection only stops future collection or also deletes previously collected traces

Disabling trace collection stops future collection only. Traces already stored are left in place.

## The process for disabling trace collection

There are two ways:

1. The flag switches off automatically when the user’s trial ends.
2. An admin turns it off in the AgentScore back office.

## The trace content transmitted by relic-service

Each trace is one agent run. The list below is from a production relic-service trace in us-east-1. A trace carries:

- Run identifiers and measurements: trace id, session id, span names, start and end times, latency, model name, and token counts.
- The user message for that run.
- The agent’s system instructions, on the model-call spans.
- The tool definitions given to the model: name, description, and parameter schema.
- The model output: any reasoning text, the reply text, and tool-call arguments (whatever values the model put in them, such as a URL).
- The tool result text that came back into the conversation.

In that trace, workflow and agent spans carried names and timing only. Their input and output were empty. The tool span’s own input and output were empty too. The call and the result sat on the model-call spans. Release, version, environment, and tags were empty.
