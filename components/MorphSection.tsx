"use client";

import { useEffect, useRef } from "react";
import { scroll, HERO_SCROLL_VH, smoothstep } from "@/lib/state";
import CursorTrail from "./CursorTrail";
import InteractiveTypography from "./InteractiveTypography";

export default function MorphSection({ children, className }: { children: React.ReactNode, className?: string }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (sectionRef.current) {
        // Only show this section after the hero flash has completely covered the screen
        // We use scroll.raw to accurately check if we've passed the 220vh mark
        const vh = window.innerHeight;
        const threshold = 2.2 * vh;
        
        // We use scroll.section2 to trigger smooth opacity transition from 0.0 to 0.15 AFTER the morph
        const fadeIn = smoothstep(0.0, 0.15, scroll.section2);

        if (fadeIn > 0.01) {
          sectionRef.current.style.opacity = String(fadeIn);
          // Removed pointerEvents = "auto" to prevent it from blocking the Canvas 3D pointer underneath
        } else {
          sectionRef.current.style.opacity = "0";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <section ref={sectionRef} className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center px-[6vw] text-center" style={{ opacity: 0 }}>
        <CursorTrail />
        <div className="mb-2 w-full overflow-hidden">
          <h2 className="w-full font-display text-[clamp(1.5rem,2.5vw,2.5rem)] font-light leading-tight text-white/90">
            For Those Who Look Closer
          </h2>
        </div>
        <InteractiveTypography 
          className="mt-6 max-w-[55ch] font-sans text-[clamp(0.75rem,0.85vw,0.9rem)] font-light leading-relaxed text-justify"
          text="Oddly Specific was born from a simple observation: the things that stay with us are rarely the loudest. They're the details we almost missed, the stories tucked between the lines, the ideas that reveal themselves when we choose to look a little closer."
        />
        <InteractiveTypography 
          className="mt-6 max-w-[55ch] font-sans text-[clamp(0.75rem,0.85vw,0.9rem)] font-light leading-relaxed text-justify"
          text="We create brands, websites, presentations, treatments and experiences, but more than that, we follow curiosity wherever it leads. Every project begins with a question, a challenge, or a spark of possibility, and unfolds into something uniquely its own. Because the most memorable ideas aren't always the most obvious ones. They're often hiding in plain sight, waiting to be discovered."
        />
      </section>
      {/* Invisible spacer to provide the scrollable area for the transition */}
      <div className={className} />
    </>
  );
}
