"use client";

import { useEffect, useRef } from "react";
import { scroll, pointer, damp } from "@/lib/state";
import InteractiveTypography from "./InteractiveTypography";

interface ServicesSectionProps {
  isServicesRoute?: boolean;
}

export default function ServicesSection({ isServicesRoute = false }: ServicesSectionProps) {
  const bgRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

      const now = performance.now();
      const dt = Math.min(0.03, (now - lastTime) / 1000);
      lastTime = now;

      // Update pointer values (smoothed mouse target)
      pointer.x = damp(pointer.x, pointer.tx, 4, dt);
      pointer.y = damp(pointer.y, pointer.ty, 4, dt);

      let opacity = 0;
      let scale = 1.0;
      let contentOpacity = 0;
      let contentTranslateY = 30; // px
      let shiftFactor = 0;

      // Force showing default browser cursor in Services section by removing hide-cursor class
      if (isServicesRoute || rawScroll >= section4Start) {
        document.body.classList.remove("hide-cursor");
      }

      if (isServicesRoute || rawScroll >= section4Start) {
        opacity = 1.0;
        shiftFactor = 1.0;

        if (rawScroll < step7Pos) {
          // Scroll 1: From Step 13 (22.2vh) to Step 14 (23.2vh). Text fades in, video zooms to 1.11.
          const t = Math.min((rawScroll - section4Start) / (1.0 * vh), 1.0);
          const easedT = t * t * (3 - 2 * t);
          contentOpacity = easedT;
          contentTranslateY = 30 - easedT * 30;
          scale = 1.10 + easedT * 0.01;
        } else if (rawScroll < step8Pos) {
          // Scroll 2: From Step 14 (23.2vh) to Step 15 (24.2vh). Text fades out, video zooms to 1.12.
          const t = Math.min((rawScroll - step7Pos) / (1.0 * vh), 1.0);
          const easedT = t * t * (3 - 2 * t);
          contentOpacity = 1.0 - easedT;
          contentTranslateY = -easedT * 30;
          scale = 1.11 + easedT * 0.01;
        } else {
          // Past Step 15 (24.2vh+)
          contentOpacity = 0.0;
          contentTranslateY = -30;
          scale = 1.12;
        }
      } else {
        // Transition from Section 3 (Works) into Section 4 (Services)
        if (p3 > 15.9 / 17.0) {
          const t = (p3 - 15.9 / 17.0) / (1.1 / 17.0);
          const easedT = t * t * (3 - 2 * t);
          opacity = easedT;
          scale = 1.10; // Baseline scale for services section
          shiftFactor = easedT;
        }
      }

      if (bgRef.current) {
        bgRef.current.style.opacity = String(opacity);
        bgRef.current.style.display = opacity > 0.005 ? "block" : "none";
      }

      if (videoRef.current) {
        // Shift background video in opposite direction of mouse for parallax pan/tilt
        const xShift = -pointer.x * 24.0 * shiftFactor;
        const yShift = -pointer.y * 24.0 * shiftFactor;
        const xRot = -pointer.y * 2.5 * shiftFactor;
        const yRot = pointer.x * 2.5 * shiftFactor;
        
        videoRef.current.style.transform = `translate3d(${xShift}px, ${yShift}px, 0) rotateX(${xRot}deg) rotateY(${yRot}deg) scale(${scale})`;
      }

      if (contentRef.current) {
        contentRef.current.style.opacity = String(contentOpacity);
        contentRef.current.style.transform = `translate3d(0, ${contentTranslateY}px, 0)`;
        contentRef.current.style.display = contentOpacity > 0.005 ? "flex" : "none";
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
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
          ref={videoRef}
          src="/services-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Soft dark overlay over the video to ensure high text legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(5, 11, 36, 0.45), rgba(3, 6, 22, 0.75))",
          }}
        />
      </div>

      {/* Services text overlay container */}
      <div
        ref={contentRef}
        id="services-section-content"
        className="fixed inset-0 flex flex-col justify-center px-[6vw] pointer-events-none select-none"
        style={{
          zIndex: 46,
          opacity: isServicesRoute ? 1 : 0,
          display: isServicesRoute ? "flex" : "none",
        }}
      >
        <div className="w-full max-w-[800px] mx-auto flex flex-col items-center text-center pointer-events-auto">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-2">
            <span className="h-[1px] w-5 bg-white/35" />
            <span className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.25em] text-[#71b4ff]/90">
              METHODOLOGY
            </span>
            <span className="h-[1px] w-5 bg-white/35" />
          </div>

          {/* Title Container styled to match MorphSection */}
          <div className="mb-2 w-full overflow-visible pb-4 pt-1 flex items-center justify-center">
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
              className="mt-6 w-[66ch] max-w-[90vw] font-sans text-[clamp(0.8125rem,0.9vw,0.9625rem)] font-light leading-relaxed text-white/80 hover:text-white transition-colors duration-300 text-center"
            />
            <InteractiveTypography
              text="Somewhere along the way, they become brands, websites, presentations, campaigns, treatments, packaging, and experiences that feel a little more intentional, a little more memorable, and a lot harder to ignore."
              className="mt-6 w-[66ch] max-w-[90vw] font-sans text-[clamp(0.8125rem,0.9vw,0.9625rem)] font-light leading-relaxed text-white/80 hover:text-white transition-colors duration-300 text-center"
            />
            <InteractiveTypography
              text="No two projects follow the same path, but they usually begin the same way: with curiosity, conversation, and a willingness to look a little closer."
              className="mt-6 w-[66ch] max-w-[90vw] font-sans text-[clamp(0.8125rem,0.9vw,0.9625rem)] font-light leading-relaxed text-white/80 hover:text-white transition-colors duration-300 text-center"
            />
          </div>
        </div>
      </div>
    </>
  );
}
