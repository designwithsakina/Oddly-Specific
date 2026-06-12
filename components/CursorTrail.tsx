"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  alpha: number;
  size: number;
  vx: number;
  vy: number;
}

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const handlePointerMove = (e: PointerEvent) => {
      // Spawn 2 particles per frame for a consistent but not clumped trail
      for (let i = 0; i < 2; i++) {
        if (Math.random() > 0.9) continue; // 10% chance to skip for slight irregularity
        
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 30, // Tighter scatter radius
          y: e.clientY + (Math.random() - 0.5) * 30,
          alpha: Math.random() * 0.5 + 0.5,
          size: Math.random() * 1.5 + 3.0, // Increased size by 2px (3.0px to 4.5px)
          vx: (Math.random() - 0.5) * 0.8, // Much softer horizontal drift
          vy: (Math.random() - 0.5) * 0.8 - 0.2, // Softer vertical drift
        });
      }
    };

    window.addEventListener("pointermove", handlePointerMove);

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render and update particles
      const activeParticles: Particle[] = [];

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];

        // Apply velocity drift
        p.x += p.vx;
        p.y += p.vy;

        // Draw the glowing dust particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`; // white dot
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();

        // Decay alpha (smooth fade out)
        p.alpha -= 0.015; 

        // Keep particle if it's still visible
        if (p.alpha > 0) {
          activeParticles.push(p);
        }
      }

      // Overwrite the array with only active particles
      particlesRef.current = activeParticles;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      aria-hidden="true"
    />
  );
}
