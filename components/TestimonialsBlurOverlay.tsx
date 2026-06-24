"use client";
import { useEffect, useRef } from "react";
import { scroll, smoothstep } from "@/lib/state";
import InteractiveTypography from "@/components/InteractiveTypography";

export default function TestimonialsBlurOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (
        overlayRef.current &&
        cardRef.current &&
        headerRef.current &&
        bodyRef.current
      ) {
        const rawScroll = scroll.raw;
        const vh = typeof window !== "undefined" ? window.innerHeight : 900;
        const section4Start = 22.2 * vh;
        const section4Span = 5.0 * vh;
        const section5Start = section4Start + section4Span; // 27.2 * vh

        // Active state checking:
        // Transition is active when scroll.section4 is past 3.9/5.0, and scroll.section5 is less than 0.8
        const isTransitionActive =
          scroll.section4 > 3.9 / 5.0 && scroll.section5 < 0.8;

        if (isTransitionActive) {
          overlayRef.current.style.display = "flex";

          let blurAmount = 0;
          let containerOpacity = 0.0;
          let headerOpacity = 0.0;
          let bodyOpacity = 0.0;

          if (rawScroll < section5Start) {
            // Transition Phase (entering Section 5 from Section 4)
            const t = (scroll.section4 - 3.9 / 5.0) / (1.1 / 5.0);
            const easedT = smoothstep(0.0, 1.0, t);
            blurAmount = easedT * 20.0;
            containerOpacity = 0.0;
            headerOpacity = 0.0;
            bodyOpacity = 0.0;
          } else {
            // Inside Section 5 (from scroll.section5 = 0.0 to 0.8)
            const p = scroll.section5;

            if (p < 0.2) {
              // Scroll 1: Blur lifts (progress 0.0 to 0.2)
              const t = smoothstep(0.0, 0.20, p);
              blurAmount = (1.0 - t) * 20.0;
              containerOpacity = 0.0;
              headerOpacity = 0.0;
              bodyOpacity = 0.0;
            } else if (p < 0.4) {
              // Scroll 2: Container with header fades in (progress 0.2 to 0.4)
              blurAmount = 0.0;
              const t = (p - 0.2) / 0.2;
              containerOpacity = smoothstep(0.0, 1.0, t);
              headerOpacity = 1.0;
              bodyOpacity = 0.0;
            } else if (p < 0.6) {
              // Scroll 3: Body text fades in (progress 0.4 to 0.6)
              blurAmount = 0.0;
              containerOpacity = 1.0;
              headerOpacity = 1.0;
              const t = (p - 0.4) / 0.2;
              bodyOpacity = smoothstep(0.0, 1.0, t);
            } else {
              // Scroll 4: Container and text fades out (progress 0.6 to 0.8)
              blurAmount = 0.0;
              const t = (p - 0.6) / 0.2;
              const easedT = smoothstep(0.0, 1.0, t);
              containerOpacity = 1.0 - easedT;
              headerOpacity = 1.0;
              bodyOpacity = 1.0;
            }
          }

          // Apply values. Set parent filter to "none" when not active to enable child backdrop-filter sampling
          if (blurAmount > 0.1) {
            overlayRef.current.style.backdropFilter = `blur(${blurAmount}px)`;
            overlayRef.current.style.setProperty(
              "-webkit-backdrop-filter",
              `blur(${blurAmount}px)`
            );
          } else {
            overlayRef.current.style.backdropFilter = "none";
            overlayRef.current.style.setProperty(
              "-webkit-backdrop-filter",
              "none"
            );
          }

          cardRef.current.style.opacity = String(containerOpacity);
          headerRef.current.style.opacity = String(headerOpacity);
          bodyRef.current.style.opacity = String(bodyOpacity);

          // If container opacity is active or blur is active, enable pointer events
          const showOverlay = containerOpacity > 0.005 || blurAmount > 0.1;
          if (showOverlay) {
            overlayRef.current.style.opacity = "1";
            overlayRef.current.style.pointerEvents = "auto";
          } else {
            overlayRef.current.style.opacity = "0";
            overlayRef.current.style.pointerEvents = "none";
          }
        } else {
          overlayRef.current.style.display = "none";
          overlayRef.current.style.opacity = "0";
          overlayRef.current.style.pointerEvents = "none";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[47] flex flex-col items-center justify-center px-[6vw] text-center select-none"
      style={{
        display: "none",
        backgroundColor: "rgba(10, 9, 22, 0.1)",
        transition: "opacity 0.15s ease-out",
      }}
    >
      <div
        ref={cardRef}
        className="flex flex-col items-center justify-center max-w-[65ch] px-8 py-10 md:px-12 md:py-14 rounded-[32px] pointer-events-auto bg-[#0a0916]/10 border border-sky-300/15 transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.05]"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow:
            "0 25px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(224, 242, 254, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.2)",
        }}
      >
        <div
          ref={headerRef}
          className="w-full overflow-visible py-1 flex items-center justify-center"
        >
          <h2
            className="hero-glow-text hero-glow-text-waterfall font-display text-[clamp(1.2rem,2.0vw,1.8rem)] font-light leading-tight cursor-default"
            style={{
              filter:
                "drop-shadow(0 0 3px rgba(255,255,255,0.15)) drop-shadow(0 2px 4px rgba(6, 18, 56, 0.4)) drop-shadow(0 6px 12px rgba(6, 18, 56, 0.4)) drop-shadow(0 12px 24px rgba(6, 18, 56, 0.4))",
            }}
          >
            THE WORK SPEAKS FOR ITSELF.
          </h2>
        </div>

        <div
          ref={bodyRef}
          className="flex flex-col items-center justify-center w-full transition-all duration-75"
        >
          <InteractiveTypography
            className="mt-2 max-w-[55ch] font-sans text-[clamp(1.0625rem,1.15vw,1.2125rem)] font-light leading-relaxed text-center text-[#c8ddf0]/85 cursor-default"
            text="Fortunately, other people decided to speak too."
          />
        </div>
      </div>
    </div>
  );
}
