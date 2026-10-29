import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import PlanCards from "@/features/billing/components/PlanCards";
import {
  createCheckout,
  getAvailablePlans,
  getBillingOverview,
  openBillingPortal,
  type BillingOverview,
  type BillingInterval,
  type Plan,
} from "@/services/billingService";
import { getRequestErrorMessage } from "@/features/reports/utils/requestError";

function Billing() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [onboardingPlans, setOnboardingPlans] = useState<Plan[]>([]);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [selectedTier, setSelectedTier] = useState("");
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const onboarding = searchParams.get("onboarding") === "1";

  useEffect(() => {
    let active = true;
    const load = onboarding ? getAvailablePlans() : getBillingOverview();
    void load
      .then((result) => {
        if (active) {
          if (onboarding) {
            setOnboardingPlans(result as Plan[]);
            setSelectedTier((result as Plan[])[0]?.tier ?? "");
          } else {
            const billing = result as BillingOverview;
            setOverview(billing);
            setSelectedTier(billing.subscription.plan);
            if (billing.subscription.billingInterval) setInterval(billing.subscription.billingInterval);
          }
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(getRequestErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onboarding]);

  async function handleCheckout(tier: string) {
    setBusyTier(tier);
    setError("");
    try {
      const { checkoutUrl } = await createCheckout(tier, interval);
      window.location.assign(checkoutUrl);
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError));
      setBusyTier(null);
    }
  }

  async function handlePortal() {
    setError("");
    try {
      const { portalUrl } = await openBillingPortal();
      window.location.assign(portalUrl);
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError));
    }
  }

  if (loading) {
    return <PageLayout title="Billing" headTitle="Subscription"><Skeleton className="h-48 w-full" /></PageLayout>;
  }

  return (
    <PageLayout
      title="Billing"
      headTitle="Subscription"
      description={onboarding ? "Choose a plan to continue setting up your workspace." : "Manage your plan, usage, payment method, and invoices."}
      actions={!onboarding && overview?.hasPaymentMethod ? <Button variant="outline" onClick={() => void handlePortal()}>Manage subscription</Button> : undefined}
    >
      {searchParams.get("upgraded") && (
        <Alert variant="info">Payment received. Your subscription is being verified by the server before access is changed.</Alert>
      )}
      {error && <Alert>{error}</Alert>}
      {onboarding ? (
        <>
          <Alert variant="info">
            Your registration is saved. Your workspace will be created only after the backend verifies payment.
          </Alert>
          <div className="flex gap-2">
            {(["monthly", "annually"] as const).map((value) => (
              <Button key={value} variant={interval === value ? "primary" : "outline"} onClick={() => setInterval(value)}>
                {value === "monthly" ? "Monthly" : "Annually"}
              </Button>
            ))}
          </div>
          <PlanCards
            plans={onboardingPlans}
            interval={interval}
            selectedTier={selectedTier}
            busyTier={busyTier}
            onSelect={setSelectedTier}
            actionLabel={() => "Continue to checkout"}
            onAction={(plan) => void handleCheckout(plan.tier)}
          />
        </>
      ) : overview && (
        <>
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-text-muted">Current plan</p>
                <h2 className="mt-1 font-heading text-2xl font-semibold">{overview.subscription.planName}</h2>
                <p className="mt-1 text-sm text-text-muted">Status: {overview.subscription.status}</p>
              </div>
              <div className="text-right text-sm text-text-muted">
                <p>{overview.subscription.usage.ordersUsed.toLocaleString()} / {overview.subscription.usage.orderLimit.toLocaleString()} monthly orders</p>
                <div className="mt-2 h-2 w-48 rounded-full bg-border">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, overview.subscription.usage.percentUsed)}%` }} />
                </div>
              </div>
            </div>
          </section>
          <div className="flex gap-2">
            {(["monthly", "annually"] as const).map((value) => (
              <Button key={value} variant={interval === value ? "primary" : "outline"} onClick={() => setInterval(value)}>
                {value === "monthly" ? "Monthly" : "Annually"}
              </Button>
            ))}
          </div>
          <PlanCards
            plans={overview.plans}
            interval={interval}
            selectedTier={selectedTier}
            busyTier={busyTier}
            onSelect={setSelectedTier}
            actionLabel={(plan) => plan.tier === overview.subscription.plan ? "Current plan" : "Choose plan"}
            onAction={(plan) => plan.tier !== overview.subscription.plan && void handleCheckout(plan.tier)}
          />
        </>
      )}
    </PageLayout>
  );
}

export default Billing;
