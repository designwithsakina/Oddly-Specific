"use client";

import { useRef, useEffect } from "react";
import { scroll, pointer } from "@/lib/state";

export default function ServicesExperience() {
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const tc = trailCanvasRef.current;
    if (!tc) return;

    const tCtx = tc.getContext("2d");
    if (!tCtx) return;

    const resize = () => {
      tc.width = window.innerWidth;
      tc.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Cursor trail particles ────────────────────────────────────────────────
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      hue: number;
    }
    const particles: Particle[] = [];
    let lastPX = -999;
    let lastPY = -999;

    const spawnAt = (x: number, y: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        particles.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: Math.cos(a) * 0.3,
          vy: -(0.55 + Math.random() * 0.85),
          life: 1,
          maxLife: 0.9 + Math.random() * 1.5,
          size: 1.8 + Math.random() * 3.8,
          hue: 195 + (Math.random() - 0.5) * 35, // Bioluminescent cyan/blue range
        });
      }
    };

    let raf = 0;
    let time = 0;

    const tick = () => {
      time += 0.016;

      const cw = tc.width;
      const ch = tc.height;

      // ── Cursor pixel coords ───────────────────────────────────────────────
      const mx = ((pointer.x + 1) / 2) * cw;
      const my = ((1 - pointer.y) / 2) * ch;

      // ── Opacity gate (section4 > 0 means services is active) ─────────────
      const targetOp = scroll.section4 > 0 ? 1 : 0;

      // ═══════════════════════════════════════════════════════════════════════
      // CURSOR TRAIL CANVAS
      // ═══════════════════════════════════════════════════════════════════════
      tCtx.clearRect(0, 0, cw, ch);

      if (targetOp > 0.01) {
        const moved = Math.hypot(mx - lastPX, my - lastPY) > 2.5;
        if (moved) {
          spawnAt(mx, my, 3);
          lastPX = mx;
          lastPY = my;
        } else if (Math.random() < 0.12) {
          spawnAt(mx, my, 1);
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life -= 0.016 / p.maxLife;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }

          p.vy -= 0.018; // Buoyant force upwards
          p.vx += Math.sin(time * 2.8 + i * 0.7) * 0.014; // Sway back and forth
          p.x += p.vx;
          p.y += p.vy;

          const pa = p.life * (1 - (1 - p.life) * 0.4) * targetOp * 0.85;
          const r = p.size * (0.4 + p.life * 0.6);

          const grad = tCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2);
          grad.addColorStop(0, `hsla(${p.hue}, 20%, 98%, ${pa})`);
          grad.addColorStop(0.28, `hsla(${p.hue}, 80%, 75%, ${pa * 0.72})`);
          grad.addColorStop(0.65, `hsla(${p.hue}, 95%, 60%, ${pa * 0.35})`);
          grad.addColorStop(1, `hsla(${p.hue}, 100%, 55%, 0)`);

          tCtx.beginPath();
          tCtx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2);
          tCtx.fillStyle = grad;
          tCtx.fill();
        }
      } else {
        // Clear particles when scrolled away
        if (particles.length > 0) {
          particles.length = 0;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={trailCanvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 50 }}
    />
  );
}
