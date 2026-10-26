import { api } from "./api";
import type {
  BulkReplayResult,
  ConnectResult,
  Connector,
  ConnectorEventsPage,
  DisconnectResult,
  GatewayCatalog,
  GatewayType,
  ReplayOutcome,
  VerifyResult,
} from "@/features/connectors/types";

const base = "/api/workspace/connectors";
const path = (id: string, suffix = "") => `${base}/${encodeURIComponent(id)}${suffix}`;

// ── Legacy / manual connectors (Shopify, Zenoti, generic, older Stripe & Razorpay setups) ──

export interface ConnectorCredentials {
  type: string;
  name: string;
  config: {
    webhookSecret?: string;
  };
}

export async function sendConnectors(credentials: ConnectorCredentials) {
  return api.post(base, credentials);
}

export async function getConnectors() {
  return api.get(base);
}

export async function updateConnector(id: string, credentials: ConnectorCredentials) {
  return api.patch(path(id), credentials);
}

/** Only works for connectors that never received data; otherwise the API answers 409 connector_has_data. */
export async function deleteConnector(id: string) {
  return api.delete(path(id));
}

// ── One-click gateway connect (Stripe, PayPal, Razorpay) ────────────────────

export async function getGatewayCatalog() {
  return api.get<GatewayCatalog>(`${base}/gateways`);
}

/**
 * Credentials are sent to the backend and never kept by the frontend:
 *   stripe   { secretKey }                              (used once to create the webhook; not stored)
 *   paypal   { environment, clientId, clientSecret }
 *   razorpay {}                                         (the response carries a one-time secret)
 */
export async function connectGateway(input: {
  type: GatewayType;
  name?: string;
  credentials: Record<string, string>;
}) {
  return api.post<ConnectResult>(`${base}/connect`, input);
}

export async function reconnectConnector(id: string, credentials: Record<string, string>) {
  return api.post<ConnectResult>(path(id, "/reconnect"), { credentials });
}

export async function disconnectConnector(
  id: string,
  options: { credentials?: Record<string, string>; force?: boolean } = {},
) {
  return api.post<DisconnectResult>(path(id, "/disconnect"), options);
}

export async function verifyConnector(id: string, credentials?: Record<string, string>) {
  return api.post<VerifyResult>(path(id, "/verify"), credentials ? { credentials } : {});
}

// ── Event log and replay ────────────────────────────────────────────────────

export async function getConnectorEvents(id: string, params: { page?: number; limit?: number; status?: string } = {}) {
  return api.get<ConnectorEventsPage>(path(id, "/events"), { params });
}

export async function getConnectorEvent(id: string, eventId: string) {
  return api.get<{ id: string; payload: unknown }>(path(id, `/events/${encodeURIComponent(eventId)}`));
}

export async function replayConnectorEvent(id: string, eventId: string, force = false) {
  return api.post<ReplayOutcome & { message: string }>(path(id, `/events/${encodeURIComponent(eventId)}/replay`), { force });
}

export async function replayFailedConnectorEvents(id: string, limit = 25) {
  return api.post<BulkReplayResult>(path(id, "/events/replay-failed"), { limit });
}

export type { Connector };
