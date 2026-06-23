"use client";

import { useEffect, useRef } from "react";
import { scroll } from "@/lib/state";

interface Particle {
  x: number;
  y: number;
  alpha: number;
  size: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  isSparkle: boolean;
  phase: number; // random starting phase for twinkling/shimmering
}

interface SparkleCursorProps {
  isServicesRoute?: boolean;
}

export default function SparkleCursor({ isServicesRoute = false }: SparkleCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Physics / position tracking
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const isHoveringRef = useRef(false);
  const wasActiveRef = useRef(false);
  const opacityRef = useRef(0); // smooth entry/exit fade
  const mainRotationRef = useRef(0); // rotating cursor star

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Track mouse pointer
    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      isHoveringRef.current = true;
    };

    const handlePointerLeave = () => {
      isHoveringRef.current = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerleave", handlePointerLeave);

    lastTimeRef.current = performance.now();

    // Utility: Draw a diamond sparkle shape mathematically
    const drawSparkleShape = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: string,
      opacity: number,
      angle: number,
      shimmer: number = 1.0
    ) => {
      c.save();
      c.translate(x, y);
      c.rotate(angle);
      c.globalAlpha = opacity;
      c.globalCompositeOperation = "screen";

      // 1. Core glow (white center, blending to icy blue/cyan)
      const coreSize = size * 0.45 * (0.8 + (shimmer - 1.0) * 0.3);
      const grad = c.createRadialGradient(0, 0, 0, 0, 0, coreSize);
      grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      grad.addColorStop(0.2, "rgba(224, 242, 254, 0.95)"); // light icy blue
      grad.addColorStop(0.55, color);                     // cyan/sky blue
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      c.fillStyle = grad;

      c.beginPath();
      c.arc(0, 0, coreSize, 0, Math.PI * 2);
      c.fill();

      // 2. Draw flare rays (diamond shape)
      const drawFlareRay = (w: number, h: number) => {
        c.beginPath();
        c.moveTo(0, -h);
        c.quadraticCurveTo(w * 0.05, 0, 0, h);
        c.quadraticCurveTo(-w * 0.05, 0, 0, -h);
        c.closePath();
        c.fill();
      };

      // Ray gradient
      const maxRayLength = size * Math.max(shimmer, 2.0 - shimmer);
      const rayGrad = c.createRadialGradient(0, 0, 0, 0, 0, maxRayLength);
      rayGrad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      rayGrad.addColorStop(0.15, "rgba(224, 242, 254, 0.85)");
      rayGrad.addColorStop(0.5, color);
      rayGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      c.fillStyle = rayGrad;

      // Vertical & Horizontal cross
      drawFlareRay(size * 0.35, size * shimmer); // Vertical
      c.save();
      c.rotate(Math.PI / 2);
      drawFlareRay(size * 0.35, size * (2.0 - shimmer)); // Horizontal
      c.restore();

      // Diagonal smaller cross with out-of-phase shimmer
      const diagShimmer = 1.0 + Math.sin(timeRef.current * 18.0 + Math.PI / 2) * 0.25;
      c.save();
      c.rotate(Math.PI / 4);
      drawFlareRay(size * 0.22, size * 0.58 * diagShimmer);
      c.rotate(Math.PI / 2);
      drawFlareRay(size * 0.22, size * 0.58 * (2.0 - diagShimmer));
      c.restore();

      c.restore();
    };

    const render = (now: number) => {
      const dt = Math.min(0.03, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;
      timeRef.current += dt;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;

      const vh = window.innerHeight;
      const rawScroll = scroll.raw;
      const section4Start = 22.2 * vh;

      // Active in Section 4 (Services)
      const isSplashActive = document.documentElement.classList.contains("splash-active");
      const isActive = !isSplashActive && (rawScroll >= section4Start - 100 || isServicesRoute);

      // Damp opacity for smooth fade entry/exit
      const targetOpacity = isActive ? 1.0 : 0.0;
      opacityRef.current += (targetOpacity - opacityRef.current) * 0.1;

      const opacity = opacityRef.current;

      // Hide default browser cursor when active
      if (isActive && opacity > 0.1) {
        if (isHoveringRef.current) {
          document.body.classList.add("hide-cursor");
        } else {
          document.body.classList.remove("hide-cursor");
        }
        wasActiveRef.current = true;
      } else if (wasActiveRef.current) {
        document.body.classList.remove("hide-cursor");
        wasActiveRef.current = false;
      }

      // 1. Lerp mouse coordinate position for buttery smooth trailing
      const m = mouseRef.current;
      const dx = m.targetX - m.x;
      const dy = m.targetY - m.y;
      m.x += dx * 0.18; // Magical, responsive float feel
      m.y += dy * 0.18;

      const speed = Math.sqrt(dx * dx + dy * dy);
      const speedFactor = Math.min(1.0, speed / 35); // normalized velocity factor

      // Rotate the main cursor sparkle slowly (pulsing on motion)
      mainRotationRef.current += dt * 0.38 + speedFactor * 0.04;

      // Main cursor color - icy blue / light cyan
      const mainColor = "rgba(14, 165, 233, 0.85)"; // #0ea5e9

      // 2. Spawn star trail particles
      if (opacity > 0.05 && isHoveringRef.current) {
        // Spawn chance scales with speed
        const spawnChance = 0.15 + speedFactor * 0.65;
        if (Math.random() < spawnChance) {
          const angle = Math.random() * Math.PI * 2;
          const pSpeed = 0.5 + Math.random() * 1.5 + speedFactor * 2.0;

          particlesRef.current.push({
            x: m.x + (Math.random() - 0.5) * 8,
            y: m.y + (Math.random() - 0.5) * 8,
            alpha: Math.random() * 0.45 + 0.55,
            size: Math.random() * 8.0 + 8.0, // Only diamond sparkles
            vx: Math.cos(angle) * pSpeed * 0.25 - (dx * 0.05), // fly outward, lagging slightly behind mouse velocity
            vy: Math.sin(angle) * pSpeed * 0.25 - (dy * 0.05),
            color: Math.random() > 0.65
              ? "rgba(186, 230, 253, 0.9)"  // sky-200 (Icy White/Blue)
              : "rgba(56, 189, 248, 0.85)",  // sky-400 (Vibrant Cyan)
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 1.5,
            isSparkle: true,
            phase: Math.random() * Math.PI * 2
          });
        }
      }

      // 3. Render and update particles
      const activeParticles: Particle[] = [];
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];

        // Apply velocity & drift
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed * dt;

        // Apply slight float drift
        p.vy -= 0.02; 

        const finalOpacity = p.alpha * opacity;

        if (finalOpacity > 0.01) {
          // Dynamic shimmer and opacity flicker for trail sparkles
          const pShimmer = 1.0 + Math.sin(timeRef.current * 18.0 + p.phase) * 0.35;
          const flicker = 0.7 + Math.sin(timeRef.current * 25.0 + p.phase) * 0.3;
          const renderOpacity = finalOpacity * flicker;

          if (renderOpacity > 0.01) {
            // Draw diamond sparkle particle
            drawSparkleShape(
              ctx,
              p.x,
              p.y,
              p.size,
              p.color,
              renderOpacity,
              p.rotation,
              pShimmer
            );
          }

          // Slow decay
          p.alpha -= 0.014;
          if (p.alpha > 0) {
            activeParticles.push(p);
          }
        }
      }
      particlesRef.current = activeParticles;

      // 4. Draw the main diamond sparkle cursor at pointer location
      if (opacity > 0.01 && isHoveringRef.current) {
        // Pulse size based on time and velocity
        const pulse = 1.0 + Math.sin(timeRef.current * 18.0) * 0.08 + speedFactor * 0.15;
        const cursorSize = 28 * pulse;
        const mainShimmer = 1.0 + Math.sin(timeRef.current * 18.0) * 0.35;

        drawSparkleShape(
          ctx,
          m.x,
          m.y,
          cursorSize,
          mainColor,
          opacity,
          mainRotationRef.current,
          mainShimmer
        );
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
      document.body.classList.remove("hide-cursor");
      cancelAnimationFrame(animationFrameId);
    };
  }, [isServicesRoute]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  );
}
