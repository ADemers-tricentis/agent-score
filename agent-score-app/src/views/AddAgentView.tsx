import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Divider from "@mui/material/Divider";
import type { View } from "../view";
import type { AgentKind, AgentType, FingerprintMatch } from "../types";
import { createAgent } from "../data/mock";
import StepBasics from "./add-agent/StepBasics";
import StepConnectOtel from "./add-agent/StepConnectOtel";
import StepWaitingForTraces from "./add-agent/StepWaitingForTraces";
import StepReviewLaunch from "./add-agent/StepReviewLaunch";

const STEP_LABELS = ["Basics", "Connect via OTel", "Waiting for traces", "Review & launch"];

/**
 * "Add Agent" onboarding wizard (REQ-042). A single linear 4-step flow -
 * intentionally simpler than the old AI-engineer-facing prototype's
 * two-path/6-step version, since this UI targets domain practitioners who
 * just need: OTel config, trace collection, fingerprint-based profile
 * matching, and a name.
 *
 * The underlying Agent record is created once, on entering step 2 (Waiting
 * for traces) - not before, since steps 0-1 are just form-filling and static
 * info. `agentId` being non-null is what guards against creating a second
 * agent if the user navigates back and forward through the wizard.
 */
export default function AddAgentView({ navigate }: { navigate: (v: View) => void }) {
  const [step, setStep] = useState(0);

  // Step 0: Basics
  const [name, setName] = useState("");
  const [agentType, setAgentType] = useState<AgentType | null>(null);
  const [kind, setKind] = useState<AgentKind>("external");

  // Step 2: Waiting for traces
  const [agentId, setAgentId] = useState<string | null>(null);
  const [fingerprintMatch, setFingerprintMatch] = useState<FingerprintMatch | null>(null);

  // Create the agent exactly once, the first time step 2 is reached.
  useEffect(() => {
    if (step !== 2 || agentId || !agentType) return;
    const created = createAgent({ name: name.trim(), agentType, kind });
    setAgentId(created.agent_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only fires on step change / first-time creation
  }, [step]);

  const canProceedFromBasics = name.trim() !== "" && agentType !== null;
  const canProceedFromWaiting = fingerprintMatch !== null;

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleNext() {
    setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1));
  }

  function handleLaunch() {
    if (!agentId) return;
    navigate({ name: "agent-overview", agentId });
  }

  const nextDisabled =
    (step === 0 && !canProceedFromBasics) || (step === 2 && !canProceedFromWaiting) || (step === 2 && !agentId);

  return (
    <Box sx={{ p: 3, maxWidth: 720 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Add Agent
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Connect a new agent to AgentScore in a few steps.
      </Typography>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEP_LABELS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {step === 0 && (
        <StepBasics
          name={name}
          onNameChange={setName}
          agentType={agentType}
          onAgentTypeChange={setAgentType}
          kind={kind}
          onKindChange={setKind}
        />
      )}

      {step === 1 && <StepConnectOtel />}

      {step === 2 &&
        (agentId ? (
          <StepWaitingForTraces
            agentId={agentId}
            fingerprintMatch={fingerprintMatch}
            onFingerprintMatch={setFingerprintMatch}
          />
        ) : (
          <Typography variant="body2" sx={{ color: "text.disabled" }}>
            Setting up your agent...
          </Typography>
        ))}

      {step === 3 && agentType && (
        <StepReviewLaunch name={name.trim()} agentType={agentType} kind={kind} fingerprintMatch={fingerprintMatch} />
      )}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box>
          {step > 0 && (
            <Button onClick={handleBack} sx={{ textTransform: "none" }}>
              ← Back
            </Button>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={() => navigate({ name: "home" })} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          {step < STEP_LABELS.length - 1 ? (
            <Button variant="contained" onClick={handleNext} disabled={nextDisabled}>
              Next
            </Button>
          ) : (
            <Button variant="contained" onClick={handleLaunch} disabled={!agentId}>
              Launch
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
