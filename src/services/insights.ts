/**
 * Typed client for every report and list of the backend (scope section 5).
 *
 * The same screens serve a company user (cookie session, /v1/reports/*, /api/workspace/*) and a
 * platform admin inside a support session ("view as", /api/view/.../:workspaceId). Pass the
 * workspaceId from the route only in the second case.
 */

import { api } from "./api";

export type AttributionModel = "first_touch" | "last_touch" | "last_non_direct" | "linear" | "time_decay" | "position_based";

export const ATTRIBUTION_MODELS: { value: AttributionModel; label: string }[] = [
  { value: "last_non_direct", label: "Last non-direct" },
  { value: "last_touch", label: "Last touch" },
  { value: "first_touch", label: "First touch" },
  { value: "linear", label: "Linear" },
  { value: "time_decay", label: "Time decay" },
  { value: "position_based", label: "Position based (40/20/40)" },
];

export interface ReportQuery {
  from?: string;
  to?: string;
  model?: AttributionModel;
  locationId?: string;
  channel?: string;
  campaign?: string;
  currency?: string;
  refundsBy?: "refund_date" | "order_date";
  compare?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface ReportMeta {
  period: { from: string; to: string; fromDay: string; toDay: string; tz: string };
  tz: string;
  currency: string;
  model: AttributionModel;
  lastUpdated: string;
  warnings?: string[];
}

export interface MatchMethodRow {
  matchMethod: "token" | "visitor_id" | "click_id" | "email" | "phone" | "none";
  orders: number;
  revenueMinorUnits: string;
  share: number;
}

export interface SummaryBlock {
  revenue: {
    grossMinorUnits: string;
    discountsMinorUnits: string;
    taxMinorUnits: string;
    refundsMinorUnits: string;
    netMinorUnits: string;
    realizedMinorUnits: string;
    averageOrderValueMinorUnits: string;
    newCustomerRevenueMinorUnits: string;
  };
  orders: { total: number; newCustomers: number; returningCustomers: number; unidentifiedOrders: number; repeatRate: number; refundCount: number };
  attribution: { model: AttributionModel; attributedRevenueMinorUnits: string; coverageRate: number; matchedRevenueMinorUnits: string; byMatchMethod: MatchMethodRow[] };
  bookings: {
    total: number;
    scheduled: number;
    cancelled: number;
    noShow: number;
    completed: number;
    bookedValueMinorUnits: string;
    cancellationRate: number;
    noShowRate: number;
    averageLeadTimeHours: number | null;
    newGuests: number;
  };
}

export type Changes = Record<"netRevenue" | "grossRevenue" | "orders" | "averageOrderValue" | "newCustomers" | "returningCustomers" | "repeatRate" | "coverage", number | null>;

export interface SummaryReport extends ReportMeta, SummaryBlock {
  previous: SummaryBlock & { period: ReportMeta["period"] };
  changes: Changes;
}

export interface ChannelRow {
  channel: string;
  label: string;
  color: string;
  orders: number;
  netMinorUnits: string;
  refundsMinorUnits: string;
  newCustomers: number;
  returningCustomers: number;
  averageOrderValueMinorUnits: string;
  spendMinorUnits: string | null;
  cacMinorUnits: string | null;
  roas: number | null;
  averageDaysToConvert: number | null;
}

export interface ChannelsReport extends ReportMeta {
  source: "rollups" | "live";
  data: ChannelRow[];
  comparison?: { models: AttributionModel[]; data: Array<{ channel: string } & Record<AttributionModel, string>> };
}

export interface CampaignRow {
  channel: string;
  label: string;
  campaign: string;
  orders: number;
  netMinorUnits: string;
  newCustomers: number;
  spendMinorUnits: string | null;
  cacMinorUnits: string | null;
  roas: number | null;
}

export interface LocationRow {
  rank: number;
  locationId: string | null;
  locationName: string;
  timezone: string;
  orders: number;
  netMinorUnits: string;
  newCustomers: number;
  returningCustomers: number;
  bookings: number;
  bookedValueMinorUnits: string;
  topSources: { channel: string; netMinorUnits: string }[];
  spendMinorUnits: string | null;
  cacMinorUnits: string | null;
}

export interface TrendPoint {
  date: string;
  orders: number;
  grossMinorUnits: string;
  refundsMinorUnits: string;
  netMinorUnits: string;
  newCustomers: number;
  bookings: number;
}

export interface TrendReport extends ReportMeta {
  data: TrendPoint[];
  previous: { date: string; previousDate: string | null; netMinorUnits: string; orders: number }[];
}

export interface CustomersReport extends ReportMeta {
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
  repeatRate: number;
  newCustomerRevenueMinorUnits: string;
  trend: { date: string; newCustomers: number; returningCustomers: number }[];
  cohorts: { cohort: string; customers: number; revenueMinorUnits: string; repeatRateByMonth: { month: number; rate: number }[] }[];
  ltvByChannel: { channel: string; label: string; customers: number; lifetimeRevenueMinorUnits: string; averageLtvMinorUnits: string; averageOrders: number }[];
}

export interface CacReport extends ReportMeta {
  spendAvailable: boolean;
  spendMinorUnits: string;
  newCustomers: number;
  blendedCacMinorUnits: string | null;
  attributedRevenueMinorUnits: string;
  roas: number | null;
  bookingsCreated: number;
  costPerBookingMinorUnits: string | null;
  byChannel: { channel: string; label: string; spendMinorUnits: string; newCustomers: number; cacMinorUnits: string | null; netMinorUnits: string; roas: number | null }[];
  payback: { monthsSinceAcquisition: number; cumulativeRevenuePerCustomerMinorUnits: string }[];
  paybackMonths: number | null;
  definition: string;
}

export interface SpendReport extends ReportMeta {
  spendAvailable: boolean;
  totalSpendMinorUnits: string;
  impressions: number;
  clicks: number;
  byPlatform: { platform: string; spendMinorUnits: string }[];
  campaigns: { platform: string; channel: string; campaign: string; spendMinorUnits: string; impressions: number; clicks: number; ctr: number | null; cpcMinorUnits: string | null }[];
  trend: { date: string; spendMinorUnits: string; netMinorUnits: string }[];
}

export interface BookingsReport extends ReportMeta {
  total: number;
  scheduled: number;
  cancelled: number;
  noShow: number;
  completed: number;
  bookedValueMinorUnits: string;
  cancellationRate: number;
  noShowRate: number;
  averageLeadTimeHours: number | null;
  newGuests: number;
  statusMix: Record<string, number>;
  pipeline: { created: number; completed: number; paid: number; bookedValueMinorUnits: string; realizedRevenueMinorUnits: string; completionRate: number; paidRate: number };
  byChannel: { channel: string; label: string; created: number; bookedValueMinorUnits: string; cancellationRate: number; noShowRate: number; averageLeadTimeHours: number | null; paid: number }[];
}

export interface JourneysReport extends ReportMeta {
  paths: { path: string; steps: string[]; orders: number; revenueMinorUnits: string }[];
  averageTouches: number | null;
  averageDaysToPurchase: number | null;
  journeysWithTouches: number;
  assisted: { channel: string; assistedOrders: number; assistedRevenueMinorUnits: string }[];
}

export interface CoverageReport extends ReportMeta {
  coverageRate: number;
  matchedRevenueMinorUnits: string;
  byMatchMethod: MatchMethodRow[];
  unattributedReasons: { reason: string; orders: number; revenueMinorUnits: string }[];
  trend: { date: string; coverageRate: number }[];
}

export interface DataQualityReport extends ReportMeta {
  checks: { key: string; label: string; count: number; share?: number; sample?: Record<string, unknown>[] }[];
}

export interface Alert {
  type: "connector_failing" | "no_events_24h" | "coverage_dropped";
  severity: "high" | "medium";
  message: string;
}

export interface UpcomingBookings {
  period: { from: string; to: string; tz: string };
  model: AttributionModel;
  days: number;
  count: number;
  bookedValueMinorUnits: string;
  currency: string | null;
  byDay: GroupRow[];
  byWeek: GroupRow[];
  byLocation: GroupRow[];
  byService: GroupRow[];
  bySource: GroupRow[];
  data: BookingRow[];
  lastUpdated: string;
}

export interface GroupRow {
  key: string;
  count: number;
  bookedValueMinorUnits: string;
  newGuests: number;
}

export interface BookingRow {
  id: string;
  externalId: string;
  status: string;
  serviceName: string | null;
  currency: string;
  bookedValueMinorUnits: string;
  appointmentStartAt: string;
  appointmentLocalDate: string | null;
  bookedAt: string;
  leadTimeHours: number;
  locationName: string | null;
  guestType: "new" | "returning" | "unknown";
  source: string;
  campaign: string | null;
  matchMethod: string;
}

export interface OrderRow {
  id: string;
  externalId: string;
  status: string;
  orderedAt: string;
  customerId: string | null;
  customerEmail: string | null;
  locationName: string | null;
  items: string[];
  currency: string;
  grossMinorUnits: string;
  discountMinorUnits: string;
  taxMinorUnits: string;
  netMinorUnits: string;
  refundedMinorUnits: string;
  source: string;
  campaign: string | null;
  matchMethod: string;
  attributionReason: string | null;
  customerType: "new" | "returning" | "unknown";
  bookingId: string | null;
}

export interface Page<T> {
  data: T[];
  pagination: { page?: number; limit: number; total: number; pages?: number; nextCursor: string | null };
  lastUpdated?: string;
}

export interface RefundRow {
  id: string;
  externalId: string | null;
  refundedAt: string;
  amountMinorUnits: string;
  currency: string;
  reason: string | null;
  orderId: string;
  orderExternalId: string | null;
  orderedAt: string | null;
  orderNetMinorUnits: string | null;
  customerId: string | null;
  locationName: string | null;
  source: string;
  campaign: string | null;
  model: string;
}

export interface OrderAttribution {
  orderId: string;
  externalId: string;
  status: string;
  orderedAt: string;
  currency: string;
  netMinorUnits: string;
  refundedMinorUnits: string;
  matchMethod: string;
  attributionReason: string | null;
  isNewCustomer: boolean;
  bookingId: string | null;
  items: { name: string; quantity: number; totalMinorUnits: string; currency: string }[];
  journey: { id: string; touchedAt: string; channel: string; source: string | null; medium: string | null; campaign: string | null; referrer: string | null; landingPage: string | null; clickId: string | null }[];
  refunds: { id: string; amountMinorUnits: string; currency: string; refundedAt: string; reason: string | null }[];
  attribution: Record<AttributionModel, { touchId: string | null; channel: string; campaign: string | null; share: number; amountMinorUnits: string; reasonCode: string | null }[]>;
}

export type ReportName =
  | "summary" | "channels" | "campaigns" | "locations" | "trend" | "customers" | "cac" | "spend"
  | "bookings" | "journeys" | "coverage" | "data-quality" | "dashboard";

const VIEW_PATH: Partial<Record<ReportName, string>> = { trend: "trends" };

export function reportUrl(name: ReportName, workspaceId?: string) {
  if (workspaceId) return name === "dashboard" ? `/api/view/workspace/${workspaceId}` : `/api/view/reports/${VIEW_PATH[name] ?? name}/${workspaceId}`;
  return `/api/workspace/reports/${name}`;
}

const clean = (q: ReportQuery) => Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== "" && v !== false));

