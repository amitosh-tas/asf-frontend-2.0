import { useRef } from "react";
import GlbScene, { type ScreenPoint } from "./GlbScene";
import Plasma from "./Plasma";
import { usePrefersReducedMotion, useScrollProgress } from "./scrollFx";
import { JOURNEY, ORDER_VALUE, shares } from "./landingData";

/** The story told as the visitor scrolls: three visits, one sale, credit for each. */
const BEATS = [
  { until: 0.15, day: "Monday", title: "They see your Meta ad", body: "A carousel catches their eye. They look, then leave." },
  { until: 0.3, day: "Thursday", title: "They search on Google", body: "They remember you, search, click your ad and browse." },
  { until: 0.45, day: "Saturday", title: "Your email brings them back", body: "A back-in-stock reminder lands at the right moment." },
  { until: 0.85, day: "Sunday", title: "They buy", body: "Three visits turn into one $240 order." },
  { until: 1.01, day: "Your dashboard", title: "Every step gets its share", body: "Elysium links all three visits to the sale and credits each one under the model you choose." },
];

const TOUCH_NODES = ["touch_meta", "touch_google", "touch_email"] as const;
const TOUCH_LABEL = { touch_meta: ["Meta ad", "Mon"], touch_google: ["Google search", "Thu"], touch_email: ["Email", "Sat"] } as const;
/** progress at which each receipt row appears (in step with the 3D model) */
const ROW_AT = [0.06, 0.2, 0.35];
const ORDER_AT = 0.8;
const CREDIT_AT = 0.88;
const CREDIT = shares("position_based");

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const money = (v: number) => `$${v.toFixed(0)}`;

