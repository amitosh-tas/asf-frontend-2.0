

import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import { useAppSelector } from "@/app/hooks";
import { getCompanyNavigation } from "@/config/navigation";

function DashboardLayout() {
  const user = useAppSelector((state) => state.auth.user);

  const items = user
    ? getCompanyNavigation(user.role)
    : [];
  return (
    <div className="flex min-h-dvh bg-page-background font-body cursor-default">
      <Sidebar items={items} />

      <main className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-10 md:pt-8 xl:px-14">
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout
