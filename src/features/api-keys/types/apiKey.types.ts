export type KeyMode = "live" | "test";

export interface CompanyApiKey {
  id: string;
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