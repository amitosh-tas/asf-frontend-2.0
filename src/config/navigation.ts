import type { UserRole } from "@/store/slices/authSlice";

export interface SidebarItem {
  label: string;
  path: string;
  end?: boolean;
}

export const companyNavigation: SidebarItem[] = [
  { label: "Dashboard", path: "/" },
  { label: "Analytics", path: "/analytics" },
  { label: "Campaign", path: "/campaigns" },
  { label: "Customers", path: "/customers" },
  { label: "Transactions", path: "/transactions" },
  // { label: "Upcoming", path: "/upcoming" },
  { label: "Team", path: "/team" },
  { label: "Settings", path: "/settings"},
  { label: "API Docs", path: "/docs" }
];

export const superAdminNavigation: SidebarItem[] = [
  { label: "Dashboard", path: "/super" },
  { label: "Workspaces", path: "/super/workspaces" },
  { label: "Members", path: "/super/members" },
  { label: "Settings", path: "/super/settings" },
  // { label: "Api Keys", path: "/super/api-keys" }
];

export function getCompanyNavigation(role: UserRole) {
  if (role === "company_viewer") {
    return companyNavigation.filter((item) => item.path !== "/team" && item.path !== "/settings");
  }

  return companyNavigation;
}