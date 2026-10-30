import type { BillingInterval, Plan } from "@/services/billingService";
import Button from "@/components/ui/Button";

interface PlanCardsProps {
  plans: Plan[];
  interval: BillingInterval;
  selectedTier?: string;
  busyTier?: string | null;
  actionLabel: (plan: Plan) => string;
  onSelect: (tier: string) => void;
  onAction: (plan: Plan) => void;
}

function formatFeature(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}

export default function PlanCards({
  plans,
  interval,
  selectedTier,
  busyTier,
  actionLabel,
  onSelect,
  onAction,
}: PlanCardsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan) => {
        const price = plan.pricing[interval];
        const selected = selectedTier === plan.tier;
        const features = Object.entries(plan.features);
        return (
          <article
            key={plan.tier}
            className={`flex flex-col rounded-2xl border bg-card p-6 text-text ${
              selected ? "border-primary ring-2 ring-primary/15" : "border-border"
            }`}
          >
            <button type="button" className="text-left text-text" onClick={() => onSelect(plan.tier)}>
              <h3 className="font-heading text-lg font-semibold text-text">{plan.name}</h3>
              {plan.description && (
                <p className="mt-2 text-sm leading-5 text-text-muted">{plan.description}</p>
              )}
              <p className="mt-3 text-2xl font-semibold text-text">
                {price?.formatted ?? "Unavailable"}
              </p>
              {price?.discountPercent ? (
                <p className="mt-1 text-xs text-success">{price.discountPercent}% annual discount</p>
              ) : null}
            </button>
            <ul className="mt-5 flex-1 space-y-2 border-t border-border pt-5 text-sm text-text-muted">
              {Object.entries(plan.limits).map(([key, value]) => (
                <li key={key} className="flex justify-between gap-3">
                  <span>{formatFeature(key)}</span>
                  <strong className="text-text">{value.toLocaleString()}</strong>
                </li>
              ))}
              {features.map(([key, value]) => (
                <li key={key}>
                  {typeof value === "boolean"
                    ? `${value ? "Included: " : "Not included: "}${formatFeature(key)}`
                    : `${formatFeature(key)}: ${(value as string[]).map(formatFeature).join(", ")}`}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              className="mt-6 w-full"
              variant={selected ? "primary" : "outline"}
              loading={busyTier === plan.tier}
              onClick={() => onAction(plan)}
            >
              {actionLabel(plan)}
            </Button>
          </article>
        );
      })}
    </div>
  );
}
