import axios from "axios";

interface ApiErrorResponse {
  message?: unknown;
  error?: unknown;
}

export function getRequestErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const responseMessage = error.response?.data?.message;
    const responseError = error.response?.data?.error;

    if (typeof responseMessage === "string") return responseMessage;
    if (typeof responseError === "string") return responseError;
    if (error.message) return error.message;
  }

  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

/** Structured fields the backend adds to some errors (e.g. `code`, `canForce`, `hint`, `connectorId`). */
export interface RequestErrorData {
  code?: string;
  message?: string;
  hint?: string;
  canForce?: boolean;
  connectorId?: string;
  provider?: string;
}

export function getRequestErrorData(error: unknown): RequestErrorData {
  if (axios.isAxiosError<RequestErrorData>(error) && error.response?.data && typeof error.response.data === "object") {
    return error.response.data;
  }
  return {};
}
