"""OTel GenAI semantic-convention + OpenInference attributes.

Confirmed against Tricentis-AI/agent-score's own source (not guessed):
- has_tools is set by an observation with `type=="TOOL"` (after Langfuse's
  projection) OR the OpenInference/gen_ai pattern below - this exact
  pattern is what agent-score's own reference fixture
  (services/platform/.../simulation/corpus/research-assistant-demo) uses,
  and canonical.py's "F1" comment confirms it maps to type=="TOOL".
- has_retrieval requires Langfuse's native `toolCalls` column to be
  populated (a "structured" tool_execution, not just type=="TOOL") - the
  exact raw-OTel shape that produces this is inside Langfuse's own OTel
  ingestion, not this repo. Unconfirmed; treat OBSERVATION_OUTPUT with
  real retrieved text as best-effort, not guaranteed.
"""

GEN_AI_AGENT_NAME = "gen_ai.agent.name"
GEN_AI_OPERATION_NAME = "gen_ai.operation.name"  # invoke_agent | chat | execute_tool
GEN_AI_REQUEST_MODEL = "gen_ai.request.model"
GEN_AI_SYSTEM_INSTRUCTIONS = "gen_ai.system_instructions"
GEN_AI_TOOL_NAME = "gen_ai.tool.name"
GEN_AI_USAGE_INPUT_TOKENS = "gen_ai.usage.input_tokens"
GEN_AI_USAGE_OUTPUT_TOKENS = "gen_ai.usage.output_tokens"

# OpenInference's own span-kind tag - a second, independent convention
# agent-score's identity/fingerprint layer also recognizes (separate code
# path from the has_tools/has_retrieval scoring-shape derivation).
OPENINFERENCE_SPAN_KIND = "openinference.span.kind"  # AGENT | LLM | TOOL | RETRIEVER | CHAIN

# Bare (non-namespaced) input/output/tool_definitions - the exact attribute
# names agent-score's reference corpus uses alongside gen_ai.*.
INPUT = "input"
OUTPUT = "output"
TOOL_DEFINITIONS = "tool_definitions"
