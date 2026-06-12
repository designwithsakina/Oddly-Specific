"use client";

import { useEffect, useRef } from "react";
import { scroll, smoothstep } from "@/lib/state";

export default function MorphFlash() {
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (flashRef.current) {
        // Flash begins fading in at 0.9, fully opaque at 1.0
        // But we want it to stay fully opaque past 1.0 for a brief moment
        // However, `scroll.hero` naturally stops at 1.0 when we hit 220vh.
        // Wait, if we use `scroll.raw` we can extend past the hero limit!
        // We will just read `scroll.hero` for the fade in.
        
        // Let's map it: 0 at <0.9, 1 at 1.0
        const flashIn = smoothstep(0.9, 1.0, scroll.hero);
        
        // To make it fade out as we continue scrolling into the new section,
        // we use `scroll.raw`. The hero section ends at 2.2vh (220vh).
        // innerHeight isn't strictly constant, so we compute dynamically:
        const vh = window.innerHeight;
        const heroEnd = 2.2 * vh;
        
        // fade out from 2.2vh to 2.4vh
        const rawScroll = scroll.raw;
        let opacity = flashIn;
        
        if (rawScroll > heroEnd) {
          const fadeOut = 1 - smoothstep(heroEnd, heroEnd + 0.2 * vh, rawScroll);
          opacity = fadeOut;
        }

        flashRef.current.style.opacity = String(opacity);
        // Hide completely from pointer events so it doesn't block clicks
        flashRef.current.style.pointerEvents = opacity > 0 ? "auto" : "none";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div 
      ref={flashRef}
      className="fixed inset-0 z-50 bg-[#0ea5e9] mix-blend-screen opacity-0 pointer-events-none"
    />
  );
}
