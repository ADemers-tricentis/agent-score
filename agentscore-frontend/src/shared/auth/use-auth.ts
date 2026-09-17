import { createContext, useContext } from "react";

import type { AccessConfig, UserProfile } from "@/shared/auth/api";

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  accessConfig: AccessConfig | null;
  /** `true` when the boot-time `GET /access/config` failed outright — distinct
   *  from `!accessConfig` while `isLoading` is still true. A page renders a
   *  retryable error for this rather than silently staying blank. */
  accessConfigError: boolean;
  /** Re-runs the whole boot sequence (config, then identity) — what a
   *  "Retry" affordance calls after `accessConfigError`. */
  retryAccessConfig: () => void;
  setupRequired: boolean;
  /** Clears `setupRequired` locally right after a successful `POST
   *  /access/setup`, without a round trip — `accessConfig` was fetched once
   *  at boot and is never refetched on its own, so without this the first
   *  navigation away from `/setup` bounces straight back via `SetupGate`. */
  markSetupComplete: () => void;
  /** The identity token Microsoft handed back on redirect, held in memory
   *  only — never persisted. Set once when a `no_account` refusal sends the
   *  person to `/no-access`, so "Ask for access"/"Ask again" can post it
   *  without asking Microsoft again. Cleared on navigation away from
   *  `/no-access`; a page reload therefore loses it by design, and
   *  `NoAccessPage` falls back to a single "Sign in with Microsoft" button
   *  that re-runs the redirect. */
  pendingIdToken: string | null;
  /** Set whenever Microsoft sign-in fails somewhere the person can't see
   *  for themselves — `loginWithMicrosoft()` rejecting before the redirect
   *  even leaves the page, or the token exchange refusing with a code that
   *  has nowhere to navigate to (`invalid_token`, `sso_not_enabled`). `null`
   *  otherwise; cleared at the start of the next `loginWithMicrosoft()`
   *  attempt. Rendered by `LoginPage` in the same alert slot the password
   *  form's own error uses. */
  signInError: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
  /** Signs the person in from a profile the caller already holds, rather
   *  than a fresh credentials round trip — `SetupPage`'s non-password branch
   *  uses this so first-run gateway/Microsoft setups land signed in instead
   *  of discarding `submitSetup`'s returned profile and bouncing to
   *  `/login`, where gateway mode has no session to establish. */
  adoptProfile: (profile: UserProfile) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  accessConfig: null,
  accessConfigError: false,
  retryAccessConfig: () => {
    throw new Error("AuthProvider missing");
  },
  setupRequired: false,
  markSetupComplete: () => {
    throw new Error("AuthProvider missing");
  },
  pendingIdToken: null,
  signInError: null,
  login: async () => {
    throw new Error("AuthProvider missing");
  },
  loginWithMicrosoft: async () => {
    throw new Error("AuthProvider missing");
  },
  logout: async () => {
    throw new Error("AuthProvider missing");
  },
  adoptProfile: () => {
    throw new Error("AuthProvider missing");
  },
});

export function useAuth() {
  return useContext(AuthContext);
}
