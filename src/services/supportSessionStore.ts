/**
 * Client-side holder for the platform admin's active SUPPORT SESSION.
 *
 * A platform admin may open a company's data only inside a support session (reason, expiry, PII masking).
 * The backend returns a session id; every /api/view/* request must carry it in `X-Support-Session`.
 * The id is kept in sessionStorage (this tab only, gone when the tab closes). It is not a credential on its
 * own: the backend also requires the admin's login cookie and checks the session belongs to that admin.
 *
 * This module must not import `api.ts` (api.ts imports it for the request interceptor).
 */

import type { AxiosError } from "axios";

export const SUPPORT_SESSION_HEADER = "X-Support-Session";

const KEY_PREFIX = "support-session:";
const CHANGE_EVENT = "support-session-change";

export interface StoredSupportSession {
  id: string;
  workspaceId: string;
  reason: string;
  maskPii: boolean;
  startedAt: string;
  expiresAt: string;
}

function isStoredSession(value: unknown): value is StoredSupportSession {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.workspaceId === "string" &&
    typeof v.reason === "string" &&
    typeof v.maskPii === "boolean" &&
    typeof v.expiresAt === "string"
  );
}

function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearSupportSession(workspaceId: string) {
  try {
    sessionStorage.removeItem(KEY_PREFIX + workspaceId);
  } catch {
    /* storage unavailable: nothing to clear */
  }
  notify();
}

/** Parses a stored value; null when it is malformed or already expired. */
export function parseStoredSession(raw: string | null): StoredSupportSession | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredSession(parsed)) return null;
    return new Date(parsed.expiresAt).getTime() > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

/** The raw stored string: a stable primitive, safe to use as a useSyncExternalStore snapshot. */
export function getSupportSessionSnapshot(workspaceId: string): string | null {
  try {
    return sessionStorage.getItem(KEY_PREFIX + workspaceId);
  } catch {
    return null;
  }
}

/** Returns the session for a workspace, or null if there is none or it has expired. */
export function getSupportSession(workspaceId: string): StoredSupportSession | null {
  const session = parseStoredSession(getSupportSessionSnapshot(workspaceId));
  if (!session && getSupportSessionSnapshot(workspaceId)) {
    try {
      sessionStorage.removeItem(KEY_PREFIX + workspaceId); // drop expired / malformed entries
    } catch {
      /* ignore */
    }
  }
  return session;
}

export function saveSupportSession(session: StoredSupportSession) {
  try {
    sessionStorage.setItem(KEY_PREFIX + session.workspaceId, JSON.stringify(session));
  } catch {
    /* storage unavailable: the session still works for this page load via the caller's state */
  }
  notify();
}

export function subscribeSupportSessions(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/** Every /api/view/* route ends with the workspace id: /api/view/workspace/:id, /api/view/reports/summary/:id ... */
export function getViewWorkspaceId(url?: string): string | null {
  if (!url) return null;
  const path = url.split("?")[0];
  if (!path.startsWith("/api/view/")) return null;
  const last = path.split("/").filter(Boolean).pop();
  return last ? decodeURIComponent(last) : null;
}

export function getSupportSessionForUrl(url?: string): StoredSupportSession | null {
  const workspaceId = getViewWorkspaceId(url);
  return workspaceId ? getSupportSession(workspaceId) : null;
}

/**
 * When the backend refuses a view request because the session is missing, invalid, ended or expired,
 * forget the stored session so the UI asks for a new one instead of retrying with a dead id.
 */
export function handleSupportSessionRejection(error: AxiosError<{ code?: unknown }>) {
  const code = error.response?.data?.code;
  if (error.response?.status !== 403 || typeof code !== "string" || !code.startsWith("support_session_")) return;
  const workspaceId = getViewWorkspaceId(error.config?.url);
  if (workspaceId) clearSupportSession(workspaceId);
}
