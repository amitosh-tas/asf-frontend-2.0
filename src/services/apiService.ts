import { api } from "./api";

export type TMode = "live" | "test"

export interface KeyCredentials {
  name: string;
  mode?: TMode;
  allowedOrigins: string[];
}

export async function getCompanyKey() {
  return api.get("/api/api-keys");
}

export async function rotateCompanyKey() {
  return api.post("/api/api-keys/rotate");
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