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
    const isServicesPath = typeof window !== "undefined" && window.location.pathname === "/services";
    const isTestimonialsPath = typeof window !== "undefined" && window.location.pathname === "/testimonials";

    const wasScrolled = typeof window !== "undefined" && (sessionStorage.getItem("wasScrolled") === "true" || isAboutPath);
    const wasWorkScrolled = typeof window !== "undefined" && (sessionStorage.getItem("wasWorkScrolled") === "true" || isWorkPath);
    const wasServicesScrolled = typeof window !== "undefined" && (sessionStorage.getItem("wasServicesScrolled") === "true" || isServicesPath);
    const wasTestimonialsScrolled = typeof window !== "undefined" && (sessionStorage.getItem("wasTestimonialsScrolled") === "true" || isTestimonialsPath);

    // Configure manual scroll restoration to prevent browser default scroll jumps
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
      if (!wasScrolled && !wasWorkScrolled && !wasServicesScrolled && !wasTestimonialsScrolled) {
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
    scroll.lenisInstance = lenis;

    // Manually restore scroll position if we reloaded on the About page, Work page, Services page, or Testimonials page
    if (wasTestimonialsScrolled) {
      const savedPos = parseFloat(sessionStorage.getItem("testimonialsScrollPosition") || "0");
      const vh = window.innerHeight;
      const targetPos = savedPos > 0 ? savedPos : vh * 27.2;
      lenis.scrollTo(targetPos, { immediate: true });
    } else if (wasServicesScrolled) {
      const savedPos = parseFloat(sessionStorage.getItem("servicesScrollPosition") || "0");
      const vh = window.innerHeight;
      const targetPos = savedPos > 0 ? savedPos : vh * 23.2;
      lenis.scrollTo(targetPos, { immediate: true });
    } else if (wasWorkScrolled) {
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

      // section 3 starts at 5.2vh and lasts for 17.0vh (1700vh)
      const section3Start = section2Start + section2Span;
      const section3Span = 17.0 * vh;
      scroll.section3 = clamp01((lenis.scroll - section3Start) / section3Span);

      // section 4 starts at 22.2vh and lasts for 5.0vh (500vh)
      const section4Start = section3Start + section3Span;
      const section4Span = 5.0 * vh;
      scroll.section4 = clamp01((lenis.scroll - section4Start) / section4Span);

      // section 5 starts at 27.2vh and lasts for 8.0vh (800vh)
      const section5Start = section4Start + section4Span;
      const section5Span = 8.0 * vh;
      scroll.section5 = clamp01((lenis.scroll - section5Start) / section5Span);

      // Save scroll state and position in sessionStorage to detect refresh on scrolled sections
      // Also update the browser URL dynamically as the user scrolls between sections.
      if (typeof window !== "undefined") {
        if (lenis.scroll >= section5Start) {
          sessionStorage.setItem("wasTestimonialsScrolled", "true");
          sessionStorage.setItem("testimonialsScrollPosition", String(lenis.scroll));
          sessionStorage.setItem("wasServicesScrolled", "false");
          sessionStorage.setItem("wasWorkScrolled", "false");
          sessionStorage.setItem("wasScrolled", "false");
          if (window.location.pathname !== "/testimonials") {
            window.history.replaceState(null, "", "/testimonials");
            window.dispatchEvent(new CustomEvent("section-changed", { detail: "testimonials" }));
          }
        } else if (lenis.scroll >= section4Start) {
          sessionStorage.setItem("wasServicesScrolled", "true");
          sessionStorage.setItem("servicesScrollPosition", String(lenis.scroll));
          sessionStorage.setItem("wasTestimonialsScrolled", "false");
          sessionStorage.setItem("wasWorkScrolled", "false");
          sessionStorage.setItem("wasScrolled", "false");
          if (window.location.pathname !== "/services") {
            window.history.replaceState(null, "", "/services");
            window.dispatchEvent(new CustomEvent("section-changed", { detail: "services" }));
          }
        } else if (lenis.scroll >= section3Start) {
          sessionStorage.setItem("wasWorkScrolled", "true");
          sessionStorage.setItem("workScrollPosition", String(lenis.scroll));
          sessionStorage.setItem("wasTestimonialsScrolled", "false");
          sessionStorage.setItem("wasServicesScrolled", "false");
          sessionStorage.setItem("wasScrolled", "false");
          if (window.location.pathname !== "/work") {
            window.history.replaceState(null, "", "/work");
            window.dispatchEvent(new CustomEvent("section-changed", { detail: "work" }));
          }
        } else if (lenis.scroll >= section2Start) {
          sessionStorage.setItem("wasScrolled", "true");
          sessionStorage.setItem("scrollPosition", String(lenis.scroll));
          sessionStorage.setItem("wasWorkScrolled", "false");
          sessionStorage.setItem("wasServicesScrolled", "false");
          sessionStorage.setItem("wasTestimonialsScrolled", "false");
          if (window.location.pathname !== "/about") {
            window.history.replaceState(null, "", "/about");
            window.dispatchEvent(new CustomEvent("section-changed", { detail: "about" }));
          }
        } else {
          sessionStorage.setItem("wasScrolled", "false");
          sessionStorage.setItem("wasWorkScrolled", "false");
          sessionStorage.setItem("wasServicesScrolled", "false");
          sessionStorage.setItem("wasTestimonialsScrolled", "false");
          sessionStorage.removeItem("scrollPosition");
          sessionStorage.removeItem("workScrollPosition");
          sessionStorage.removeItem("servicesScrollPosition");
          sessionStorage.removeItem("testimonialsScrollPosition");
          if (window.location.pathname !== "/") {
            window.history.replaceState(null, "", "/");
            window.dispatchEvent(new CustomEvent("section-changed", { detail: "home" }));
          }
        }
      }
    };
    lenis.on("scroll", onScroll);
    onScroll();

    let raf = 0;
    let isSplashStopped = false;
    const loop = (time: number) => {
      const isSplash = document.documentElement.classList.contains("splash-active");
      if (isSplash) {
        if (!isSplashStopped) {
          lenis.stop();
          isSplashStopped = true;
        }
      } else {
        if (isSplashStopped) {
          lenis.start();
          isSplashStopped = false;
        }
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
