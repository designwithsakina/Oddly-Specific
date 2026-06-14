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
  isBubble: boolean;
}

interface MantaRayCursorProps {
  isWorkRoute?: boolean;
}

export default function MantaRayCursor({ isWorkRoute = false }: MantaRayCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mantaImage, setMantaImage] = useState<HTMLImageElement | null>(null);

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
    img.src = "/manta.png?v=" + Date.now(); // Cache buster
    img.onload = () => {
      setMantaImage(img);
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
      const dt = Math.min(0.03, (now - lastTimeRef.current) / 1000); // clamp dt
      lastTimeRef.current = now;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const vh = window.innerHeight;
      const rawScroll = scroll.raw;

      // Active in Section 3 (Underwater Projects) starting past 5.2vh, or immediately on /work route
      const isSplashActive = document.documentElement.classList.contains("splash-active");
      const isActive = !isSplashActive && (rawScroll >= 5.2 * vh || isWorkRoute);
      const opacity = isActive ? 1.0 : 0.0; // Sharp gating for Section 3 boundary

      // Hide default browser cursor only on transition states
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
      m.x += dx * 0.08; // Slightly heavier than butterfly for a floating underwater feel
      m.y += dy * 0.08;

      const speed = Math.sqrt(dx * dx + dy * dy);
      const speedFactor = Math.min(1.0, speed / 30); // 0 to 1 scaling speed

      // 2. Update rotation based on motion direction
      if (speed > 0.5) {
        const targetAngle = Math.atan2(dy, dx);
        
        // Handle wrapping angle for smooth interpolation
        let diff = targetAngle - rotationRef.current;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        
        rotationRef.current += diff * 0.08;
      }

      // Align manta ray head (straight up in original png) to face forward
      const drawAngle = rotationRef.current + Math.PI / 2;

      // 3. Swim flapping frequency & amplitude based on velocity
      const swimFreq = 4.0 + speedFactor * 10.0; // 4 rad/s idle, up to 14 rad/s moving
      const swimAmp = 0.05 + speedFactor * 0.12; // small undulation at rest, larger when swimming
      timeRef.current += dt * swimFreq;

      const drawSize = 120; // Size of the manta ray

      // 4. Calculate emitter points in screen space for particles (tail and wingtips)
      const cosVal = Math.cos(drawAngle);
      const sinVal = Math.sin(drawAngle);

      // Tail (local x=0, y=drawSize/2 - at the bottom)
      const tailX = m.x - (drawSize / 2) * sinVal;
      const tailY = m.y + (drawSize / 2) * cosVal;

      // Left wingtip (local x=-drawSize/2, y=0)
      const leftX = m.x - (drawSize / 2) * cosVal;
      const leftY = m.y - (drawSize / 2) * sinVal;

      // Right wingtip (local x=drawSize/2, y=0)
      const rightX = m.x + (drawSize / 2) * cosVal;
      const rightY = m.y + (drawSize / 2) * sinVal;

      // Track tail coordinates history for underwater wake streams
      if (opacity > 0.05 && isHoveringRef.current) {
        historyRef.current.push({ x: tailX, y: tailY, angle: rotationRef.current });
        if (historyRef.current.length > 25) {
          historyRef.current.shift();
        }
      } else {
        historyRef.current = [];
      }

      // 4a. Draw the waving underwater wake streams
      const history = historyRef.current;
      if (history.length >= 2) {
        const drawStream = (offsetSide: number) => {
          ctx.beginPath();
          for (let i = 0; i < history.length; i++) {
            const p = history[i];
            const perpAngle = p.angle + Math.PI / 2;
            
            // Sinusoidal wave to simulate water turbulence behind the ray
            const wave = Math.sin(timeRef.current * 8 - i * 0.3) * 3.5 * (1.0 - i / history.length);
            const offsetDist = offsetSide * 12 + wave;
            
            const sx = p.x + Math.cos(perpAngle) * offsetDist;
            const sy = p.y + Math.sin(perpAngle) * offsetDist;
            
            if (i === 0) {
              ctx.moveTo(sx, sy);
            } else {
              ctx.lineTo(sx, sy);
            }
          }
          
          const lastIdx = history.length - 1;
          const grad = ctx.createLinearGradient(
            history[0].x, history[0].y,
            history[lastIdx].x, history[lastIdx].y
          );
          
          // Soft cyan bioluminescent water glow
          grad.addColorStop(0.0, "rgba(0, 180, 255, 0.0)");
          grad.addColorStop(0.4, `rgba(0, 200, 255, ${opacity * 0.10})`);
          grad.addColorStop(1.0, `rgba(120, 240, 255, ${opacity * 0.32})`);
          
          ctx.strokeStyle = grad;
          ctx.lineWidth = offsetSide === 0 ? 2.0 : 1.2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(0, 180, 255, ${opacity * 0.35})`;
          
          ctx.stroke();
        };

        ctx.save();
        drawStream(0);   // Center wake
        drawStream(1);   // Left wake
        drawStream(-1);  // Right wake
        ctx.restore();
      }

      // 4b. Spawn glowing bioluminescent bubbles and sparks
      if (opacity > 0.05 && isHoveringRef.current) {
        const spawnChance = 0.12 + speedFactor * 0.48;
        if (Math.random() < spawnChance) {
          const emitter = Math.floor(Math.random() * 3);
          let spawnX = 0;
          let spawnY = 0;
          const isBubble = Math.random() > 0.45; // 55% bubbles, 45% sparks
          
          if (emitter === 0) {
            spawnX = tailX;
            spawnY = tailY;
          } else if (emitter === 1) {
            spawnX = leftX;
            spawnY = leftY;
          } else {
            spawnX = rightX;
            spawnY = rightY;
          }
          
          const angleBack = rotationRef.current + Math.PI + (Math.random() - 0.5) * 0.6;
          const pSpeed = 0.4 + Math.random() * 1.2 + speedFactor * 1.8;
          
          particlesRef.current.push({
            x: spawnX + (Math.random() - 0.5) * 4,
            y: spawnY + (Math.random() - 0.5) * 4,
            alpha: Math.random() * 0.4 + 0.6,
            size: isBubble ? Math.random() * 2.2 + 1.2 : Math.random() * 1.0 + 1.0,
            vx: Math.cos(angleBack) * pSpeed * 0.6,
            vy: Math.sin(angleBack) * pSpeed * 0.6 - 0.15, // float up slightly
            color: Math.random() > 0.5 
              ? { r: 120, g: 240, b: 255 } // Bioluminescent Cyan
              : { r: 180, g: 120, b: 255 }, // Bioluminescent Purple
            isBubble
          });
        }
      }

      // Update and draw particles
      const activeParticles: Particle[] = [];
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;

        ctx.save();
        if (p.isBubble) {
          // Hollow water bubble with white highlight reflection
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(130, 220, 255, ${p.alpha * opacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          
          ctx.beginPath();
          ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * opacity * 0.8})`;
          ctx.fill();

          p.size += 0.04; // expand bubble size slightly
        } else {
          // Filled glowing bioluminescent spark
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha * opacity})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha * opacity})`;
          ctx.fill();
        }
        ctx.restore();

        p.alpha -= 0.012; // decay
        if (p.alpha > 0) {
          activeParticles.push(p);
        }
      }
      particlesRef.current = activeParticles;

      // 5. Draw the manta ray cursor in one piece with smooth swim flapping scales
      if (mantaImage && opacity > 0.01 && isHoveringRef.current) {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(m.x, m.y);
        ctx.rotate(drawAngle);

        // Swimming wing-flapping scale oscillation:
        // scaleX contracts as wings flap up, scaleY stretches out of phase
        const scaleX = 1.0 - Math.abs(Math.sin(timeRef.current)) * swimAmp * 2.5;
        const scaleY = 1.0 + Math.cos(timeRef.current) * swimAmp * 0.5;
        ctx.scale(scaleX, scaleY);

        // Add soft bioluminescent glow around the ray
        ctx.shadowBlur = 24;
        ctx.shadowColor = "rgba(100, 200, 255, 0.35)";

        ctx.drawImage(
          mantaImage,
          -drawSize / 2,
          -drawSize / 2,
          drawSize,
          drawSize
        );
        ctx.restore();
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
  }, [mantaImage, isWorkRoute]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: "screen" }}
      aria-hidden="true"
    />
  );
}
