import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Notfound from "@/components/layout/Notfound";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SupportViewGate from "@/features/support/components/SupportViewGate";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ScrollToTop from "@/components/ScrollToTop";
import Loader from "@/components/ui/Loader";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import GuestRoute from "@/components/auth/GuestRoute";

import { useAppDispatch } from "@/app/hooks";
import { restoreSession } from "@/services/restoreSession";
import { Toaster } from "react-hot-toast";

const Testing = lazy(() => import("@/test/Testing"));
const Overview = lazy(() => import("@/pages/company/Overview"));
const Analytics = lazy(() => import("@/pages/company/Analytics"));
const Transactions = lazy(() => import("@/pages/company/Transactions"));
const Customers = lazy(() => import("@/pages/company/Customers"));
const Team = lazy(() => import("@/pages/company/Team"));
const Campaign = lazy(() => import("@/pages/company/Campaign"));
const Upcoming = lazy(() => import("@/pages/company/Upcoming"));
const Refunds = lazy(() => import("@/pages/company/Refunds"));
const Channels = lazy(() => import("@/pages/insights/Channels"));
const Journeys = lazy(() => import("@/pages/insights/Journeys"));
const Locations = lazy(() => import("@/pages/insights/Locations"));
const AdSpend = lazy(() => import("@/pages/insights/AdSpend"));
const Integrations = lazy(() => import("@/pages/insights/Integrations"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("@/pages/auth/VerifyEmail"));
const AcceptInvite = lazy(() => import("@/pages/auth/AcceptInvite"));
const SetupTwoFactor = lazy(() => import("@/pages/auth/SetupTwoFactor"));
const PlatformHealth = lazy(() => import("@/pages/superAdmin/PlatformHealth"));
const PlatformAuditLog = lazy(() => import("@/pages/superAdmin/PlatformAuditLog"));
const FxRates = lazy(() => import("@/pages/superAdmin/FxRates"));
const SignIn = lazy(() => import("@/pages/auth/SignIn"));
const Dashboard = lazy(() => import("@/pages/superAdmin/Dashboard"));
const Unauthorized = lazy(() => import("@/pages/Unauthorized"));
const SignUp = lazy(() => import("@/pages/auth/SignUp"));
const AccountInactive = lazy(() => import("@/pages/AccountInactive"));
const Members = lazy(() => import("@/pages/superAdmin/Members"));
const Settings = lazy(() => import("@/pages/superAdmin/Settings"));
const A_Settings = lazy(() => import("@/pages/company/Settings"));
const Billing = lazy(() => import("@/pages/company/Billing"));
const CheckoutReturn = lazy(() => import("@/pages/auth/CheckoutReturn"));
const Workspaces = lazy(() => import("@/pages/superAdmin/Workspaces"));
const WorkspaceById = lazy(() => import("@/pages/superAdmin/WorkspaceById"));
const Docs = lazy(() => import("@/pages/docs/Docs"));
const Landing = lazy(() => import("@/pages/landing/Landing"));

function App() {

  const dispatch = useAppDispatch();

  useEffect(() => {
    const rs = async ()=> {
      await restoreSession(dispatch);
    }
    rs();
  }, [dispatch]);

  return (
    <>
      <ScrollToTop />

      <Suspense fallback={<Loader label="Loading page" />}>
      <Routes>
        {/* Company dashboard: company_admin and company_viewer */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["company_admin", "company_viewer"]} />
          }
        >
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="campaigns" element={<Campaign />} />
            <Route path="customers" element={<Customers />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="bookings" element={<Upcoming />} />
            <Route path="upcoming" element={<Upcoming />} />
            <Route path="channels" element={<Channels />} />
            <Route path="journeys" element={<Journeys />} />
            <Route path="locations" element={<Locations />} />
            <Route path="ad-spend" element={<AdSpend />} />
            <Route path="integrations" element={<Integrations />} />
          </Route>
        </Route>

        {/* Team: company_admin only */}
        <Route
          element={<ProtectedRoute allowedRoles={["company_admin"]} />}
        >
          <Route path="/" element={<DashboardLayout />}>
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<A_Settings />}/>
            <Route path="billing" element={<Billing />}/>
            <Route path="settings/billing" element={<Billing />}/>
          </Route>
        </Route>

        {/* Super Admin dashboard */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["platform_admin"]} />
          }
        >
          <Route path="/super" element={<SuperAdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="workspaces" element={<Workspaces/>} />
            <Route path="workspaces/:id" element={<WorkspaceById />}/>
            <Route path="workspaces/:id/view" element={<SupportViewGate />}>
              <Route index element={<Overview />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="campaigns" element={<Campaign />} />
              <Route path="customers" element={<Customers />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="refunds" element={<Refunds />} />
              <Route path="bookings" element={<Upcoming />} />
              <Route path="upcoming" element={<Upcoming />} />
              <Route path="channels" element={<Channels />} />
              <Route path="journeys" element={<Journeys />} />
              <Route path="locations" element={<Locations />} />
              <Route path="ad-spend" element={<AdSpend />} />
              <Route path="integrations" element={<Integrations />} />
            </Route>
            <Route path="health" element={<PlatformHealth />} />
            <Route path="audit-log" element={<PlatformAuditLog />} />
            <Route path="fx-rates" element={<FxRates />} />
            <Route path="members" element={<Members />} />
            <Route path="settings" element={<Settings />}/>
          </Route>
        </Route>

        {/* Public routes */}
        <Route
        element={<GuestRoute />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route path="/landing" element={<Landing/>} />

        {/* Reached from emailed links: work signed in or out */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-user" element={<VerifyEmail />} />
        <Route path="/verify-user/:token" element={<VerifyEmail />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
        <Route path="/billing/checkout-return" element={<CheckoutReturn />} />
        <Route path="/invite" element={<AcceptInvite />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />
        <Route path="/invites/accept" element={<AcceptInvite />} />
        {/* Platform admins without two-factor login land here (the API refuses everything else) */}
        <Route element={<ProtectedRoute allowedRoles={["platform_admin", "company_admin", "company_viewer"]} />}>
          <Route path="/setup-2fa" element={<SetupTwoFactor />} />
        </Route>
        <Route path="/docs" element={<Docs/>} />
        <Route path="/test" element={<Testing />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/account-inactive" element={<AccountInactive />} />

        {/* Fallback */}
        <Route path="*" element={<Notfound />} />
      </Routes>
      </Suspense>

      <Toaster
        position="top-right"
        reverseOrder={true}
        toastOptions={{
          duration: 3500,
          style: {
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            background: "var(--color-card)",
            color: "var(--color-text)",
            fontSize: "13px",
            boxShadow: "0 12px 32px rgba(22, 35, 24, 0.14)",
          },
        }}
      />
    </>
  );
}

export default App;
