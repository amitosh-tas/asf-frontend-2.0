import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  setCredentials,
  type UserRole,
} from "@/store/slices/authSlice";

// Keep your existing testUsers object
const testUsers: Record<UserRole, {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}> = {
  platform_admin: {
    id: "test-super-admin",
    name: "Test Super Admin",
    email: "superadmin@test.local",
    role: "platform_admin",
  },
  company_admin: {
    id: "test-admin",
    name: "Test Admin",
    email: "admin@test.local",
    role: "company_admin",
  },
  company_viewer: {
    id: "test-viewer",
    name: "Test Viewer",
    email: "viewer@test.local",
    role: "company_viewer",
  },
};

export default function RoleSwitcher() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const currentRole = useAppSelector(
    (state) => state.auth.user?.role ?? "company_admin",
  );

  function switchRole(role: UserRole) {
    dispatch(setCredentials(testUsers[role]));

    if (role === "platform_admin") {
      navigate("/super");
    } else {
      navigate("/");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <div>
        <p className="text-xs text-text-muted">DEV MODE · TEST USER</p>
        <p className="text-sm font-medium text-text">
          {testUsers[currentRole].name}
        </p>
      </div>

      <select
        value={currentRole}
        onChange={(event) =>
          switchRole(event.target.value as UserRole)
        }
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label="Switch test role"
      >
        <option value="platform_admin">Super Admin</option>
        <option value="company_admin">Admin</option>
        <option value="company_viewer">Viewer</option>
      </select>
    </div>
  );
}