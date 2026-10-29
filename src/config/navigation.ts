import type { UserRole } from "@/store/slices/authSlice";

export interface SidebarItem {
  label: string;
  path: string;
  end?: boolean;
  /** shown to company admins only */
  adminOnly?: boolean;
  /** not available while a platform admin views a company */
  companyOnly?: boolean;
}

// Section 5 of the scope: one screen per area.
export const companyNavigation: SidebarItem[] = [
  { label: "Overview", path: "/" },
  { label: "Channels", path: "/channels" },
  { label: "Campaigns", path: "/campaigns" },
  { label: "Journeys", path: "/journeys" },
  { label: "Customers", path: "/customers" },
  { label: "Orders", path: "/transactions" },
  { label: "Refunds", path: "/refunds" },
  { label: "Bookings", path: "/bookings" },
  { label: "Locations", path: "/locations" },
  { label: "Ad spend & CAC", path: "/ad-spend" },
  { label: "Analytics", path: "/analytics" },
  { label: "Integrations", path: "/integrations" },
  { label: "Team", path: "/team", adminOnly: true, companyOnly: true },
  { label: "Settings", path: "/settings", adminOnly: true, companyOnly: true },
  { label: "Billing", path: "/settings/billing", adminOnly: true, companyOnly: true },
  { label: "API Docs", path: "/docs", companyOnly: true },
];

export const superAdminNavigation: SidebarItem[] = [
  { label: "Dashboard", path: "/super" },
  { label: "Platform health", path: "/super/health" },
  { label: "Workspaces", path: "/super/workspaces" },
  { label: "Members", path: "/super/members" },
  { label: "Audit log", path: "/super/audit-log" },
  { label: "FX rates", path: "/super/fx-rates" },
  { label: "Settings", path: "/super/settings" },
];

export function getCompanyNavigation(role: UserRole) {
  return companyNavigation.filter((item) => role === "company_admin" || !item.adminOnly);
}

/** Navigation for a platform admin viewing a company (read-only screens only). */
export function getViewNavigation(basePath: string) {
  return companyNavigation
    .filter((item) => !item.companyOnly)
    .map((item) => ({ ...item, path: item.path === "/" ? basePath : `${basePath}${item.path}`, end: item.path === "/" }));
}
