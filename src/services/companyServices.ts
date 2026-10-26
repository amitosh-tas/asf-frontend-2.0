import { api } from "./api";

export interface ReportsParams {
  from: string;
  to: string;
  model?: string;
  locationId?: string;
  currency?: string;
  tz?: string;
}

export interface ReportPeriod {
  from: string;
  to: string;
}

export interface ReportsSummary {
  period: ReportPeriod;
  currency: string;
  model: string;
  revenue: {
    grossMinorUnits: string;
    discountsMinorUnits: string;
    refundsMinorUnits: string;
    netMinorUnits: string;
    averageOrderValueMinorUnits: string;
  };
  orders: {
    total: number;
    newCustomers: number;
    returningCustomers: number;
  };
  attribution: {
    attributedRevenueMinorUnits: string;
    coverageRate: number;
  };
  bookings: {
    total: number;
    scheduled: number;
    cancelled: number;
    bookedValueMinorUnits: string;
    cancellationRate: number;
  };
}

export interface ReportChannel {
  channel: string;
  orders: number;
  netMinorUnits: string;
  newCustomers: number;
  returningCustomers: number;
}

export interface ReportCampaign {
  channel: string;
  campaign: string;
  orders: number;
  netMinorUnits: string;
}

export interface ReportLocation {
  locationId: string | null;
  locationName: string;
  orders: number;
  netMinorUnits: string;
  newCustomers: number;
  returningCustomers: number;
}

export interface ReportTrendPoint {
  date: string;
  orders: number;
  netMinorUnits: string;
  newCustomers: number;
}

export interface ReportCustomerSummary {
  period: ReportPeriod;
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
  repeatRate: number;
}

export interface WorkspaceDashboard {
  period: ReportPeriod;
  currency: string;
  primaryRevenue: {
    totalRevenue: string;
    totalRevenueFormatted: string;
    exclTax: string;
    tax: string;
    invoicesCount: number;
    description: string;
  };
  kpis: {
    newCustomers: { value: number; label: string };
    returningCustomers: { value: number; label: string };
    retention: { percentage: number; detail: string };
    trackedVisits: { value: number; label: string };
  };
  revenueCards: {
    adAttributed: { value: string; formatted: string; subtext: string };
    directOrganic: { value: string; formatted: string; subtext: string };
    unattributed: { value: string; formatted: string; subtext: string };
    refunded: { value: string; formatted: string; subtext: string };
    avgOrderValue: {
      value: string;
      formatted: string;
      changePercent: number;
      trend: "up" | "down";
      subtext: string;
    };
  };
  revenueBySource: Array<{
    source: string;
    percentage: number;
    color: string;
    revenue: string;
    conversions: number;
  }>;
  revenueByPlatform: Array<{
    platform: string;
    badge: string;
    conversions: number;
    revenue: string;
    revenueMinorUnits: string;
    color: string;
  }>;
}

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  allowedLocationIds?: string[];
  lastLoginAt?: string | null;
  twoFactorEnabled?: boolean;
}

export interface TeamUsersResponse {
  data: TeamUser[];
  pendingInvites?: import("@/features/team/TeamAccess").PendingInvite[];
}

export interface CustomerRecord {
  id: string;
  email: string;
  firstSeenAt: string;
  firstPurchaseAt: string | null;
  lastPurchaseAt: string | null;
  externalIds: Record<string, unknown> | null;
}

export interface CustomersResponse {
  data: CustomerRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function getCustomers( page = 1) {
  return api.get<CustomersResponse>("/v1/customers", {
    params: { page }
  });
}

export async function getOrders() {
  return api.get<unknown>("/api/workspace/orders");
}

export async function getReportsSummary(params: ReportsParams) {
  return api.get<ReportsSummary>("/v1/reports/summary", { params });
}

export async function getReportChannels(params: ReportsParams) {
  return api.get<{ period: ReportPeriod; model: string; data: ReportChannel[] }>(
    "/v1/reports/channels",
    { params },
  );
}

export async function getReportCampaigns(params: ReportsParams) {
  return api.get<{ period: ReportPeriod; model: string; data: ReportCampaign[] }>(
    "/v1/reports/campaigns",
    { params },
  );
}

export async function getReportLocations(params: ReportsParams) {
  return api.get<{ period: ReportPeriod; data: ReportLocation[] }>(
    "/v1/reports/locations",
    { params },
  );
}

export async function getReportTrend(params: ReportsParams) {
  return api.get<{ period: ReportPeriod; tz: string; data: ReportTrendPoint[] }>(
    "/v1/reports/trend",
    { params },
  );
}

export async function getReportCustomers(params: ReportsParams) {
  return api.get<ReportCustomerSummary>("/v1/reports/customers", { params });
}

export async function getWorkspaceDashboard() {
  return api.get<WorkspaceDashboard>("/api/workspace/dashboard");
}

export async function getTeamUsers() {
  return api.get<TeamUsersResponse>("/api/workspace/team");
}

type TRole = "platform_admin" | "company_admin" | "company_viewer";
type TStatus = "invited" | "active" | "deactivated";

interface IAddMember {
  name: string;
  email: string;
  password: string;
  role: TRole;
  companyId?: string;
}

interface IUpdateUser {
  name: string;
  email: string;
  role: string;
  status: TStatus;
  reason?: string;
}

interface IUpdateUserProps {
  id: string;
  data: IUpdateUser;
}

export async function updateTeamUser(
  { id, data }: IUpdateUserProps
){
  if (!id.trim()) {
    throw new Error("A user ID is required to update a team member.");
  }
  return api.patch(`/api/user/${encodeURIComponent(id)}`, data)
}

export async function addTeamUser(
  data: IAddMember
){
  return api.post(`/api/user/add-member`, data);
}

export async function deleteTeamUser(
  userId: string
){
  return api.delete(`/api/user/${encodeURIComponent(userId)}`)
}

export async function getCustomerJourney(
  customerId: string
){
  return api.get(`/v1/customers/${customerId}/journey`);
}
export interface MergeCustomersResult {
  targetId: string;
  sourceId: string;
  moved: { orders: number; bookings: number; visitors: number };
  newVsReturningFlagsChanged: number;
  firstPurchaseAt: string | null;
  lastPurchaseAt: string | null;
}

/**
 * Merges a duplicate customer (source) into the customer to keep (target).
 * Orders, bookings and visits move to the target and new-vs-returning is recalculated.
 */
export async function mergeCustomers(sourceId: string, targetId: string) {
  return api.post<MergeCustomersResult>("/api/workspace/customers/merge", { sourceId, targetId });
}
