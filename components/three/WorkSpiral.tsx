"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { scroll, damp, smoothstep } from "@/lib/state";

// --- GLSL SHADERS FOR LIQUID GLASS CARDS WITH DEPTH BLUR ---

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uBendStrength;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    // Curve the plane horizontally: bend increases quadratically at the edges
    float bend = (uv.x - 0.5) * (uv.x - 0.5) * uBendStrength;
    pos.z += bend;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uHover;
  uniform float uOpacity;
  uniform float uBlur; // 0 = sharp (in focus), 1 = fully blurred (out of focus)

  void main() {
    // 1. Liquid glass UV warping
    vec2 warpedUv = vUv;
    float waveX = sin(vUv.y * 7.0 + uTime * 1.2) * 0.020;
    float waveY = cos(vUv.x * 7.0 + uTime * 1.2) * 0.020;
    warpedUv.x += waveX * (1.0 - uHover * 0.6);
    warpedUv.y += waveY * (1.0 - uHover * 0.6);
    
    // 2. Depth-of-field blur: multi-sample box blur
    //    Sample in a 5x5 grid, spread controlled by uBlur
    float blurAmount = uBlur * 0.025; // Max blur spread in UV space
    vec4 texColor = vec4(0.0);
    float total = 0.0;
    for (int x = -2; x <= 2; x++) {
      for (int y = -2; y <= 2; y++) {
        vec2 offset = vec2(float(x), float(y)) * blurAmount;
        texColor += texture2D(uTexture, warpedUv + offset);
        total += 1.0;
      }
    }
    texColor /= total;
    
    // 3. Rounded corners SDF
    vec2 center = vUv - 0.5;
    vec2 size = vec2(0.5 - 0.06);
    vec2 d = abs(center) - size;
    float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - 0.06;
    float alpha = 1.0 - smoothstep(-0.008, 0.008, dist);
    
    // 4. Frosted Liquid Glass Aesthetics
    vec3 glassTint = vec3(0.92, 0.95, 1.0);
    vec3 rgb = mix(texColor.rgb, glassTint, 0.15 + uBlur * 0.15); // More frosted when blurred
    
    // 5. Specular sheen
    float sweep = sin(vUv.x * 2.5 - vUv.y * 1.8 + uTime * 1.5) * 0.5 + 0.5;
    float sheenPattern = pow(sweep, 8.0) * 0.35;
    vec3 sheen = vec3(1.0) * sheenPattern;
    
    // 6. Fresnel Edge highlight
    float fresnel = pow(1.0 - (vUv.x * (1.0 - vUv.x) * 4.0 * vUv.y * (1.0 - vUv.y) * 4.0), 3.5);
    vec3 edgeGlow = vec3(0.55, 0.85, 1.0) * fresnel * 0.55;
    
    // 7. Interactive Hover highlight
    vec3 hoverGlow = vec3(0.0, 0.75, 1.0) * uHover * 0.3;
    
    // Sum all layers
    vec3 finalColor = rgb + sheen + edgeGlow + hoverGlow;
    
    // Reduce overall opacity slightly for blurred (background) cards
    float blurFade = 1.0 - uBlur * 0.3;
    gl_FragColor = vec4(finalColor, alpha * uOpacity * (0.88 + uHover * 0.12) * blurFade);
  }
