"use client";

import { useEffect, useRef } from "react";
import { scroll, smoothstep } from "@/lib/state";

export default function TestimonialsBlurOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (overlayRef.current) {
        // We only want the blur overlay to exist during the transition from Section 4 (Services) into Section 5 (Testimonials).
        // It starts fully blurred when we land on the Testimonials section (scroll.section4 reaches 1.0, scroll.section5 is 0.0)
        // And is lifted (fades to 0 blur) as we start scrolling into Section 5 (from scroll.section5 = 0.0 to 0.08).
        // When we scroll past Section 5, or before the transition begins, it should be hidden.
        
        const isTransitionActive = scroll.section4 > 3.9 / 5.0 && scroll.section5 < 0.08;
        
        if (isTransitionActive) {
          overlayRef.current.style.display = "block";
          
          let blurAmount = 0;
          
          if (scroll.section4 < 1.0) {
            // Fading in the blur during the final scroll of Section 4
            const t = (scroll.section4 - 3.9 / 5.0) / (1.1 / 5.0);
            const easedT = smoothstep(0.0, 1.0, t);
            blurAmount = easedT * 20.0;
          } else {
            // Lifting the blur during the first scroll of Section 5
            const t = smoothstep(0.0, 0.08, scroll.section5);
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
        zIndex: 47, // Blurs the Services/Testimonials video BGs (z-index 45/46) but sits under text/cards
        display: "none",
        backgroundColor: "rgba(10, 9, 22, 0.1)", // subtle dark tint matching the theme
        transition: "opacity 0.15s ease-out",
      }}
    />
  );
}
