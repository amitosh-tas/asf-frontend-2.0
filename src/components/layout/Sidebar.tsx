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
import {
  Activity, ArrowLeftRight, BookOpen, Building2, CalendarDays, ChartNoAxesCombined,
  Coins, CreditCard, FileClock, LayoutDashboard, LifeBuoy,
  Menu, Moon, Plug, Radio, RotateCcw, Settings2, ShoppingBag, Sun, Users, UserRound,
  Workflow, X,
} from "lucide-react";

type Theme = "light" | "dark";

const navigationGroups = ["Overview", "Attribution", "Customers & Sales", "Performance", "Settings", "Workspace", "Platform"] as const;

interface SidebarProps {
  items: SidebarItem[];
}

function Sidebar({
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
          fixed left-4 top-4 z-50 flex h-10 items-center justify-center
          rounded-lg border border-border bg-card px-3 text-xs font-medium text-text
          duration-300 hover:bg-hover
          md:hidden
          ${isOpen ? "translate-x-40" : "translate-x-0"}
        `}
      >
        {isOpen ? <X size={17} /> : <Menu size={18} />}
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
            fixed inset-y-0 left-0 z-40 flex h-dvh w-64 flex-col
            isolate border-r border-border bg-sidebar text-sidebar-text shadow-[8px_0_30px_rgba(32,43,37,0.035)]
            transition-transform duration-200 ease-out md:sticky md:top-0 md:translate-x-0
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="shrink-0 border-b border-border px-5 pb-5 pt-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-[14px] bg-primary text-on-primary shadow-[0_5px_14px_rgba(142,189,60,0.24)]"><ChartNoAxesCombined size={20} strokeWidth={2.2} /></span>
              <span className="min-w-0">
                <span className="block font-heading text-[17px] font-extrabold leading-tight tracking-[-0.055em] text-sidebar-active"><Title /></span>
                <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.18em] text-text-muted">Revenue intelligence</span>
              </span>
            </div>
          </div>

          <nav
            aria-label="Main navigation"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5"
          >
            <div className="flex flex-col gap-6">
              {navigationGroups.map((group) => {
                const groupItems = items.filter((item) => navigationGroup(item.label) === group);
                if (!groupItems.length) return null;
                return (
                  <div key={group}>
                    <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">{group}</h2>
                    <div className="flex flex-col gap-1.5">
                      {groupItems.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.end ?? (item.path === "/" || item.path === "/super")}
                          className={({ isActive }) => `group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-150 ${isActive ? "bg-primary text-on-primary shadow-[0_6px_15px_rgba(142,189,60,0.2)]" : "text-sidebar-text hover:bg-hover hover:text-sidebar-active"}`}
                        >
                          <NavigationIcon label={item.label} />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="shrink-0 border-t border-border/80 p-3">
            <ThemeToggle />
            <AccountComponent key={location.pathname} />
          </div>
        </div>
      </aside>
    </>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );

  function selectTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    try {
      window.localStorage.setItem("elysium-theme", nextTheme);
    } catch {
      // Keep the current page usable when browser storage is unavailable.
    }
  }

  return (
    <div className="mb-2 w-full" role="group" aria-label="Color theme">
      <div className="flex w-full rounded-lg border border-border/80 bg-surface-muted p-0.5">
      {(["light", "dark"] as const).map((value) => {
        const selected = theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            aria-label={`${value === "light" ? "Light" : "Dark"} theme`}
            title={`${value === "light" ? "Light" : "Dark"} theme`}
            onClick={() => selectTheme(value)}
            className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-normal transition-colors ${selected ? "bg-card text-text shadow-sm" : "text-text-muted hover:text-text"}`}
          >
            {value === "light" ? <Sun aria-hidden="true" size={13} /> : <Moon aria-hidden="true" size={13} />}
            <span>{value === "light" ? "Light" : "Dark"}</span>
          </button>
        );
      })}
      </div>
    </div>
  );
}

function navigationGroup(label: string) {
  if (["Overview", "Dashboard"].includes(label)) return "Overview";
  if (["Channels", "Campaigns", "Journeys"].includes(label)) return "Attribution";
  if (["Customers", "Orders", "Refunds", "Bookings"].includes(label)) return "Customers & Sales";
  if (["Locations", "Ad spend & CAC", "Analytics"].includes(label)) return "Performance";
  if (label === "Settings") return "Settings";
  if (["Integrations", "Team", "Billing", "API Docs"].includes(label)) return "Workspace";
  return "Platform";
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
        className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary"
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
          className="absolute bottom-[calc(100%+0.5rem)] left-0 z-60 w-[calc(100vw-2rem)] max-w-72 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-xl"
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

function NavigationIcon({ label }: { label: string }) {
  const iconProps = { size: 17, strokeWidth: 1.8, "aria-hidden": true as const };
  switch (label) {
    case "Overview": case "Dashboard": return <LayoutDashboard {...iconProps} />;
    case "Channels": return <Radio {...iconProps} />;
    case "Campaigns": return <Activity {...iconProps} />;
    case "Journeys": return <Workflow {...iconProps} />;
    case "Customers": case "Members": return <Users {...iconProps} />;
    case "Orders": return <ShoppingBag {...iconProps} />;
    case "Refunds": return <RotateCcw {...iconProps} />;
    case "Bookings": return <CalendarDays {...iconProps} />;
    case "Locations": return <Building2 {...iconProps} />;
    case "Ad spend & CAC": return <Coins {...iconProps} />;
    case "Analytics": return <ChartNoAxesCombined {...iconProps} />;
    case "Integrations": return <Plug {...iconProps} />;
    case "Team": return <UserRound {...iconProps} />;
    case "Settings": return <Settings2 {...iconProps} />;
    case "Billing": return <CreditCard {...iconProps} />;
    case "API Docs": return <BookOpen {...iconProps} />;
    case "Platform health": return <Activity {...iconProps} />;
    case "Workspaces": return <Building2 {...iconProps} />;
    case "Audit log": return <FileClock {...iconProps} />;
    case "FX rates": return <ArrowLeftRight {...iconProps} />;
    default: return <LifeBuoy {...iconProps} />;
  }
}

export default Sidebar;
