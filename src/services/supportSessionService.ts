import { api } from "./api";
import {
  clearSupportSession,
  saveSupportSession,
  type StoredSupportSession,
} from "./supportSessionStore";

export interface SupportSessionRecord {
  id: string;
  workspaceId: string;
  reason: string;
  maskPii: boolean;
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  /** Present on the company-facing list only. */
  supportAgent?: string;
}

export interface StartSupportSessionInput {
  workspaceId: string;
  reason: string;
  durationMinutes: number;
  maskPii: boolean;
}

/** Starts a session on the backend and remembers it for this tab. */
export async function startSupportSession(input: StartSupportSessionInput): Promise<StoredSupportSession> {
  const { data } = await api.post<SupportSessionRecord>("/api/platform-admin/support-sessions", input);
  const session: StoredSupportSession = {
    id: data.id,
    workspaceId: data.workspaceId,
    reason: data.reason,
    maskPii: data.maskPii,
    startedAt: data.startedAt ?? new Date().toISOString(),
    expiresAt: data.expiresAt,
  };
  saveSupportSession(session);
  return session;
}

/** Ends the session. The local copy is always dropped, even if the network call fails. */
export async function endSupportSession(session: StoredSupportSession) {
  try {
    await api.post(`/api/platform-admin/support-sessions/${encodeURIComponent(session.id)}/end`);
  } finally {
    clearSupportSession(session.workspaceId);
  }
}

/** Company admin: who from platform support looked at our data, why, and when. */
export async function getCompanySupportAccess() {
  return api.get<{ data: SupportSessionRecord[] }>("/api/workspace/support-access");
}
