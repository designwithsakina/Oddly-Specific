"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import LoaderOne from "@/components/ui/loader-one";

// 1. Starfield Component to render a starry sky and a vertical Milky Way lane
function Starfield() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 2500;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    
    const colorMilky = new THREE.Color("#dceaff");
    const colorFaint = new THREE.Color("#4a6a94");
    const colorWhite = new THREE.Color("#ffffff");

    for (let i = 0; i < count; i++) {
      if (i < count * 0.6) {
        // 60% of stars distributed in a vertical, slightly diagonal band for the Milky Way
        const y = (Math.random() - 0.5) * 20;
        // Milky way is vertical and slightly tilted: x = y * 0.25
        const x = y * 0.25 + (Math.random() - 0.5) * 2.8 * (1.5 - Math.abs(y) / 10);
        const z = -6 - Math.random() * 8;
        
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;

        const mixColor = Math.random() > 0.4 ? colorMilky : colorFaint;
        cols[i * 3] = mixColor.r;
        cols[i * 3 + 1] = mixColor.g;
        cols[i * 3 + 2] = mixColor.b;
      } else {
        // Uniform background stars scattered across space
        const x = (Math.random() - 0.5) * 35;
        const y = (Math.random() - 0.5) * 25;
        const z = -8 - Math.random() * 8;
        
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;

        const col = Math.random() > 0.7 ? colorWhite : colorFaint;
        cols[i * 3] = col.r;
        cols[i * 3 + 1] = col.g;
        cols[i * 3 + 2] = col.b;
      }
    }
    return { positions: pos, colors: cols };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      // Very slow background galaxy rotation
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.0003;
      pointsRef.current.rotation.z = state.clock.getElapsedTime() * 0.0001;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.038}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        vertexColors={true}
      />
    </points>
  );
}

