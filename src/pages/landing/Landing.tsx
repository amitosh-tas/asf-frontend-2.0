import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import JourneyDemo from "./JourneyDemo";
import Pricing from "./Pricing";
import JourneyScroll from "./JourneyScroll";
import Plasma from "./Plasma";
import { usePageProgress, useReveal } from "./scrollFx";
import { FAQ, FEATURES, INTEGRATIONS, STEPS } from "./landingData";

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap";

/** Loads the display face once (kept out of index.html so the dashboard does not pay for it). */
function useDisplayFont() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
}

/**
 * Motion. One load sequence (hero), reveals as sections scroll in, the pinned 3D story, and a moving
 * integrations strip. Everything is off for prefers-reduced-motion.
 */
const LANDING_CSS = `
.landing .font-display{font-family:"Bricolage Grotesque",Inter,ui-sans-serif,system-ui,sans-serif;font-optical-sizing:auto}
html:has(.landing){scroll-behavior:smooth}
@keyframes l-rise{from{opacity:0;transform:translateY(0.55em) rotate(2deg)}to{opacity:1;transform:none}}
@keyframes l-fade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes l-card{from{opacity:0;transform:translateY(40px) scale(.97)}to{opacity:1;transform:none}}
@keyframes l-marquee{to{transform:translateX(-50%)}}
@keyframes l-beat{from{opacity:0;transform:translateY(18px);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
@keyframes l-price{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
.landing .h-word{display:inline-block;animation:l-rise .9s cubic-bezier(.2,.7,.1,1) both;animation-delay:calc(var(--i)*70ms + 80ms)}
.landing .h-after{animation:l-fade .8s ease-out both;animation-delay:calc(var(--d,0)*1ms)}
.landing .h-card{animation:l-card 1.1s cubic-bezier(.2,.7,.1,1) .45s both}
.landing [data-reveal]{opacity:0;transform:translateY(28px);transition:opacity .8s ease,transform .9s cubic-bezier(.2,.7,.1,1);transition-delay:calc(var(--i,0)*90ms)}
.landing [data-reveal][data-shown]{opacity:1;transform:none}
.landing .marquee{animation:l-marquee 28s linear infinite}
.landing .marquee-wrap:hover .marquee{animation-play-state:paused}
.landing .beat-in{animation:l-beat .6s cubic-bezier(.2,.7,.1,1) both}
.landing .price-in{display:inline-block;animation:l-price .35s ease-out both}
@media (prefers-reduced-motion: reduce){
  html:has(.landing){scroll-behavior:auto}
  .landing .h-word,.landing .h-after,.landing .h-card,.landing .beat-in,.landing .price-in{animation:none}
  .landing [data-reveal]{opacity:1;transform:none;transition:none}
  .landing .marquee{animation:none;flex-wrap:wrap;width:auto}
  .landing .marquee [aria-hidden="true"]{display:none}
}`;

const HEADLINE = "See which ad paid for every sale.";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current";

