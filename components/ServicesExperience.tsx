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

    // ── Fish Boids Physics Setup ──────────────────────────────────────────────
    interface Fish {
      x: number;
      y: number;
      vx: number;
      vy: number;
      angle: number;
      size: number;
      phase: number;
      tailWagSpeed: number;
      maxSpeed: number;
      colorVariation: number;
    }

    const fishCount = 28;
    const school: Fish[] = [];

    // Initialize the school of fish
    const cw = tc.width;
    const ch = tc.height;
    const initialMx = ((pointer.x + 1) / 2) * cw;
    const initialMy = ((1 - pointer.y) / 2) * ch;

    for (let i = 0; i < fishCount; i++) {
      // Spawn fish scattered around the viewport so they swim in naturally
      school.push({
        x: initialMx + (Math.random() - 0.5) * cw,
        y: initialMy + (Math.random() - 0.5) * ch,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        angle: Math.random() * Math.PI * 2,
        size: 16 + Math.random() * 11, // Torpedo sizes between 16px and 27px
        phase: Math.random() * Math.PI * 2, // Random starting wag phase
        tailWagSpeed: 1.1 + Math.random() * 0.5,
        maxSpeed: 3.2 + Math.random() * 1.5,
        colorVariation: Math.random(),
      });
    }

    let raf = 0;
    let time = 0;

    // Draw a single procedurally animated fish facing positive X (right)
    const drawFish = (ctx: CanvasRenderingContext2D, L: number, phase: number, colorVar: number) => {
      const H = L * 0.20; // Sleek, streamlined body height (mackerel/tuna ratio)
      
      // Compute body/tail flex offsets based on phase
      const wTail = Math.sin(phase) * L * 0.16;       // Tail wiggle amplitude
      const wMid = Math.sin(phase - 0.95) * L * 0.07;   // Mid-body flex
      const wShoulder = Math.sin(phase - 1.9) * L * 0.025; // Nose/shoulder flex

      // 1. Draw glowing radial background aura (bioluminescence bleed)
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, L * 1.8);
      // Soft cyan-blue light matching the video highlights
      const glowOpacity = 0.18 + 0.06 * Math.sin(phase * 1.5);
      aura.addColorStop(0, `rgba(50, 140, 240, ${glowOpacity})`);
      aura.addColorStop(0.35, `rgba(30, 95, 200, ${glowOpacity * 0.4})`);
      aura.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, L * 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Draw Fish Body Path
      ctx.beginPath();
      
      // Nose / Head
      ctx.moveTo(L / 2, 0);

      // Top flank curve to tail base
      ctx.bezierCurveTo(
        L / 4, -H + wShoulder,
        -L / 6, -H * 0.8 + wMid,
        -L / 2.8, wTail
      );

      // Deeply forked tail fin (Caudal Fin) - classic fast swimmer shape
      ctx.lineTo(-L / 1.8, wTail - L * 0.22); // Top tip
      ctx.quadraticCurveTo(-L / 2.3, wTail, -L / 1.8, wTail + L * 0.22); // Fork center back to bottom tip
      ctx.lineTo(-L / 2.8, wTail); // Back to tail base

      // Bottom flank curve to nose
      ctx.bezierCurveTo(
        -L / 6, H * 0.8 + wMid,
        L / 4, H + wShoulder,
        L / 2, 0
      );

      ctx.closePath();

      // Create metallic silver-blue linear gradient
      const bodyGrad = ctx.createLinearGradient(-L / 2, 0, L / 2, 0);
      // Vary color slightly between fish for depth
      const hue = 196 + colorVar * 16;
      bodyGrad.addColorStop(0, `hsla(${hue}, 85%, 22%, 0.88)`);  // Dark deep blue tail
      bodyGrad.addColorStop(0.42, `hsla(${hue}, 65%, 48%, 0.93)`); // Sleek mid-body blue
      bodyGrad.addColorStop(0.85, `hsla(${hue}, 80%, 78%, 0.96)`); // Glowing silver-cyan neck
      bodyGrad.addColorStop(1, "#ffffff"); // Pure white bioluminescent nose

      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Thin bright glowing stroke along the silhouette
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = `hsla(${hue}, 95%, 72%, 0.38)`;
      ctx.stroke();

      // 3. Draw bright spinal highlight (mimicking overhead light ray reflections)
      ctx.beginPath();
      ctx.moveTo(L / 3.2, -H * 0.3);
      ctx.quadraticCurveTo(0, -H * 0.72 + wMid * 0.5, -L / 3.8, wTail * 0.5);
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.stroke();

      // 4. Draw tiny pectoral fin
      ctx.beginPath();
      ctx.moveTo(L / 6, H * 0.15);
      ctx.quadraticCurveTo(L / 8, H * 0.7, L / 16, H * 0.5);
      ctx.closePath();
      ctx.fillStyle = `hsla(${hue}, 80%, 65%, 0.65)`;
      ctx.fill();
    };

    const tick = () => {
      time += 0.016;

      const cw = tc.width;
      const ch = tc.height;

      // ── Cursor pixel coords ───────────────────────────────────────────────
      const mx = ((pointer.x + 1) / 2) * cw;
      const my = ((1 - pointer.y) / 2) * ch;

      // ── Opacity gate (section4 > 0 means services is active) ─────────────
      const targetOp = scroll.section4 > 0 ? 1 : 0;

      tCtx.clearRect(0, 0, cw, ch);

      if (targetOp > 0.01) {
        // ── Simulate Schooling (Boids) Physics ──────────────────────────────
        for (let i = 0; i < school.length; i++) {
          const f = school[i];

          let ax = 0;
          let ay = 0;

          // 1. Attraction Force to cursor
          const dxM = mx - f.x;
          const dyM = my - f.y;
          const distM = Math.hypot(dxM, dyM);

          if (distM > 10) {
            // Stronger pull when far, gentle orbit/hover behavior when close
            const pullStrength = distM > 160 ? 0.045 : 0.018;
            ax += (dxM / distM) * pullStrength * f.maxSpeed;
            ay += (dyM / distM) * pullStrength * f.maxSpeed;

            // orbital drift when close so they swim around the cursor in loops
            if (distM < 120) {
              const ox = -dyM / distM;
              const oy = dxM / distM;
              ax += ox * 0.14;
              ay += oy * 0.14;
            }
          } else {
            // Passive circling when directly on the mouse
            const wanderAngle = time * 2.5 + i * 0.6;
            ax += Math.cos(wanderAngle) * 0.15;
            ay += Math.sin(wanderAngle) * 0.15;
          }

          // 2. Separation Force (avoid clumping into a single dot)
          for (let j = 0; j < school.length; j++) {
            if (i === j) continue;
            const other = school[j];
            const dxS = f.x - other.x;
            const dyS = f.y - other.y;
            const distS = Math.hypot(dxS, dyS);
            
            const separationRadius = 24; // Min distance between fish
            if (distS < separationRadius && distS > 0.1) {
              const force = (1.0 - distS / separationRadius) * 0.45;
              ax += (dxS / distS) * force;
              ay += (dyS / distS) * force;
            }
          }

          // 3. Wandering/Current drift (adds organic water currents)
          const currentForceX = Math.sin(time * 0.8 + f.y * 0.005) * 0.035;
          const currentForceY = Math.cos(time * 0.6 + f.x * 0.005) * 0.025;
          ax += currentForceX;
          ay += currentForceY;

          // 4. Update Velocity with inertia and damping
          const damping = 0.955;
          f.vx = (f.vx + ax) * damping;
          f.vy = (f.vy + ay) * damping;

          // Speed limits
          const currentSpeed = Math.hypot(f.vx, f.vy);
          if (currentSpeed > f.maxSpeed) {
            f.vx = (f.vx / currentSpeed) * f.maxSpeed;
            f.vy = (f.vy / currentSpeed) * f.maxSpeed;
          } else if (currentSpeed < 1.0) {
            // Keep them swimming forward
            const angle = Math.atan2(f.vy, f.vx);
            f.vx = Math.cos(angle) * 1.0;
            f.vy = Math.sin(angle) * 1.0;
          }

          // 5. Update Position
          f.x += f.vx;
          f.y += f.vy;

          // 6. Orientation Alignment
          f.angle = Math.atan2(f.vy, f.vx);

          // 7. Update tail wagging phase (faster wagging when swimming faster)
          const wagFreq = currentSpeed * 1.85 * f.tailWagSpeed;
          f.phase += wagFreq * 0.045 + 0.03;

          // ── Render Fish ────────────────────────────────────────────────────
          tCtx.save();
          tCtx.translate(f.x, f.y);
          tCtx.rotate(f.angle);
          tCtx.globalAlpha = targetOp;
          
          drawFish(tCtx, f.size, f.phase, f.colorVariation);
          
          tCtx.restore();
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
