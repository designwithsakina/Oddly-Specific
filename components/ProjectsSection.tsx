"use client";

import { useEffect, useRef, useState } from "react";
import { scroll, pointer, smoothstep, clamp01 } from "@/lib/state";

const PROJECTS = [
  {
    title: "Heineken Fan Experience",
    brand: "Heineken",
    role: "Art Direction & Fan Experience",
    desc: "Crafted immersive, high-energy director's treatments and physical-meets-digital fan experiences for elite global F1 and IPL screenings."
  },
  {
    title: "IPL Fan Arenas",
    brand: "FanCode",
    role: "Experience & Interface Design",
    desc: "Designed next-generation interactive live-screening arenas and visual touchpoints for FanCode's premium IPL community events."
  },
  {
    title: "Lakmé Fashion Week",
    brand: "Lakmé",
    role: "Visual Design & Art Direction",
    desc: "Developed conceptual showcase art direction and visual identity assets featured at India's premier fashion showcase."
  },
  {
    title: "Oasis AI Interface",
    brand: "Oasis",
    role: "AI UX & Product Design",
    desc: "Explored new frontiers of human-machine interaction, building design-thinking workflows for context-aware AI agents."
  },
  {
    title: "Mumbai Dabbawalas",
    brand: "Personal Project",
    role: "UX Research & Editorial Design",
    desc: "A deep-dive research case study translating the legendary, error-free logistics network of Mumbai's lunchbox delivery into a rich visual editorial."
  },
  {
    title: "L'Oréal Campaign Treatments",
    brand: "L'Oréal",
    role: "Director's Treatments & Art Direction",
    desc: "Co-authored cinematic directors' treatments and styling guides that set the aesthetic tone for national product launches."
  },
  {
    title: "Garnier Eco-Branding",
    brand: "Garnier",
    role: "Brand Identity & Strategy",
    desc: "Engineered sustainable brand communication and promotional design concepts aligning natural beauty with modern eco-initiatives."
  },
  {
    title: "Padah Developer Platform",
    brand: "Padah",
    role: "Identity Systems & Branding",
    desc: "Created a bold, developer-centric brand system and digital assets in alignment with industry partners like GitHub and Atlassian."
  },
  {
    title: "Clubber's Hive UX",
    brand: "Clubber's Hive",
    role: "Product Design & UX Strategy",
    desc: "Designed an interactive nightlife discovery app facilitating real-time crowd dynamics, vibe checkups, and event booking."
  },
  {
    title: "Kosmos Neo Typeface",
    brand: "Kosmos Neo",
    role: "Type Design & Font Geometry",
    desc: "Carved a geometric display typeface influenced by neo-brutalist grids, combining stark angles with high-contrast curves."
  }
];

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+~`{}|[]\\:\";'<>?,./";

function ViewAllScramble({ isHovered }: { isHovered: boolean }) {
  const triggerText = "VIEW ALL WORK  →";
  const targetText = "VIEW ALL WORK  →";
  const [displayText, setDisplayText] = useState(triggerText);
  const frameRef = useRef(0);
  const queueRef = useRef<{ from: string; to: string; start: number; end: number }[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const from = displayText;
    const to = isHovered ? targetText : triggerText;
    const duration = 25;
    const queue = [];
    
    for (let i = 0; i < Math.max(from.length, to.length); i++) {
      const fromChar = from[i] || "";
      const toChar = to[i] || "";
      const start = Math.floor(Math.random() * (duration / 2));
      const end = start + Math.floor(Math.random() * (duration / 2)) + 5;
      queue.push({ from: fromChar, to: toChar, start, end });
    }
    
    queueRef.current = queue;
    frameRef.current = 0;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const update = () => {
      let complete = true;
      let output = "";
      const q = queueRef.current;
      const frame = frameRef.current;

      for (let i = 0; i < q.length; i++) {
        const { from: f, to: t, start, end } = q[i];
        if (frame >= end) {
          output += t;
        } else if (frame >= start) {
          complete = false;
          output += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        } else {
          complete = false;
          output += f;
        }
      }

      setDisplayText(output);

      if (!complete) {
        frameRef.current += 1;
        animationRef.current = requestAnimationFrame(update);
      }
    };

    animationRef.current = requestAnimationFrame(update);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered]);

  return <span>{displayText}</span>;
}

interface ProjectsSectionProps {
  isWorkRoute?: boolean;
  setVideo1: (el: HTMLVideoElement | null) => void;
  setVideo2: (el: HTMLVideoElement | null) => void;
}

export default function ProjectsSection({ isWorkRoute = false, setVideo1, setVideo2 }: ProjectsSectionProps) {
  const bgRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const vRef1 = useRef<HTMLVideoElement>(null);
  const vRef2 = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(1);
  const plungeTriggered = useRef(false);
  const activeStepRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const timeoutRef = useRef<any>(null);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [fade, setFade] = useState(true);
  const [btnHovered, setBtnHovered] = useState(false);
  const viewBtnMouseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleHover = (e: Event) => {
      const idx = (e as CustomEvent).detail;
      setHoveredIdx(idx);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("work-project-hover", handleHover);
    }

    // Initialize snap step based on current scroll position to handle reloads
    if (typeof window !== "undefined") {
      const vh = window.innerHeight;
      const section3Start = 5.2 * vh;
      const currentScroll = scroll.raw;
      
      let initialStep = 0;
      if (currentScroll >= section3Start + 11.0 * vh - 20) {
        initialStep = 5;
      } else if (currentScroll >= section3Start + 5.0 * vh - 20) {
        initialStep = 4;
      } else if (currentScroll >= section3Start + 4.0 * vh - 20) {
        initialStep = 3;
      } else if (currentScroll >= section3Start + 3.0 * vh - 20) {
        initialStep = 2;
      } else if (currentScroll >= section3Start + 2.0 * vh - 20) {
        initialStep = 1;
      }
      activeStepRef.current = initialStep;
    }

    const triggerStepTransition = (targetStep: number) => {
      if (!scroll.lenisInstance) return;
      isAnimatingRef.current = true;
      activeStepRef.current = targetStep;

      // Clear any existing safety timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const vh = window.innerHeight;
      const section3Start = 5.2 * vh;
      const snapTargets = [
        section3Start,
        section3Start + 2.0 * vh,
        section3Start + 3.0 * vh,
        section3Start + 4.0 * vh,
        section3Start + 5.0 * vh,
        section3Start + 11.0 * vh
      ];

      const duration = targetStep === 1 ? 1.5 : 1.0;
      const easing = targetStep === 1
        ? (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
        : (t: number) => t * (2 - t);

      // Safety fallback to release the input lock after transition duration + buffer
      timeoutRef.current = setTimeout(() => {
        isAnimatingRef.current = false;
      }, duration * 1000 + 150);

      scroll.lenisInstance.scrollTo(snapTargets[targetStep], {
        duration,
        easing,
        onComplete: () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          isAnimatingRef.current = false;
        }
      });
    };

    const handleWheel = (e: WheelEvent) => {
      // 1. If currently animating, block ALL wheel inputs within/near the snap range to prevent scroll bleed/cancellation
      if (isAnimatingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const vh = window.innerHeight;
      const section3Start = 5.2 * vh;
      const currentScroll = scroll.raw;
      const maxSnapScroll = section3Start + 11.0 * vh;

      const isScrollingDown = e.deltaY > 0;

      // Snapping down: intercept if we are at/near Section 3 start or inside it, and not yet at Step 5
      if (isScrollingDown && activeStepRef.current < 5) {
        if (currentScroll >= section3Start - 80) {
          e.preventDefault();
          e.stopPropagation();
          triggerStepTransition(activeStepRef.current + 1);
        }
      } 
      // Snapping up: intercept if we are inside Section 3 (below Step 5)
      else if (!isScrollingDown && activeStepRef.current > 0) {
        if (currentScroll <= maxSnapScroll + 20) {
          e.preventDefault();
          e.stopPropagation();
          triggerStepTransition(activeStepRef.current - 1);
        }
      }
    };

    let touchStart = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // 2. Block touch scrolling inputs during active snapping animation
      if (isAnimatingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const vh = window.innerHeight;
      const section3Start = 5.2 * vh;
      const currentScroll = scroll.raw;
      const maxSnapScroll = section3Start + 11.0 * vh;

      const touchEnd = e.touches[0].clientY;
      const deltaY = touchStart - touchEnd;
      const isScrollingDown = deltaY > 0;

      if (Math.abs(deltaY) > 10) {
        // Snapping down
        if (isScrollingDown && activeStepRef.current < 5) {
          if (currentScroll >= section3Start - 80) {
            e.preventDefault();
            e.stopPropagation();
            triggerStepTransition(activeStepRef.current + 1);
          }
        } 
        // Snapping up
        else if (!isScrollingDown && activeStepRef.current > 0) {
          if (currentScroll <= maxSnapScroll + 20) {
            e.preventDefault();
            e.stopPropagation();
            triggerStepTransition(activeStepRef.current - 1);
          }
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 3. Block keyboard scroll keys (arrow keys, spacebar, page keys) during active snap animation
      if (isAnimatingRef.current) {
        const keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
        if (keys.includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      const vh = window.innerHeight;
      const section3Start = 5.2 * vh;
      const currentScroll = scroll.raw;
      const maxSnapScroll = section3Start + 11.0 * vh;

      const isDownKey = e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ";
      const isUpKey = e.key === "ArrowUp" || e.key === "PageUp";

      if (isDownKey && activeStepRef.current < 5) {
        if (currentScroll >= section3Start - 80) {
          e.preventDefault();
          e.stopPropagation();
          triggerStepTransition(activeStepRef.current + 1);
        }
      } else if (isUpKey && activeStepRef.current > 0) {
        if (currentScroll <= maxSnapScroll + 20) {
          e.preventDefault();
          e.stopPropagation();
          triggerStepTransition(activeStepRef.current - 1);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("wheel", handleWheel, { capture: true, passive: false });
      window.addEventListener("touchstart", handleTouchStart, { capture: true, passive: true });
      window.addEventListener("touchmove", handleTouchMove, { capture: true, passive: false });
      window.addEventListener("keydown", handleKeyDown, { capture: true, passive: false });
    }

    let raf = 0;
    const tick = () => {
      const progress = scroll.section3;
      const vh = typeof window !== "undefined" ? window.innerHeight : 900;
      const section3Start = 5.2 * vh;

      // Keep activeStepRef in sync with actual scroll position when not animating (e.g. reload or anchor clicks)
      if (!isAnimatingRef.current) {
        const currentScroll = scroll.raw;
        let currentStep = 0;
        if (currentScroll >= section3Start + 11.0 * vh - 20) {
          currentStep = 5;
        } else if (currentScroll >= section3Start + 5.0 * vh - 20) {
          currentStep = 4;
        } else if (currentScroll >= section3Start + 4.0 * vh - 20) {
          currentStep = 3;
        } else if (currentScroll >= section3Start + 3.0 * vh - 20) {
          currentStep = 2;
        } else if (currentScroll >= section3Start + 2.0 * vh - 20) {
          currentStep = 1;
        }
        activeStepRef.current = currentStep;
      }

      // 1. Background opacity transition (transition completes at the end of the plunge)
      if (bgRef.current) {
        const opacity = smoothstep(0.0, 2.0 / 15.0, progress);
        bgRef.current.style.opacity = String(opacity);
        bgRef.current.style.display = opacity > 0.01 ? "block" : "none";
      }

      // 2. Swish pan backdrop-blur transition (transient blur peaks midway through the plunge)
      if (blurRef.current) {
        if (progress > 0.0 && progress < 2.0 / 15.0) {
          const t = progress / (2.0 / 15.0);
          // Parabolic curve peaking in the middle of the plunge
          const blurVal = 4.0 * t * (1.0 - t) * 20.0;
          blurRef.current.style.backdropFilter = `blur(${blurVal}px)`;
          blurRef.current.style.setProperty("-webkit-backdrop-filter", `blur(${blurVal}px)`);
          blurRef.current.style.display = "block";
        } else {
          blurRef.current.style.backdropFilter = "blur(0px)";
          blurRef.current.style.setProperty("-webkit-backdrop-filter", "blur(0px)");
          blurRef.current.style.display = "none";
        }
      }

      // 3. Underwater video loop crossfade logic (seamless crossfade near video end)
      const v1 = vRef1.current;
      const v2 = vRef2.current;
      if (v1 && v2 && v1.duration && v2.duration) {
        const crossfadeTime = 1.5;
        const dur1 = v1.duration;
        const dur2 = v2.duration;

        if (activeRef.current === 1) {
          const t1 = v1.currentTime;
          if (t1 >= dur1 - crossfadeTime) {
            if (v2.paused) {
              v2.currentTime = 0;
              v2.play().catch(() => {});
            }
            const ratio = Math.min((t1 - (dur1 - crossfadeTime)) / crossfadeTime, 1.0);
            v1.style.opacity = String(1.0 - ratio);
            v2.style.opacity = String(ratio);
          } else {
            v1.style.opacity = "1";
            v2.style.opacity = "0";
            if (!v2.paused) v2.pause();
          }

          if (t1 >= dur1 - 0.1) {
            activeRef.current = 2;
          }
        } else {
          const t2 = v2.currentTime;
          if (t2 >= dur2 - crossfadeTime) {
            if (v1.paused) {
              v1.currentTime = 0;
              v1.play().catch(() => {});
            }
            const ratio = Math.min((t2 - (dur2 - crossfadeTime)) / crossfadeTime, 1.0);
            v1.style.opacity = String(ratio);
            v2.style.opacity = String(1.0 - ratio);
          } else {
            v1.style.opacity = "0";
            v2.style.opacity = "1";
            if (!v1.paused) v1.pause();
          }

          if (t2 >= dur2 - 0.1) {
            activeRef.current = 1;
          }
        }
      }

      // 4. Parallax Pan/Tilt effect on mouse hover + Progressive Unblur + Zoom + Swish Pan
      if (v1 && v2) {
        // Calculate transition progress p for the plunge duration (0.0 to 2.0 / 15.0)
        const plungeProgress = clamp01(progress / (2.0 / 15.0));

        // Calculate vertical whip pan shift (Y translation)
        const yWhipPx = (1.0 - plungeProgress) * vh;

        // Calculate scroll zoom: starts after unblur (progress > 3.0 / 15.0), up to 1.25 at progress = 1.0
        let scrollZoom = 1.0;
        let shiftFactor = 0.0;
        
        if (progress > 3.0 / 15.0) {
          const tZoom = Math.min(Math.max((progress - 3.0 / 15.0) / (12.0 / 15.0), 0.0), 1.0);
          const easedT = tZoom * tZoom * (3 - 2 * tZoom);
          scrollZoom = 1.0 + easedT * 0.25;
          shiftFactor = easedT;
        }

        // Shift background video in opposite direction of mouse
        const xShift = -pointer.x * 24.0 * shiftFactor;
        const yShift = -pointer.y * 24.0 * shiftFactor;
        const xRot = -pointer.y * 2.5 * shiftFactor;
        const yRot = pointer.x * 2.5 * shiftFactor;
        
        const transformStr = `translate3d(${xShift}px, ${yShift + yWhipPx}px, 0) rotateX(${xRot}deg) rotateY(${yRot}deg) scale(${scrollZoom})`;
        v1.style.transform = transformStr;
        v2.style.transform = transformStr;

        // Snappy 1-scroll unblur: stays blurred at 12px during plunge, unblurs to 0px from progress 2/15 to 3/15
        let vBlur = 12.0;
        if (progress >= 2.0 / 15.0) {
          const tBlur = Math.min(Math.max((progress - 2.0 / 15.0) / (1.0 / 15.0), 0.0), 1.0);
          vBlur = (1.0 - tBlur) * 12.0;
        }

        // Calculate vertical whip blur (peaks midway through the plunge)
        const blurAmount = 4.0 * plungeProgress * (1.0 - plungeProgress) * 80.0;
        const blurEl = document.getElementById("whip-blur-gaussian");
        if (blurEl) {
          blurEl.setAttribute("stdDeviation", `0, ${blurAmount}`);
        }

        const canvasContainer = document.getElementById("webgl-canvas-container");
        if (canvasContainer) {
          canvasContainer.style.filter = blurAmount > 0.1 ? "url(#whip-blur-filter)" : "";
          canvasContainer.style.webkitFilter = blurAmount > 0.1 ? "url(#whip-blur-filter)" : "";
        }

        const filterVal = blurAmount > 0.1
          ? `url(#whip-blur-filter) blur(${vBlur}px)`
          : `blur(${vBlur}px)`;
        v1.style.filter = filterVal;
        v2.style.filter = filterVal;
        v1.style.webkitFilter = filterVal;
        v2.style.webkitFilter = filterVal;
      }

      // 5. Editorial Intro Overlay fade-in/out
      if (introRef.current) {
        // Fade in: from Step 2 to Step 3 (progress 3.0 / 15.0 to 4.0 / 15.0)
        // Fade out: from Step 3 to Step 4 (progress 4.0 / 15.0 to 5.0 / 15.0)
        let introOpacity = 0;
        if (progress >= 3.0 / 15.0 && progress <= 4.0 / 15.0) {
          introOpacity = smoothstep(3.0 / 15.0, 4.0 / 15.0, progress);
        } else if (progress > 4.0 / 15.0 && progress <= 5.0 / 15.0) {
          introOpacity = 1.0 - smoothstep(4.0 / 15.0, 5.0 / 15.0, progress);
        }

        introRef.current.style.opacity = String(introOpacity);
        introRef.current.style.display = introOpacity > 0.01 ? "flex" : "none";
      }

      // 6. View All Work button fade-in
      if (btnRef.current) {
        // Toggle opacity & pointer-events at the end of the scroll snap (using CSS transitions for unified fade)
        const showBtn = progress >= 10.8 / 15.0;
        btnRef.current.style.opacity = showBtn ? "1" : "0";
        btnRef.current.style.pointerEvents = showBtn ? "auto" : "none";
      }

      // 7. Editorial active card overlay fade-in (synchronized with cards: 10th to 11th scrolls)
      if (overlayRef.current) {
        const overlayOpacity = smoothstep(10.0 / 15.0, 11.0 / 15.0, progress);
        overlayRef.current.style.opacity = String(overlayOpacity);
        overlayRef.current.style.display = overlayOpacity > 0.01 ? "block" : "none";
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (typeof window !== "undefined") {
        window.removeEventListener("work-project-hover", handleHover);
        window.removeEventListener("wheel", handleWheel, { capture: true });
        window.removeEventListener("touchstart", handleTouchStart, { capture: true });
        window.removeEventListener("touchmove", handleTouchMove, { capture: true });
        window.removeEventListener("keydown", handleKeyDown, { capture: true });
      }
    };
  }, []);

  useEffect(() => {
    setFade(false);
    const timer = setTimeout(() => {
      setActiveIdx(hoveredIdx);
      setFade(true);
    }, 120); // short transition time
    return () => clearTimeout(timer);
  }, [hoveredIdx]);

  useEffect(() => {
    if (vRef1.current) setVideo1(vRef1.current);
    if (vRef2.current) setVideo2(vRef2.current);
  }, [setVideo1, setVideo2]);

  return (
    <>
      {/* Dynamic background with twin underwater videos for seamless crossfade and pan/tilt perspective */}
      <div
        ref={bgRef}
        id="projects-section-bg"
        className="fixed inset-0 bg-[#040a1d] pointer-events-none overflow-hidden"
        style={{
          zIndex: 2,
          opacity: isWorkRoute ? 1 : 0,
          display: isWorkRoute ? "block" : "none",
          perspective: "1000px", // Enables 3D rotation tilt
        }}
      >
        <video
          ref={vRef1}
          src="/underwater.mp4"
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 1 }}
        />
        <video
          ref={vRef2}
          src="/underwater.mp4"
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0 }}
        />
        {/* Deep blue color overlay to match the waterfall backdrop's tint */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: "#040412",
            opacity: 0.20,
          }}
        />
      </div>

      {/* Swish pan motion blur overlay */}
      <div
        ref={blurRef}
        id="projects-swish-blur"
        className="fixed inset-0 z-51 pointer-events-none"
        style={{
          display: "none",
          backdropFilter: "blur(0px)",
          WebkitBackdropFilter: "blur(0px)",
        }}
      />

      {/* Editorial project text overlay */}
      <div
        ref={overlayRef}
        id="projects-text-overlay"
        className="fixed bottom-[10vh] left-[6vw] z-30 pointer-events-none select-none max-w-[440px] text-left"
        style={{
          opacity: 0,
          display: "none",
        }}
      >
        <div 
          className="transition-all duration-300 ease-out transform"
          style={{
            opacity: fade ? 1 : 0,
            transform: fade ? "translateY(0)" : "translateY(12px)",
          }}
        >
          {/* Brand Eyebrow */}
          <div className="flex items-center gap-3 mb-2">
            <span className="h-[1px] w-5 bg-white/35" />
            <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.25em] text-white/75">
              {activeIdx !== null ? PROJECTS[activeIdx].brand : "Curated Showcase"}
            </span>
          </div>

          {/* Project Title */}
          <h3 className="font-display font-light text-[clamp(1.5rem,2.8vw,2.5rem)] leading-none text-white mb-2 hero-glow-text">
            {activeIdx !== null ? PROJECTS[activeIdx].title : "SELECTED WORKS"}
          </h3>

          {/* Role */}
          <p className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[#71b4ff]/90 mb-4">
            {activeIdx !== null ? PROJECTS[activeIdx].role : "Visual & Experience Design"}
          </p>

          {/* Description */}
          <p className="font-sans text-[0.85rem] font-light leading-relaxed text-white/70 max-w-[38ch]">
            {activeIdx !== null ? PROJECTS[activeIdx].desc : "A collection of brand experiences, identity systems, and digital playgrounds developed for Heineken, FanCode, L'Oréal, and more."}
          </p>
        </div>
      </div>

      {/* Editorial intro text overlay (Section 3 entrance) */}
      <div
        ref={introRef}
        id="projects-intro-overlay"
        className="fixed inset-0 z-30 flex flex-col items-center justify-center px-[6vw] text-center pointer-events-none select-none"
        style={{
          opacity: 0,
          display: "none",
        }}
      >
        <div className="max-w-[60ch] flex flex-col items-center">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-4">
            <span className="h-[1px] w-5 bg-white/35" />
            <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.25em] text-[#71b4ff]/90">
              SELECTED CASE STUDIES
            </span>
            <span className="h-[1px] w-5 bg-white/35" />
          </div>

          {/* Title */}
          <h2 className="font-display font-light text-[clamp(1.8rem,3.2vw,3rem)] leading-tight text-white mb-6 hero-glow-text">
            CREATING WORK THAT CANNOT BE IGNORED
          </h2>

          {/* Body */}
          <p className="font-sans text-[clamp(0.85rem,1vw,1.05rem)] font-light leading-relaxed text-white/70 text-center mb-4">
            We believe in creating design that isn&apos;t just seen, but felt. Over the years, we have crafted immersive visual systems and digital products for exceptional brands.
          </p>
          <p className="font-sans text-[clamp(0.85rem,1vw,1.05rem)] font-light leading-relaxed text-white/70 text-center">
            From high-energy fan arenas for <strong className="text-white font-medium">FanCode</strong> and <strong className="text-white font-medium">Heineken</strong>, to visual products for <strong className="text-white font-medium">Google</strong>, and conceptual art direction featured at <strong className="text-white font-medium">Lakmé Fashion Week</strong>, our work combines deep storytelling with rigorous execution to leave a lasting mark.
          </p>
        </div>
      </div>

      {/* Floating View All Work pill button — glass style with spinning gradient border & scramble text */}
      <div
        ref={btnRef}
        id="view-all-work-btn"
        className="fixed bottom-[10vh] right-[6vw] z-50 transition-all duration-500 ease-out"
        style={{
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <a href="/work" style={{ textDecoration: "none", display: "inline-block" }}>
          <div
            ref={viewBtnMouseRef}
            onMouseMove={(e) => {
              const el = viewBtnMouseRef.current;
              if (!el) return;
              const rect = el.getBoundingClientRect();
              el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
              el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
            }}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            className="glass-btn-sound-styled"
          >
            {/* Moving gradient border stroke */}
            <span className="glass-btn-border-wrap">
              <span className="glass-btn-border-light" />
            </span>

            <span className="glass-btn-sound-content">
              <span className="glass-btn-sound-text">
                <ViewAllScramble isHovered={btnHovered} />
              </span>
            </span>
          </div>
        </a>
      </div>

      {/* SVG vertical whip blur filter */}
      <svg className="fixed pointer-events-none" style={{ width: 0, height: 0, opacity: 0, zIndex: -10 }} aria-hidden="true">
        <defs>
          <filter id="whip-blur-filter">
            <feGaussianBlur id="whip-blur-gaussian" stdDeviation="0,0" />
          </filter>
        </defs>
      </svg>
    </>
  );
}
