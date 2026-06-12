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
  const [butterflyImage, setButterflyImage] = useState<HTMLCanvasElement | null>(null);
  
  // Physics / position tracking
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rotationRef = useRef(0);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const isHoveringRef = useRef(false);

  // Load and process image to make background transparent
  useEffect(() => {
    const img = new Image();
    img.src = "/butterfly.png";
    img.onload = () => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCtx.drawImage(img, 0, 0);
      const imgData = tempCtx.getImageData(0, 0, img.width, img.height);
      const data = imgData.data;

      // Smooth luma keying with noise gate to clean black background,
      // and a gamma curve (< 1.0) to preserve dark glass facets inside the wings
      const threshold = 32; // pixels with luma below this start fading out
      const fadeRange = 26;   // fade range to 0 (fades out between 6 and 32)

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Luminance calculation
        const luma = r * 0.299 + g * 0.587 + b * 0.114;

        let alphaFactor = 1.0;
        if (luma < threshold - fadeRange) {
          alphaFactor = 0.0;
        } else if (luma < threshold) {
          alphaFactor = (luma - (threshold - fadeRange)) / fadeRange;
        }

        // Boost shadows/midtones using gamma = 0.65 to keep glass wings solid and smooth,
        // and scale alpha to make highlights pop.
        const glassAlpha = Math.pow(luma / 255.0, 0.65) * 1.5;
        const finalAlpha = Math.min(255, Math.floor(alphaFactor * glassAlpha * 255));
        
        data[i + 3] = finalAlpha;

        if (finalAlpha > 0) {
          // Un-premultiply: divide pixel color channels by alpha to remove dark halo
          const aNorm = Math.max(0.12, finalAlpha / 255.0);
          data[i] = Math.min(255, Math.floor(r / aNorm));
          data[i + 1] = Math.min(255, Math.floor(g / aNorm));
          data[i + 2] = Math.min(255, Math.floor(b / aNorm));
        }
      }
      tempCtx.putImageData(imgData, 0, 0);
      setButterflyImage(tempCanvas);
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
      const isActive = rawScroll > 2.0 * vh;
      const opacity = Math.min(1.0, Math.max(0.0, (rawScroll - 2.0 * vh) / (0.2 * vh)));

      // Add or remove body class to hide standard cursor
      if (isActive && isHoveringRef.current) {
        document.body.classList.add("hide-cursor");
      } else {
        document.body.classList.remove("hide-cursor");
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
      const tailOffset = 22; // px offset from center body
      const bodyAngle = drawAngle + 3 * Math.PI / 4; // 135 deg offset is opposite the head
      const tailX = m.x + tailOffset * Math.cos(bodyAngle);
      const tailY = m.y + tailOffset * Math.sin(bodyAngle);

      // Spawn trail particles if active and cursor is moving or breathing
      if (opacity > 0.05 && isHoveringRef.current) {
        // Spawn more particles when moving fast
        const spawnChance = 0.2 + speedFactor * 0.8;
        if (Math.random() < spawnChance) {
          particlesRef.current.push({
            x: tailX + (Math.random() - 0.5) * 6,
            y: tailY + (Math.random() - 0.5) * 6,
            alpha: Math.random() * 0.45 + 0.55,
            size: Math.random() * 1.5 + 2.8, // 2.8px to 4.3px
            vx: (Math.random() - 0.5) * 0.6 - Math.cos(bodyAngle) * 0.4, // float backwards away from tail
            vy: (Math.random() - 0.5) * 0.6 - Math.sin(bodyAngle) * 0.4 - 0.1, // float slightly up
            color: { r: 255, g: 255, b: 255 } // Reset particle color to white
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
        // Fade particles out based on global opacity, draw white glowing dots
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * opacity})`;
        ctx.shadowBlur = 12; // Beautiful glow
        ctx.shadowColor = `rgba(255, 255, 255, ${p.alpha * opacity})`;
        ctx.fill();

        p.alpha -= 0.014; // decay rate
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

        const drawSize = 92; // px size
        
        // Disable shadow/glow on the butterfly itself to prevent bounding box halo artifacts
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
        
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