/** Pinned black section: scrolling drives the 3D model (public/models/journey.glb) and its overlays. */
export default function JourneyScroll() {
  const { ref, progress } = useScrollProgress<HTMLElement>();
  const reduced = usePrefersReducedMotion();
  const active = BEATS.findIndex((b) => progress < b.until);
  const beatIndex = active < 0 ? BEATS.length - 1 : active;
  const beat = BEATS[beatIndex];

  if (reduced) return <StaticStory />;

  const creditOn = progress >= CREDIT_AT;
  const totalOpacity = clamp01((progress - 0.78) / 0.12);

  return (
    <section ref={ref} data-nav-dark aria-label="How a sale is traced" className="relative h-[460vh] bg-black text-white">
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
        {/* depth: faint plasma and a dot grid */}
        <div aria-hidden="true" className="absolute inset-0 opacity-70">
          <Plasma color="#ffffff" opacity={0.1} speed={0.5} scale={1.4} mouseInteractive={false} />
        </div>
        <div aria-hidden="true" className="absolute inset-0 [background-image:radial-gradient(rgb(255_255_255/0.09)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_70%_50%,#000_10%,transparent_70%)]" />

        <div className="relative mx-auto grid w-full max-w-[76rem] items-center gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr]">
          {/* ── text, receipt ── */}
          <div className="relative z-10 order-2 lg:order-1">
            <ol className="m-0 mb-7 flex list-none gap-2 p-0" aria-hidden="true">
              {BEATS.map((b, i) => {
                const from = BEATS[i - 1]?.until ?? 0;
                return (
                  <li key={b.title} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                    <span className="block h-full bg-white" style={{ width: `${clamp01((progress - from) / (b.until - from)) * 100}%` }} />
                  </li>
                );
              })}
            </ol>
            <div key={beat.title} className="beat-in" aria-live="polite">
              <p className="m-0 text-sm text-white/55">{beat.day}</p>
              <h2 className="mt-2 mb-0 font-display text-[clamp(2.25rem,5vw,4.25rem)] leading-[1] font-bold tracking-[-0.03em]">{beat.title}</h2>
              <p className="mt-4 mb-0 max-w-[28rem] text-lg leading-relaxed text-white/70">{beat.body}</p>
            </div>

            <Receipt progress={progress} creditOn={creditOn} />
          </div>

          {/* ── 3D model with trails, labels and the purchase burst ── */}
          <div className="relative order-1 lg:order-2">
            <p
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-[2%] z-10 m-0 text-center font-display text-[clamp(4rem,10vw,8.5rem)] leading-none font-bold tracking-[-0.05em] text-transparent [-webkit-text-stroke:1.5px_rgb(255_255_255/0.55)] max-lg:hidden"
              style={{ opacity: totalOpacity, transform: `translateY(${(1 - totalOpacity) * 24}px)` }}
            >
              ${ORDER_VALUE}
            </p>
            <SceneWithOverlay progress={progress} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** The left-hand receipt: each visit appears in step with the model, then the order, then the credit. */
function Receipt({ progress, creditOn }: { progress: number; creditOn: boolean }) {
  return (
    <div className="mt-8 hidden max-w-[30rem] rounded-2xl border border-white/15 bg-white/[0.03] p-2 backdrop-blur-sm lg:block">
      <ul className="m-0 list-none p-0">
        {JOURNEY.map((touch, i) => {
          const shown = progress >= ROW_AT[i];
          return (
            <li
              key={touch.id}
              className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 transition-[opacity,transform] duration-500"
              style={{ opacity: shown ? 1 : 0.18, transform: shown ? "none" : "translateX(-8px)" }}
            >
              <span className="text-sm text-white/50">{["Mon", "Thu", "Sat"][i]}</span>
              <span className="min-w-0">
                <span className="block font-medium">{touch.channel}</span>
                {creditOn && (
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-white transition-[width] duration-700 ease-out" style={{ width: `${CREDIT[i] * 100}%`, transitionDelay: `${i * 120}ms` }} />
                  </span>
                )}
              </span>
              <span className="text-right tabular-nums">
                {creditOn ? (
                  <span className="beat-in block">
                    <span className="font-semibold">{money(ORDER_VALUE * CREDIT[i])}</span>
                    <span className="ml-1.5 text-sm text-white/50">{Math.round(CREDIT[i] * 100)}%</span>
                  </span>
                ) : (
                  <span className="text-sm text-white/40">{shown ? "visit" : ""}</span>
                )}
              </span>
            </li>
          );
        })}
        <li
          className="mt-1 grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 rounded-xl bg-white px-3 py-3 text-black transition-[opacity,transform] duration-500"
          style={{ opacity: progress >= ORDER_AT ? 1 : 0, transform: progress >= ORDER_AT ? "none" : "translateY(6px)" }}
        >
          <span className="text-sm text-black/55">Sun</span>
          <span className="font-semibold">Order #10482</span>
          <span className="font-display text-xl font-bold tabular-nums">${ORDER_VALUE}</span>
        </li>
      </ul>
      <p className="m-0 px-3 pt-2 pb-1 text-xs text-white/45">{creditOn ? "Credit under position-based: 40% first, 20% middle, 40% last" : "Each visit is recorded as it happens"}</p>
    </div>
  );
}

const TRAIL = 46;

/** The 3D model plus a 2D layer: light trails behind each visit, beams into the sale, the purchase burst. */
function SceneWithOverlay({ progress }: { progress: number }) {
  const fx = useRef<HTMLCanvasElement>(null);
  const labels = useRef<Record<string, HTMLDivElement | null>>({});
  const trails = useRef<Record<string, { x: number; y: number }[]>>({});
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const onFrame = (points: ScreenPoint[], size: { width: number; height: number }) => {
    const p = progressRef.current;
    const canvas = fx.current;
    const sale = points.find((q) => q.name === "sale");

    // labels follow their crystal; they fade out as the visits merge into the sale
    const merge = clamp01((p - 0.45) / 0.4);
    for (const q of points) {
      const el = labels.current[q.name];
      if (!el) continue;
      el.style.opacity = q.visible ? String(Math.max(0, 1 - merge * 1.6)) : "0";
      // keep the label inside the box (flip to the left near the right edge)
      const lw = el.offsetWidth;
      const lx = q.x + 16 + lw > size.width ? q.x - 16 - lw : q.x + 16;
      el.style.transform = `translate(${Math.max(0, lx)}px, ${q.y - 14}px)`;
    }

    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(size.width * dpr)) {
      canvas.width = Math.round(size.width * dpr);
      canvas.height = Math.round(size.height * dpr);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);

    for (const name of TOUCH_NODES) {
      const q = points.find((x) => x.name === name);
      const trail = (trails.current[name] ??= []);
      if (!q?.visible) {
        trail.length = 0;
        continue;
      }
      trail.push({ x: q.x, y: q.y });
      if (trail.length > TRAIL) trail.shift();
      // trail: thin at the tail, bright at the head
      for (let i = 1; i < trail.length; i++) {
        const a = i / trail.length;
        ctx.strokeStyle = `rgba(255,255,255,${a * 0.55})`;
        ctx.lineWidth = 0.6 + a * 2.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
      // beam: credit flowing into the sale while the visits merge
      if (sale?.visible && merge > 0) {
        const g = ctx.createLinearGradient(q.x, q.y, sale.x, sale.y);
        g.addColorStop(0, `rgba(255,255,255,${0.5 * merge})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 6]);
        ctx.lineDashOffset = -performance.now() / 40;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(sale.x, sale.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // purchase burst: a shockwave and sparks, scrubbed by scroll (reversible)
    const burst = clamp01((p - 0.8) / 0.14);
    if (sale?.visible && burst > 0 && burst < 1) {
      const base = Math.max(sale.unit * 1.7, size.width * 0.16);
      for (const [delay, width] of [[0, 2.5], [0.18, 1.2]] as const) {
        const k = clamp01((burst - delay) / (1 - delay));
        if (k <= 0) continue;
        ctx.strokeStyle = `rgba(255,255,255,${(1 - k) * 0.8})`;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.arc(sale.x, sale.y, base + k * base * 2.6, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 28; i++) {
        const ang = (i / 28) * Math.PI * 2 + (i % 3) * 0.2;
        const dist = base * (1 + burst * (2 + (i % 5) * 0.45));
        ctx.fillStyle = `rgba(255,255,255,${(1 - burst) * 0.9})`;
        ctx.beginPath();
        ctx.arc(sale.x + Math.cos(ang) * dist, sale.y + Math.sin(ang) * dist, 1.2 + (i % 3) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[36rem] max-lg:max-h-[46dvh] max-lg:w-auto">
      <GlbScene
        src="/models/journey.glb"
        progress={progress}
        onFrame={onFrame}
        label="3D model: three visits orbiting a sale and merging into it as you scroll"
        className="absolute inset-0 h-full w-full"
      />
      <canvas ref={fx} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {TOUCH_NODES.map((name) => (
        <div
          key={name}
          ref={(el) => {
            labels.current[name] = el;
          }}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 rounded-full border border-white/25 bg-black/60 px-2.5 py-1 text-xs whitespace-nowrap text-white opacity-0 backdrop-blur"
        >
          <span className="font-medium">{TOUCH_LABEL[name][0]}</span>
          <span className="ml-1.5 text-white/50">{TOUCH_LABEL[name][1]}</span>
        </div>
      ))}
    </div>
  );
}

/** Reduced motion: the whole story at once, the model at its final pose, no pinning. */
function StaticStory() {
  return (
    <section data-nav-dark aria-label="How a sale is traced" className="bg-black text-white">
      <div className="mx-auto grid max-w-[76rem] items-center gap-10 px-4 py-24 sm:px-6 lg:grid-cols-2">
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
