"use client";
import { useEffect, useRef, useState } from "react";
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

  interface CardCoords {
    idx: number;
    startRect: { left: number; top: number; width: number; height: number };
  }

  const [activeCard, setActiveCard] = useState<CardCoords | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isTransitioningBack, setIsTransitioningBack] = useState(false);

  const handleCardClick = (imgIdx: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (activeCard || isOpening || isTransitioningBack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveCard({
      idx: imgIdx,
      startRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
    });
    // Allow React to mount the overlay at startRect, then animate in the next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsOpening(true);
      });
    });
    scroll.lenisInstance?.stop();
  };

  const handleCloseCard = () => {
    if (isTransitioningBack) return;
    setIsOpening(false);
    setIsTransitioningBack(true);
    setTimeout(() => {
      setActiveCard(null);
      setIsTransitioningBack(false);
      scroll.lenisInstance?.start();
    }, 600);
  };

  const getCardTitle = (idx: number) => {
    switch (idx) {
      case 1: return "The Silent Force";
      case 2: return "The Pathfinder";
      case 3: return "The Catalyst";
      case 4: return "The Vanguard";
      case 5: return "The Craftsman";
      case 6: return "The Architect";
      case 7: return "The Visionary";
      case 8: return "The Giant";
      case 9: return "The Guardian";
      case 10: return "The Current";
      case 11: return "The Legacy";
      case 12: return "The Voyager";
      default: return "";
    }
  };

  const getCardBottom = (idx: number) => {
    if (idx === 10) return "4%"; // Sea Lion (The Current)
    if (idx === 9) return "5%";  // Octopus (The Guardian)
    if (idx === 11) return "7%"; // Shark (The Legacy)
    if (idx === 7 || idx === 8) return "8%"; // Lobster (The Visionary), Whale (The Giant)
    if (idx === 12) return "10%"; // Dolphin (The Voyager)
    if (idx === 4) return "11%"; // Sea Turtle (The Vanguard)
    return "9%"; // Default
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseCard();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCard, isTransitioningBack]);

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

            // Center column translates by 135vh (completely scrolls all 4 cards up and off top)
            centerY = -easedTScroll * 135.0 * vh / 100;
            // Side columns translate by 135vh (starting at 14vh offset, ending at -121vh offset)
            leftY = (14.0 - easedTScroll * 135.0) * vh / 100;
            rightY = (14.0 - easedTScroll * 135.0) * vh / 100;

            // Fade out the text exactly in sync with the first card moving up: starting immediately and completing by 15vh of travel
            const textFadeProgress = clamp01(Math.abs(centerY) / (15.0 * vh / 100));
            tarotTextOpacity = 1.0 - smoothstep(0.0, 1.0, textFadeProgress);
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
          50% { transform: translateY(-12px) rotate(1deg); }
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
        {/* Volumetric Spotlight from above behind the cards */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-45 mix-blend-screen"
          style={{
            background: "radial-gradient(circle at 50% -10%, rgba(56, 189, 248, 0.22) 0%, rgba(14, 165, 233, 0.05) 45%, transparent 75%)",
          }}
        />

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
            className="hero-glow-text hero-glow-text-waterfall font-display text-[clamp(1.8rem,3.2vw,3rem)] font-light leading-tight uppercase tracking-wide cursor-default"
            style={{
              filter:
                "drop-shadow(0 0 3px rgba(255,255,255,0.15)) drop-shadow(0 2px 4px rgba(6, 18, 56, 0.4)) drop-shadow(0 6px 12px rgba(6, 18, 56, 0.4)) drop-shadow(0 12px 24px rgba(6, 18, 56, 0.4))",
            }}
          >
            What The Cards Reveal
          </h2>
          <p 
            className="mt-2 font-sans text-[clamp(0.9rem,1.1vw,1.15rem)] font-medium text-white cursor-default"
            style={{
              textShadow: "0 1px 3px rgba(6, 12, 36, 0.5)",
            }}
          >
            Should the stars align, this could be your story too.
          </p>
          <p 
            className="mt-1 font-sans text-[clamp(0.75rem,0.85vw,0.9rem)] font-light text-white tracking-[0.1em] cursor-default uppercase"
            style={{
              textShadow: "0 1px 3px rgba(6, 12, 36, 0.5)",
            }}
          >
            Proof we didn&apos;t make this up.
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
          <div className="flex flex-row justify-center gap-x-[5.2vw] w-full pt-[46vh]">
            {/* Column 1 (Left): Cards 1, 4, 7, 10 */}
            <div
              ref={col1Ref}
              className="flex flex-col gap-y-[5.2vh] w-[clamp(100px,11.5vw,190px)] transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              {[1, 4, 7, 10].map((imgIdx, idx) => (
                <div
                  key={imgIdx}
                  className="w-full aspect-[1/1.42]"
                  style={{
                    animation: `tarotCardFloat ${["6.2s", "6.4s", "6.6s", "6.0s"][idx]} ease-in-out infinite`,
                    animationDelay: ["0s", "0.3s", "0.6s", "0.2s"][idx],
                    opacity: activeCard?.idx === imgIdx ? 0 : 1,
                    pointerEvents: activeCard?.idx === imgIdx ? "none" : "auto",
                    transition: "opacity 0.2s ease-in-out",
                  }}
                >
                  <div
                    className="w-full h-full rounded-2xl overflow-hidden border border-sky-400/20 hover:border-sky-300/60 bg-[#060c24]/90 transition-all duration-300 hover:scale-[1.05] cursor-pointer shadow-[0_25px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(56,189,248,0.12),inset_0_0_15px_rgba(56,189,248,0.25)] hover:shadow-[0_35px_65px_rgba(0,0,0,0.95),0_0_45px_rgba(56,189,248,0.35),inset_0_0_20px_rgba(56,189,248,0.4)]"
                    onClick={(e) => handleCardClick(imgIdx, e)}
                  >
                    <div className="relative w-full h-full">
                      <img
                        src={`/tarot/tarot-back-${imgIdx}.jpg`}
                        alt={`Tarot Card Back ${imgIdx}`}
                        className="w-full h-full object-cover pointer-events-none select-none"
                      />
                      {/* Inner Rim Light / Glow Overlay on top of the image */}
                      <div 
                        className="absolute inset-0 pointer-events-none rounded-2xl" 
                        style={{
                          boxShadow: "inset 0 0 16px rgba(56, 189, 248, 0.45)",
                          border: "1px solid rgba(56, 189, 248, 0.25)"
                        }}
                      />
                      {/* Card Title overlay on card back */}
                      <div 
                        className="absolute inset-x-0 text-center pointer-events-none z-10 px-2"
                        style={{
                          bottom: getCardBottom(imgIdx)
                        }}
                      >
                        <span 
                          className="hero-glow-text hero-glow-text-waterfall font-display text-[clamp(0.68rem,0.78vw,0.98rem)] font-light tracking-wide uppercase whitespace-nowrap block"
                          style={{
                            filter: "drop-shadow(0 2px 4px rgba(6, 18, 56, 0.8))",
                          }}
                        >
                          {getCardTitle(imgIdx)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 2 (Center): Cards 2, 5, 8, 11 */}
            <div
              ref={col2Ref}
              className="flex flex-col gap-y-[5.2vh] w-[clamp(100px,11.5vw,190px)] transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              {[2, 5, 8, 11].map((imgIdx, idx) => (
                <div
                  key={imgIdx}
                  className="w-full aspect-[1/1.42]"
                  style={{
                    animation: `tarotCardFloat ${["6.7s", "6.9s", "6.3s", "6.5s"][idx]} ease-in-out infinite`,
                    animationDelay: ["0.8s", "1.1s", "1.3s", "1.0s"][idx],
                    opacity: activeCard?.idx === imgIdx ? 0 : 1,
                    pointerEvents: activeCard?.idx === imgIdx ? "none" : "auto",
                    transition: "opacity 0.2s ease-in-out",
                  }}
                >
                  <div
                    className="w-full h-full rounded-2xl overflow-hidden border border-sky-400/20 hover:border-sky-300/60 bg-[#060c24]/90 transition-all duration-300 hover:scale-[1.05] cursor-pointer shadow-[0_25px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(56,189,248,0.12),inset_0_0_15px_rgba(56,189,248,0.25)] hover:shadow-[0_35px_65px_rgba(0,0,0,0.95),0_0_45px_rgba(56,189,248,0.35),inset_0_0_20px_rgba(56,189,248,0.4)]"
                    onClick={(e) => handleCardClick(imgIdx, e)}
                  >
                    <div className="relative w-full h-full">
                      <img
                        src={`/tarot/tarot-back-${imgIdx}.jpg`}
                        alt={`Tarot Card Back ${imgIdx}`}
                        className="w-full h-full object-cover pointer-events-none select-none"
                      />
                      {/* Inner Rim Light / Glow Overlay on top of the image */}
                      <div 
                        className="absolute inset-0 pointer-events-none rounded-2xl" 
                        style={{
                          boxShadow: "inset 0 0 16px rgba(56, 189, 248, 0.45)",
                          border: "1px solid rgba(56, 189, 248, 0.25)"
                        }}
                      />
                      {/* Card Title overlay on card back */}
                      <div 
                        className="absolute inset-x-0 text-center pointer-events-none z-10 px-2"
                        style={{
                          bottom: getCardBottom(imgIdx)
                        }}
                      >
                        <span 
                          className="hero-glow-text hero-glow-text-waterfall font-display text-[clamp(0.68rem,0.78vw,0.98rem)] font-light tracking-wide uppercase whitespace-nowrap block"
                          style={{
                            filter: "drop-shadow(0 2px 4px rgba(6, 18, 56, 0.8))",
                          }}
                        >
                          {getCardTitle(imgIdx)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 3 (Right): Cards 3, 6, 9, 12 */}
            <div
              ref={col3Ref}
              className="flex flex-col gap-y-[5.2vh] w-[clamp(100px,11.5vw,190px)] transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              {[3, 6, 9, 12].map((imgIdx, idx) => (
                <div
                  key={imgIdx}
                  className="w-full aspect-[1/1.42]"
                  style={{
                    animation: `tarotCardFloat ${["5.9s", "6.1s", "6.8s", "7.0s"][idx]} ease-in-out infinite`,
                    animationDelay: ["1.5s", "1.9s", "1.7s", "1.2s"][idx],
                    opacity: activeCard?.idx === imgIdx ? 0 : 1,
                    pointerEvents: activeCard?.idx === imgIdx ? "none" : "auto",
                    transition: "opacity 0.2s ease-in-out",
                  }}
                >
                  <div
                    className="w-full h-full rounded-2xl overflow-hidden border border-sky-400/20 hover:border-sky-300/60 bg-[#060c24]/90 transition-all duration-300 hover:scale-[1.05] cursor-pointer shadow-[0_25px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(56,189,248,0.12),inset_0_0_15px_rgba(56,189,248,0.25)] hover:shadow-[0_35px_65px_rgba(0,0,0,0.95),0_0_45px_rgba(56,189,248,0.35),inset_0_0_20px_rgba(56,189,248,0.4)]"
                    onClick={(e) => handleCardClick(imgIdx, e)}
                  >
                    <div className="relative w-full h-full">
                      <img
                        src={`/tarot/tarot-back-${imgIdx}.jpg`}
                        alt={`Tarot Card Back ${imgIdx}`}
                        className="w-full h-full object-cover pointer-events-none select-none"
                      />
                      {/* Inner Rim Light / Glow Overlay on top of the image */}
                      <div 
                        className="absolute inset-0 pointer-events-none rounded-2xl" 
                        style={{
                          boxShadow: "inset 0 0 16px rgba(56, 189, 248, 0.45)",
                          border: "1px solid rgba(56, 189, 248, 0.25)"
                        }}
                      />
                      {/* Card Title overlay on card back */}
                      <div 
                        className="absolute inset-x-0 text-center pointer-events-none z-10 px-2"
                        style={{
                          bottom: getCardBottom(imgIdx)
                        }}
                      >
                        <span 
                          className="hero-glow-text hero-glow-text-waterfall font-display text-[clamp(0.68rem,0.78vw,0.98rem)] font-light tracking-wide uppercase whitespace-nowrap block"
                          style={{
                            filter: "drop-shadow(0 2px 4px rgba(6, 18, 56, 0.8))",
                          }}
                        >
                          {getCardTitle(imgIdx)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3D Flip & Fly Testimonial Modal Overlay */}
      {activeCard && (
        <div
          className={`fixed inset-0 z-[60] flex items-center justify-center select-none cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpening && !isTransitioningBack ? "bg-black/75 backdrop-blur-md opacity-100" : "bg-black/0 backdrop-blur-none opacity-0"
          }`}
          onClick={handleCloseCard}
        >
          {/* Close button (X) in top right */}
          <button
            className={`fixed top-6 right-6 z-[70] w-12 h-12 flex items-center justify-center text-white/60 hover:text-white bg-[#060c24]/80 border border-sky-400/20 hover:border-sky-400/60 rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-md cursor-pointer hover:scale-110 shadow-[0_0_15px_rgba(56,189,248,0.15)] ${
              isOpening && !isTransitioningBack ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleCloseCard();
            }}
          >
            <span className="text-xl font-light">✕</span>
          </button>

          {/* 3D Flying/Flipping Card Container */}
          <div
            className="absolute transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              perspective: "1000px",
              ...(isOpening && !isTransitioningBack
                ? {
                    left: "50%",
                    top: "50%",
                    width: "clamp(280px, 30vw, 420px)",
                    height: "clamp(398px, 42.6vw, 596px)",
                    transform: "translate(-50%, -50%)",
                  }
                : {
                    left: `${activeCard.startRect.left}px`,
                    top: `${activeCard.startRect.top}px`,
                    width: `${activeCard.startRect.width}px`,
                    height: `${activeCard.startRect.height}px`,
                    transform: "translate(0, 0)",
                  }),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card Inner with 3D transform-style */}
            <div
              className="relative w-full h-full transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transformStyle: "preserve-3d",
                transform: isOpening && !isTransitioningBack ? "rotateY(180deg)" : "rotateY(0deg)",
                width: "100%",
                height: "100%",
              }}
            >
              {/* Back Face (Card Back Image) */}
              <div
                className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden border border-sky-400/20 bg-[#060c24]/90 shadow-[0_25px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(56,189,248,0.12),inset_0_0_15px_rgba(56,189,248,0.25)]"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(0deg)",
                }}
              >
                <img
                  src={`/tarot/tarot-back-${activeCard.idx}.jpg`}
                  alt={`Tarot Card Back ${activeCard.idx}`}
                  className="w-full h-full object-cover pointer-events-none select-none"
                />
                <div 
                  className="absolute inset-0 pointer-events-none rounded-2xl" 
                  style={{
                    boxShadow: "inset 0 0 16px rgba(56, 189, 248, 0.45)",
                    border: "1px solid rgba(56, 189, 248, 0.25)"
                  }}
                />
              </div>

              {/* Front Face (Blank Testimonial Card Image) */}
              <div
                className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden border border-sky-300/40 bg-[#060c24]/95 shadow-[0_0_50px_rgba(56,189,248,0.55),0_0_100px_rgba(56,189,248,0.25),inset_0_0_20px_rgba(56,189,248,0.4)]"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <img
                  src="/tarot/tarot-blank.png"
                  alt="Testimonial Card Front"
                  className="w-full h-full object-cover pointer-events-none select-none"
                />

                {/* Card Title on the Front face */}
                <div className="absolute top-[8%] inset-x-0 text-center pointer-events-none">
                  <span 
                    className="hero-glow-text hero-glow-text-waterfall font-display text-[clamp(0.9rem,1.2vw,1.4rem)] font-light tracking-wide uppercase"
                    style={{
                      filter: "drop-shadow(0 2px 4px rgba(6, 18, 56, 0.8))",
                    }}
                  >
                    {getCardTitle(activeCard.idx)}
                  </span>
                </div>
                
                {/* Center Content Area for Testimonials */}
                <div className="absolute inset-0 flex items-center justify-center p-8 select-text">
                  {/* Empty placeholder for now */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
