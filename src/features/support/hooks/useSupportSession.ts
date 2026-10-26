import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  clearSupportSession,
  getSupportSessionSnapshot,
  parseStoredSession,
  subscribeSupportSessions,
  type StoredSupportSession,
} from "@/services/supportSessionStore";

/**
 * The platform admin's live support session for a workspace (null when none / expired / ended).
 * Re-renders when the session is started, ended, rejected by the backend, or reaches its expiry time.
 */
export function useSupportSession(workspaceId?: string): StoredSupportSession | null {
  const raw = useSyncExternalStore(
    subscribeSupportSessions,
    () => (workspaceId ? getSupportSessionSnapshot(workspaceId) : null),
    () => null,
  );
  const session = useMemo(() => parseStoredSession(raw), [raw]);

  const expiresAt = session?.expiresAt;
  useEffect(() => {
    if (!workspaceId || !expiresAt) return;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    // setTimeout caps at ~24.8 days; sessions last at most 2 hours, so this is safe
    const timer = window.setTimeout(() => clearSupportSession(workspaceId), Math.max(remaining, 0) + 50);
    return () => window.clearTimeout(timer);
  }, [workspaceId, expiresAt]);

  return session;
}
