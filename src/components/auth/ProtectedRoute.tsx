import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import type { UserRole } from "@/store/slices/authSlice";

import "@/app/loader.css"

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const user = useAppSelector((state) => state.auth.user);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const location = useLocation();

  // Wait until authentication/session restoration finishes
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center
      bg-page-background
      ">
        {/* <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600" /> */}
        <span className="loader"></span>
      </div>
    );
  }

  // Not logged in: remember the route they wanted
  if (!user) {
    if (location.pathname === "/") {
      return <Navigate to="/landing" replace />;
    }

    return (
      <Navigate
        to="/signin"
        state={{ from: location }}
        replace
      />
    );
  }

  const accountStatus = user.status?.toLowerCase();
  if (accountStatus === "inactive" || accountStatus === "deactivated") {
    return <Navigate to="/account-inactive" replace />;
  }

  // console.log(location)

  // Platform admins must use two-factor login before anything else (scope 4.9).
  if (user.mfaPending && location.pathname !== "/setup-2fa") {
    return <Navigate to="/setup-2fa" replace />;
  }

  if(user.role === "platform_admin" && location.pathname === "/"){
    return <Navigate to="/super" replace />
  }

  if (
    user.role === "company_admin" &&
    user.workspace?.status === "pending" &&
    location.pathname !== "/billing" &&
    location.pathname !== "/settings/billing"
  ) {
    return <Navigate to="/billing?onboarding=1" replace />;
  }

  // Logged in, but role is not permitted
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Authorized: stay on the requested URL
  return <Outlet />;
}

export default ProtectedRoute;
