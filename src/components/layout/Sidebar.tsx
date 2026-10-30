import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { SidebarItem } from "@/config/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/store/slices/authSlice";
import { logoutUser } from "@/services/authService";
import toast from "react-hot-toast";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PlanCards from "@/features/billing/components/PlanCards";
import {
  createCheckout,
  getWorkspacePlans,
  type BillingInterval,
  type Plan,
} from "@/services/billingService";
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
            isolate border-r border-border bg-sidebar text-sidebar-text
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
            <AccountComponent key={location.pathname} />
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
  const currentPlan = user?.workspace?.plan;
  const [menuOpen, setMenuOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isFreePlan = currentPlan?.trim().toLowerCase() === "free";
  const userName = user?.name?.trim() || "Account";
  const initials = getInitials(userName);
  const planLabel = formatPlanName(currentPlan);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

      const menuItems = menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]',
      );
      if (!menuItems?.length) return;
      event.preventDefault();
      const currentIndex = Array.from(menuItems).indexOf(
        document.activeElement as HTMLButtonElement,
      );
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex =
        currentIndex < 0
          ? 0
          : (currentIndex + direction + menuItems.length) % menuItems.length;
      menuItems[nextIndex]?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  async function openUpgrade() {
    setMenuOpen(false);
    setUpgradeOpen(true);
    setUpgradeError("");
    if (plans.length > 0) return;

    setPlansLoading(true);
    try {
      setPlans(await getWorkspacePlans());
    } catch (error) {
      setUpgradeError(getRequestErrorMessage(error));
    } finally {
      setPlansLoading(false);
    }
  }

  async function upgrade(tier: string) {
    setBusyTier(tier);
    setUpgradeError("");
    try {
      const { checkoutUrl } = await createCheckout(tier, interval);
      window.location.assign(checkoutUrl);
    } catch (error) {
      setUpgradeError(getRequestErrorMessage(error));
      setBusyTier(null);
    }
  }

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
    <div ref={accountRef} className="relative">
      <button
        type="button"
        ref={triggerRef}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={`Open account menu for ${userName}`}
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white"
        >
          {initials}
        </span>
        <span className="min-w-0 flex-1 ">
          <span className="flex min-w-0  flex-col">
            <span className="truncate text-sm font-semibold text-sidebar-active">
              {userName}
            </span>
            {planLabel && (
              <span className="shrink-0px-1.5 text-[10px] font-medium text-sidebar-active/70">
                {planLabel}
              </span>
            )}
          </span>
        </span>
        <i
          className={`fi fi-rr-angle-small-${menuOpen ? "up" : "down"} shrink-0 text-xs text-sidebar-text`}
          aria-hidden="true"
        />
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account menu"
          className="absolute bottom-[calc(100%+0.5rem)] left-0 z-[60] w-[calc(100vw-2rem)] max-w-72 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-xl"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-text">{userName}</p>
            <p className="mt-0.5 truncate text-xs text-text-muted">{user?.email}</p>
            {planLabel && (
              <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-text">
                {planLabel} plan
              </span>
            )}
          </div>
          {isFreePlan && (
            <button
              type="button"
              role="menuitem"
              onClick={() => void openUpgrade()}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-text transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Upgrade plan
            </button>
          )}
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleLogout()}
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-text transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Sign out
          </button>
        </div>
      )}

      <Modal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Upgrade your plan"
        description="Choose a plan to unlock higher limits and premium features."
        size="xl"
      >
        {upgradeError && <p role="alert" className="mb-4 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2.5 text-sm text-danger">{upgradeError}</p>}
        <div className="mb-5 flex gap-2">
          {(["monthly", "annually"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={interval === value ? "primary" : "outline"}
              onClick={() => setInterval(value)}
            >
              {value === "monthly" ? "Monthly" : "Annually"}
            </Button>
          ))}
        </div>
        {plansLoading ? (
          <p className="text-sm text-text-muted">Loading plans...</p>
        ) : (
          <PlanCards
            plans={plans}
            interval={interval}
            selectedTier={currentPlan}
            busyTier={busyTier}
            actionLabel={(plan) => plan.tier === currentPlan ? "Current plan" : "Upgrade"}
            onSelect={() => undefined}
            onAction={(plan) => {
              if (plan.tier !== currentPlan) void upgrade(plan.tier);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return initials.toUpperCase() || "?";
}

function formatPlanName(plan?: string) {
  if (!plan) return "";
  return plan
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default Sidebar;