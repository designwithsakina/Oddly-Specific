"use client";

import { useEffect, useRef } from "react";
import { scroll, smoothstep } from "@/lib/state";

export default function AboutBlurOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (overlayRef.current) {
        // We only want the blur overlay to exist during the transition into Section 2 (About).
        // It starts fully blurred when we land on the About page (scroll.hero reaches 1.0, scroll.section2 is 0.0)
        // And is lifted (fades to 0 blur) as we start scrolling into Section 2 (from scroll.section2 = 0.0 to 0.08).
        // When we scroll past Section 2, or before Section 2 is active, it should be hidden.
        
        const isTransitionActive = scroll.hero > 0.8 && scroll.section3 < 0.01;
        
        if (isTransitionActive) {
          overlayRef.current.style.display = "block";
          
          // Calculate blur amount:
          // - At scroll.hero = 0.8, it starts at 0
          // - Peaks at scroll.hero = 1.0 (scroll.section2 = 0.0) at 20px blur
          // - Lifts to 0 as scroll.section2 goes from 0.0 to 0.08
          let blurAmount = 0;
          
          if (scroll.hero < 1.0) {
            // Fading in the blur during the final plunge
            const t = smoothstep(0.8, 1.0, scroll.hero);
            blurAmount = t * 20.0;
          } else {
            // Lifting the blur during the first scroll of Section 2
            const t = smoothstep(0.0, 0.08, scroll.section2);
            blurAmount = (1.0 - t) * 20.0;
          }
          
          overlayRef.current.style.backdropFilter = `blur(${blurAmount}px)`;
          overlayRef.current.style.setProperty("-webkit-backdrop-filter", `blur(${blurAmount}px)`);
          
          // Fade out opacity when blur is close to 0 to prevent rendering overhead
          if (blurAmount < 0.1) {
            overlayRef.current.style.opacity = "0";
            overlayRef.current.style.pointerEvents = "none";
          } else {
            overlayRef.current.style.opacity = "1";
            overlayRef.current.style.pointerEvents = "auto";
          }
        } else {
          overlayRef.current.style.display = "none";
          overlayRef.current.style.opacity = "0";
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
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 35, // Blurs the 3D Canvas (z-index 3) but sits under Logo/Text (z-index 40/50)
        display: "none",
        backgroundColor: "rgba(10, 9, 22, 0.1)", // subtle dark tint matching the theme
        transition: "opacity 0.15s ease-out",
      }}
    />
  );
}
