import { api } from "./api";
import type {
  CustomersResponse,
  ReportCampaign,
  ReportChannel,
  ReportCustomerSummary,
  ReportLocation,
  ReportTrendPoint,
  ReportsParams,
  ReportsSummary,
  WorkspaceDashboard,
} from "./companyServices";

export async function viewWorkspace(workspaceId: string) {
  return api.get(`/api/view/workspace/${workspaceId}`);
}

export async function viewCustomers(workspaceId: string, page = 1) {
  return api.get<CustomersResponse>(
    `/api/view/customers/workspace/${workspaceId}`,
    { params: { page } },
  );
}

export async function viewDashboard(workspaceId: string) {
  return api.get<WorkspaceDashboard>(`/api/view/workspace/${workspaceId}`);
}

export async function viewReportSummary(
  workspaceId: string,
  params: ReportsParams,
) {
  return api.get<ReportsSummary>(
    `/api/view/reports/summary/${workspaceId}`,
    { params },
  );
}

export async function viewReportChannels(
  workspaceId: string,
  params: ReportsParams,
) {
  return api.get<{ period: ReportsSummary["period"]; model: string; data: ReportChannel[] }>(
    `/api/view/reports/channels/${workspaceId}`,
    { params },
  );
}

export async function viewReportLocations(
  workspaceId: string,
  params: ReportsParams,
) {
  return api.get<{ period: ReportsSummary["period"]; data: ReportLocation[] }>(
    `/api/view/reports/locations/${workspaceId}`,
    { params },
  );
}

export async function viewReportCampaigns(
  workspaceId: string,
  params: ReportsParams,
) {
  return api.get<{ period: ReportsSummary["period"]; model: string; data: ReportCampaign[] }>(
    `/api/view/reports/campaigns/${workspaceId}`,
    { params },
  );
}

export async function viewReportTrend(
  workspaceId: string,
  params: ReportsParams,
) {
  return api.get<{ period: ReportsSummary["period"]; tz: string; data: ReportTrendPoint[] }>(
    `/api/view/reports/trends/${workspaceId}`,
    { params },
  );
}

export async function viewReportCustomers(
  workspaceId: string,
  params: ReportsParams,
) {
  return api.get<ReportCustomerSummary>(
    `/api/view/reports/customers/${workspaceId}`,
    { params },
  );
}

export async function viewTransactions(workspaceId: string) {
  return api.get(`/api/view/transactions/workspace/${workspaceId}`);
}

export async function viewUpcoming(workspaceId: string) {
  return api.get(`/api/view/upcoming/workspace/${workspaceId}`);
}