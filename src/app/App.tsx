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
// import Upcoming from "@/pages/company/Upcoming";

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
            {/* <Route path="upcoming" element={<Upcoming />} /> */}
          </Route>
        </Route>

        {/* Team: company_admin only */}
        <Route
          element={<ProtectedRoute allowedRoles={["company_admin"]} />}
        >
          <Route path="/" element={<DashboardLayout />}>
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<A_Settings />}/>
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
              {/* <Route path="upcoming" element={<Upcoming />} /> */}
            </Route>
            <Route path="members" element={<Members />} />
            <Route path="settings" element={<Settings />}/>
          </Route>
        </Route>

        {/* Public routes */}
        <Route
        element={<GuestRoute />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
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
