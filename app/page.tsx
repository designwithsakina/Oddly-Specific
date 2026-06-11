"use client";

import dynamic from "next/dynamic";
import SmoothScroll from "@/components/SmoothScroll";
import HeroOverlay from "@/components/HeroOverlay";
import LogoReveal from "@/components/LogoReveal";

// WebGL can't server-render — load the stage on the client only.
const HeroExperience = dynamic(() => import("@/components/HeroExperience"), {
  ssr: false,
});

export default function Page() {
  return (
    <SmoothScroll>
      {/* fixed WebGL stage + typographic overlay */}
      <HeroExperience />
      <HeroOverlay />

      <main className="relative z-10">
        {/* logo holds centre after the headline fades; section below covers it */}
        <LogoReveal />

        {/* hero descent scroll region — empty space that drives scroll.hero */}
        <section style={{ height: "320vh" }} aria-label="Hero" />

        {/* placeholder for the river→spiral morph (next build phase). Opaque,
            so it slides up over the fixed canvas as a new chapter. */}
        <section className="relative z-20 min-h-screen bg-[#06060f]">
          <div className="flex min-h-screen flex-col items-center justify-center px-[6vw] text-center">
            <span className="mb-6 font-sans text-[0.62rem] uppercase tracking-[0.36em] text-glow/60">
              02 — The Work
            </span>
            <h2 className="max-w-[18ch] font-display text-[clamp(1.8rem,4vw,3.4rem)] font-light leading-tight text-white/90">
              The river coils into six rabbit holes.
            </h2>
            <p className="mt-6 max-w-[42ch] font-sans text-sm font-light leading-relaxed text-mist/45">
              Next phase: the light-thread lifts off the valley floor and winds
              into the project spiral — Organic Delight, Muneer, Padah, Leo Club
              MCR, Kalara, F1 Campaign.
            </p>
          </div>
        </section>
      </main>
    </SmoothScroll>
  );
}
