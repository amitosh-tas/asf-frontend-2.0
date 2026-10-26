export type UserRole = "platform_admin" | "company_admin" | "company_viewer";

export type Permission =
  | "dashboard:view"
  | "revenue:view"
  | "teams:view"
  | "teams:add"
  | "teams:edit"
  | "teams:delete"
  | "roles:manage";

const rolePermissions: Record<UserRole, Permission[]> = {
  platform_admin: [
    "dashboard:view",
    "revenue:view",
    "teams:view",
    "teams:add",
    "teams:edit",
    "teams:delete",
    "roles:manage",
  ],

  company_admin: [
    "dashboard:view",
    "revenue:view",
    "teams:view",
    "teams:add",
    "teams:edit",
  ],

  company_viewer: [
    "dashboard:view",
    "revenue:view",
    // "teams:view",
  ],
};

export function hasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return rolePermissions[role].includes(permission);
}