import { useMemo } from "react";

interface JourneyCustomer {
  id: string;
  email: string;
  firstSeenAt: string;
  firstPurchaseAt: string | null;
  lastPurchaseAt: string | null;
  externalIds: Record<string, unknown> | null;
}

interface JourneyTouch {
  id: string;
  channel: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  landingPage: string;
  touchedAt: string;
  gclid: string | null;
  fbclid: string | null;
}

interface JourneyCredit {
  touchId: string;
  share: string;
  amountMinorUnits: string;
}

interface JourneyOrder {
  id: string;
  externalId: string;
  status: string;
  currency: string;
  netMinorUnits: string;
  matchMethod: string;
  isNewCustomer: boolean;
  orderedAt: string;
  credits: JourneyCredit[];
}

export interface CustomerJourney {
  customer: JourneyCustomer;
  touches: JourneyTouch[];
  orders: JourneyOrder[];
  bookings: unknown[];
  refunds: unknown[];
  touchCount: number;
  attributionModel: string;
}

interface CustomerJourneyDrawerProps {
  data: CustomerJourney;
  onClose: () => void;
}

const channelStyles: Record<string, string> = {
  google: "bg-blue-100 text-blue-700 ring-blue-200",
  meta: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  ig: "bg-pink-100 text-pink-700 ring-pink-200",
  organic: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  direct: "bg-amber-100 text-amber-800 ring-amber-200",
};

const channelDots: Record<string, string> = {
  google: "bg-blue-500",
  meta: "bg-indigo-500",
  ig: "bg-pink-500",
  organic: "bg-emerald-500",
  direct: "bg-amber-500",
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const normalized = value
    .replace(" ", "T")
    .replace(/(\.\d{3})\d+/, "$1")
    .replace(/\+00$/, "Z");

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPageName(url: string) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const productIndex = segments.indexOf("product");

    if (productIndex !== -1 && segments[productIndex + 1]) {
      return segments[productIndex + 1]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    return segments.at(-1) || "Homepage";
  } catch {
    return "Landing page";
  }
}

