"use client";
import { useEffect, useRef } from "react";
import { scroll, smoothstep, clamp01 } from "@/lib/state";
import InteractiveTypography from "@/components/InteractiveTypography";

export default function TestimonialsBlurOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const tarotContainerRef = useRef<HTMLDivElement>(null);
  const tarotTextRef = useRef<HTMLDivElement>(null);
  
  // Independent column refs for parallax scrolling
  const col1Ref = useRef<HTMLDivElement>(null);
  const col2Ref = useRef<HTMLDivElement>(null);
  const col3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (
        overlayRef.current &&
        cardRef.current &&
        headerRef.current &&
        bodyRef.current &&
        tarotContainerRef.current &&
        tarotTextRef.current &&
        col1Ref.current &&
        col2Ref.current &&
        col3Ref.current
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
          let tarotTranslateY = 0;
          let tarotTextOpacity = 1.0;
          let tarotScale = 1.0;
          let tarotBlur = 0.0;
          
          // Column scroll positions (staggered initial offsets: center is 0, sides are shifted down by 14vh)
          let leftY = 14.0 * vh / 100;
          let centerY = 0;
          let rightY = 14.0 * vh / 100;

          const p = scroll.section5;
          overlayBgOpacity = 0.4;

          // Normalized step boundaries within Section 5:
          const p1 = 3.0 / 15.5;  // 0.1935 (Step 16: Testimonials text screen)
          const p2 = 5.5 / 15.5;  // 0.3548 (Step 17: Tarot Cards zoom entry completes)
          const p3 = 14.5 / 15.5; // 0.9355 (Step 20: Tarot Cards Scroll 3 completes)
          const p4 = 1.0;         // (Step 21: Testimonials exit completes)

          if (p < p1) {
            // Phase 1: Intro text fades in & blur lifts (entering Section 5 from Section 4, unblurring text)
            // Blur starts at 20px, lifts to 0px as p goes from 0.0 to p1
            const t = smoothstep(0.0, p1 - 0.05, p);
            blurAmount = (1.0 - t) * 20.0;
            containerOpacity = t;
            headerOpacity = 1.0;
            bodyOpacity = 1.0;

            tarotOpacity = 0.0;
            tarotTranslateY = 0;
            tarotScale = 0.85;
            tarotBlur = 15.0;
            tarotTextOpacity = 1.0;
            leftY = 14.0 * vh / 100;
            centerY = 0;
            rightY = 14.0 * vh / 100;
          } else if (p < p2) {
            // Phase 2: Intro text fades out & Tarot grid blur-fade-zooms in over 2s snap transition (p = p1 to p2)
            blurAmount = 0.0;
            
            // Intro text fades out completely in the first half of the step
            const textFadeT = (p - p1) / ((p2 - p1) * 0.6);
            containerOpacity = 1.0 - smoothstep(0.0, 1.0, clamp01(textFadeT));
            headerOpacity = 1.0;
            bodyOpacity = 1.0;

            // Tarot cards blur-fade-zoom in over the entire step (duration is 2s!)
            const tTarot = (p - p1) / (p2 - p1);
            const easedTTarot = smoothstep(0.0, 1.0, clamp01(tTarot));
            tarotOpacity = easedTTarot;
            tarotScale = 0.85 + 0.15 * easedTTarot;
            tarotBlur = (1.0 - easedTTarot) * 15.0;

            tarotTranslateY = 0;
            tarotTextOpacity = 1.0;
            leftY = 14.0 * vh / 100;
            centerY = 0;
            rightY = 14.0 * vh / 100;
          } else if (p < p3) {
            // Phase 3: Tarot grid fully visible, cards scroll up staggered over 3 distinct scroll targets (p = p2 to p3)
            blurAmount = 0.0;
            containerOpacity = 0.0;
            
            tarotOpacity = 1.0;
            tarotTranslateY = 0;
            tarotScale = 1.0;
            tarotBlur = 0.0;

            const tScroll = (p - p2) / (p3 - p2);
            const easedTScroll = smoothstep(0.0, 1.0, clamp01(tScroll));

            // Fade out the text when the cards scroll up
            tarotTextOpacity = 1.0 - smoothstep(0.0, 0.25, easedTScroll);

            // Center column translates by 135vh (completely scrolls all 4 cards up and off top)
            centerY = -easedTScroll * 135.0 * vh / 100;
            // Side columns translate by 135vh (starting at 14vh offset, ending at -121vh offset)
            leftY = (14.0 - easedTScroll * 135.0) * vh / 100;
            rightY = (14.0 - easedTScroll * 135.0) * vh / 100;
          } else {
            // Phase 4: Tarot grid and overlay fade out (p = p3 to p4)
            blurAmount = 0.0;
            containerOpacity = 0.0;

            const tExit = (p - p3) / (p4 - p3);
            const easedTExit = smoothstep(0.0, 1.0, clamp01(tExit));
            tarotOpacity = 1.0 - easedTExit;
            tarotTranslateY = -easedTExit * 30;
            tarotScale = 1.0;
            tarotBlur = 0.0;
            tarotTextOpacity = 0.0;
            
            leftY = -121.0 * vh / 100 - easedTExit * 20.0 * vh / 100;
            centerY = -135.0 * vh / 100 - easedTExit * 20.0 * vh / 100;
            rightY = -121.0 * vh / 100 - easedTExit * 20.0 * vh / 100;
            overlayBgOpacity = 0.4 - easedTExit * 0.4;
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

          // Apply Tarot container styles
          tarotContainerRef.current.style.opacity = String(tarotOpacity);
          tarotContainerRef.current.style.transform = `translate3d(0, ${tarotTranslateY}px, 0) scale(${tarotScale})`;
          tarotContainerRef.current.style.filter = tarotBlur > 0.1 ? `blur(${tarotBlur}px)` : "none";
          tarotContainerRef.current.style.display = tarotOpacity > 0.005 ? "flex" : "none";
          
          // Apply text fade out
          tarotTextRef.current.style.opacity = String(tarotTextOpacity);
          
          // Apply independent column translations
          col1Ref.current.style.transform = `translate3d(0, ${leftY}px, 0)`;
          col2Ref.current.style.transform = `translate3d(0, ${centerY}px, 0)`;
          col3Ref.current.style.transform = `translate3d(0, ${rightY}px, 0)`;

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
          50% { transform: translateY(-24px) rotate(2deg); }
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

      {/* Tarot Cards Layout (spanning the full height of the viewport with a screen-height gradient mask) */}
      <div
        ref={tarotContainerRef}
        className="fixed inset-0 z-[47] flex flex-col items-center justify-start select-none text-center pointer-events-none"
        style={{ display: "none", opacity: 0 }}
      >
        {/* Header & Body Text overlayed */}
        <div 
          ref={tarotTextRef}
          className="relative z-10 flex flex-col items-center pt-[8vh] px-[6vw] mb-[2vh] pointer-events-auto transition-opacity duration-300"
        >
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
              filter: "drop-shadow(0 0 3px rgba(255,255,255,0.15)) drop-shadow(0 2px 4px rgba(6, 18, 56, 0.4)) drop-shadow(0 4px 12px rgba(6, 12, 36, 0.35))",
            }}
          >
            WHAT THE CARDS REVEAL
          </h2>
          <p 
            className="mt-2 font-sans text-[clamp(0.9rem,1.1vw,1.15rem)] font-light text-[#c8ddf0]/80 cursor-default"
            style={{
              filter: "drop-shadow(0 2px 6px rgba(6, 12, 36, 0.35))",
            }}
          >
            Proof that we didn&apos;t make this up.
          </p>
        </div>

        {/* Full Viewport Height scrollable window. Cards fade out naturally at the very top and bottom edges of the screen */}
        <div 
          className="absolute inset-x-0 top-0 h-[100vh] overflow-hidden pointer-events-auto z-0"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 2%, white 14%, white 86%, transparent 98%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 2%, white 14%, white 86%, transparent 98%)"
          }}
        >
          <div className="flex flex-row justify-center gap-x-[3.5vw] w-full pt-[46vh]">
            {/* Column 1 (Left): Cards 1, 4, 7, 10 */}
            <div
              ref={col1Ref}
              className="flex flex-col gap-y-[3.5vh] w-[clamp(100px,12.5vw,200px)] transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              {[1, 4, 7, 10].map((imgIdx, idx) => (
                <div
                  key={imgIdx}
                  className="w-full aspect-[1/1.42] rounded-2xl overflow-hidden border border-sky-300/10 hover:border-sky-300/30 bg-[#060c24]/80 shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-[1.05]"
                  style={{
                    animation: `tarotCardFloat ${["6.2s", "6.4s", "6.6s", "6.0s"][idx]} ease-in-out infinite`,
                    animationDelay: ["0s", "0.3s", "0.6s", "0.2s"][idx],
                  }}
                >
                  <img
                    src={`/tarot/tarot-back-${imgIdx}.jpg`}
                    alt={`Tarot Card Back ${imgIdx}`}
                    className="w-full h-full object-cover pointer-events-none select-none"
                  />
                </div>
              ))}
            </div>

            {/* Column 2 (Center): Cards 2, 5, 8, 11 */}
            <div
              ref={col2Ref}
              className="flex flex-col gap-y-[3.5vh] w-[clamp(100px,12.5vw,200px)] transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              {[2, 5, 8, 11].map((imgIdx, idx) => (
                <div
                  key={imgIdx}
                  className="w-full aspect-[1/1.42] rounded-2xl overflow-hidden border border-sky-300/10 hover:border-sky-300/30 bg-[#060c24]/80 shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-[1.05]"
                  style={{
                    animation: `tarotCardFloat ${["6.7s", "6.9s", "6.3s", "6.5s"][idx]} ease-in-out infinite`,
                    animationDelay: ["0.8s", "1.1s", "1.3s", "1.0s"][idx],
                  }}
                >
                  <img
                    src={`/tarot/tarot-back-${imgIdx}.jpg`}
                    alt={`Tarot Card Back ${imgIdx}`}
                    className="w-full h-full object-cover pointer-events-none select-none"
                  />
                </div>
              ))}
            </div>

            {/* Column 3 (Right): Cards 3, 6, 9, 12 */}
            <div
              ref={col3Ref}
              className="flex flex-col gap-y-[3.5vh] w-[clamp(100px,12.5vw,200px)] transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              {[3, 6, 9, 12].map((imgIdx, idx) => (
                <div
                  key={imgIdx}
                  className="w-full aspect-[1/1.42] rounded-2xl overflow-hidden border border-sky-300/10 hover:border-sky-300/30 bg-[#060c24]/80 shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-[1.05]"
                  style={{
                    animation: `tarotCardFloat ${["5.9s", "6.1s", "6.8s", "7.0s"][idx]} ease-in-out infinite`,
                    animationDelay: ["1.5s", "1.9s", "1.7s", "1.2s"][idx],
                  }}
                >
                  <img
                    src={`/tarot/tarot-back-${imgIdx}.jpg`}
                    alt={`Tarot Card Back ${imgIdx}`}
                    className="w-full h-full object-cover pointer-events-none select-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
