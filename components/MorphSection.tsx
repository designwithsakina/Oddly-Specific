"use client";

import { useEffect, useRef } from "react";
import { scroll, HERO_SCROLL_VH, smoothstep, lerp } from "@/lib/state";
import GlassButterflyCursor from "./GlassButterflyCursor";
import InteractiveTypography from "./InteractiveTypography";

export default function MorphSection({ children, className, isAboutRoute = false, isWorkRoute = false }: { children?: React.ReactNode, className?: string, isAboutRoute?: boolean, isWorkRoute?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const bodyTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (sectionRef.current) {
        // Only show this section after the hero flash has completely covered the screen
        // We use scroll.raw to accurately check if we've passed the 220vh mark
        const vh = window.innerHeight;
        const threshold = 2.2 * vh;
        
        // We use scroll.section2 to trigger smooth opacity transition from 0.08 to 0.22 AFTER the morph and blur clear
        // We also apply fadeOut as scroll.section3 starts to transition to Section 3
        const fadeIn = smoothstep(0.08, 0.22, scroll.section2);
        const fadeOut = 1.0 - smoothstep(0.0, 0.07, scroll.section3);
        const opacity = fadeIn * fadeOut;

        if (opacity > 0.01) {
          sectionRef.current.style.opacity = String(opacity);
          sectionRef.current.style.display = "flex";
        } else {
          sectionRef.current.style.opacity = "0";
          sectionRef.current.style.display = "none";
        }

        // Dolly Zoom: text starts at 0.85x scale, zooms to 1.0x (current settings) as we scroll
        const textScale = lerp(0.85, 1.0, smoothstep(0.08, 0.35, scroll.section2));
        if (textContainerRef.current) {
          textContainerRef.current.style.transform = `scale(${textScale})`;
        }

        // Body text unblur & fade:
        // - First scroll (0.12 to 0.22): fade in quickly to 1.0 opacity while keeping maximum blur (16px)
        // - Second scroll onwards (0.22 to 0.38): keep opacity at 1.0, and progressively unblur to 0px at the lock position (0.38)
        let bodyOpacity = 0;
        let blurAmount = 16;

        if (scroll.section2 > 0.12) {
          bodyOpacity = smoothstep(0.12, 0.22, scroll.section2);
          
          if (scroll.section2 >= 0.22) {
            const blurProgress = smoothstep(0.22, 0.38, scroll.section2);
            blurAmount = lerp(16, 0, blurProgress);
          }
        }
        
        if (bodyTextRef.current) {
          bodyTextRef.current.style.filter = `blur(${blurAmount}px)`;
          bodyTextRef.current.style.opacity = String(bodyOpacity);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <section ref={sectionRef} className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center px-[6vw] text-center" style={{ opacity: isAboutRoute && !isWorkRoute ? 1 : 0, display: isAboutRoute && !isWorkRoute ? "flex" : "none" }}>
        <GlassButterflyCursor />
        
        {/* Dolly Zoom typography wrapper */}
        <div ref={textContainerRef} className="flex flex-col items-center justify-center w-full origin-center">
          <div className="mb-2 w-full overflow-visible py-4 flex items-center justify-center">
            <h2 
              className="hero-glow-text hero-glow-text-waterfall font-display text-[clamp(1.8rem,3.2vw,3rem)] font-light leading-tight cursor-default pointer-events-auto"
              style={{
                filter: "drop-shadow(0 0 3px rgba(255,255,255,0.15)) drop-shadow(0 2px 4px rgba(6, 18, 56, 0.4)) drop-shadow(0 6px 12px rgba(6, 18, 56, 0.4)) drop-shadow(0 12px 24px rgba(6, 18, 56, 0.4))"
              }}
            >
              For Those Who Look Closer
            </h2>
          </div>
          
          {/* Wrapper for the body paragraphs to control blur and opacity */}
          <div ref={bodyTextRef} className="flex flex-col items-center justify-center w-full transition-all duration-75">
            <InteractiveTypography 
              className="mt-6 max-w-[55ch] font-sans text-[clamp(0.8125rem,0.9vw,0.9625rem)] font-light leading-relaxed text-justify"
              text="Oddly Specific was born from a simple observation: the things that stay with us are rarely the loudest. They're the details we almost missed, the stories tucked between the lines, the ideas that reveal themselves when we choose to look a little closer."
            />
            <InteractiveTypography 
              className="mt-6 max-w-[55ch] font-sans text-[clamp(0.8125rem,0.9vw,0.9625rem)] font-light leading-relaxed text-justify"
              text="We create brands, websites, presentations, treatments and experiences, but more than that, we follow curiosity wherever it leads. Every project begins with a question, a challenge, or a spark of possibility, and unfolds into something uniquely its own. Because the most memorable ideas aren't always the most obvious ones. They're often hiding in plain sight, waiting to be discovered."
            />
          </div>
        </div>
      </section>
      {/* Invisible spacer to provide the scrollable area for the transition */}
      <div className={`${className || ""} pointer-events-none`} />
    </>
  );
}
