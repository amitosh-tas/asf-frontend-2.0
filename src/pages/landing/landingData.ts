/** Content and the plan catalog fallback for the public landing page. */

export interface PlanLimits {
  monthlyOrders: number;
  adAccounts: number;
  teamMembers: number;
  retentionMonths: number;
  customChannelRules: number;
  locations: number;
}

export interface PlanFeatures {
  models: string[];
  csvExports: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  customLookback: boolean;
}

/** Prices are plain numbers in config/plans.js; the API guide documents objects. Both are accepted. */
type Price = number | { amount: number; currency?: string };

export interface Plan {
  id: string;
  name: string;
  description: string;
  pricing: { monthly: Price; annually: Price; currency?: string };
  limits: PlanLimits;
  features: PlanFeatures;
}

export const priceOf = (p: Price) => (typeof p === "number" ? p : p.amount);

/** Mirrors backend config/plans.js. Used when GET /api/billing/plans is unreachable. */
export const FALLBACK_PLANS: Plan[] = [
  {
    id: "free",
    name: "Free Trial",
    description: "Explore the core features of the attribution platform",
    pricing: { monthly: 0, annually: 0, currency: "USD" },
    limits: { monthlyOrders: 1000, adAccounts: 1, teamMembers: 2, retentionMonths: 3, customChannelRules: 3, locations: 1 },
    features: { models: ["first_touch", "last_touch", "last_non_direct", "linear"], csvExports: false, apiAccess: false, prioritySupport: false, customLookback: false },
  },
  {
    id: "pro",
    name: "Pro Plan",
    description: "For growing businesses scaling their multi-channel marketing",
    pricing: { monthly: 10, annually: 100, currency: "USD" },
    limits: { monthlyOrders: 15000, adAccounts: 5, teamMembers: 5, retentionMonths: 13, customChannelRules: 20, locations: 5 },
    features: { models: ["first_touch", "last_touch", "last_non_direct", "linear", "position_based", "time_decay"], csvExports: true, apiAccess: true, prioritySupport: false, customLookback: true },
  },
  {
    id: "ultra",
    name: "Ultra Plan",
    description: "For high-volume brands needing advanced attribution and dedicated support",
    pricing: { monthly: 20, annually: 210, currency: "USD" },
    limits: { monthlyOrders: 100000, adAccounts: 50, teamMembers: 50, retentionMonths: 36, customChannelRules: 100, locations: 50 },
    features: { models: ["first_touch", "last_touch", "last_non_direct", "linear", "position_based", "time_decay", "data_driven"], csvExports: true, apiAccess: true, prioritySupport: true, customLookback: true },
  },
];

export const MODEL_NAMES: Record<string, string> = {
  first_touch: "First touch",
  last_touch: "Last touch",
  last_non_direct: "Last non-direct",
  linear: "Linear",
  position_based: "Position-based",
  time_decay: "Time decay",
  data_driven: "Data-driven",
};

// ── The journey shown in the hero ───────────────────────────────────────────

export interface Touch {
  id: string;
  channel: string;
  detail: string;
  /** days before the purchase */
  daysBefore: number;
}

export const JOURNEY: Touch[] = [
  { id: "meta", channel: "Meta ad", detail: "Summer sale carousel", daysBefore: 6 },
  { id: "google", channel: "Google search", detail: "“linen shirts men”", daysBefore: 3 },
  { id: "email", channel: "Email", detail: "Back-in-stock reminder", daysBefore: 1 },
];

export const ORDER_VALUE = 240;

export const DEMO_MODELS = [
  { id: "first_touch", name: "First touch", explain: "All the credit goes to the ad that found the customer." },
  { id: "last_touch", name: "Last touch", explain: "All the credit goes to the last thing they clicked before buying." },
  { id: "linear", name: "Linear", explain: "Every step that led to the sale gets an equal share." },
  { id: "position_based", name: "Position-based", explain: "40% to the first touch, 40% to the last, 20% shared by the middle." },
  { id: "time_decay", name: "Time decay", explain: "Steps closer to the purchase count for more (half-life of 7 days)." },
] as const;

export type DemoModel = (typeof DEMO_MODELS)[number]["id"];

/** Credit shares (0–1) per touch, the same rules the attribution engine uses. */
export function shares(model: DemoModel, touches: Touch[] = JOURNEY): number[] {
  const n = touches.length;
  switch (model) {
    case "first_touch":
      return touches.map((_, i) => (i === 0 ? 1 : 0));
    case "last_touch":
      return touches.map((_, i) => (i === n - 1 ? 1 : 0));
    case "linear":
      return touches.map(() => 1 / n);
    case "position_based":
      if (n === 1) return [1];
      if (n === 2) return [0.5, 0.5];
      return touches.map((_, i) => (i === 0 || i === n - 1 ? 0.4 : 0.2 / (n - 2)));
    case "time_decay": {
      const w = touches.map((t) => 2 ** (-t.daysBefore / 7));
      const sum = w.reduce((a, b) => a + b, 0);
      return w.map((x) => x / sum);
    }
  }
}

// ── Page copy ───────────────────────────────────────────────────────────────

export const STEPS = [
  {
    title: "Add one script to your site",
    body: "It records each visit and the ad, search or link that brought it, and respects the consent setting you choose.",
  },
  {
    title: "Connect your checkout or booking system",
    body: "Stripe and PayPal connect in one click; Razorpay, Shopify and Zenoti take a short guided setup. Anything else can send sales from your server.",
  },
  {
    title: "See where each sale came from",
    body: "Revenue, new customers and bookings by channel, campaign and location, in your own currency and timezone.",
  },
];

export const FEATURES = [
  {
    title: "Six ways to split the credit",
    body: "First touch, last touch, last non-direct, linear, position-based and time decay. Switch at any time and past results are recalculated.",
  },
  {
    title: "Sales and bookings",
    body: "Appointments get credit the moment they are booked, and the invoice paid later keeps that source.",
  },
  {
    title: "Numbers you can check",
    body: "Every total opens to the orders behind it, and each order shows how it was matched to its visits.",
  },
  {
    title: "Ad spend, CAC and ROAS",
    body: "Bring in Meta and Google Ads spend to see what each new customer cost, channel by channel.",
  },
  {
    title: "Any currency",
    body: "Sales in other currencies are converted with exchange rates that update every hour. Everyone can view in rupees, dollars or euros.",
  },
  {
    title: "Ready for teams and branches",
    body: "Limit teammates to the locations they run, see every change in the audit log, and export or erase a customer's data on request.",
  },
];

export const INTEGRATIONS = ["Stripe", "Razorpay", "PayPal", "Shopify", "WooCommerce", "Zenoti", "Meta Ads", "Google Ads"];

export const FAQ = [
  {
    q: "Do I need a developer?",
    a: "Not for most setups. You paste one script into your site and connect your payment or booking system from the dashboard. A developer helps only if you send sales from your own server.",
  },
  {
    q: "What happens when a customer switches devices or blocks tracking?",
    a: "Elysium falls back to matching by email, phone or ad click ID. Sales it still cannot trace are shown as “Direct / unknown” with the reason, and the dashboard tells you what share of revenue has a known source.",
  },
  {
    q: "Can I change the attribution model later?",
    a: "Yes. The visits behind each sale are kept, so switching models recalculates past results too. You can also compare models side by side.",
  },
  {
    q: "How is my customers' data protected?",
    a: "Customer emails are stored encrypted and matched using one-way hashes, each company's data is kept separate, and you can export or erase any customer's data from Settings.",
  },
];
