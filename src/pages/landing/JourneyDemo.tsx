import { useEffect, useState } from "react";
import { DEMO_MODELS, JOURNEY, ORDER_VALUE, shares, type DemoModel } from "./landingData";

const money = (v: number) => `$${v.toFixed(2)}`;

/**
 * The hero's centrepiece: one customer's real path to a purchase, and how each attribution model
 * splits the credit for it. Pick a model; the bars and amounts re-split.
 */
export default function JourneyDemo() {
  const [model, setModel] = useState<DemoModel>("position_based");
  // bars start empty and fill once the card has animated in
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setFilled(true), 900);
    return () => window.clearTimeout(t);
  }, []);
  const split = shares(model);
  const current = DEMO_MODELS.find((m) => m.id === model)!;

  return (
    <figure className="m-0 border border-white/20 bg-black text-white">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/20 px-5 py-4 sm:px-7">
        <span className="text-sm text-white/60">Order #10482, paid on 2 June</span>
        <span className="font-display text-2xl tabular-nums sm:text-3xl">{money(ORDER_VALUE)}</span>
      </figcaption>

      <ol className="m-0 list-none p-0">
        {JOURNEY.map((touch, i) => {
          const share = split[i];
          return (
            <li key={touch.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-white/10 px-5 py-4 sm:grid-cols-[11rem_1fr_6.5rem] sm:px-7">
              <div className="min-w-0">
                <p className="m-0 font-medium">{touch.channel}</p>
                <p className="m-0 text-sm leading-snug text-white/55">
                  {touch.detail}, {touch.daysBefore} {touch.daysBefore === 1 ? "day" : "days"} before
                </p>
              </div>
              <div className="col-span-2 row-start-2 h-3 bg-white/10 sm:col-span-1 sm:row-start-auto" aria-hidden="true">
                <div className="h-full bg-white motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out" style={{ width: `${(filled ? share : 0) * 100}%`, transitionDelay: filled ? `${i * 120}ms` : undefined }} />
              </div>
              <p className="m-0 text-right tabular-nums">
                <span className="block font-medium">{money(ORDER_VALUE * share)}</span>
                <span className="block text-sm text-white/55">{Math.round(share * 100)}%</span>
              </p>
            </li>
          );
        })}
      </ol>

      <div className="px-5 py-5 sm:px-7">
        <div role="group" aria-label="Attribution model" className="flex flex-wrap gap-2">
          {DEMO_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={m.id === model}
              onClick={() => setModel(m.id)}
              className={[
                "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                m.id === model ? "border-white bg-white text-black" : "border-white/30 text-white hover:border-white",
              ].join(" ")}
            >
              {m.name}
            </button>
          ))}
        </div>
        <p className="mt-3 mb-0 min-h-[2.75rem] text-sm leading-relaxed text-white/70" aria-live="polite">
          {current.explain}
        </p>
      </div>
    </figure>
  );
}
