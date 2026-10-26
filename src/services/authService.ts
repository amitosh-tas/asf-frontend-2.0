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
  dataRegion: string;
  paymentMethod?: string;
}

export async function loginUser(credentials: LoginCredentials) {
  const res = await api.post("/api/auth/user/login", credentials);
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
  const res = await api.get<{ decoded: AuthUser }>("/api/auth/me");
  return res.data.decoded;
}

export async function logoutUser() {
  const res = await api.post("/api/auth/logout");
  return res.data;
}