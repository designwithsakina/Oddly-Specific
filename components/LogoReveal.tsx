"use client";

import { useEffect, useRef } from "react";
import { scroll, smoothstep } from "@/lib/state";

/**
 * The Oddly Specific mark. Hidden while the headline owns the screen; once the
 * text has dissolved it blurs + fades into focus over a single scroll and holds,
 * centred, until the next section scrolls up and covers it.
 *
 * The mark is light (pink/cream/blue) so it reads cleanly on the dark valley;
 * just a soft glow keeps it luminous.
 * Lives inside <main> (z-15) so the opaque section below (z-20) slides over it.
 */
export default function LogoReveal() {
  const wrap = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = scroll.hero;
      // fade + de-blur as the headline finishes dissolving (text gone by ~0.4)
      const reveal = smoothstep(0.4, 0.58, p);
      // then keep growing with the crystal as it advances toward the viewer —
      // the mark reads as living on the face of the approaching block.
      const grow = smoothstep(0.4, 1.0, p);
      if (wrap.current) wrap.current.style.opacity = String(reveal);
      if (img.current) {
        const blur = (1 - reveal) * 18;
        const scale = 0.85 + grow * 1.0; // 0.85 → 1.85
        img.current.style.transform = `scale(${scale})`;
        img.current.style.filter = `blur(${blur}px) drop-shadow(0 20px 30px rgba(0,0,0,0.85)) drop-shadow(0 0 50px rgba(180,80,255,0.35))`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={wrap}
      className="pointer-events-none fixed inset-0 z-[15] grid place-items-center"
      style={{ opacity: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={img}
        src="/logo.png"
        alt="Oddly Specific"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        className="w-[clamp(300px,40vw,720px)] select-none will-change-transform"
        style={{ filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.85)) drop-shadow(0 0 50px rgba(180,80,255,0.35))" }}
      />
    </div>
  );
}
