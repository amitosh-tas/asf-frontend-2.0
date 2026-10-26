export type GatewayType = "stripe" | "paypal" | "razorpay";
export type ConnectionMode = "auto" | "manual";

/** Connection details the backend adds for gateway connectors it manages. */
export interface ConnectorConnection {
  gateway: GatewayType;
  mode: ConnectionMode | null;
  environment: string | null;
  accountId: string | null;
  businessName: string | null;
  enabledEvents: string[];
  connectedAt: string | null;
  reconnectedAt: string | null;
  disconnectedAt: string | null;
  awaitingFirstEvent: boolean;
}

export interface Connector {
  id: string;
  publicId?: string;
  type: string;
  name: string;
  status?: string;
  errorCount?: number;
  lastError?: string | null;
  lastEventAt?: string | null;
  lastErrorAt?: string | null;
  createdAt?: string;
  webhookUrl?: string;
  /** null for connectors created the old manual way (Shopify, Zenoti, generic, legacy Stripe/Razorpay). */
  connection?: ConnectorConnection | null;
}

// ── Gateway catalog (GET /api/workspace/connectors/gateways) ────────────────

export interface GatewayField {
  name: string;
  label: string;
  type: "text" | "password" | "select";
  required?: boolean;
  options?: string[];
  help?: string;
}

export interface GatewayCatalogEntry {
  type: GatewayType;
  label: string;
  mode: ConnectionMode;
  events: string[];
  fields: GatewayField[];
  notes: string[];
}

export interface GatewayCatalog {
  /** false when the server's public URL is not a public HTTPS address; `problem` says why. */
  ready: boolean;
  problem: string | null;
  webhookBase: string;
  data: GatewayCatalogEntry[];
}

// ── Connect / reconnect / disconnect / verify ───────────────────────────────

/** Razorpay only: shown exactly once, never retrievable again. */
export interface ManualSetupReveal {
  webhookUrl: string;
  webhookSecret: string;
  events: string[];
  optionalEvents: string[];
  steps: string[];
}

export interface ConnectResult extends Connector {
  connected: boolean;
  mode: ConnectionMode;
  message?: string;
  setup: ManualSetupReveal | null;
  previousWebhookRemoved?: boolean | null;
}

export interface DisconnectResult extends Connector {
  alreadyDisconnected?: boolean;
  remoteWebhook?: { removed: boolean; reason: string | null };
  manualSteps?: string[];
}

export interface VerifyCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface VerifyResult {
  status: string;
  lastEventAt: string | null;
  errorCount: number;
  lastError: string | null;
  ok: boolean;
  awaitingFirstEvent: boolean;
  checks: VerifyCheck[];
}

// ── Event log ───────────────────────────────────────────────────────────────

export type ConnectorEventStatus = "pending" | "processed" | "failed" | "replaying" | "dead" | string;

export interface ConnectorEvent {
  id: string;
  source: string;
  eventType: string;
  status: ConnectorEventStatus;
  error: string | null;
  replayCount: number;
  receivedAt: string;
  processedAt: string | null;
  hasPayload: boolean;
}

export interface ConnectorEventsPage {
  data: ConnectorEvent[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface ReplayOutcome {
  eventId: string;
  status: string;
  replayCount?: number;
  error?: string | null;
}

export interface BulkReplayResult {
  attempted: number;
  processed: number;
  stillFailing: number;
  dead: number;
  results: ReplayOutcome[];
}

/** Used by the legacy setup modal for connectors created the manual way. */
export interface ConnectorSetup {
  providerType: string;
  webhookUrl: string;
}
