import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { FALLBACK_PLANS, MODEL_NAMES, priceOf, type Plan } from "./landingData";

type Interval = "monthly" | "annually";

const LIMIT_ROWS: { key: keyof Plan["limits"]; label: string; unit?: (v: number) => string }[] = [
  { key: "monthlyOrders", label: "Orders per month" },
  { key: "adAccounts", label: "Ad accounts" },
  { key: "teamMembers", label: "Team members" },
  { key: "locations", label: "Locations" },
  { key: "customChannelRules", label: "Custom channel rules" },
  { key: "retentionMonths", label: "Data kept for", unit: (v) => `${v} months` },
];

const FEATURE_ROWS: { key: Exclude<keyof Plan["features"], "models">; label: string }[] = [
  { key: "csvExports", label: "CSV exports" },
  { key: "apiAccess", label: "API access" },
  { key: "customLookback", label: "Custom lookback window" },
  { key: "prioritySupport", label: "Priority support" },
];

const usd = (v: number) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/** Plans from GET /api/billing/plans (public), falling back to the same catalog built in. */
export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [interval, setBilling] = useState<Interval>("monthly");

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: Plan[] }>("/api/billing/plans")
      .then((res) => {
        if (!cancelled && Array.isArray(res.data?.data) && res.data.data.length) setPlans(res.data.data);
      })
      .catch(() => {
        /* keep the built-in catalog */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const bestSaving = Math.max(...plans.map((p) => priceOf(p.pricing.monthly) * 12 - priceOf(p.pricing.annually)));

  return (
    <div>
      <div role="group" aria-label="Billing period" className="inline-flex border border-black p-1">
        {(["monthly", "annually"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={interval === value}
            onClick={() => setBilling(value)}
            className={[
              "cursor-pointer px-5 py-2 text-sm font-medium",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
              interval === value ? "bg-black text-white" : "text-black hover:bg-black/5",
            ].join(" ")}
          >
            {value === "monthly" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>
      {bestSaving > 0 && <p className="mt-3 mb-0 text-sm text-neutral-600">Paying yearly saves up to {usd(bestSaving)} a year.</p>}

      <div className="mt-10 grid grid-cols-1 border-t border-l border-black md:grid-cols-3">
        {plans.map((plan) => {
          const price = priceOf(plan.pricing[interval]);
          const yearlySaving = priceOf(plan.pricing.monthly) * 12 - priceOf(plan.pricing.annually);
          const free = priceOf(plan.pricing.monthly) === 0;
          return (
            <article key={plan.id} className="flex flex-col border-r border-b border-black p-6 sm:p-8">
              <h3 className="m-0 font-display text-2xl font-semibold">{plan.name}</h3>
              <p className="mt-2 mb-0 min-h-[3rem] text-sm leading-relaxed text-neutral-600">{plan.description}</p>

              <p className="mt-6 mb-0 flex items-baseline gap-1.5">
                <span key={`${plan.id}-${interval}`} className="price-in font-display text-5xl font-semibold tabular-nums">{usd(price)}</span>
                <span className="text-sm text-neutral-600">{free ? "" : interval === "monthly" ? "per month" : "per year"}</span>
              </p>
              <p className="mt-1 mb-0 min-h-[1.25rem] text-sm text-neutral-600">
                {free ? "No card needed" : interval === "annually" && yearlySaving > 0 ? `${usd(yearlySaving)} less than paying monthly` : ""}
              </p>

              <Link
                to={free ? "/signup" : `/signup?plan=${encodeURIComponent(plan.id)}&billing=${interval}`}
                className={[
                  "mt-6 block py-3 text-center text-sm font-semibold no-underline",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
                  free ? "border border-black text-black hover:bg-black hover:text-white" : "bg-black text-white hover:bg-neutral-800",
                ].join(" ")}
              >
                {free ? "Start free trial" : `Choose ${plan.name.replace(/ plan$/i, "")}`}
              </Link>

              <dl className="mt-8 mb-0 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2.5 text-sm">
                {LIMIT_ROWS.map((row) => (
                  <div key={row.key} className="contents">
                    <dt className="text-neutral-600">{row.label}</dt>
                    <dd className="m-0 text-right font-medium tabular-nums">{row.unit ? row.unit(plan.limits[row.key]) : plan.limits[row.key].toLocaleString("en-US")}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 border-t border-neutral-200 pt-5 text-sm">
                <p className="m-0 text-neutral-600">Attribution models</p>
                <p className="mt-1 mb-0 leading-relaxed">{plan.features.models.map((m) => MODEL_NAMES[m] ?? m).join(", ")}</p>
              </div>

              <ul className="mt-5 mb-0 list-none space-y-2 p-0 text-sm">
                {FEATURE_ROWS.map((row) => {
                  const on = plan.features[row.key];
                  return (
                    <li key={row.key} className={["flex items-center gap-2.5", on ? "text-black" : "text-neutral-400"].join(" ")}>
                      <span aria-hidden="true" className={["inline-block h-3.5 w-3.5 shrink-0 border", on ? "border-black bg-black" : "border-neutral-300"].join(" ")} />
                      <span>
                        {row.label}
                        <span className="sr-only">{on ? ": included" : ": not included"}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
