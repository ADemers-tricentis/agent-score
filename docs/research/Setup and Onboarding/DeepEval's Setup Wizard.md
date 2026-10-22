# How the DeepEval Setup Wizard Works

The release notes only list it as "Deepeval wizard (#3084)". The details below come from that PR and the separate `confident-ai/confident-setup` repo, which holds the actual wizard. It first appeared in DeepEval Python 4.1.9 and TypeScript 0.9.11 (August 2026). It works in two layers.

## Layer 1: The bootstrap script (`setup.sh`)

You start it with:

```
curl -fsSL "https://deepeval.com/setup.sh" | sh
```

PR #3084 added a docs-site route that serves this shell script. It doesn't contain the wizard. It downloads and launches it:

1. **Checks prerequisites:** `curl` and `tar` must be installed.
2. **Picks a version:** it queries the GitHub API for the latest `confident-setup` release. You can pin a version by passing a tag as the first argument.
3. **Detects your platform:** macOS or Linux, x64 or arm64. Windows isn't supported.
4. **Downloads and checks the archive:** it fetches `confident-setup-<os>-<arch>.tar.gz` plus `SHA256SUMS` and checks the SHA-256 hash. If the hash doesn't match, it stops.
5. **Installs the binary:** it goes to `~/.local/bin/confident-setup`, or `$XDG_BIN_HOME` if that's set.
6. **Reconnects your terminal:** `curl | sh` uses up standard input, so the script reattaches to `/dev/tty`. On macOS it uses `script` to give the wizard a real terminal.
7. **Starts the wizard** with `--from deepeval`.

The Confident AI version (`confident-ai.com/setup.sh`) is the same script, except it skips the "use Confident AI?" question.

## Layer 2: The wizard itself (`confident-setup`)

It's a Node.js program compiled into a single executable. It shows all six steps up front.

### Checks before step 1

- **Git:** it checks your Git status and asks before continuing in a folder with uncommitted changes or one that isn't a Git repo.
- **Language:** it looks for an existing DeepEval install. For Python it checks, in order: the active venv, a Poetry or uv environment, `.venv`, then `python3` on your PATH. For TypeScript it uses your package manager (npm, pnpm, Yarn or Bun), detected from `packageManager` or the lockfile.
- **Installing DeepEval:** if it isn't found, the wizard shows the exact install command and asks first. It never installs into the system Python.
- **Mixed or other languages:** if the repo has both Python and TypeScript, it asks which to evaluate. If it has neither, it builds a standalone Python script that calls your app from outside, the way a user would.
- **The DeepEval question:** started from DeepEval, it asks whether to use Confident AI (their hosted platform). Saying no skips steps 1-3 and keeps everything local.

### The six steps

1. **Browser sign-in:** you approve the login in your browser, and the wizard loads your account details from Confident AI.
2. **Project and API key:** you pick or confirm a project, and it creates an API key for that project.
3. **Saving the key:** it adds `CONFIDENT_API_KEY` to `.env.local`, limits the file's permissions to you (mode `0600`), and makes sure Git ignores it.
4. **Judge model:** this is the LLM that scores your app. It supports OpenAI, Anthropic, Gemini, Azure OpenAI, Bedrock, OpenRouter, DeepSeek, Grok, Moonshot, LiteLLM, Portkey, Ollama, and any OpenAI-compatible server.
   - It offers to reuse keys already in your environment or `.env.local`.
   - New keys are typed into a hidden prompt.
   - It doesn't ask for credentials DeepEval can find itself, like your AWS login for Bedrock or Vertex AI for Gemini.
   - You can skip this step, but then you only get metrics that compare outputs directly, not ones that need a model.
5. **Writing the evaluation:** three options:
   - Let a detected coding agent write it (Claude Code, Codex or Cursor CLI, if installed and logged in).
   - Copy a generated prompt into your own agent.
   - Write it yourself using the quickstart docs.
6. **Run and check:** it runs the evaluation once and checks the agent's results. With Confident AI it also confirms the test run exists in the cloud. It rejects results where a supposedly component-level evaluation has no span-level or trace-level scores. It ends with a short report. If the check fails, it explains why and keeps the generated files and keys.

### Options

`--project-dir`, `--app-url`, `--api-url`, `--org-id`, `--proj-id`, `--from`.

## Security notes

- **Agent permissions:** if you let a coding agent write the evaluation, the wizard first runs it in a read-only mode (Claude plan mode, Codex's read-only sandbox, Cursor ask mode). It then warns you and asks again before giving the agent full permissions. That second approval is the risky one, since the agent can then change your code freely.
- **Keys:** they stay out of prompts, telemetry, command-line arguments and result files. The agent is told the environment variable names, never the values, and is told not to read `.env.local`.
- **Telemetry:** on by default, redacted. Turn it off with `CONFIDENT_TELEMETRY_DISABLED=1`.
- **Git:** the wizard never commits or pushes.
- **`curl | sh`:** the hash check only proves the binary matches what's on GitHub. You're still trusting the script and the release. You can download `setup.sh` and read it before running it.

## Sources

- [DeepEval releases](https://github.com/confident-ai/deepeval/releases)
- [PR #3084: Deepeval wizard](https://github.com/confident-ai/deepeval/pull/3084/files)
- [confident-ai/confident-setup README](https://github.com/confident-ai/confident-setup)