// 2. InteractiveClouds Component to render volumetric 3D clouds and soft floating fog mist
function InteractiveClouds() {
  const groupRef = useRef<THREE.Group>(null);
  const mistGroupRef = useRef<THREE.Group>(null);

  // Load the realistic transparent cloud sprite texture
  const cloudTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load("/cloud_sprite.png");
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  const cloudsData = useMemo(() => {
    const count = 80; // Denser volumetric cloud floor
    const list = [];
    for (let i = 0; i < count; i++) {
      const z = -6.5 + Math.random() * 9.0;
      const baseX = (Math.random() - 0.5) * 16;
      const baseY = -2.6 - Math.random() * 1.6; // sit nicely in viewport
      
      const size = 4.2 + Math.random() * 3.5;

      const color = new THREE.Color();
      if (z < -3) {
        color.setRGB(0.18, 0.32, 0.65); // Horizon twilight blue
      } else if (z < 1) {
        color.setRGB(0.1, 0.16, 0.35);  // Mid-ground blue
      } else {
        color.setRGB(0.04, 0.07, 0.18);  // Foreground shadow silhouette
      }
      
      const rotation = Math.random() * Math.PI * 2;

      list.push({
        id: i,
        baseX,
        baseY,
        x: baseX,
        y: baseY,
        z,
        size,
        color,
        phase: Math.random() * Math.PI * 2,
        targetX: baseX,
        targetY: baseY,
        rotation,
      });
    }
    return list;
  }, []);

  // 12 Giant floating mist sheets that drift slowly to create a soft volumetric fog overlay
  const mistData = useMemo(() => {
    const count = 12;
    const list = [];
    for (let i = 0; i < count; i++) {
      const z = -5.0 + Math.random() * 8.0;
      const baseX = (Math.random() - 0.5) * 18;
      const baseY = -2.0 - Math.random() * 0.8; // sit slightly higher to blanket the clouds
      const size = 12.0 + Math.random() * 7.0; // very large scale
      
      const color = new THREE.Color("#0c193b"); // soft twilight blue/navy mist
      const rotation = Math.random() * Math.PI * 2;

      list.push({
        id: i,
        baseX,
        baseY,
        x: baseX,
        y: baseY,
        z,
        size,
        color,
        phase: Math.random() * Math.PI * 2,
        targetX: baseX,
        targetY: baseY,
        rotation,
      });
    }
    return list;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const mouseX = state.pointer.x * 6; // projected canvas coordinates
    const mouseY = state.pointer.y * 3.5 - 2.0; // offset down to the cloud layer

    // A. Animate Clouds
    if (groupRef.current) {
      const sprites = groupRef.current.children;
      cloudsData.forEach((cloud, idx) => {
        const sprite = sprites[idx] as THREE.Sprite;
        if (!sprite) return;

        const floatX = Math.sin(time * 0.12 + cloud.phase) * 0.15;
        const floatY = Math.cos(time * 0.16 + cloud.phase) * 0.1;

        const currentBaseX = cloud.baseX + floatX;
        const currentBaseY = cloud.baseY + floatY;

        const dx = cloud.x - mouseX;
        const dy = cloud.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 3.0) {
          const force = (3.0 - dist) * 0.25;
          const angle = Math.atan2(dy, dx);
          cloud.targetX = currentBaseX + Math.cos(angle) * force * 1.6;
          cloud.targetY = currentBaseY + Math.sin(angle) * force * 1.0;
        } else {
          cloud.targetX += (currentBaseX - cloud.targetX) * 0.03;
          cloud.targetY += (currentBaseY - cloud.targetY) * 0.03;
        }

        cloud.x += (cloud.targetX - cloud.x) * 0.06;
        cloud.y += (cloud.targetY - cloud.y) * 0.06;

        sprite.position.set(cloud.x, cloud.y, cloud.z);
      });
    }

    // B. Animate Mist Sheets (drift very slowly, no mouse repulsion to keep fog stable)
    if (mistGroupRef.current) {
      const sprites = mistGroupRef.current.children;
      mistData.forEach((mist, idx) => {
        const sprite = sprites[idx] as THREE.Sprite;
        if (!sprite) return;

        const floatX = Math.sin(time * 0.04 + mist.phase) * 0.25;
        const floatY = Math.cos(time * 0.06 + mist.phase) * 0.15;

        mist.x = mist.baseX + floatX;
        mist.y = mist.baseY + floatY;

        sprite.position.set(mist.x, mist.y, mist.z);
      });
    }
  });

  return (
    <>
      {/* Cloud Sprites Floor */}
      <group ref={groupRef}>
        {cloudsData.map((cloud) => (
          <sprite key={cloud.id} position={[cloud.x, cloud.y, cloud.z]} scale={[cloud.size, cloud.size, 1]}>
            <spriteMaterial
              map={cloudTexture}
              color={cloud.color}
              rotation={cloud.rotation}
              transparent={true}
              opacity={0.96}
              depthWrite={false}
              blending={THREE.NormalBlending}
            />
          </sprite>
        ))}
      </group>

      {/* Floating Fog Mist Sheets */}
      <group ref={mistGroupRef}>
        {mistData.map((mist) => (
          <sprite key={`mist-${mist.id}`} position={[mist.x, mist.y, mist.z]} scale={[mist.size, mist.size, 1]}>
            <spriteMaterial
              map={cloudTexture}
              color={mist.color}
              rotation={mist.rotation}
              transparent={true}
              opacity={0.35} // Low opacity for soft volumetric haze
              depthWrite={false}
              blending={THREE.NormalBlending}
            />
          </sprite>
        ))}
      </group>
    </>
  );
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+~`{}|[]\\:\";'<>?,./";

interface ScrambleTextProps {
  triggerText: string;
  targetText: string;
  isHovered: boolean;
}

const ScrambleText: React.FC<ScrambleTextProps> = ({ triggerText, targetText, isHovered }) => {
  const [displayText, setDisplayText] = useState(triggerText);
  const frameRef = useRef(0);
  const queueRef = useRef<{ from: string; to: string; start: number; end: number }[]>([]);
  const animationRef = useRef<number | null>(null);

  const resolveText = isHovered ? targetText : triggerText;

  useEffect(() => {
    const from = displayText;
    const to = resolveText;
    const duration = 45; // Increased duration to slow down scramble speed
    const queue = [];
    
    for (let i = 0; i < Math.max(from.length, to.length); i++) {
      const fromChar = from[i] || "";
      const toChar = to[i] || "";
      const start = Math.floor(Math.random() * (duration / 2));
      const end = start + Math.floor(Math.random() * (duration / 2)) + 5;
      queue.push({ from: fromChar, to: toChar, start, end });
    }
    
    queueRef.current = queue;
    frameRef.current = 0;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const update = () => {
      let complete = true;
      let output = "";
      const queue = queueRef.current;
      const frame = frameRef.current;

      for (let i = 0; i < queue.length; i++) {
        const { from: f, to: t, start, end } = queue[i];
        if (frame >= end) {
          output += t;
        } else if (frame >= start) {
          complete = false;
          output += CHARS[Math.floor(Math.random() * CHARS.length)];
        } else {
          complete = false;
          output += f;
        }
      }

      setDisplayText(output);

      if (!complete) {
        frameRef.current += 1;
        animationRef.current = requestAnimationFrame(update);
      }
    };

    animationRef.current = requestAnimationFrame(update);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [resolveText]);

  return <span>{displayText}</span>;
};

// 3. Main SplashScreen Component
interface SplashScreenProps {
  onEnter: () => void;
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const btnRef = useRef<HTMLDivElement>(null);
  const hasEnteredRef = useRef(false);

  const handleEnter = () => {
    if (hasEnteredRef.current) return;
    hasEnteredRef.current = true;
    setIsLoading(true);
    // Give 800ms to show loading feedback in full opacity, then start the page fade-out
    setTimeout(() => {
      setIsFading(true);
      document.documentElement.classList.remove("splash-active");
    }, 800);
    setTimeout(() => {
      onEnter();
    }, 1800); // Wait for CSS opacity transition to complete
  };

  useEffect(() => {
    const wasScrolled = sessionStorage.getItem("wasScrolled") === "true";
    if (wasScrolled) {
      onEnter();
      return;
    }

    setMounted(true);
    // Add active class to document root to lock scrolling
    document.documentElement.classList.add("splash-active");

    const hasWebGL = () => {
      try {
        const canvas = document.createElement("canvas");
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext("webgl2") ||
           canvas.getContext("webgl") ||
           (canvas as any).getContext("experimental-webgl"))
        );
      } catch (e) {
        return false;
      }
    };
    setWebglSupported(hasWebGL());

    // Auto-fade into the home page after 15 seconds of inactivity
    const autoRedirectTimer = setTimeout(() => {
      handleEnter();
    }, 15000);

    return () => {
      document.documentElement.classList.remove("splash-active");
      clearTimeout(autoRedirectTimer);
    };
  }, []);

  // Mouse move handler to track coordinates for the golden spotlight hover glow
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    btn.style.setProperty("--mouse-x", `${x}px`);
    btn.style.setProperty("--mouse-y", `${y}px`);
  };

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden bg-black transition-opacity duration-1000 ease-in-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Video Layer */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <source src="/space_stars.mp4" type="video/mp4" />
        <source src="/space_stars.mov" type="video/quicktime" />
      </video>

      {/* 3D WebGL Canvas Layer */}
      {webglSupported && (
        <div className="absolute inset-0 z-10 w-full h-full">
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
            <ambientLight intensity={0.6} />
            <fog attach="fog" args={["#000000", 1, 14]} />
            <InteractiveClouds />
          </Canvas>
        </div>
      )}

      {/* Typography Overlay Layer */}
      <div className="relative z-20 flex flex-col items-center justify-center gap-14 w-full h-full px-[6vw] pt-[12vh] pb-[22vh] text-center pointer-events-none">
        {/* Typography Group (Eyebrow + Headline) */}
        <div className="flex flex-col items-center gap-6 max-w-[90vw] md:max-w-[850px]">
          {/* Eyebrow in Inter */}
          <p className="font-sans text-[clamp(0.52rem,0.7vw,0.72rem)] font-light uppercase tracking-[0.45em] text-[#bcd0ff]/70 leading-relaxed max-w-none mx-auto whitespace-nowrap">
            A Place for Details, Stories, and The Occasional Surprise.
          </p>

          {/* Headline in Serif (Fraunces) */}
          <h1 className="font-display font-light text-[clamp(1.3rem,2.2vw,2.05rem)] leading-[1.65] tracking-wide">
            <span className="hero-glow-text">You don't</span> <span className="holo-highlight italic font-normal">have</span> <span className="hero-glow-text">to interact with everything.</span>
            <br />
            <span className="hero-glow-text">But you</span> <span className="holo-highlight italic font-normal">might</span> <span className="hero-glow-text">want to.</span>
          </h1>
        </div>

        {/* Action Button: Glass style with a sound-toggle border and left golden glow */}
        <div className="flex flex-col items-center gap-6">
          <div 
            ref={btnRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="glass-btn-sound-styled pointer-events-auto" 
            onClick={handleEnter}
          >
            {/* Moving gradient border stroke (identical to the sound button) */}
            <span className="glass-btn-border-wrap">
              <span className="glass-btn-border-light" />
            </span>

            <span className="glass-btn-sound-content">
              <span className="glass-btn-sound-text">
                <ScrambleText 
                  triggerText="Hover to discover" 
                  targetText="Dive In" 
                  isHovered={isHovered} 
                />
              </span>
            </span>
          </div>
          <div className="h-10 pointer-events-none">
            <LoaderOne />
          </div>
        </div>
      </div>
    </div>
  );
}
