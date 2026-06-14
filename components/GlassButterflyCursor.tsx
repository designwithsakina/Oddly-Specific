"use client";

import { useEffect, useRef, useState } from "react";
import { scroll } from "@/lib/state";

interface Particle {
  x: number;
  y: number;
  alpha: number;
  size: number;
  vx: number;
  vy: number;
  color: { r: number; g: number; b: number };
}

export default function GlassButterflyCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [butterflyImage, setButterflyImage] = useState<HTMLImageElement | null>(null);
  
  // Physics / position tracking
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rotationRef = useRef(0);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const historyRef = useRef<{ x: number; y: number; angle: number }[]>([]);
  const isHoveringRef = useRef(false);
  const wasActiveRef = useRef(false);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = "/butterfly.png?v=" + Date.now(); // Cache buster
    img.onload = () => {
      setButterflyImage(img);
    };
  }, []);

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

    const render = (now: number) => {
      const dt = Math.min(0.03, (now - lastTimeRef.current) / 1000); // clamp dt to prevent giant jumps
      lastTimeRef.current = now;

      // Clear the physical canvas coordinates
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context state, apply device pixel ratio scaling, and configure high-quality smoothing
      ctx.save();
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const vh = window.innerHeight;
      const rawScroll = scroll.raw;

      // Show the butterfly and custom cursor when we scroll down into the Morph/About section
      // Transition starts at 2.0vh (200vh) and is fully active by 2.2vh (220vh)
      // Never activate while the splash screen is active or on Section 3 (past 5.2vh)
      const isSplashActive = document.documentElement.classList.contains("splash-active");
      const isActive = !isSplashActive && rawScroll > 2.0 * vh && rawScroll < 5.2 * vh;
      const opacity = isActive ? Math.min(1.0, Math.max(0.0, (rawScroll - 2.0 * vh) / (0.2 * vh))) : 0;

      // Add or remove body class to hide standard cursor only on transition states
      if (isActive) {
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

      // 1. Lerp cursor position for buttery organic movement
      const m = mouseRef.current;
      const dx = m.targetX - m.x;
      const dy = m.targetY - m.y;
      m.x += dx * 0.12;
      m.y += dy * 0.12;

      const speed = Math.sqrt(dx * dx + dy * dy);
      const speedFactor = Math.min(1.0, speed / 40); // 0 to 1 scaling speed

      // 2. Update rotation based on motion direction
      if (speed > 0.5) {
        const targetAngle = Math.atan2(dy, dx);
        
        // Handle wrapping angle for smooth interpolation
        let diff = targetAngle - rotationRef.current;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        
        rotationRef.current += diff * 0.1;
      }

      const drawAngle = rotationRef.current + Math.PI / 4; // Align butterfly diagonal axis to point forwards

      // 3. Dynamic flap speed and amplitude based on speed
      const flapFreq = 5.0 + speedFactor * 24.0; // 5rad/s idle, up to 29rad/s moving
      const flapAmp = 0.18 + speedFactor * 0.52; // small flap idle, large flap moving
      timeRef.current += dt * flapFreq;
      const scaleX = 1.0 - Math.abs(Math.sin(timeRef.current)) * flapAmp;

      // 4. Draw fairy dust trail particles from the tail
      // Tail is located opposite to the direction of travel
      const tailOffset = 30; // px offset from center body (adjusted for 124px size)
      const bodyAngle = drawAngle + 3 * Math.PI / 4; // 135 deg offset is opposite the head
      const tailX = m.x + tailOffset * Math.cos(bodyAngle);
      const tailY = m.y + tailOffset * Math.sin(bodyAngle);

      // Track tail coordinate history for the wind stream effect
      if (opacity > 0.05 && isHoveringRef.current) {
        historyRef.current.push({ x: tailX, y: tailY, angle: rotationRef.current });
        if (historyRef.current.length > 20) {
          historyRef.current.shift();
        }
      } else {
        // Clear history if inactive so it doesn't snap when returning
        historyRef.current = [];
      }

      // 4a. Draw the waving wind ribbon streams
      const history = historyRef.current;
      if (history.length >= 2) {
        const drawStream = (offsetSide: number) => {
          ctx.beginPath();
          for (let i = 0; i < history.length; i++) {
            const p = history[i];
            const perpAngle = p.angle + Math.PI / 2;
            
            // Add a gentle waving wave to simulate wind turbulence
            const wave = Math.sin(timeRef.current * 14 - i * 0.4) * 4.5 * (1.0 - i / history.length);
            const offsetDist = offsetSide * 15 + wave;
            
            const sx = p.x + Math.cos(perpAngle) * offsetDist;
            const sy = p.y + Math.sin(perpAngle) * offsetDist;
            
            if (i === 0) {
              ctx.moveTo(sx, sy);
            } else {
              ctx.lineTo(sx, sy);
            }
          }
          
          // Create a gradient that fades out towards the oldest points in history
          const lastIdx = history.length - 1;
          const grad = ctx.createLinearGradient(
            history[0].x, history[0].y,
            history[lastIdx].x, history[lastIdx].y
          );
          
          // Beautiful soft blue tint wind glow
          grad.addColorStop(0.0, "rgba(130, 205, 255, 0.0)");
          grad.addColorStop(0.4, `rgba(145, 215, 255, ${opacity * 0.12})`);
          grad.addColorStop(1.0, `rgba(175, 235, 255, ${opacity * 0.38})`);
          
          ctx.strokeStyle = grad;
          ctx.lineWidth = offsetSide === 0 ? 1.8 : 1.2; // center stream is slightly thicker
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          
          // Add soft blue wind glow
          ctx.shadowBlur = 8;
          ctx.shadowColor = `rgba(130, 205, 255, ${opacity * 0.35})`;
          
          ctx.stroke();
        };

        // Draw Center, Left, and Right streams
        ctx.save();
        drawStream(0);   // Center
        drawStream(1);   // Left
        drawStream(-1);  // Right
        ctx.restore();
      }

      // 4b. Spawn a few very fine drifting sparks with a blue tint
      if (opacity > 0.05 && isHoveringRef.current) {
        // Lower spawn rate, makes it feel like subtle crystal dust in the wind
        const spawnChance = 0.1 + speedFactor * 0.45;
        if (Math.random() < spawnChance) {
          particlesRef.current.push({
            x: tailX + (Math.random() - 0.5) * 6,
            y: tailY + (Math.random() - 0.5) * 6,
            alpha: Math.random() * 0.4 + 0.6,
            size: Math.random() * 1.0 + 1.2, // Very fine sparks (1.2px to 2.2px)
            vx: (Math.random() - 0.5) * 0.4 - Math.cos(bodyAngle) * 0.9, // blow backwards faster
            vy: (Math.random() - 0.5) * 0.4 - Math.sin(bodyAngle) * 0.9 - 0.1,
            color: { r: 160, g: 228, b: 255 } // Soft blue tint
          });
        }
      }

      // Update and draw particles
      const activeParticles: Particle[] = [];
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // Fade particles out based on global opacity, draw soft blue glowing dust
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha * opacity})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha * opacity})`;
        ctx.fill();

        p.alpha -= 0.016; // decay rate
        if (p.alpha > 0) {
          activeParticles.push(p);
        }
      }
      particlesRef.current = activeParticles;

      // 5. Draw the glass butterfly
      if (butterflyImage && opacity > 0.01 && isHoveringRef.current) {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(m.x, m.y);
        ctx.rotate(drawAngle);
        ctx.scale(scaleX, 1.0); // Compress horizontal local axis to flap wings

        const drawSize = 124; // px size (increased to be clearly larger)
        
        // Add a soft, delicate outer glow matching the glass highlights to lift it off the page.
        // This is now fully safe because the border vignette ensures no bounding box artifacts.
        ctx.shadowBlur = 24;
        ctx.shadowColor = "rgba(180, 230, 255, 0.28)";
        
        ctx.drawImage(
          butterflyImage,
          -drawSize / 2,
          -drawSize / 2,
          drawSize,
          drawSize
        );
        ctx.restore();
      }

      // Restore outer context state (DPR scale)
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
  }, [butterflyImage]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]" // Mount over everything
      style={{ mixBlendMode: "screen" }} // Screen blend mode blends glass highlights beautifully
      aria-hidden="true"
    />
  );
}
