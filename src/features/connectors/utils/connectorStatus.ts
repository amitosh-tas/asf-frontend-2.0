import type { BadgeVariant } from "@/components/ui/Badge";
import type { Connector } from "../types";

export const GATEWAY_TYPES = ["stripe", "paypal", "razorpay"] as const;

export function isGatewayConnector(connector: Pick<Connector, "type">): boolean {
  return (GATEWAY_TYPES as readonly string[]).includes(connector.type);
}

const LABELS: Record<string, string> = {
  stripe: "Stripe",
  paypal: "PayPal",
  razorpay: "Razorpay",
  shopify: "Shopify",
  zenoti: "Zenoti",
  generic: "Generic webhook",
  woocommerce: "WooCommerce",
  square: "Square",
};

export function getConnectorLabel(type: string): string {
  return LABELS[type] ?? type;
}

export interface StatusInfo {
  label: string;
  variant: BadgeVariant;
  hint: string;
}

/** One plain-language status for a connector, including the "connected but no event yet" state. */
export function getStatusInfo(connector: Connector): StatusInfo {
  switch (connector.status) {
    case "healthy":
      return { label: "Healthy", variant: "success", hint: "Events are arriving and being processed." };
    case "failing":
      return { label: "Failing", variant: "danger", hint: "The last event failed. Open the event log to see why and replay it." };
    case "disabled":
      return { label: "Disconnected", variant: "neutral", hint: "This connector is off. Reconnect it to receive events again." };
    case "pending":
    default:
      return connector.connection?.awaitingFirstEvent || !connector.lastEventAt
        ? { label: "Waiting for first event", variant: "warning", hint: "Connected. Make a test payment to confirm events arrive." }
        : { label: "Pending", variant: "warning", hint: "Waiting for a successful event." };
  }
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function eventStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "processed":
      return "success";
    case "failed":
      return "danger";
    case "dead":
      return "danger";
    case "replaying":
    case "pending":
      return "warning";
    default:
      return "neutral";
  }
}

/** Human labels for the backend's health-check names. */
export const CHECK_LABELS: Record<string, string> = {
  signing_secret_stored: "Signing secret stored",
  first_event_received: "First event received",
  remote_webhook_active: "Webhook exists at the gateway",
  remote_url_matches: "Webhook points to this platform",
  remote_events_subscribed: "Required events subscribed",
  gateway_reachable: "Gateway reachable",
};
