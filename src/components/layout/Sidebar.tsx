import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { SidebarItem } from "@/config/navigation";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/store/slices/authSlice";
import { logoutUser } from "@/services/authService";
import toast from "react-hot-toast";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import Button from "@/components/ui/Button";
import Title from "../ui/Title";

interface SidebarProps {
  companyName?: string;
  items: SidebarItem[];
}

function Sidebar({
  companyName,
  items,
}: SidebarProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          fixed left-4 top-4 z-0 flex h-10 items-center justify-center
          rounded-lg border border-border bg-card px-3 text-xs font-medium text-text
          transition-colors duration-150 hover:bg-hover
          md:hidden
          ${isOpen ? "" : "translate-x-0"}
        `}
      >
        {isOpen ? "Close" :  (<i className="fi fi-br-bars-sort flex items-center text-lg"></i>)}
      </button>

      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation backdrop"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
        />
      )}

      <aside className="relative z-40 w-0 shrink-0 md:w-64">
        <div
          className={`
            fixed inset-y-0 left-0 z-40 flex h-dvh w-60 flex-col
            overflow-hidden border-r border-border bg-sidebar text-sidebar-text
            transition-transform duration-200 ease-out md:sticky md:top-0 md:translate-x-0
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="shrink-0 border-b border-border px-5 pb-5 pt-6">
            <p className="font-heading text-lg font-semibold tracking-[-0.03em] text-sidebar-active">
              <Title/>
              <span className="text-text-muted">.</span>
            </p>
            {companyName && (
              <p className="mt-5 truncate text-xs font-medium text-sidebar-text">
                {companyName}
              </p>
            )}
          </div>

          <nav
            aria-label="Main navigation"
            className="
              min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4
            "
          >
            <div className="flex flex-col gap-1">
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end ?? (item.path === "/" || item.path === "/super")}
                  className={({ isActive }) =>
                    `
                      flex min-h-10 items-center rounded-lg px-3 py-2
                      text-sm font-medium transition-colors duration-150
                      ${isActive
                        ? "bg-neutral-100 text-sidebar-active"
                        : "text-sidebar-text hover:bg-neutral-100 hover:text-sidebar-active"}
                    `
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="shrink-0 border-t border-border p-4">
            <AccountComponent />
          </div>
        </div>
      </aside>
    </>
  );
}

function AccountComponent() {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Signed out successfully.");
    } catch (error) {
      console.error("Logout API failed:", error);
      toast.error(getRequestErrorMessage(error));
    } finally {
      dispatch(logout());
      navigate("/signin", { replace: true });
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <p className="truncate text-sm font-semibold text-sidebar-active">
        {user?.name}
      </p>

      <p className="truncate text-xs text-sidebar-text">
        {user?.email}
      </p>

      <span
        className="
          mt-2 w-max max-w-full truncate rounded-md
          border bg-white/10 border-white/20 px-2 py-1
          text-[10px] font-medium text-sidebar-text
        "
      >
        {user?.role}
      </span>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleLogout}
      >
        Sign out
      </Button>
    </div>
  );
}

export default Sidebar;