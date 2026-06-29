"use client";
import { useEffect, useRef } from "react";
import { scroll, smoothstep } from "@/lib/state";
import InteractiveTypography from "@/components/InteractiveTypography";

export default function TestimonialsBlurOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const tarotContainerRef = useRef<HTMLDivElement>(null);
  const tarotGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (
        overlayRef.current &&
        cardRef.current &&
        headerRef.current &&
        bodyRef.current &&
        tarotContainerRef.current &&
        tarotGridRef.current
      ) {
        const rawScroll = scroll.raw;
        const vh = typeof window !== "undefined" ? window.innerHeight : 900;
        const section4Start = 22.2 * vh;
        const section4Span = 5.0 * vh;
        const section5Start = section4Start + section4Span; // 27.2 * vh

        // Active state checking:
        // Transition is active when scroll.section4 is past 2.0/5.0, and scroll.section5 is less than 1.0 (since section5 span is 8.0vh)
        const isTransitionActive =
          scroll.section4 > 2.0 / 5.0 && scroll.section5 < 1.0;

        if (isTransitionActive) {
          overlayRef.current.style.display = "flex";

          let blurAmount = 0;
          let containerOpacity = 0.0;
          let headerOpacity = 0.0;
          let bodyOpacity = 0.0;
          let overlayBgOpacity = 0.1;

          let tarotOpacity = 0.0;
          let tarotTranslateY = 40;
          let cardsScrollY = 0;

          if (rawScroll < section5Start) {
            // Transition Phase (entering Section 5 from Section 4)
            const t = (scroll.section4 - 2.0 / 5.0) / (3.0 / 5.0);
            const easedT = smoothstep(0.0, 1.0, t);
            blurAmount = easedT * 20.0;
            overlayBgOpacity = 0.1 + easedT * 0.3;
            containerOpacity = 0.0;
            headerOpacity = 0.0;
            bodyOpacity = 0.0;
          } else {
            // Inside Section 5 (from scroll.section5 = 0.0 to 1.0)
            const p = scroll.section5;
            overlayBgOpacity = 0.4;

            if (p < 0.375) {
              // Phase 1: Intro text fades in & blur lifts (p = 0.0 to 0.375)
              const t = smoothstep(0.0, 0.30, p);
              blurAmount = (1.0 - t) * 20.0;
              containerOpacity = t;
              headerOpacity = 1.0;
              bodyOpacity = 1.0;

              tarotOpacity = 0.0;
              tarotTranslateY = 40;
              cardsScrollY = 0;
            } else if (p < 0.6875) {
              // Phase 2: Intro text fades out & Tarot grid fades/floats in (p = 0.375 to 0.6875)
              blurAmount = 0.0;
              // Intro text fades out fully by progress 0.50
              containerOpacity = 1.0 - smoothstep(0.375, 0.50, p);
              headerOpacity = 1.0;
              bodyOpacity = 1.0;

              if (p < 0.45) {
                tarotOpacity = 0.0;
                tarotTranslateY = 40;
              } else {
                const tTarot = (p - 0.45) / (0.6875 - 0.45);
                const easedTTarot = smoothstep(0.0, 1.0, tTarot);
                tarotOpacity = easedTTarot;
                tarotTranslateY = (1.0 - easedTTarot) * 40;
              }
              cardsScrollY = 0;
            } else if (p < 0.9375) {
              // Phase 3: Tarot grid fully visible, cards scroll up to show rows 3 & 4 (p = 0.6875 to 0.9375)
              blurAmount = 0.0;
              containerOpacity = 0.0;

              tarotOpacity = 1.0;
              tarotTranslateY = 0;

              const tScroll = (p - 0.6875) / (0.9375 - 0.6875);
              const easedTScroll = smoothstep(0.0, 1.0, tScroll);
              // Scroll the grid up by 34vh to reveal the bottom rows
              cardsScrollY = -easedTScroll * 34.0 * vh / 100;
            } else {
              // Phase 4: Tarot grid and overlay fade out (p = 0.9375 to 1.0)
              blurAmount = 0.0;
              containerOpacity = 0.0;

              const tExit = (p - 0.9375) / (1.0 - 0.9375);
              const easedTExit = smoothstep(0.0, 1.0, tExit);
              tarotOpacity = 1.0 - easedTExit;
              tarotTranslateY = -easedTExit * 30;
              cardsScrollY = -34.0 * vh / 100;
              overlayBgOpacity = 0.4 - easedTExit * 0.4;
            }
          }

          // Apply blur
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

          overlayRef.current.style.backgroundColor = `rgba(6, 12, 36, ${overlayBgOpacity})`;

          // Apply intro text styles
          cardRef.current.style.opacity = String(containerOpacity);
          headerRef.current.style.opacity = String(headerOpacity);
          bodyRef.current.style.opacity = String(bodyOpacity);
          cardRef.current.style.display = containerOpacity > 0.005 ? "flex" : "none";

          // Apply Tarot styles
          tarotContainerRef.current.style.opacity = String(tarotOpacity);
          tarotContainerRef.current.style.transform = `translate3d(0, ${tarotTranslateY}px, 0)`;
          tarotContainerRef.current.style.display = tarotOpacity > 0.005 ? "flex" : "none";
          tarotGridRef.current.style.transform = `translate3d(0, ${cardsScrollY}px, 0)`;

          // If container opacity is active or blur is active, enable pointer events
          const showOverlay = containerOpacity > 0.005 || tarotOpacity > 0.005 || blurAmount > 0.1;
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
        backgroundColor: "rgba(6, 12, 36, 0.1)",
        transition: "opacity 0.15s ease-out",
      }}
    >
      <style>{`
        @keyframes tarotCardFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(0.5deg); }
        }
      `}</style>

      {/* Intro Text Card (restored to absolute bottom alignment) */}
      <div
        ref={cardRef}
        className="absolute inset-x-0 bottom-0 pb-[10vh] md:pb-[14vh] flex flex-col items-center justify-end w-full max-w-[90vw] mx-auto pointer-events-auto transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02]"
        style={{}}
      >
        <div
          ref={headerRef}
          className="w-full overflow-visible py-2 flex items-center justify-center"
        >
          <h2
            className="hero-glow-text hero-glow-text-waterfall font-display text-[clamp(1.5rem,2.8vw,2.5rem)] font-light leading-tight cursor-default"
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
            className="mt-2 max-w-[55ch] font-sans text-[clamp(0.95rem,1.05vw,1.1rem)] font-light leading-relaxed text-center text-[#c8ddf0]/85 cursor-default"
            text="Fortunately, other people decided to speak too."
          />
        </div>
      </div>

      {/* Tarot Cards Layout (restored to justify-start with responsive card size and gradient mask) */}
      <div
        ref={tarotContainerRef}
        className="fixed inset-0 z-[47] flex flex-col items-center justify-start pt-[8vh] px-[6vw] pointer-events-none select-none text-center"
        style={{ display: "none", opacity: 0 }}
      >
        {/* Header & Body */}
        <div className="flex flex-col items-center mb-[4vh] pointer-events-auto">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-2">
            <span className="h-[1px] w-5 bg-white/20" />
            <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.25em] text-[#71b4ff]/90">
              TESTIMONIALS
            </span>
            <span className="h-[1px] w-5 bg-white/20" />
          </div>

          <h2
            className="hero-glow-text font-display text-[clamp(1.8rem,3.2vw,3rem)] font-light leading-tight uppercase tracking-wide cursor-default"
            style={{
              filter: "drop-shadow(0 0 3px rgba(255,255,255,0.15)) drop-shadow(0 2px 4px rgba(6, 18, 56, 0.4))",
            }}
          >
            WHAT THE CARDS REVEAL
          </h2>
          <p className="mt-2 font-sans text-[clamp(0.9rem,1.1vw,1.15rem)] font-light text-[#c8ddf0]/80 cursor-default">
            Proof that we didn&apos;t make this up.
          </p>
        </div>

        {/* Scrollable Cards Grid Window with premium vertical gradient mask */}
        <div 
          className="relative w-full max-w-[1000px] h-[56vh] overflow-hidden pointer-events-auto"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, white 12%, white 88%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, white 12%, white 88%, transparent)"
          }}
        >
          <div
            ref={tarotGridRef}
            className="grid grid-cols-3 gap-x-[3vw] gap-y-[3.5vh] justify-items-center w-full pt-[2vh] pb-[6vh] transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            {Array.from({ length: 12 }).map((_, idx) => {
              const delays = ["0s", "0.8s", "1.5s", "0.3s", "1.1s", "1.9s", "0.6s", "1.3s", "2.1s", "0.2s", "1.0s", "1.7s"];
              const durations = ["6.2s", "6.7s", "5.9s", "6.4s", "6.9s", "6.1s", "6.6s", "6.3s", "6.8s", "6.0s", "6.5s", "7.0s"];
              return (
                <div
                  key={idx}
                  className="w-[clamp(85px,9.8vw,160px)] aspect-[1/1.42] rounded-2xl overflow-hidden border border-sky-300/10 hover:border-sky-300/30 bg-[#060c24]/80 shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-[1.05]"
                  style={{
                    animation: `tarotCardFloat ${durations[idx]} ease-in-out infinite`,
                    animationDelay: delays[idx],
                  }}
                >
                  <img
                    src={`/tarot/tarot-back-${idx + 1}.jpg`}
                    alt={`Tarot Card Back ${idx + 1}`}
                    className="w-full h-full object-cover pointer-events-none select-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
