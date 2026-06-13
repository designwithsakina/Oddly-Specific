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
    const isAboutPath = typeof window !== "undefined" && window.location.pathname === "/about";
    const isWorkPath = typeof window !== "undefined" && window.location.pathname === "/work";

    const wasScrolled = typeof window !== "undefined" && (sessionStorage.getItem("wasScrolled") === "true" || isAboutPath);
    const wasWorkScrolled = typeof window !== "undefined" && (sessionStorage.getItem("wasWorkScrolled") === "true" || isWorkPath);

    // Configure manual scroll restoration to prevent browser default scroll jumps
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
      if (!wasScrolled && !wasWorkScrolled) {
        window.scrollTo(0, 0);
      }
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = new Lenis({
      duration: 1.15,
      // heavy, slightly-overshooting feel — premium, not twitchy
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduce,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
    });

    // Manually restore scroll position if we reloaded on the About page or Work page
    if (wasWorkScrolled) {
      const savedPos = parseFloat(sessionStorage.getItem("workScrollPosition") || "0");
      const vh = window.innerHeight;
      const targetPos = savedPos > 0 ? savedPos : vh * 5.6;
      lenis.scrollTo(targetPos, { immediate: true });
    } else if (wasScrolled) {
      const savedPos = parseFloat(sessionStorage.getItem("scrollPosition") || "0");
      const vh = window.innerHeight;
      const targetPos = savedPos > 0 ? savedPos : vh * HERO_SCROLL_VH;
      lenis.scrollTo(targetPos, { immediate: true });
    }

    const onScroll = () => {
      scroll.raw = lenis.scroll;
      const vh = window.innerHeight;
      const span = vh * HERO_SCROLL_VH;
      scroll.hero = clamp01(lenis.scroll / span);
      
      // section 2 starts at `span` (2.2vh) and lasts for 3.0vh (300vh)
      const section2Start = span;
      const section2Span = 3.0 * vh;
      scroll.section2 = clamp01((lenis.scroll - section2Start) / section2Span);

      // section 3 starts at 5.2vh and lasts for 15.0vh (1500vh)
      const section3Start = section2Start + section2Span;
      const section3Span = 15.0 * vh;
      scroll.section3 = clamp01((lenis.scroll - section3Start) / section3Span);

      // Save scroll state and position in sessionStorage to detect refresh on scrolled sections
      // Also update the browser URL dynamically as the user scrolls between sections.
      if (typeof window !== "undefined") {
        if (lenis.scroll >= section3Start) {
          sessionStorage.setItem("wasWorkScrolled", "true");
          sessionStorage.setItem("workScrollPosition", String(lenis.scroll));
          sessionStorage.setItem("wasScrolled", "false");
          if (window.location.pathname !== "/work") {
            window.history.replaceState(null, "", "/work");
          }
        } else if (lenis.scroll >= section2Start) {
          sessionStorage.setItem("wasScrolled", "true");
          sessionStorage.setItem("scrollPosition", String(lenis.scroll));
          sessionStorage.setItem("wasWorkScrolled", "false");
          if (window.location.pathname !== "/about") {
            window.history.replaceState(null, "", "/about");
          }
        } else {
          sessionStorage.setItem("wasScrolled", "false");
          sessionStorage.setItem("wasWorkScrolled", "false");
          sessionStorage.removeItem("scrollPosition");
          sessionStorage.removeItem("workScrollPosition");
          if (window.location.pathname !== "/") {
            window.history.replaceState(null, "", "/");
          }
        }
      }
    };
    lenis.on("scroll", onScroll);
    onScroll();

    let raf = 0;
    const loop = (time: number) => {
      if (document.documentElement.classList.contains("splash-active")) {
        lenis.stop();
      } else {
        lenis.start();
      }
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
