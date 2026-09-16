/** Shared manual re-fit hook — no backend. Fakes the same busy → settle
 *  lifecycle the real 202-enqueue-and-poll hook has (so the UI still shows a
 *  brief "busy" state on the refit button) without any network call. */
import { useRef, useState } from "react";

import { toast } from "@/shared/lib/toast";

const FAKE_FIT_DELAY_MS = 900;

export function useAutoFit(_tenantId: string, _agentId: string, onComplete?: () => void) {
  const [isBusy, setIsBusy] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const refit = () => {
    if (isBusy) return;
    setIsBusy(true);
    toast.success("Re-fit queued.");
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setIsBusy(false);
      toast.success("Re-fit complete.");
      onComplete?.();
    }, FAKE_FIT_DELAY_MS);
  };

  return {
    refit,
    isPending: isBusy,
    isPolling: false,
    isBusy,
  };
}