export async function fetchReport<T>(name: ReportName, query: ReportQuery, workspaceId?: string) {
  const { data } = await api.get<T>(reportUrl(name, workspaceId), { params: clean(query) });
  return data;
}

/** Download any report or list as CSV (the backend renders it with format=csv). */
export async function downloadCsv(url: string, query: ReportQuery, filename: string) {
  const response = await api.get<Blob>(url, { params: { ...clean(query), format: "csv" }, responseType: "blob" });
  const href = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export const listUrl = {
  orders: (workspaceId?: string) => (workspaceId ? `/api/view/transactions/workspace/${workspaceId}` : "/api/workspace/orders"),
  refunds: (workspaceId?: string) => (workspaceId ? `/api/view/refunds/workspace/${workspaceId}` : "/api/workspace/refunds"),
  bookings: (workspaceId?: string) => (workspaceId ? `/api/view/bookings/workspace/${workspaceId}` : "/api/workspace/bookings"),
  upcoming: (workspaceId?: string) => (workspaceId ? `/api/view/upcoming/workspace/${workspaceId}` : "/api/workspace/upcoming"),
  customers: (workspaceId?: string) => (workspaceId ? `/api/view/customers/workspace/${workspaceId}` : "/api/workspace/customers"),
  alerts: (workspaceId?: string) => (workspaceId ? `/api/view/alerts/${workspaceId}` : "/api/workspace/alerts"),
  orderAttribution: (orderId: string, workspaceId?: string) =>
    workspaceId ? `/api/view/orders/${orderId}/attribution/${workspaceId}` : `/api/workspace/orders/${orderId}/attribution`,
  journey: (customerId: string, workspaceId?: string) =>
    workspaceId ? `/api/view/customers/${customerId}/journey/${workspaceId}` : `/api/workspace/customers/${customerId}/journey`,
};

export async function fetchList<T>(url: string, query: ReportQuery) {
  const { data } = await api.get<T>(url, { params: clean(query) });
  return data;
}

export async function fetchAlerts(workspaceId?: string) {
  const { data } = await api.get<{ data: Alert[] }>(listUrl.alerts(workspaceId));
  return data.data;
}

export async function fetchOrderAttribution(orderId: string, workspaceId?: string) {
  const { data } = await api.get<OrderAttribution>(listUrl.orderAttribution(orderId, workspaceId));
  return data;
}

export const CHANNEL_LABELS: Record<string, string> = {
  google: "Google", meta: "Meta", tiktok: "TikTok", bing: "Microsoft Ads", linkedin: "LinkedIn", snapchat: "Snapchat",
  affiliate: "Affiliate", email: "Email", sms: "SMS", organic_search: "Organic search", organic_social: "Organic social",
  referral: "Referral", direct: "Direct", direct_unknown: "Direct / unknown", paid_other: "Other paid",
};
export const channelLabel = (channel: string) => CHANNEL_LABELS[channel] ?? channel;

export const MATCH_LABELS: Record<string, string> = {
  token: "Checkout token", visitor_id: "Visitor ID", click_id: "Click ID", email: "Email", phone: "Phone", none: "Not matched",
};

export const REASON_LABELS: Record<string, string> = {
  no_identifiers: "No token, email, phone or click ID was sent",
  no_tracked_visits: "Customer known, but no tracked visits",
  token_not_found: "Checkout token not recognised",
  token_expired: "Checkout token expired",
  token_already_used: "Checkout token already used by another order",
  token_without_touches: "Token had no visits frozen in it",
  outside_lookback: "Visits were older than the lookback window",
  unknown_visitor: "Visitor ID never seen",
  booking_unattributed: "The booking it pays had no source",
  no_source_found: "No source found",
};
