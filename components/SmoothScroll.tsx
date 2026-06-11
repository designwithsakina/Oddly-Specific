"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { scroll, pointer, clamp01, HERO_SCROLL_VH } from "@/lib/state";

/**
 * Wraps the app in Lenis smooth scrolling and feeds two global signals into
 * `lib/state`:
 *   - scroll.hero : eased 0..1 progress through the opening descent
 *   - pointer.tx/ty : normalised cursor target for the parallax rig
 *
 * Both are read inside the R3F loop, so nothing here causes React renders.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = new Lenis({
      duration: 1.15,
      // heavy, slightly-overshooting feel — premium, not twitchy
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduce,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
    });

    const onScroll = () => {
      scroll.raw = lenis.scroll;
      const span = window.innerHeight * HERO_SCROLL_VH;
      scroll.hero = clamp01(lenis.scroll / span);
    };
    lenis.on("scroll", onScroll);
    onScroll();

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