function getHost(url: string | null) {
  if (!url) return "No referrer";

  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export default function CustomerJourneyDrawer({
  data,
  onClose,
}: CustomerJourneyDrawerProps) {
  const { customer, touches, orders, touchCount, attributionModel } = data;

  const sortedTouches = useMemo(
    () =>
      [...touches].sort(
        (a, b) =>
          new Date(
            a.touchedAt.replace(" ", "T").replace(/\+00$/, "Z"),
          ).getTime() -
          new Date(
            b.touchedAt.replace(" ", "T").replace(/\+00$/, "Z"),
          ).getTime(),
      ),
    [touches],
  );

  const channelCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const touch of touches) {
      const channel = touch.channel.toLowerCase();
      counts.set(channel, (counts.get(channel) ?? 0) + 1);
    }

    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [touches]);

  const creditedTouchIds = new Set(
    orders.flatMap((order) => order.credits.map((credit) => credit.touchId)),
  );

  const paidOrders = orders.filter(
    (order) => order.status.toLowerCase() === "paid",
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="journey-title"
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <header className="border-b border-border bg-surface-muted/40 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                Attribution explorer
              </p>

              <h2
                id="journey-title"
                className="mt-2 truncate text-xl font-semibold text-text"
              >
                Customer journey
              </h2>

              <p className="mt-1 truncate text-sm text-text-muted">
                {customer.email}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close customer journey"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-lg text-text-muted transition hover:bg-hover hover:text-text"
            >
              ×
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Touchpoints", value: touchCount },
              { label: "Channels", value: channelCounts.length },
              { label: "Paid orders", value: paidOrders.length },
              {
                label: "Attribution",
                value: attributionModel.replaceAll("_", " "),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-0 rounded-2xl border border-border bg-card p-3"
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  {item.label}
                </p>
                <p className="mt-2 truncate text-sm font-semibold capitalize text-text">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          {/* Channel breakdown */}
          <section>
            <h3 className="text-sm font-semibold text-text">
              Traffic sources
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              {channelCounts.map(([channel, count]) => (
                <span
                  key={channel}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ring-1 ${
                    channelStyles[channel] ??
                    "bg-slate-100 text-slate-700 ring-slate-200"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      channelDots[channel] ?? "bg-slate-500"
                    }`}
                  />
                  <span className="capitalize">{channel}</span>
                  <span className="font-bold">{count}</span>
                </span>
              ))}
            </div>
          </section>

          {/* Connected journey */}
          <section>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-text">
                Conversion timeline
              </h3>

              <span className="text-xs text-text-muted">
                Oldest first
              </span>
            </div>

            <div className="mt-5">
              {sortedTouches.length === 0 && orders.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-5 text-sm text-text-muted">
                  No journey events are available.
                </p>
              )}

              {sortedTouches.map((touch, index) => {
                const channel = touch.channel.toLowerCase();
                const isCredited = creditedTouchIds.has(touch.id);

                return (
                  <div key={touch.id} className="relative flex gap-4">
                    {/* Vertical connector */}
                    <div className="relative flex w-8 shrink-0 justify-center">
                      {index < sortedTouches.length - 1 && (
                        <div className="absolute bottom-0 top-8 w-px bg-border" />
                      )}

                      <div
                        className={`relative z-10 mt-1 flex size-8 items-center justify-center rounded-full ring-4 ring-card ${
                          channelDots[channel] ?? "bg-slate-500"
                        }`}
                      >
                        <span className="size-2 rounded-full bg-white" />
                      </div>
                    </div>

                    {/* Touchpoint card */}
                    <article
                      className={`mb-5 min-w-0 flex-1 rounded-2xl border p-4 transition-colors ${
                        isCredited
                          ? "border-emerald-300 bg-emerald-50/60"
                          : "border-border bg-card hover:bg-surface-muted/40"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold capitalize text-text">
                            {channel} touchpoint
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ring-1 ${
                              channelStyles[channel] ??
                              "bg-slate-100 text-slate-700 ring-slate-200"
                            }`}
                          >
                            {touch.medium ?? "unclassified"}
                          </span>
                        </div>

                        {isCredited && (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                            Conversion credit
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-text-muted">
                        {formatDate(touch.touchedAt)}
                      </p>

                      <div className="mt-3 rounded-xl bg-surface-muted/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                          Landing page
                        </p>

                        <p className="mt-1 wrap-break-word text-sm font-medium text-text">
                          {getPageName(touch.landingPage)}
                        </p>

                        <a
                          href={touch.landingPage}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block break-all text-xs text-blue-600 hover:underline"
                        >
                          {touch.landingPage}
                        </a>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">
                            Source
                          </p>
                          <p className="mt-1 truncate text-xs font-medium text-text">
                            {touch.source ?? "—"}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">
                            Campaign
                          </p>
                          <p className="mt-1 wrap-break-word text-xs font-medium text-text">
                            {touch.campaign ?? "—"}
                          </p>
                        </div>

                        <div className="col-span-2 min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-text-muted">
                            Referrer
                          </p>
                          <p className="mt-1 break-all text-xs text-text-muted">
                            {getHost(touch.referrer)}
                          </p>
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}

              {/* Purchase events */}
              {orders.map((order) => (
                <div key={order.id} className="relative flex gap-4">
                  <div className="relative flex w-8 shrink-0 justify-center">
                    <div className="absolute bottom-0 top-0 w-px bg-border" />
                    <div className="relative z-10 mt-1 flex size-8 items-center justify-center rounded-full bg-emerald-600 text-sm text-white ring-4 ring-card">
                      ✓
                    </div>
                  </div>

                  <article className="mb-2 min-w-0 flex-1 rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-emerald-950">
                        {order.status.toLowerCase() === "paid"
                          ? "Purchase completed"
                          : `Order ${order.status}`}
                      </h4>

                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-800">
                        {order.status}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-emerald-900/70">
                      {formatDate(order.orderedAt)}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-emerald-900/60">
                          Order ID
                        </p>
                        <p className="mt-1 break-all text-xs font-medium text-emerald-950">
                          {order.externalId}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-emerald-900/60">
                          Match method
                        </p>
                        <p className="mt-1 text-xs font-medium capitalize text-emerald-950">
                          {order.matchMethod}
                        </p>
                      </div>
                    </div>

                    {order.credits.length > 0 && (
                      <div className="mt-4 border-t border-emerald-200 pt-3">
                        <p className="text-xs font-semibold text-emerald-950">
                          Attribution credits
                        </p>

                        {order.credits.map((credit) => {
                          const creditedTouch = touches.find(
                            (touch) => touch.id === credit.touchId,
                          );

                          return (
                            <div
                              key={credit.touchId}
                              className="mt-2 rounded-xl bg-white/80 p-3"
                            >
                              <p className="text-xs font-medium text-emerald-950">
                                {creditedTouch
                                  ? `${creditedTouch.channel} · ${getPageName(
                                      creditedTouch.landingPage,
                                    )}`
                                  : "Attributed touchpoint"}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-emerald-900/70">
                                <span>Share: {credit.share}</span>
                                <span>
                                  Credit: {order.currency}{" "}
                                  {(
                                    Number(credit.amountMinorUnits) / 100
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </article>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-text-muted">
              Model:{" "}
              <span className="font-semibold text-text">
                {attributionModel.replaceAll("_", " ")}
              </span>
            </p>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-text px-4 py-2.5 text-xs font-semibold text-card transition hover:opacity-85"
            >
              Close journey
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}