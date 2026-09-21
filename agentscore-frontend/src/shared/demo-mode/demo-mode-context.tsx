/** Demo-only presenter controls — lets whoever is running the demo switch
 * between an admin and a non-admin (staff) view, and between the populated
 * fixtures and a blank/new-tenant state, without a real backend or login.
 * Not part of the product; not wired into AgentScore itself. Persisted to
 * localStorage so a role/blank choice survives client-side navigation and a
 * page reload mid-demo.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type { UserProfile } from "@/shared/auth/api";
import { SAMPLE_TENANT_ID } from "@/back-office/agents/fake-data";

export type DemoRole = "admin" | "staff";

/** The tenant id a Tosca login would have resolved to, for each `blank`
 * state — there's no tenant picker anywhere in the product anymore, so
 * every screen that needs "the current tenant" reads it from here instead
 * of asking the person. `blank` stands in for "first-ever Tosca login for
 * this org" (the tenant was just auto-created, so it's still empty besides
 * the seeded sample agent); un-blank stands in for a returning, known org. */
const TENANT_ID_BY_BLANK: Record<"blank" | "populated", string> = {
  blank: SAMPLE_TENANT_ID,
  populated: "tenant-tais",
};

const STORAGE_KEY = "agentscore-frontend:mode";

interface StoredDemoMode {
  role: DemoRole;
  blank: boolean;
}

const DEFAULT_MODE: StoredDemoMode = { role: "admin", blank: false };

/** The fake principal each role resolves to — fed to the real `canAccess`
 * tier gate in `shared/auth/destination-tiers.ts` so nav visibility matches
 * how production actually gates staff vs. superadmin. */
export const DEMO_USERS: Record<DemoRole, UserProfile> = {
  admin: { is_superadmin: true, name: "Alex Admin", email: "alex@tricentis.com" },
  staff: { is_superadmin: false, name: "Sam Staff", email: "sam@tricentis.com" },
};

function readStoredMode(): StoredDemoMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MODE;
    const parsed = JSON.parse(raw) as Partial<StoredDemoMode>;
    return {
      role: parsed.role === "staff" ? "staff" : "admin",
      blank: parsed.blank === true,
    };
  } catch {
    return DEFAULT_MODE;
  }
}

interface DemoModeContextValue {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  blank: boolean;
  setBlank: (blank: boolean) => void;
  user: UserProfile;
  /** The tenant a Tosca login resolved to for this session. Read this
   * instead of prompting for a tenant — there is nothing to pick. */
  tenantId: string;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<StoredDemoMode>(readStoredMode);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mode));
  }, [mode]);

  const value: DemoModeContextValue = {
    role: mode.role,
    setRole: (role) => setMode((m) => ({ ...m, role })),
    blank: mode.blank,
    setBlank: (blank) => setMode((m) => ({ ...m, blank })),
    user: DEMO_USERS[mode.role],
    tenantId: TENANT_ID_BY_BLANK[mode.blank ? "blank" : "populated"],
  };

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode(): DemoModeContextValue {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error("useDemoMode must be used within a DemoModeProvider");
  return ctx;
}
