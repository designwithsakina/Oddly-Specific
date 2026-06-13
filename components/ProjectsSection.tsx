"use client";

import { useEffect, useRef } from "react";
import { scroll, pointer, smoothstep } from "@/lib/state";

export default function ProjectsSection({ isWorkRoute = false }: { isWorkRoute?: boolean }) {
  const bgRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<HTMLDivElement>(null);
  const vRef1 = useRef<HTMLVideoElement>(null);
  const vRef2 = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(1);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const progress = scroll.section3;

      // 1. Background opacity transition (transition completes at 0.2 progress)
      if (bgRef.current) {
        const opacity = smoothstep(0.0, 0.2, progress);
        bgRef.current.style.opacity = String(opacity);
        bgRef.current.style.display = opacity > 0.01 ? "block" : "none";
      }

      // 2. Swish pan backdrop-blur transition (transient blur peaks at 0.1 progress)
      if (blurRef.current) {
        if (progress > 0.0 && progress < 0.2) {
          const t = progress / 0.2;
          // Parabolic curve peaking at t = 0.5 (progress = 0.1)
          const blurVal = 4.0 * t * (1.0 - t) * 20.0;
          blurRef.current.style.backdropFilter = `blur(${blurVal}px)`;
          blurRef.current.style.WebkitBackdropFilter = `blur(${blurVal}px)`;
          blurRef.current.style.display = "block";
        } else {
          blurRef.current.style.backdropFilter = "blur(0px)";
          blurRef.current.style.WebkitBackdropFilter = "blur(0px)";
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
            // Start v2 if it's paused
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
            // Start v1 if it's paused
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

      // 4. Parallax Pan/Tilt effect on mouse hover + Progressive Unblur
      if (v1 && v2) {
        // Shift background video in opposite direction of mouse
        const xShift = -pointer.x * 24.0;
        const yShift = -pointer.y * 24.0;
        const xRot = -pointer.y * 2.5; // Pitch tilt
        const yRot = pointer.x * 2.5;  // Yaw tilt
        
        const transformStr = `translate3d(${xShift}px, ${yShift}px, 0) rotateX(${xRot}deg) rotateY(${yRot}deg) scale(1.08)`;
        v1.style.transform = transformStr;
        v2.style.transform = transformStr;

        // Progressive Unblur: murkiness fades from 8px at progress 0.2 down to 0px at progress 0.8
        let vBlur = 8.0;
        if (progress >= 0.2) {
          const tBlur = Math.min(Math.max((progress - 0.2) / 0.6, 0.0), 1.0);
          vBlur = (1.0 - tBlur) * 8.0;
        }
        
        const filterStr = `blur(${vBlur}px)`;
        v1.style.filter = filterStr;
        v2.style.filter = filterStr;
        v1.style.webkitFilter = filterStr;
        v2.style.webkitFilter = filterStr;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* Dynamic background with twin underwater videos for seamless crossfade and pan/tilt perspective */}
      <div
        ref={bgRef}
        id="projects-section-bg"
        className="fixed inset-0 z-45 bg-[#040a1d] pointer-events-none overflow-hidden"
        style={{
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
    </>
  );
}
