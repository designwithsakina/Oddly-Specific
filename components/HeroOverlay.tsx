"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { scroll, smoothstep } from "@/lib/state";

/**
 * Centred typographic layer over the 3D stage. Editorial serif headline with an
 * italic accent (human, not the default left-aligned grid), framed eyebrow and
 * a centred scroll cue beneath the monolith — composed like the dusk reference.
 * Reveals on load with GSAP, recedes as the descent begins.
 */
export default function HeroOverlay() {
  const root = useRef<HTMLDivElement>(null);
  const reveal = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = reveal.current?.querySelectorAll<HTMLElement>("[data-reveal]") ?? [];

    if (!reduce) {
      gsap.set(items, { yPercent: 130, opacity: 0 });
      gsap.to(items, {
        yPercent: 0,
        opacity: 1,
        duration: 1.3,
        ease: "expo.out",
        stagger: 0.1,
        delay: 0.4,
      });
    }

    let raf = 0;
    const tick = () => {
      const el = root.current;
      if (el) {
        const fade = 1 - smoothstep(0.04, 0.4, scroll.hero);
        el.style.opacity = String(fade);
        el.style.transform = `translateY(${-scroll.hero * 50}px)`;
        el.style.pointerEvents = fade < 0.1 ? "none" : "auto";
      }

      // Animate the SVG liquid filter base frequency for fluid organic motion
      const turb = document.getElementById("liquid-turb");
      if (turb && !reduce) {
        const time = Date.now() * 0.0012;
        const baseFreqX = 0.035 + Math.sin(time * 0.6) * 0.008;
        const baseFreqY = 0.11 + Math.cos(time * 0.9) * 0.025;
        turb.setAttribute("baseFrequency", `${baseFreqX} ${baseFreqY}`);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={root}
      className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center px-[6vw] py-[3.2vh] text-center"
    >
      {/* top bar */}
      <header className="flex w-full items-start justify-between">
        <span 
          className="font-sans text-[0.7rem] uppercase tracking-[0.42em] text-white/85"
          style={{ textShadow: "0 4px 10px rgba(3, 3, 15, 0.8), 0 0 8px rgba(180, 80, 255, 0.25)" }}
        >
          Oddly&nbsp;Specific
        </span>
        <span 
          className="hidden font-sans text-[0.62rem] uppercase tracking-[0.34em] text-white/55 sm:block"
          style={{ textShadow: "0 4px 10px rgba(3, 3, 15, 0.8)" }}
        >
          Boutique&nbsp;Creative&nbsp;Studio
        </span>
      </header>

      {/* centred headline block, seated in the lower-middle beneath the monolith */}
      <div className="flex flex-1 flex-col items-center justify-end pb-[9vh]">
        <div ref={reveal} className="flex flex-col items-center">
          {/* framed eyebrow */}
          <div className="overflow-hidden pb-2">
            <div
              data-reveal
              className="flex items-center gap-4 text-white/85"
            >
              <span className="h-px w-7 bg-white/30" />
              <span 
                className="font-sans text-[0.6rem] uppercase tracking-[0.4em]"
                style={{ textShadow: "0 4px 10px rgba(3, 3, 15, 0.8)" }}
              >
                Strategy · Storytelling · Design
              </span>
              <span className="h-px w-7 bg-white/30" />
            </div>
          </div>

          {/* headline — two centred lines, italic accent for character.
              masks carry bottom padding (with matching negative margin) so
              descenders like the g's are never clipped. */}
          <h1 
            className="font-display font-light leading-[1.06] tracking-[-0.015em] text-white text-[clamp(2.1rem,5.2vw,4.4rem)]"
            style={{ textShadow: "0 12px 40px rgba(3, 3, 15, 0.9), 0 4px 16px rgba(3, 3, 15, 0.7), 0 0 60px rgba(3, 3, 15, 0.4)" }}
          >
            <span className="block overflow-visible pb-[0.18em] -mb-[0.16em]">
              <span data-reveal className="inline-block px-2">
                Making{" "}
                <span className="ideas-grad italic font-normal">ideas</span>
              </span>
            </span>
            <span className="block overflow-visible pb-[0.18em] -mb-[0.12em]">
              <span data-reveal className="inline-block px-2">
                harder to ignore.
              </span>
            </span>
          </h1>

          {/* subline — glowing accent line above it, plus a soft shadow so it
              lifts off the bright image rather than blending in */}
          <div className="mt-7 flex flex-col items-center gap-4">
            <span 
              data-reveal 
              className="glow-line-h" 
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.setProperty('--mouse-x', '50%');
              }}
            />
            <p
              data-reveal
              className="font-sans text-[clamp(0.95rem,1.35vw,1.15rem)] font-light leading-relaxed text-white/90"
              style={{ textShadow: "0 4px 16px rgba(3,3,15,0.9), 0 1px 3px rgba(3,3,15,0.7)" }}
            >
              Brands, stories, interfaces and other rabbit holes.
            </p>
          </div>
        </div>
      </div>

      {/* centred scroll cue */}
      <footer className="flex flex-col items-center gap-3 pb-[1vh]">
        <span 
          className="font-sans text-[0.82rem] uppercase tracking-[0.38em] text-white/85"
          style={{ textShadow: "0 4px 14px rgba(3, 3, 15, 0.85), 0 0 8px rgba(3, 3, 15, 0.5)" }}
        >
          Scroll to descend
        </span>
        <span className="scroll-line" />
      </footer>

      {/* SVG liquid displacement filter */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true" style={{ visibility: "hidden" }}>
        <defs>
          <filter id="liquid-splash">
            <feTurbulence id="liquid-turb" type="fractalNoise" baseFrequency="0.04 0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
