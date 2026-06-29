"use client";

import { useEffect, useRef, useState } from "react";
import { scroll, pointer, damp } from "@/lib/state";
import InteractiveTypography from "./InteractiveTypography";

interface ServicesSectionProps {
  isServicesRoute?: boolean;
}

interface ServiceCardProps {
  header: string;
  description: string;
  className?: string;
  delayIndex: number;
}

function ServiceCard({ header, description, className = "", delayIndex }: ServiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showBackFace, setShowBackFace] = useState(false);
  const [showText, setShowText] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [displayText, setDisplayText] = useState(header);
  const scrambleInterval = useRef<any>(null);
  const flippingTimeoutRef = useRef<any>(null);
  const faceTimeoutRef = useRef<any>(null);
  const hoverStartTimeRef = useRef<number>(0);

  // Scramble animation
  const scramble = () => {
    const chars = "!<>-_\\/[]{}=+*^?#";
    let iterations = 0;
    
    if (scrambleInterval.current) clearInterval(scrambleInterval.current);
    
    scrambleInterval.current = setInterval(() => {
      setDisplayText(
        header
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iterations) return header[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );
      
      iterations += 0.5; // Scramble speed factor
      if (iterations >= header.length + 1) {
        clearInterval(scrambleInterval.current);
        setDisplayText(header);
      }
    }, 30);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowText(false);
    hoverStartTimeRef.current = performance.now();
    
    if (faceTimeoutRef.current) clearTimeout(faceTimeoutRef.current);
    faceTimeoutRef.current = setTimeout(() => {
      setShowBackFace(true);
    }, 300); // Swap face halfway through the 600ms transition
    
    if (flippingTimeoutRef.current) clearTimeout(flippingTimeoutRef.current);
    flippingTimeoutRef.current = setTimeout(() => {
      setShowText(true);
    }, 600); // Matches the 0.6s CSS flip transition duration
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowText(false);
    hoverStartTimeRef.current = 0;
    
    if (faceTimeoutRef.current) clearTimeout(faceTimeoutRef.current);
    faceTimeoutRef.current = setTimeout(() => {
      setShowBackFace(false);
    }, 300); // Swap face halfway through the reset transition
    
    if (flippingTimeoutRef.current) clearTimeout(flippingTimeoutRef.current);
    if (scrambleInterval.current) clearInterval(scrambleInterval.current);
    setDisplayText(header);
    if (cardRef.current) {
      cardRef.current.style.transform = "";
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    card.style.setProperty("--mouse-x", `${(x / rect.width) * 100}%`);
    card.style.setProperty("--mouse-y", `${(y / rect.height) * 100}%`);
    
    // Check if the 3D flip transition is still running
    const elapsed = performance.now() - hoverStartTimeRef.current;
    if (elapsed < 600) return; // Prevent tilt overrides during native CSS flip transition
    
    // Tilt calculations
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = (yc - y) / 5; // max 12deg tilt
    const angleY = -(x - xc) / 5; // Inverted since the card is rotated by rotateY(180deg)
    
    card.style.transform = `perspective(800px) rotateY(180deg) rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.06) translateY(-4px)`;
  };

  useEffect(() => {
    if (showText) {
      scramble();
    } else {
      setDisplayText(header);
    }
  }, [showText]);

  useEffect(() => {
    return () => {
      if (scrambleInterval.current) clearInterval(scrambleInterval.current);
      if (flippingTimeoutRef.current) clearTimeout(flippingTimeoutRef.current);
      if (faceTimeoutRef.current) clearTimeout(faceTimeoutRef.current);
    };
  }, []);

  const getCategoryName = (idx: number) => {
    const names = ["IDENTITY", "DIGITAL", "PITCH", "CREATIVE", "PHYSICAL", "SYSTEMS"];
    return names[idx] || "";
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className={`services-glass-card-wrapper w-[192px] h-[127px] relative pointer-events-auto ${className}`}
      style={{
        transitionDelay: `${delayIndex * 80}ms`,
        perspective: "1000px" // Provide 3D perspective context for the child flip
      }}
    >
      <div
        ref={cardRef}
        className="services-glass-card w-full h-full rounded-2xl border flex flex-col justify-center items-start cursor-pointer transition-all"
        style={{
          transformStyle: "preserve-3d"
        }}
      >
        {!showBackFace ? (
          /* Front Face (unhovered cover) */
          <div className="absolute inset-0 p-[18px] flex items-center justify-end w-full h-full select-none">
            <span className="font-display font-thin text-[3.0rem] leading-none text-white/40 tracking-wider">
              0{delayIndex + 1}
            </span>
          </div>
        ) : (
          /* Back Face (hovered content) */
          <div 
            className="absolute inset-0 p-[18px] flex items-center justify-start gap-[14px] w-full h-full"
            style={{
              transform: "rotateY(180deg)"
            }}
          >
            {/* Local Left (Visual Right) - Large Number */}
            <span className="font-display font-thin text-[3.0rem] leading-none text-white/40 tracking-wider select-none">
              0{delayIndex + 1}
            </span>

            {/* Local Right (Visual Left) - Text Content Column aligned with the number height */}
            <div className={`services-glass-card-content flex flex-col justify-center gap-1 max-w-[65%] text-left z-10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              showText ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-2"
            }`}>
              <span className="font-display font-semibold text-[0.74rem] tracking-[0.05em] services-card-header-glow uppercase leading-tight">
                {displayText}
              </span>
              <p className="font-sans text-[0.74rem] leading-snug text-[#c8ddf0]/85">
                {description}
              </p>
            </div>

            <div className="services-glass-card-border-wrap">
              <div className="services-glass-card-border-light" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServicesSection({ isServicesRoute = false }: ServicesSectionProps) {
  const bgRef = useRef<HTMLDivElement>(null);
  const vRef1 = useRef<HTMLVideoElement>(null);
  const vRef2 = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const blurPatchRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<any>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const bottomTextRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(1);
  const hasTriggeredAutoScroll = useRef(false);
  const lenisListenerRef = useRef<any>(null);

  useEffect(() => {
    let raf = 0;
    let lastTime = performance.now();

    const tick = () => {
      const p3 = scroll.section3;
      const rawScroll = scroll.raw;
      const vh = typeof window !== "undefined" ? window.innerHeight : 900;
      const section3Start = 5.2 * vh;
      const section4Start = 22.2 * vh;
      const step7Pos = 23.2 * vh;
      const step8Pos = 24.2 * vh;
      const section5Start = 27.2 * vh;

      // Register Lenis listener once the instance is available
      if (scroll.lenisInstance && !lenisListenerRef.current) {
        const handleLenisScroll = (e: any) => {
          const currentScroll = e.scroll;
          const currentVh = window.innerHeight;
          const minScroll = 24.2 * currentVh;
          const maxScroll = 26.5 * currentVh;
          const targetScroll = 27.2 * currentVh;

          // Reset trigger if scrolled back above the cards, or deep past testimonials
          if (currentScroll < 24.0 * currentVh || currentScroll > 28.5 * currentVh) {
            hasTriggeredAutoScroll.current = false;
          }

          // Trigger transition if scrolling down in active zone
          if (
            currentScroll >= minScroll &&
            currentScroll < maxScroll &&
            e.direction === 1 &&
            !hasTriggeredAutoScroll.current
          ) {
            hasTriggeredAutoScroll.current = true;
            scroll.lenisInstance.stop();

            const safetyTimeout = setTimeout(() => {
              if (scroll.lenisInstance) scroll.lenisInstance.start();
            }, 2200);

            scroll.lenisInstance.scrollTo(targetScroll, {
              duration: 1.5,
              easing: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
              onComplete: () => {
                clearTimeout(safetyTimeout);
                if (scroll.lenisInstance) scroll.lenisInstance.start();
              }
            });
          }
        };

        lenisListenerRef.current = handleLenisScroll;
        scroll.lenisInstance.on("scroll", handleLenisScroll);
      }

      const now = performance.now();
      const dt = Math.min(0.03, (now - lastTime) / 1000);
      lastTime = now;

      // Update pointer values (smoothed mouse target)
      pointer.x = damp(pointer.x, pointer.tx, 4, dt);
      pointer.y = damp(pointer.y, pointer.ty, 4, dt);

      let opacity = 0;
      let scale = 1.0;
      let contentOpacity = 0;
      let blurOpacity = 0;
      let vignetteOpacity = 0;
      let cardsOpacity = 0;
      let cardsTranslateY = 20; // px
      let contentTranslateY = 30; // px
      let shiftFactor = 0;

      // Force showing default browser cursor in Services section by removing hide-cursor class
      if (isServicesRoute || rawScroll >= section4Start) {
        document.body.classList.remove("hide-cursor");
      }

      let exitOpacity = 1.0;
      let exitZoomFactor = 1.0;
      if (scroll.section4 > 3.9 / 5.0) {
        const tExit = Math.min(Math.max((scroll.section4 - 3.9 / 5.0) / (1.1 / 5.0), 0.0), 1.0);
        exitOpacity = 1.0 - tExit * tExit * (3 - 2 * tExit);
        exitZoomFactor = 1.0 + tExit * 0.28;
      }

      if (rawScroll >= section4Start) {
        opacity = 1.0;
        shiftFactor = 1.0;

        if (rawScroll < step7Pos) {
          // Scroll 1: From Step 13 (22.2vh) to Step 14 (23.2vh). Text fades in, video zooms to 1.03.
          const t = Math.min((rawScroll - section4Start) / (1.0 * vh), 1.0);
          const easedT = t * t * (3 - 2 * t);
          contentOpacity = easedT;
          blurOpacity = 1.0; // Blur overlay is fully present as soon as we land
          vignetteOpacity = 0.0;
          cardsOpacity = 0.0;
          cardsTranslateY = 20;
          contentTranslateY = 30 - easedT * 30;
          scale = 1.05 + easedT * 0.01;
        } else if (rawScroll < step8Pos) {
          // Scroll 2: From Step 14 (23.2vh) to Step 15 (24.2vh). Text fades out, video zooms to 1.04.
          const t = Math.min((rawScroll - step7Pos) / (1.0 * vh), 1.0);
          const easedT = t * t * (3 - 2 * t);
          contentOpacity = 1.0 - easedT;
          blurOpacity = 1.0 - easedT; // Blur fades out in sync with the text
          vignetteOpacity = easedT;   // Vignette fades in as text/blur fade out
          cardsOpacity = easedT;      // Liquid glass cards fade in as text/blur fade out
          cardsTranslateY = 20 - easedT * 20;
          contentTranslateY = -easedT * 30;
          scale = 1.06 + easedT * 0.01;
        } else {
          // Past Step 15 (24.2vh+)
          contentOpacity = 0.0;
          blurOpacity = 0.0;
          vignetteOpacity = 1.0;
          cardsOpacity = 1.0;
          cardsTranslateY = 0;
          contentTranslateY = -30;
          scale = 1.07;
        }
      } else {
        // Transition from Section 3 (Works) into Section 4 (Services)
        if (p3 > 15.9 / 17.0) {
          const t = (p3 - 15.9 / 17.0) / (1.1 / 17.0);
          const easedT = t * t * (3 - 2 * t);
          opacity = easedT;
          blurOpacity = easedT; // Blur fades in smoothly during the entry transition
          vignetteOpacity = 0.0;
          cardsOpacity = 0.0;
          cardsTranslateY = 20;
          scale = 1.05; // Baseline scale for services section
          shiftFactor = easedT;
        }
      }

      scale = scale * exitZoomFactor;

      if (bgRef.current) {
        const finalBgOpacity = opacity * exitOpacity;
        bgRef.current.style.opacity = String(finalBgOpacity);
        bgRef.current.style.display = finalBgOpacity > 0.005 ? "block" : "none";
      }

      const v1 = vRef1.current;
      const v2 = vRef2.current;
      // Play video during the zoom-in transition from Section 3 or when section 4 is active
      const active = isServicesRoute || rawScroll >= (section4Start - 100) || p3 > 15.9 / 17.0;

      if (v1 && v2) {
        if (!active) {
          if (!v1.paused) v1.pause();
          if (!v2.paused) v2.pause();
        } else {
          // Play the active video immediately without waiting for durations to load
          if (activeRef.current === 1) {
            if (v1.paused) v1.play().catch(() => {});
            
            if (v1.duration && v2.duration) {
              const crossfadeTime = 1.5;
              const dur1 = v1.duration;
              const t1 = v1.currentTime;
              if (t1 >= dur1 - crossfadeTime) {
                if (v2.paused) {
                  v2.currentTime = 0;
                  v2.play().catch(() => {});
                }
                const ratio = Math.min((t1 - (dur1 - crossfadeTime)) / crossfadeTime, 1.0);
                v1.style.opacity = String((1.0 - ratio) * exitOpacity);
                v2.style.opacity = String(ratio * exitOpacity);
              } else {
                v1.style.opacity = String(exitOpacity);
                v2.style.opacity = "0";
                if (!v2.paused) v2.pause();
              }

              if (t1 >= dur1 - 0.1) {
                activeRef.current = 2;
              }
            } else {
              // Fallback opacity if durations are not loaded yet
              v1.style.opacity = String(exitOpacity);
              v2.style.opacity = "0";
            }
          } else {
            if (v2.paused) v2.play().catch(() => {});

            if (v1.duration && v2.duration) {
              const crossfadeTime = 1.5;
              const dur2 = v2.duration;
              const t2 = v2.currentTime;
              if (t2 >= dur2 - crossfadeTime) {
                if (v1.paused) {
                  v1.currentTime = 0;
                  v1.play().catch(() => {});
                }
                const ratio = Math.min((t2 - (dur2 - crossfadeTime)) / crossfadeTime, 1.0);
                v1.style.opacity = String(ratio * exitOpacity);
                v2.style.opacity = String((1.0 - ratio) * exitOpacity);
              } else {
                v1.style.opacity = "0";
                v2.style.opacity = String(exitOpacity);
                if (!v1.paused) v1.pause();
              }

              if (t2 >= dur2 - 0.1) {
                activeRef.current = 1;
              }
            } else {
              // Fallback opacity if durations are not loaded yet
              v1.style.opacity = "0";
              v2.style.opacity = String(exitOpacity);
            }
          }
        }

        // Shift background videos in opposite direction of mouse for parallax pan
        const xShift = -pointer.x * 24.0 * shiftFactor;
        const yShift = -pointer.y * 24.0 * shiftFactor;
        const transformStr = `translate3d(${xShift}px, ${yShift}px, 0) scale(${scale})`;
        
        v1.style.transform = transformStr;
        v2.style.transform = transformStr;
      }

      if (contentRef.current) {
        contentRef.current.style.opacity = String(contentOpacity * exitOpacity);
        contentRef.current.style.transform = `translate3d(0, ${contentTranslateY}px, 0)`;
        contentRef.current.style.display = (contentOpacity * exitOpacity) > 0.005 ? "flex" : "none";
      }

      if (blurPatchRef.current) {
        blurPatchRef.current.style.opacity = String(blurOpacity * exitOpacity);
        blurPatchRef.current.style.display = (blurOpacity * exitOpacity) > 0.005 ? "block" : "none";
      }

      if (cardsContainerRef.current) {
        const finalCardsOpacity = cardsOpacity * exitOpacity;
        cardsContainerRef.current.style.transform = `translate3d(0, ${cardsTranslateY}px, 0)`;
        cardsContainerRef.current.style.display = finalCardsOpacity > 0.005 ? "flex" : "none";
        cardsContainerRef.current.style.setProperty("--cards-opacity", String(finalCardsOpacity));
      }

      if (bottomTextRef.current) {
        const finalBottomOpacity = cardsOpacity * exitOpacity;
        bottomTextRef.current.style.opacity = String(finalBottomOpacity);
        bottomTextRef.current.style.display = finalBottomOpacity > 0.005 ? "flex" : "none";
      }

      if (vignetteRef.current) {
        const finalVignetteOpacity = vignetteOpacity * exitOpacity;
        vignetteRef.current.style.opacity = String(finalVignetteOpacity);
        vignetteRef.current.style.display = finalVignetteOpacity > 0.005 ? "block" : "none";

        // Calculate spotlight pixel coordinates from normalized pointer
        const w = typeof window !== "undefined" ? window.innerWidth : 1920;
        const h = typeof window !== "undefined" ? window.innerHeight : 1080;
        const spotX = ((pointer.x + 1) / 2) * w;
        const spotY = ((1 - pointer.y) / 2) * h;

        // Promote to hardware-accelerated layer to stack correctly
        vignetteRef.current.style.transform = `translate3d(0, 0, 0)`;

        // Update the SVG circle coordinates in the mask
        const mouseSpot = vignetteRef.current.querySelector("#mouse-spot");
        if (mouseSpot) {
          mouseSpot.setAttribute("cx", String(spotX));
          mouseSpot.setAttribute("cy", String(spotY));
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (lenisListenerRef.current && scroll.lenisInstance) {
        scroll.lenisInstance.off("scroll", lenisListenerRef.current);
      }
      if (scroll.lenisInstance) {
        scroll.lenisInstance.start();
      }
    };
  }, [isServicesRoute]);

  return (
    <>
      {/* Background Video container with perspective for 3D pan/tilt rotation */}
      <div
        ref={bgRef}
        id="services-section-bg"
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{
          zIndex: 45,
          opacity: isServicesRoute ? 1 : 0,
          display: isServicesRoute ? "block" : "none",
          perspective: "1000px",
        }}
      >
        <video
          ref={vRef1}
          src="/services-bg.mp4"
          preload="metadata"
          muted
          playsInline
          className="absolute object-cover"
          style={{
            width: "calc(100% + 80px)",
            height: "calc(100% + 80px)",
            top: "-40px",
            left: "-40px",
            opacity: 1,
            maxWidth: "none",
            maxHeight: "none"
          }}
        />
        <video
          ref={vRef2}
          src="/services-bg.mp4"
          preload="metadata"
          muted
          playsInline
          className="absolute object-cover"
          style={{
            width: "calc(100% + 80px)",
            height: "calc(100% + 80px)",
            top: "-40px",
            left: "-40px",
            opacity: 0,
            maxWidth: "none",
            maxHeight: "none"
          }}
        />
        {/* Fullscreen subtle blur overlay to match home page blur style and enhance text legibility, fading out with the text */}
        <div
          ref={blurPatchRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            backgroundColor: "rgba(10, 9, 22, 0.12)",
            opacity: isServicesRoute ? 1 : 0,
            display: isServicesRoute ? "block" : "none",
          }}
        />
      </div>

      {/* Six liquid glass cards, fading in as the text/blur fade out (moved outside of 3D transformed container) */}
      <div
        ref={cardsContainerRef}
        className="fixed inset-0 flex items-center justify-between px-[6vw] pointer-events-none select-none"
        style={{
          zIndex: 47,
          display: "none",
        }}
      >
        {/* Left Column - Shifted 2px closer to the center */}
        <div className="flex flex-col gap-[4vh] items-start pointer-events-auto translate-x-[2px]">
          <ServiceCard
            header="Brand Identity"
            description="For ideas looking for a personality."
            delayIndex={0}
          />
          <ServiceCard
            header="Websites"
            description="For ideas that deserve a world of their own."
            className="translate-x-[-35px]"
            delayIndex={1}
          />
          <ServiceCard
            header={"Interactive Pitch\u00a0Decks"}
            description="For ideas that need believers."
            delayIndex={2}
          />
        </div>

        {/* Right Column - Shifted 2px closer to the center */}
        <div className="flex flex-col gap-[4vh] items-end pointer-events-auto -translate-x-[2px]">
          <ServiceCard
            header="Art Direction"
            description="For ideas that are easier to show than explain."
            delayIndex={3}
          />
          <ServiceCard
            header="Packaging"
            description="For ideas people can hold."
            className="translate-x-[35px]"
            delayIndex={4}
          />
          <ServiceCard
            header="Creative Systems"
            description="For ideas that need the pieces to connect."
            delayIndex={5}
          />
        </div>
      </div>

      {/* Bottom Shimmer Narrative Text */}
      <div
        ref={bottomTextRef}
        className="fixed bottom-[7vh] left-0 right-0 flex flex-col items-center gap-[7px] pointer-events-none text-center select-none"
        style={{
          zIndex: 49,
          display: "none",
        }}
      >
        <span className="font-display font-light text-[clamp(1.0rem,1.4vw,1.25rem)] tracking-[0.18em] uppercase hero-glow-text select-none">
          The darkness isn&apos;t empty.
        </span>
        <span className="font-display font-light text-[clamp(1.0rem,1.4vw,1.25rem)] tracking-[0.18em] uppercase hero-glow-text select-none">
          It&apos;s waiting.
        </span>
        <span className="font-display font-medium text-[clamp(0.6rem,0.8vw,0.75rem)] tracking-[0.2em] uppercase hero-glow-text select-none mt-1">
          HOVER TO DISCOVER.
        </span>
      </div>

      {/* Fullscreen vignette overlay rendered on top of the cards to shade them near the corners */}
      <svg
        ref={vignetteRef}
        className="fixed inset-0 pointer-events-none w-full h-full"
        style={{
          zIndex: 48,
          display: "none",
          opacity: 0,
        }}
      >
        <defs>
          <filter id="spotlight-blur" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="55" />
          </filter>
          <mask id="spotlight-mask">
            {/* The white background keeps the overlay visible (opaque black) */}
            <rect width="100%" height="100%" fill="white" />
            {/* The static center circle cuts a transparent hole in the center to keep the video bright */}
            <circle cx="50%" cy="50%" r="240" fill="black" filter="url(#spotlight-blur)" />
            {/* The dynamic mouse circle cuts a transparent spotlight under the cursor to reveal the cards */}
            <circle id="mouse-spot" cx="-500" cy="-500" r="120" fill="black" filter="url(#spotlight-blur)" />
          </mask>
        </defs>
        {/* The shaded overlay rect */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(4, 4, 12, 0.95)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Services text overlay container */}
      <div
        ref={contentRef}
        id="services-section-content"
        className="fixed inset-0 flex flex-col justify-center px-[6vw] pointer-events-none select-none"
        style={{
          zIndex: 49,
          opacity: isServicesRoute ? 1 : 0,
          display: isServicesRoute ? "flex" : "none",
        }}
      >
        <div className="w-full max-w-[1200px] mx-auto flex flex-col items-center text-center pointer-events-auto">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-2">
            <span className="h-[1px] w-5 bg-white/35" />
            <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.25em] text-[#71b4ff]/90">
              METHODOLOGY
            </span>
            <span className="h-[1px] w-5 bg-white/35" />
          </div>

          {/* Title Container styled to match MorphSection */}
          <div className="mb-2 w-full overflow-visible pb-2 pt-1 flex items-center justify-center">
            <h2 className="font-display font-light text-[clamp(1.8rem,3.2vw,3.0rem)] leading-tight text-white hero-glow-text animate-glow-pulse"
                style={{
                  filter: "drop-shadow(0 0 3px rgba(255,255,255,0.15)) drop-shadow(0 2px 4px rgba(6, 18, 56, 0.4)) drop-shadow(0 6px 12px rgba(6, 18, 56, 0.4)) drop-shadow(0 12px 24px rgba(6, 18, 56, 0.4))"
                }}
            >
              What Tends to Happen Here
            </h2>
          </div>

          {/* Body Narrative Wrapper styled to match MorphSection */}
          <div className="flex flex-col items-center justify-center w-full transition-all duration-75">
            <InteractiveTypography
              text="Some projects arrive as half-formed ideas. Others arrive with spreadsheets, deadlines, and a mild identity crisis."
              className="mt-4 w-[88ch] max-w-[92vw] font-sans text-[clamp(0.8125rem,0.9vw,0.9625rem)] font-light leading-relaxed text-white/80 hover:text-white transition-colors duration-300 text-center"
            />
            <InteractiveTypography
              text="Somewhere along the way, they become brands, websites, presentations, campaigns, treatments, packaging, and experiences that feel a little more intentional, a little more memorable, and a lot harder to ignore."
              className="mt-6 w-[88ch] max-w-[92vw] font-sans text-[clamp(0.8125rem,0.9vw,0.9625rem)] font-light leading-relaxed text-white/80 hover:text-white transition-colors duration-300 text-center"
            />
            <InteractiveTypography
              text="No two projects follow the same path, but they usually begin the same way: with curiosity, conversation, and a willingness to look a little closer."
              className="mt-6 w-[88ch] max-w-[92vw] font-sans text-[clamp(0.8125rem,0.9vw,0.9625rem)] font-light leading-relaxed text-white/80 hover:text-white transition-colors duration-300 text-center"
            />
          </div>
        </div>
      </div>
    </>
  );
}
