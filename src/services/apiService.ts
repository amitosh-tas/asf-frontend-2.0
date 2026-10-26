import { api } from "./api";

export type TMode = "live" | "test"

export interface KeyCredentials {
  name: string;
  mode?: TMode;
  type?: "publishable" | "secret";
  allowedOrigins: string[];
}

export async function getCompanyKey() {
  return api.get("/api/api-keys");
}

/** Rotates one key; the old key keeps working for `graceHours` so a live site can switch over. */
export async function rotateCompanyKey(id?: string, graceHours = 24) {
  return id ? api.post(`/api/api-keys/${encodeURIComponent(id)}/rotate`, { graceHours }) : api.post("/api/api-keys/rotate", { graceHours });
}

export async function generateKey(credentials: KeyCredentials) {
  return api.post("/api/api-keys", credentials);
}

export async function updateCompanyKey(
  id: string,
  credentials: KeyCredentials,
) {
  return api.patch(`/api/api-keys/${encodeURIComponent(id)}`, credentials);
}

export async function revokeCompanyKey(id: string) {
  return api.delete(`/api/api-keys/${encodeURIComponent(id)}`);
}