"use client";

import { useEffect, useRef } from "react";
import { scroll, smoothstep } from "@/lib/state";

export default function ProjectsSection({ isWorkRoute = false }: { isWorkRoute?: boolean }) {
  const bgRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      // 1. Background opacity transition
      if (bgRef.current) {
        // Starts fading in at 0.0 and reaches 1.0 opacity by 0.3333 progress (3.6 * vh)
        const opacity = smoothstep(0.0, 0.3333, scroll.section3);
        bgRef.current.style.opacity = String(opacity);
        bgRef.current.style.display = opacity > 0.01 ? "block" : "none";
      }

      // 2. Swish pan backdrop-blur transition
      if (blurRef.current) {
        const progress = scroll.section3;
        if (progress > 0.0 && progress < 0.3333) {
          const t = progress / 0.3333;
          // Parabolic curve peaking at t = 0.5
          const blurVal = 4.0 * t * (1.0 - t) * 20.0;
          blurRef.current.style.backdropFilter = `blur(${blurVal}px)`;
          blurRef.current.style.webkitBackdropFilter = `blur(${blurVal}px)`;
          blurRef.current.style.display = "block";
        } else {
          blurRef.current.style.backdropFilter = "blur(0px)";
          blurRef.current.style.webkitBackdropFilter = "blur(0px)";
          blurRef.current.style.display = "none";
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* Dynamic background with underwater video */}
      <div
        ref={bgRef}
        id="projects-section-bg"
        className="fixed inset-0 z-45 bg-[#040a1d] pointer-events-none overflow-hidden"
        style={{
          opacity: isWorkRoute ? 1 : 0,
          display: isWorkRoute ? "block" : "none",
        }}
      >
        <video
          src="/underwater.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
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
          webkitBackdropFilter: "blur(0px)",
        }}
      />
    </>
  );
}
