export type KeyMode = "live" | "test";

export interface CompanyApiKey {
  id: string;
  /** display only: active | replaced (still works until expiresAt) | expired | revoked */
  status?: "active" | "replaced" | "expired" | "revoked";
  replacedById?: string | null;
  /** key prefix of the newer key that replaced this one */
  replacedByPrefix?: string | null;
  name: string;
  mode: KeyMode;
  keyPrefix: string;
  siteId: string | null;
  allowedOrigins: string[];
  rateLimitPerMin: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  rotatedFromId: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface RotateKeyResult {
  key: string;
}