function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-xl font-bold tracking-tight ${className}`}>
      Elysium
    </span>
  );
}

/** Public landing page (black and white). Shown at "/" to signed-out visitors and at /home. */
export default function Landing() {
  useDisplayFont();
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  const page = usePageProgress();
  const dark = page.overDark;
  const navLink = `no-underline transition-colors duration-300 ${dark ? "text-white/65 hover:text-white" : "text-neutral-600 hover:text-black"}`;

  useEffect(() => {
    const previous = document.title;
    document.title = "Elysium: see which ad paid for every sale";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div ref={root} className="landing min-h-dvh bg-white text-black antialiased">
      <style>{LANDING_CSS}</style>

      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-black focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </a>

      {/* ── Navigation ──────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur transition-colors duration-300 ${
          dark ? "bg-black/80 text-white" : "bg-white/90 text-black"
        } ${page.scrolled ? (dark ? "border-white/15" : "border-black/10") : "border-transparent"}`}
      >
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-[76rem] items-center gap-6 px-4 sm:px-6">
          <Link to="/" className={`text-inherit no-underline ${focusRing}`}>
            <Logo />
          </Link>
          <ul className="m-0 hidden list-none gap-6 p-0 text-sm md:flex">
            {[
              ["#how-it-works", "How it works"],
              ["#features", "Features"],
              ["#pricing", "Pricing"],
            ].map(([href, text]) => (
              <li key={href}><a href={href} className={`${navLink} ${focusRing}`}>{text}</a></li>
            ))}
            <li><Link to="/docs" className={`${navLink} ${focusRing}`}>Docs</Link></li>
          </ul>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link to="/signin" className={`text-sm text-inherit no-underline hover:underline ${focusRing}`}>Sign in</Link>
            <Link
              to="/signup"
              className={`px-4 py-2 text-sm font-semibold no-underline transition-colors duration-300 ${dark ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"} ${focusRing}`}
            >
              Start free
            </Link>
          </div>
        </nav>
        <div aria-hidden="true" className={`absolute inset-x-0 bottom-[-1px] h-[2px] origin-left transition-colors duration-300 ${dark ? "bg-white" : "bg-black"}`} style={{ transform: `scaleX(${page.progress})` }} />
      </header>

      <main id="main">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_75%_90%_at_75%_40%,#000_35%,transparent_80%)]">
            <Plasma color="#000000" opacity={0.34} speed={0.6} scale={1.1} direction="forward" />
          </div>
          <div className="mx-auto grid max-w-[76rem] items-end gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-24 lg:pb-28">
          <div>
            <h1 aria-label={HEADLINE} className="m-0 font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] font-bold tracking-[-0.035em]">
              {HEADLINE.split(" ").map((word, i) => (
                <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] align-top">
                  <span className="h-word" style={{ ["--i" as string]: i }}>{word}</span>
                  {"\u00a0"}
                </span>
              ))}
            </h1>
            <p style={{ ["--d" as string]: 550 }} className="h-after mt-7 mb-0 max-w-[34rem] text-lg leading-relaxed text-neutral-700">
              Elysium follows each customer from the first ad they click to the order or booking they make, so you know
              where your revenue really comes from: Meta, Google, email or a friend's link.
            </p>
            <div style={{ ["--d" as string]: 700 }} className="h-after mt-9 flex flex-wrap items-center gap-3">
              <Link to="/signup" className={`bg-black px-6 py-3.5 text-base font-semibold text-white no-underline hover:bg-neutral-800 ${focusRing}`}>
                Start free trial
              </Link>
              <a href="#pricing" className={`border border-black px-6 py-3.5 text-base font-semibold text-black no-underline hover:bg-black hover:text-white ${focusRing}`}>
                See pricing
              </a>
            </div>
            <p style={{ ["--d" as string]: 850 }} className="h-after mt-4 mb-0 text-sm text-neutral-500">Free trial with 1,000 orders a month. No card needed.</p>
          </div>

          <div className="h-card">
            <p className="mt-0 mb-3 text-sm text-neutral-600">One customer, three visits, one sale. Who gets the credit depends on the model you pick:</p>
            <JourneyDemo />
          </div>
          </div>
        </section>

        {/* ── Works with ────────────────────────────────────────── */}
        <section aria-labelledby="works-with" className="border-y border-black">
          <div className="mx-auto flex max-w-[76rem] flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:gap-10">
            <h2 id="works-with" className="m-0 shrink-0 text-sm font-normal text-neutral-600">Works with</h2>
            <div className="marquee-wrap min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
              <ul className="marquee m-0 flex w-max list-none gap-x-12 gap-y-2 p-0 font-display text-lg font-semibold">
                {INTEGRATIONS.map((name) => <li key={name}>{name}</li>)}
                {INTEGRATIONS.map((name) => <li key={`copy-${name}`} aria-hidden="true">{name}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* ── The story, driven by scroll (3D .glb) ─────────────── */}
        <JourneyScroll />

        {/* ── How it works (a real sequence) ────────────────────── */}
        <section id="how-it-works" className="mx-auto max-w-[76rem] scroll-mt-20 px-4 py-24 sm:px-6">
          <h2 data-reveal className="m-0 max-w-[40rem] font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">Set up in an afternoon</h2>
          <ol className="mt-12 mb-0 grid list-none gap-10 p-0 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, i) => (
              <li key={step.title} data-reveal style={{ ["--i" as string]: i + 1 }} className="border-t-2 border-black pt-5">
                <span aria-hidden="true" className="font-display text-6xl leading-none font-bold">{i + 1}</span>
                <h3 className="mt-5 mb-0 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 mb-0 max-w-[24rem] leading-relaxed text-neutral-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Features (black band) ─────────────────────────────── */}
        <section id="features" data-nav-dark className="scroll-mt-16 bg-black text-white">
          <div className="mx-auto max-w-[76rem] px-4 py-24 sm:px-6">
            <h2 data-reveal className="m-0 max-w-[44rem] font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
              Built for brands that sell online and in person
            </h2>
            <ul className="mt-14 mb-0 grid list-none gap-x-10 gap-y-12 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <li key={f.title} data-reveal style={{ ["--i" as string]: i % 3 }} className="border-t border-white/30 pt-5">
                  <h3 className="m-0 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 mb-0 leading-relaxed text-white/70">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────── */}
        <section id="pricing" className="mx-auto max-w-[76rem] scroll-mt-20 px-4 py-24 sm:px-6">
          <h2 data-reveal className="m-0 font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">Pricing</h2>
          <p className="mt-4 mb-8 max-w-[36rem] text-lg leading-relaxed text-neutral-700">
            Start on the free trial. Upgrade when you need more orders, more models or your team on board.
          </p>
          <div data-reveal style={{ ["--i" as string]: 1 }}>
            <Pricing />
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section aria-labelledby="faq" className="border-t border-black">
          <div className="mx-auto grid max-w-[76rem] gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_2fr]">
            <h2 id="faq" data-reveal className="m-0 font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">Questions</h2>
            <div data-reveal style={{ ["--i" as string]: 1 }} className="border-t border-black">
              {FAQ.map((item) => (
                <details key={item.q} className="group border-b border-black">
                  <summary className={`flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden ${focusRing}`}>
                    {item.q}
                    <span aria-hidden="true" className="font-display text-2xl leading-none font-normal group-open:rotate-45 motion-safe:transition-transform">+</span>
                  </summary>
                  <p className="mt-0 mb-6 max-w-[42rem] leading-relaxed text-neutral-700">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing call to action ────────────────────────────── */}
        <section data-nav-dark className="relative isolate overflow-hidden bg-black text-white">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Plasma color="#ffffff" opacity={0.42} speed={0.8} scale={0.9} direction="pingpong" />
          </div>
          <div className="mx-auto flex max-w-[76rem] flex-col items-start gap-8 px-4 py-32 sm:px-6 md:flex-row md:items-end md:justify-between">
            <h2 data-reveal className="m-0 max-w-[40rem] font-display text-[clamp(2.25rem,5vw,4rem)] leading-[1] font-bold tracking-[-0.03em]">
              Find out what your ads really earn.
            </h2>
            <Link to="/signup" data-reveal style={{ ["--i" as string]: 2 }} className={`shrink-0 bg-white px-7 py-4 text-base font-semibold text-black no-underline hover:bg-neutral-200 ${focusRing}`}>
              Start free trial
            </Link>
          </div>
        </section>
      </main>

      <footer data-nav-dark className="border-t border-white/15 bg-black text-white">
        <div className="mx-auto flex max-w-[76rem] flex-col gap-6 px-4 py-10 text-sm sm:px-6 md:flex-row md:items-center md:justify-between">
          <Logo className="text-white" />
          <ul className="m-0 flex list-none flex-wrap gap-6 p-0 text-white/70">
            <li><a href="#pricing" className={`text-inherit no-underline hover:text-white ${focusRing}`}>Pricing</a></li>
            <li><Link to="/docs" className={`text-inherit no-underline hover:text-white ${focusRing}`}>Developer docs</Link></li>
            <li><Link to="/signin" className={`text-inherit no-underline hover:text-white ${focusRing}`}>Sign in</Link></li>
          </ul>
          <p className="m-0 text-white/50">© {new Date().getFullYear()} Elysium</p>
        </div>
      </footer>
    </div>
  );
}
