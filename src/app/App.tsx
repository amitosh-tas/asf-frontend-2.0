import { Routes, Route } from "react-router-dom";

import Notfound from "@/components/layout/Notfound";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SupportViewGate from "@/features/support/components/SupportViewGate";

import Testing from "@/test/Testing";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ScrollToTop from "@/components/ScrollToTop";

import Overview from "@/pages/company/Overview";
import Analytics from "@/pages/company/Analytics";
import Transactions from "@/pages/company/Transactions";
import Customers from "@/pages/company/Customers";
import Team from "@/pages/company/Team";
import Campaign from "@/pages/company/Campaign";
import Upcoming from "@/pages/company/Upcoming";
import Refunds from "@/pages/company/Refunds";
import Channels from "@/pages/insights/Channels";
import Journeys from "@/pages/insights/Journeys";
import Locations from "@/pages/insights/Locations";
import AdSpend from "@/pages/insights/AdSpend";
import Integrations from "@/pages/insights/Integrations";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import AcceptInvite from "@/pages/auth/AcceptInvite";
import SetupTwoFactor from "@/pages/auth/SetupTwoFactor";
import PlatformHealth from "@/pages/superAdmin/PlatformHealth";
import PlatformAuditLog from "@/pages/superAdmin/PlatformAuditLog";
import FxRates from "@/pages/superAdmin/FxRates";

import SignIn from "@/pages/auth/SignIn";
import Dashboard from "@/pages/superAdmin/Dashboard";
import Unauthorized from "@/pages/Unauthorized";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import SignUp from "@/pages/auth/SignUp";
import GuestRoute from "@/components/auth/GuestRoute";
import AccountInactive from "@/pages/AccountInactive";

import { useAppDispatch } from "@/app/hooks";
import { useEffect } from "react";
import Members from "@/pages/superAdmin/Members";
import Settings from "@/pages/superAdmin/Settings";
import A_Settings from "@/pages/company/Settings";
import Billing from "@/pages/company/Billing";
import CheckoutReturn from "@/pages/auth/CheckoutReturn";
import { restoreSession } from "@/services/restoreSession";
import { Toaster } from "react-hot-toast";
import Workspaces from "@/pages/superAdmin/Workspaces";
import WorkspaceById from "@/pages/superAdmin/WorkspaceById";
import Docs from "@/docs/Docs";

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

      <Toaster
        position="top-right"
        reverseOrder={true}
        toastOptions={{
          duration: 3500,
          style: {
            border: "1px solid #e5e5e5",
            borderRadius: "6px",
            background: "#ffffff",
            color: "#171717",
            fontSize: "13px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
          },
        }}
      />
    </>
  );
}

export default App;
