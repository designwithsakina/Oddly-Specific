"use client";

import dynamic from "next/dynamic";
import SmoothScroll from "@/components/SmoothScroll";
import HeroOverlay from "@/components/HeroOverlay";
import SmokeyCursor from "@/components/SmokeyCursor";
import LogoReveal from "@/components/LogoReveal";

import MorphSection from "@/components/MorphSection";

import SoundToggle from "@/components/SoundToggle";

// WebGL can't server-render — load the stage on the client only.
const HeroExperience = dynamic(() => import("@/components/HeroExperience"), {
  ssr: false,
});

export default function Page() {
  return (
    <SmoothScroll>
      {/* fixed WebGL stage + typographic overlay */}
      <HeroExperience />
      <SmokeyCursor />
      <HeroOverlay />
      <SoundToggle />


      <main className="relative z-40">
        {/* logo holds centre after the headline fades; section below covers it */}
        <LogoReveal />

        {/* hero descent scroll region — exactly 2.2vh (220vh) so it hits 1.0 at the end */}
        <section style={{ height: "220vh" }} aria-label="Hero" />

        {/* MorphSection remains opacity-0 until scroll.hero hits the flash threshold,
            then it jumps to opacity-1 seamlessly while the flash is solid. */}
        <MorphSection className="relative z-50 min-h-[200vh] bg-transparent" />
      </main>
    </SmoothScroll>
  );
}
