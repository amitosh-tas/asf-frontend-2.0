import { api } from "./api";

export type BillingInterval = "monthly" | "annually";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export interface Price {
  amount: number;
  currency: string;
  formatted: string;
  discountPercent?: number;
}

export interface Plan {
  id: string;
  tier: string;
  name: string;
  description?: string;
  pricing: Partial<Record<BillingInterval, Price>>;
  limits: Record<string, number>;
  features: Record<string, boolean | string[]>;
  isCurrent?: boolean;
}

interface RawPricing {
  monthly?: number | Price;
  annually?: number | Price;
  currency?: string;
}

export interface BillingOverview {
  subscription: {
    plan: string;
    planName: string;
    billingInterval: BillingInterval | null;
    status: SubscriptionStatus;
    trialEndsAt: string | null;
    currentPeriodEndsAt: string | null;
    cancelAtPeriodEnd: boolean;
    limits: Record<string, number>;
    features: Record<string, boolean | string[]>;
    usage: {
      ordersUsed: number;
      orderLimit: number;
      percentUsed: number;
      isOverLimit: boolean;
    };
  };
  plans: Plan[];
  hasPaymentMethod: boolean;
}

type BillingOverviewResponse =
  | BillingOverview
  | { data?: BillingOverview };

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

interface CheckoutPayload {
  checkoutUrl?: string;
  url?: string;
  sessionId?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export interface RegistrationStatus {
  status: "pending" | "paid" | "provisioning" | "active" | "failed" | "canceled";
  workspaceId?: string | null;
  message?: string;
}

type RawPlan = Omit<Plan, "id" | "tier" | "pricing"> & {
  id?: string;
  tier?: string;
  pricing: RawPricing;
};

type PlanResponse = RawPlan[] | { data?: RawPlan[] } | { plans?: RawPlan[] } | undefined;

function plansFromResponse(data: PlanResponse): Plan[] {
  if (!data) return [];

  const plans: RawPlan[] = Array.isArray(data)
    ? data
    : "data" in data
      ? data.data ?? []
      : "plans" in data
        ? data.plans ?? []
        : [];
  return plans
    .filter((plan) => Boolean(plan.id ?? plan.tier))
    .map((plan) => {
      const identifier = plan.id ?? plan.tier;
      return {
        ...plan,
        id: identifier!,
        tier: identifier!,
        pricing: normalizePricing(plan.pricing),
      };
    });
}

function normalizePricing(pricing: RawPricing): Partial<Record<BillingInterval, Price>> {
  return (["monthly", "annually"] as const).reduce<
    Partial<Record<BillingInterval, Price>>
  >((normalized, interval) => {
    const value = pricing[interval];
    if (value === undefined) return normalized;

    normalized[interval] =
      typeof value === "number"
        ? {
            amount: value,
            currency: pricing.currency ?? "USD",
            formatted: formatPrice(value, pricing.currency ?? "USD"),
          }
        : value;
    return normalized;
  }, {});
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function getAvailablePlans() {
  const response = await api.get<PlanResponse>("/api/billing/plans");
  return plansFromResponse(response.data);
}

export async function getWorkspacePlans() {
  const response = await api.get<PlanResponse>("/api/workspace/billing/plans");
  return plansFromResponse(response.data);
}

export async function getBillingOverview() {
  const response = await api.get<BillingOverviewResponse>("/api/workspace/billing");
  const billing = "subscription" in response.data
    ? response.data
    : response.data.data;

  if (!billing?.subscription) {
    throw new Error("The billing service returned an invalid overview response.");
  }

  return {
    ...billing,
    plans: plansFromResponse(billing.plans),
  };
}

export async function createCheckout(tier: string, interval: BillingInterval) {
  const response = await api.post<unknown>("/api/workspace/billing/checkout", {
    tier,
    interval,
  });
  const responseBody = isRecord(response.data) ? response.data : {};
  const nestedPayload = isRecord(responseBody.data) ? responseBody.data : undefined;
  const payload: CheckoutPayload = nestedPayload ?? responseBody;
  const checkoutUrl = payload?.checkoutUrl ?? payload?.url;

  if (!checkoutUrl) {
    throw new Error("The billing service did not return a Stripe checkout URL.");
  }

  return {
    checkoutUrl,
    sessionId: payload.sessionId ?? "",
  };
}

export async function openBillingPortal() {
  const response = await api.post<
    unknown
  >("/api/workspace/billing/portal", {});
  const responseBody = isRecord(response.data) ? response.data : {};
  const nestedPayload = isRecord(responseBody.data) ? responseBody.data : undefined;
  const portalUrl = typeof nestedPayload?.portalUrl === "string"
    ? nestedPayload.portalUrl
    : typeof responseBody.portalUrl === "string"
      ? responseBody.portalUrl
      : undefined;

  if (!portalUrl) {
    throw new Error("The billing service did not return a customer portal URL.");
  }

  return { portalUrl };
}

export async function getRegistrationStatus() {
  const response = await api.get<RegistrationStatus>("/api/auth/company/registration/status");
  return response.data;
}
