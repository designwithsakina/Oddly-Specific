"use client";

import { useEffect, useRef } from "react";
import { scroll, pointer, damp } from "@/lib/state";

interface TestimonialsSectionProps {
  isTestimonialsRoute?: boolean;
}

export default function TestimonialsSection({ isTestimonialsRoute = false }: TestimonialsSectionProps) {
  const bgRef = useRef<HTMLDivElement>(null);
  const vRef1 = useRef<HTMLVideoElement>(null);
  const vRef2 = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(1);

  useEffect(() => {
    let raf = 0;
    let lastTime = performance.now();

    const v1 = vRef1.current;
    const v2 = vRef2.current;

    // Pre-warm video buffers on mount
    if (v1) {
      v1.load();
      v1.onended = () => {
        activeRef.current = 2;
        if (v2) {
          v2.currentTime = 0;
          v2.play().catch(() => {});
        }
      };
    }
    if (v2) {
      v2.load();
      v2.onended = () => {
        activeRef.current = 1;
        if (v1) {
          v1.currentTime = 0;
          v1.play().catch(() => {});
        }
      };
    }

    const tick = () => {
      const p4 = scroll.section4;
      const rawScroll = scroll.raw;
      const vh = typeof window !== "undefined" ? window.innerHeight : 900;
      const section4Start = 22.2 * vh;
      const section4Span = 5.0 * vh;
      const section5Start = section4Start + section4Span; // 27.2 * vh

      const now = performance.now();
      const dt = Math.min(0.03, (now - lastTime) / 1000);
      lastTime = now;

      // Update pointer values (smoothed mouse target)
      pointer.x = damp(pointer.x, pointer.tx, 4, dt);
      pointer.y = damp(pointer.y, pointer.ty, 4, dt);

      let opacity = 0;
      let scale = 1.0;
      let shiftFactor = 0;

      // Make sure default browser cursor is shown
      if (isTestimonialsRoute || rawScroll >= section5Start) {
        document.body.classList.remove("hide-cursor");
      }

      if (rawScroll >= section5Start) {
        // Fully inside Testimonials section (Section 5)
        opacity = 1.0;
        shiftFactor = 1.0;
        // Continue zooming in slightly as we scroll within the section
        scale = 1.05 + scroll.section5 * 0.02; // Zooms up to 1.07
      } else {
        // Transition from Section 4 (Services) into Section 5 (Testimonials)
        if (p4 > 0.42) {
          const t = (p4 - 0.42) / (1.0 - 0.42);
          const easedT = t * t * (3 - 2 * t);
          opacity = easedT;
          scale = 1.05; // Entry baseline zoom
          shiftFactor = easedT;
        }
      }

      if (bgRef.current) {
        bgRef.current.style.opacity = String(opacity);
        bgRef.current.style.display = opacity > 0.005 ? "block" : "none";
      }

      // Play fish video ONLY once blur fades in (scroll.section4 >= 0.70) or inside section 5
      const active = isTestimonialsRoute || rawScroll >= (section5Start - 100) || p4 >= 0.70;

      if (v1 && v2) {
        if (!active) {
          if (!v1.paused) {
            v1.pause();
            v1.currentTime = 0;
          }
          if (!v2.paused) {
            v2.pause();
            v2.currentTime = 0;
          }
          activeRef.current = 1;
        } else {
          // Seamless crossfade looping logic (2.0s cubic crossfade window)
          const crossfadeTime = 2.0;

          if (activeRef.current === 1) {
            if (v1.paused) v1.play().catch(() => {});

            const dur1 = v1.duration;
            const t1 = v1.currentTime;

            if (dur1 && dur1 > crossfadeTime) {
              if (t1 >= dur1 - crossfadeTime) {
                if (v2.paused) {
                  v2.currentTime = 0;
                  v2.play().catch(() => {});
                }
                const ratio = Math.min((t1 - (dur1 - crossfadeTime)) / crossfadeTime, 1.0);
                const easedRatio = ratio * ratio * (3 - 2 * ratio);
                v1.style.opacity = String(1.0 - easedRatio);
                v2.style.opacity = String(easedRatio);
              } else {
                v1.style.opacity = "1";
                v2.style.opacity = "0";
                if (!v2.paused) v2.pause();
              }

              if (t1 >= dur1 - 0.15) {
                activeRef.current = 2;
                v1.style.opacity = "0";
                v1.pause();
                v1.currentTime = 0;
              }
            } else {
              v1.style.opacity = "1";
              v2.style.opacity = "0";
            }
          } else {
            if (v2.paused) v2.play().catch(() => {});

            const dur2 = v2.duration;
            const t2 = v2.currentTime;

            if (dur2 && dur2 > crossfadeTime) {
              if (t2 >= dur2 - crossfadeTime) {
                if (v1.paused) {
                  v1.currentTime = 0;
                  v1.play().catch(() => {});
                }
                const ratio = Math.min((t2 - (dur2 - crossfadeTime)) / crossfadeTime, 1.0);
                const easedRatio = ratio * ratio * (3 - 2 * ratio);
                v1.style.opacity = String(easedRatio);
                v2.style.opacity = String(1.0 - easedRatio);
              } else {
                v1.style.opacity = "0";
                v2.style.opacity = "1";
                if (!v1.paused) v1.pause();
              }

              if (t2 >= dur2 - 0.15) {
                activeRef.current = 1;
                v2.style.opacity = "0";
                v2.pause();
                v2.currentTime = 0;
              }
            } else {
              v1.style.opacity = "0";
              v2.style.opacity = "1";
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

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isTestimonialsRoute]);

  return (
    <div
      ref={bgRef}
      id="testimonials-section-bg"
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{
        zIndex: 46, // Sits directly on top of ServicesSection (45)
        opacity: isTestimonialsRoute ? 1 : 0,
        display: isTestimonialsRoute ? "block" : "none",
        perspective: "1000px",
      }}
    >
      <video
        ref={vRef1}
        src="https://pub-0c93a368d7e440289749f18d3bc77b75.r2.dev/compressed/testimonial.mp4"
        preload="auto"
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
        src="https://pub-0c93a368d7e440289749f18d3bc77b75.r2.dev/compressed/testimonial.mp4"
        preload="auto"
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
    </div>
  );
}
