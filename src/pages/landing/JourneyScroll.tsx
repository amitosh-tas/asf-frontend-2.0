import GlbScene from "./GlbScene";
import { usePrefersReducedMotion, useScrollProgress } from "./scrollFx";

/** The story told as the visitor scrolls: three visits, one sale, credit for each. */
const BEATS = [
  { until: 0.15, day: "Monday", title: "They see your Meta ad", body: "A carousel catches their eye. They look, then leave." },
  { until: 0.3, day: "Thursday", title: "They search on Google", body: "They remember you, search, click your ad and browse." },
  { until: 0.45, day: "Saturday", title: "Your email brings them back", body: "A back-in-stock reminder lands at the right moment." },
  { until: 0.85, day: "Sunday", title: "They buy", body: "Three visits turn into one $240 order." },
  { until: 1.01, day: "Your dashboard", title: "Every step gets its share", body: "Elysium links all three visits to the sale and credits each one under the model you choose." },
];

/** Pinned black section: scrolling drives the 3D model (public/models/journey.glb). */
export default function JourneyScroll() {
  const { ref, progress } = useScrollProgress<HTMLElement>();
  const reduced = usePrefersReducedMotion();
  const active = BEATS.findIndex((b) => progress < b.until);
  const beat = BEATS[active < 0 ? BEATS.length - 1 : active];

  if (reduced) {
    // no pinning or scroll-driven motion: the whole story at once, model at its final pose
    return (
      <section aria-label="How a sale is traced" className="bg-black text-white">
        <div className="mx-auto grid max-w-304 items-center gap-10 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <ol className="m-0 list-none space-y-8 p-0">
            {BEATS.map((b) => (
              <li key={b.title}>
                <p className="m-0 text-sm text-white/55">{b.day}</p>
                <h3 className="mt-1 mb-0 font-display text-2xl font-bold">{b.title}</h3>
                <p className="mt-1 mb-0 text-white/70">{b.body}</p>
              </li>
            ))}
          </ol>
          <GlbScene src="/models/journey.glb" progress={1} still label="Three visits merged into one sale" className="aspect-square w-full" />
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} aria-label="How a sale is traced" className="relative h-[420vh] bg-black text-white">
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-304 items-center gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="relative z-10 order-2 lg:order-1">
            <ol className="m-0 mb-8 flex list-none gap-2 p-0" aria-hidden="true">
              {BEATS.map((b, i) => (
                <li key={b.title} className="h-1 flex-1 bg-white/15">
                  <span
                    className="block h-full bg-white"
                    style={{ width: `${Math.min(1, Math.max(0, (progress - (BEATS[i - 1]?.until ?? 0)) / (b.until - (BEATS[i - 1]?.until ?? 0)))) * 100}%` }}
                  />
                </li>
              ))}
            </ol>
            <div key={beat.title} className="beat-in" aria-live="polite">
              <p className="m-0 text-sm text-white/55">{beat.day}</p>
              <h2 className="mt-2 mb-0 font-display text-[clamp(2.25rem,5vw,4.25rem)] leading-none font-bold tracking-[-0.03em]">{beat.title}</h2>
              <p className="mt-5 mb-0 max-w-md text-lg leading-relaxed text-white/70">{beat.body}</p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <GlbScene
              src="/models/journey.glb"
              progress={progress}
              label="3D model: three visits orbiting a sale and merging into it as you scroll"
              className="mx-auto aspect-square w-full max-w-136 max-lg:max-h-[46dvh] max-lg:w-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