`;

// --- INDIVIDUAL SPIRAL CARD COMPONENT ---

interface SpiralCardProps {
  index: number;
  totalCards: number;
  texture: THREE.Texture;
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
}

function SpiralCard({
  index,
  totalCards,
  texture,
  hoveredIndex,
  setHoveredIndex,
}: SpiralCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const hoverVal = useRef(0);
  const scaleVal = useRef(1);
  const scrollRotVal = useRef(0);
  const blurVal = useRef(1); // Smoothed blur value
  const rotXVal = useRef(0);
  const rotYVal = useRef(0);

  const { camera } = useThree();

  useFrame((state, dt) => {
    const isHovered = hoveredIndex === index;
    const d = Math.min(dt, 0.1);

    // 1. Smoothly damp hover and scale factors
    hoverVal.current = damp(hoverVal.current, isHovered ? 1.0 : 0.0, 8, d);
    scaleVal.current = damp(scaleVal.current, isHovered ? 1.08 : 1.0, 8, d);

    // Subtle pointer-reactive hover tilt
    const targetRotX = isHovered ? (state.pointer.y * 0.15) : 0;
    const targetRotY = isHovered ? (state.pointer.x * 0.15) : 0;
    rotXVal.current = damp(rotXVal.current, targetRotX, 8, d);
    rotYVal.current = damp(rotYVal.current, targetRotY, 8, d);

    if (meshRef.current) {
      // Map scroll offset to raw scroll pixels to ensure uniform speed across screen sizes
      const vhPx = typeof window !== "undefined" ? window.innerHeight : 900;
      const section3Start = 5.2 * vhPx;
      const section3Span = 15.0 * vhPx;
      const activeStart = section3Start + (10.0 / 15.0) * section3Span;
      const activeEnd = section3Start + 1.0 * section3Span;
      
      const rawScroll = scroll.raw;
      const activeScrollPixels = Math.min(Math.max(rawScroll - activeStart, 0.0), activeEnd - activeStart);
      
      // Every 130px of scroll shifts the spiral by exactly 1 card spacing (0.14 parameter span)
      const pixelsPerCard = 130;
      const span = 1.4;
      const cardSpacing = span / totalCards; // 0.14
      const targetScrollOffset = (activeScrollPixels / pixelsPerCard) * cardSpacing;
      scrollRotVal.current = damp(scrollRotVal.current, targetScrollOffset, 4.5, d);

      // Wrap parameter between -0.2 and 1.2 (span of 1.4)
      const startParam = -0.2;
      const endParam = 1.2;

      // Add a slow, continuous automatic scroll drift along the S-curve (0.025 units/second)
      const autoScroll = state.clock.getElapsedTime() * 0.025;
      const rawParam = (index / totalCards) * span + startParam + scrollRotVal.current + autoScroll;
      let uPath = ((rawParam - startParam) % span);
      if (uPath < 0) uPath += span;
      uPath += startParam;

      // Base coordinates centered on camera to eliminate camera hover parallax
      const axisZ = -3.2; // Brought closer to camera (down from -4.0)
      const heightSpan = 5.0; // Vertical span of S-curve

      // Y: vertical distribution along S-curve
      const y = camera.position.y + (uPath - 0.5) * heightSpan;

      // X: left-right curve amplitude (increased to 1.5 for wider spread)
      const xAmplitude = 1.5;
      const x = camera.position.x + xAmplitude * Math.sin(uPath * Math.PI * 2.0);

      // Z: depth curve (middle is closest, ends curve away into background)
      const zAmplitude = 2.0;
      const z = axisZ - zAmplitude * Math.cos(uPath * Math.PI * 2.0);

      // Micro float drift
      const floatDrift = Math.sin(state.clock.getElapsedTime() * 0.5 + index * 0.7) * 0.04;
      meshRef.current.position.set(x, y + floatDrift, z);
      
      // Face camera horizontally
      meshRef.current.lookAt(camera.position.x, y, camera.position.z);

      // Apply interactive hover tilt
      meshRef.current.rotateX(rotXVal.current);
      meshRef.current.rotateY(rotYVal.current);

      // 3. Depth-of-field blur based on z-distance from camera
      const cardZ = meshRef.current.position.z;
      const cameraZ = camera.position.z;
      const distFromCamera = Math.abs(cameraZ - cardZ);
      
      // Front-most possible z is axisZ + zAmplitude
      // Back-most possible z is axisZ - zAmplitude
      const minDist = Math.abs(cameraZ - (axisZ + zAmplitude));
      const maxDist = Math.abs(cameraZ - (axisZ - zAmplitude));
      
      const normalizedDist = (distFromCamera - minDist) / (maxDist - minDist);
      // Sharp transition to focus on two cards in the center at a time
      const targetBlur = smoothstep(0.05, 0.35, normalizedDist);
      blurVal.current = damp(blurVal.current, targetBlur, 6, d);

      // Apply interactive scale
      meshRef.current.scale.set(scaleVal.current, scaleVal.current, 1.0);
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uHover.value = hoverVal.current;
      materialRef.current.uniforms.uBlur.value = blurVal.current;
      
      // Fade in over 1 scroll: between the 10th and 11th scrolls (fully opaque by the 11th scroll)
      const opacity = smoothstep(10.0 / 15.0, 11.0 / 15.0, scroll.section3);
      materialRef.current.uniforms.uOpacity.value = opacity;
    }
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredIndex(index);
      }}
      onPointerOut={(e) => {
        setHoveredIndex(null);
      }}
    >
      <planeGeometry args={[1.15, 0.72, 16, 16]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTexture: { value: texture },
          uTime: { value: 0 },
          uHover: { value: 0 },
          uBendStrength: { value: 0.3 }, // Adjusted for card size
          uOpacity: { value: 0 },
          uBlur: { value: 1.0 }, // Start blurred
        }}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}

// --- PARENT WORK SPIRAL CAROUSEL ---

export default function WorkSpiral() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Load the two alternating placeholder images
  const tex1 = useTexture("/project1.png");
  const tex2 = useTexture("/project2.png");

  const N = 10; // 10 cards for the spiral
  const cards = Array.from({ length: N });

  return (
    <group>
      {cards.map((_, i) => (
        <SpiralCard
          key={i}
          index={i}
          totalCards={N}
          texture={i % 2 === 0 ? tex1 : tex2}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
        />
      ))}
    </group>
  );
}
