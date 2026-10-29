import { api } from "./api";
import type { AuthUser } from "@/store/slices/authSlice";

interface LoginCredentials {
  email?: string;
  password?: string;
}

export interface RegisterCompanyCredentials {
  name: string;
  email: string;
  password: string;
  adminName: string;
  country: string;
  timezone: string;
  currency: string;
  industry: string;
  // dataRegion: string;
  paymentMethod?: string;
  websiteUrl?: string;
  weekStart?: number;
  tier?: string;
  interval?: "monthly" | "annually";
}

export interface LoginResult {
  message: string;
  twoFactorRequired?: boolean;
  challengeToken?: string;
  twoFactorSetupRequired?: boolean;
}

export async function verifyTwoFactor(challengeToken: string, code: string) {
  return (await api.post("/api/auth/2fa/verify", { challengeToken, code })).data;
}
export async function requestPasswordReset(email: string) {
  return (await api.post<{ message: string }>("/api/auth/user/forgotpass", { email })).data;
}
export async function resetPassword(token: string, newPassword: string) {
  return (await api.post<{ message: string }>("/api/auth/user/reset-password", { token, newPassword })).data;
}
export async function verifyEmail(verifytoken: string) {
  return (await api.post<{ message: string; status?: string }>("/api/auth/verify-user", { verifytoken })).data;
}
export async function resendVerification(email: string) {
  return (await api.post<{ message: string }>("/api/auth/resend-verification", { email })).data;
}
export async function acceptInvite(token: string, name: string, password: string) {
  return (await api.post<{ message: string }>("/api/workspace/invites/accept", { token, name, password })).data;
}

export async function loginUser(credentials: LoginCredentials): Promise<LoginResult> {
  const res = await api.post<LoginResult>("/api/auth/user/login", credentials);
  return res.data;
}

export async function registerCompany(
  credentials: RegisterCompanyCredentials,
  options: { preserveSession?: boolean } = {},
) {
  if (options.preserveSession) {
    const url = api.getUri({ url: "/api/auth/company/register" });
    const response = await fetch(url, {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      throw new Error(`Company registration failed with status ${response.status}.`);
    }
    return response.json();
  }

  const res = await api.post("/api/auth/company/register", credentials);
  return res.data;
}

export async function getMe(): Promise<AuthUser> {
  const res = await api.get<{ decoded: AuthUser; workspace?: AuthUser["workspace"] }>("/api/auth/me");
  return { ...res.data.decoded, workspace: res.data.workspace };
}

export async function logoutUser() {
  const res = await api.post("/api/auth/logout");
  return res.data;
}