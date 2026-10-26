import axios from "axios";
import { rememberReportTimeZone } from "@/features/reports/utils/timezone";
import {
  SUPPORT_SESSION_HEADER,
  getSupportSessionForUrl,
  handleSupportSessionRejection,
} from "./supportSessionStore";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Platform-admin views (/api/view/*) are only allowed inside a support session.
api.interceptors.request.use((config) => {
  const session = getSupportSessionForUrl(config.url);
  if (session) config.headers.set(SUPPORT_SESSION_HEADER, session.id);
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Every report returns `period.tz`: the company's timezone, used for date presets.
    const timeZone = (response.data as { period?: { tz?: unknown } } | null)?.period?.tz;
    if (timeZone) rememberReportTimeZone(timeZone);
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) handleSupportSessionRejection(error);
    return Promise.reject(error);
  },
);
