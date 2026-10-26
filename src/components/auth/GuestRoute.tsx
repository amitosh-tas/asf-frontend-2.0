import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";

function GuestRoute() {
  const { isAuthenticated, user } = useAppSelector(
    (state) => state.auth
  );

  if (isAuthenticated) {
    const destination =
      user?.role === "platform_admin" ? "/super" : "/";

    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}

export default GuestRoute;